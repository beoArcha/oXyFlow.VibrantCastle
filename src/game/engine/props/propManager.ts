import type { AssetQuality } from "../../types";
import { assetsLogger } from "../../logger/gameLogger";
import type { AtlasFileMap } from "../atlas/atlasTypes";
import type { ISpriteSourceFactory } from "../sprites";
import { loadTilesetImage, type TilesetImageLoader } from "../tiles/tilesetManager";
import { parsePropMeta, type PropMeta } from "./propMeta";

/** A prop sheet ready to draw at the active quality. */
export interface ResolvedProp {
  readonly meta: PropMeta;
  readonly tier: AssetQuality;
  readonly image: CanvasImageSource;
  /** Frame size in sheet pixels of the resolved tier. */
  readonly frameWidth: number;
  readonly frameHeight: number;
}

export interface IPropProvider {
  /** The prop drawn at the current quality, or null (unknown id, still loading, or every tier failed). */
  resolve(propId: string): ResolvedProp | null;
  getMeta(propId: string): PropMeta | null;
}

const TIERS: readonly AssetQuality[] = ["low", "mid"];

interface PropEntry {
  readonly meta: PropMeta;
  readonly urls: Partial<Record<AssetQuality, string>>;
  readonly failed: Set<AssetQuality>;
  readonly loading: Set<AssetQuality>;
  readonly ready: Partial<Record<AssetQuality, ResolvedProp>>;
}

/**
 * Owns decor prop sheets: loaded lazily once, failed tiers skipped by the shared quality resolver
 * (`high` falls back to hi-16bit), live quality switching through the injected `ISpriteSourceFactory`.
 */
export class PropManager implements IPropProvider {
  private readonly entries = new Map<string, PropEntry>();

  constructor(
    private readonly sprites: ISpriteSourceFactory,
    private readonly loadImage: TilesetImageLoader = loadTilesetImage,
    private readonly onChange?: () => void
  ) {}

  public register(meta: PropMeta, urlsByFile: Readonly<Record<string, string>>): void {
    const urls: Partial<Record<AssetQuality, string>> = {};
    for (const tier of TIERS) {
      const variant = meta.variants[tier as "low" | "mid"];
      const url = variant ? urlsByFile[variant.file] : undefined;
      if (url) urls[tier] = url;
    }
    this.entries.set(meta.propId, { meta, urls, failed: new Set(), loading: new Set(), ready: {} });
  }

  /** Registers every discovered prop; an invalid meta is logged and skipped. */
  public registerDiscovered(files: AtlasFileMap): void {
    for (const [metaPath, raw] of Object.entries(files.metas)) {
      try {
        const meta = parsePropMeta(raw);
        const prefix = metaPath.slice(0, metaPath.lastIndexOf("/") + 1);
        const urlsByFile: Record<string, string> = {};
        for (const [imagePath, url] of Object.entries(files.images)) {
          if (imagePath.startsWith(prefix)) urlsByFile[imagePath.slice(prefix.length)] = url;
        }
        this.register(meta, urlsByFile);
      } catch (err: unknown) {
        assetsLogger.warn(`Ignoring prop meta '${metaPath}'`, undefined, err);
      }
    }
  }

  public has(propId: string): boolean {
    return this.entries.has(propId);
  }

  public getMeta(propId: string): PropMeta | null {
    return this.entries.get(propId)?.meta ?? null;
  }

  public resolve(propId: string): ResolvedProp | null {
    const entry = this.entries.get(propId);
    if (!entry) return null;
    const tier = this.sprites.resolveTier(entry.urls, this.sprites.getQuality(), entry.failed);
    if (tier === null) return null;
    const ready = entry.ready[tier];
    if (ready) return ready;
    this.startLoad(entry, tier);
    return entry.ready.low ?? entry.ready.mid ?? null;
  }

  private startLoad(entry: PropEntry, tier: AssetQuality): void {
    const url = entry.urls[tier];
    const variant = entry.meta.variants[tier as "low" | "mid"];
    if (!url || !variant || entry.loading.has(tier)) return;
    entry.loading.add(tier);
    this.loadImage(url).then(
      (image) => {
        entry.loading.delete(tier);
        entry.ready[tier] = {
          meta: entry.meta,
          tier,
          image,
          frameWidth: variant.frameWidth,
          frameHeight: variant.frameHeight,
        };
        this.onChange?.();
      },
      (err: unknown) => {
        entry.loading.delete(tier);
        entry.failed.add(tier);
        assetsLogger.warn(`Prop sheet '${url}' failed to load, falling back`, { propId: entry.meta.propId, tier }, err);
        this.onChange?.();
      }
    );
  }
}
