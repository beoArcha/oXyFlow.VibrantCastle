import type { AssetQuality } from "../../types";
import { assetsLogger } from "../../logger/gameLogger";
import { AssetError, ErrorCode } from "@lib/errors";
import type { AtlasFileMap } from "../atlas/atlasTypes";
import type { ISpriteSourceFactory } from "../sprites";
import { parseTilesetMeta, type TilesetMeta } from "./tilesetMeta";

/** A tileset ready to draw at the active quality. */
export interface ResolvedTileset {
  readonly meta: TilesetMeta;
  readonly tier: AssetQuality;
  readonly image: CanvasImageSource;
  /** Tile size in sheet pixels of the resolved tier. */
  readonly tile: number;
}

export interface ITilesetProvider {
  /** The tileset drawn at the current quality, or null (unknown id, still loading, or every tier failed). */
  resolve(tilesetId: string): ResolvedTileset | null;
}

export type TilesetImageLoader = (url: string) => Promise<CanvasImageSource>;

const TIERS: readonly AssetQuality[] = ["low", "mid"];

interface TilesetEntry {
  readonly meta: TilesetMeta;
  /** Sheet url per tier; only tiers that ship a sheet are present. */
  readonly urls: Partial<Record<AssetQuality, string>>;
  readonly failed: Set<AssetQuality>;
  readonly loading: Set<AssetQuality>;
  readonly ready: Partial<Record<AssetQuality, ResolvedTileset>>;
}

/** Default loader: one `Image` per sheet, decoded once by the browser. */
export function loadTilesetImage(url: string): Promise<CanvasImageSource> {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined") {
      reject(new AssetError(`Cannot load tile sheet outside a browser: ${url}`, ErrorCode.ASSET_LOAD_FAILED, { details: { url } }));
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (cause) =>
      reject(new AssetError(`Failed to load tile sheet: ${url}`, ErrorCode.ASSET_LOAD_FAILED, { details: { url }, cause }));
    img.src = url;
  });
}

/**
 * Owns platform tilesets: sheets load once (lazily, on first use), failed tiers are skipped by the
 * shared quality resolver, and the quality comes from the injected `ISpriteSourceFactory` so the menu
 * setting switches tiers live. While the requested tier is still loading, a tier that is ready is drawn.
 */
export class TilesetManager implements ITilesetProvider {
  private readonly entries = new Map<string, TilesetEntry>();

  constructor(
    private readonly sprites: ISpriteSourceFactory,
    private readonly loadImage: TilesetImageLoader = loadTilesetImage,
    private readonly onChange?: () => void
  ) {}

  /** Registers a tileset from its validated meta and the sheet urls (by meta file name). */
  public register(meta: TilesetMeta, urlsByFile: Readonly<Record<string, string>>): void {
    const urls: Partial<Record<AssetQuality, string>> = {};
    for (const tier of TIERS) {
      const variant = meta.variants[tier as "low" | "mid"];
      const url = variant ? urlsByFile[variant.file] : undefined;
      if (url) urls[tier] = url;
    }
    this.entries.set(meta.tilesetId, { meta, urls, failed: new Set(), loading: new Set(), ready: {} });
  }

  /** Registers every discovered tileset; an invalid meta is logged and skipped. */
  public registerDiscovered(files: AtlasFileMap): void {
    for (const [metaPath, raw] of Object.entries(files.metas)) {
      try {
        const meta = parseTilesetMeta(raw);
        const prefix = metaPath.slice(0, metaPath.lastIndexOf("/") + 1);
        const urlsByFile: Record<string, string> = {};
        for (const [imagePath, url] of Object.entries(files.images)) {
          if (imagePath.startsWith(prefix)) urlsByFile[imagePath.slice(prefix.length)] = url;
        }
        this.register(meta, urlsByFile);
      } catch (err: unknown) {
        assetsLogger.warn(`Ignoring tileset meta '${metaPath}'`, undefined, err);
      }
    }
  }

  public has(tilesetId: string): boolean {
    return this.entries.has(tilesetId);
  }

  public getMeta(tilesetId: string): TilesetMeta | null {
    return this.entries.get(tilesetId)?.meta ?? null;
  }

  public resolve(tilesetId: string): ResolvedTileset | null {
    const entry = this.entries.get(tilesetId);
    if (!entry) return null;
    const tier = this.sprites.resolveTier(entry.urls, this.sprites.getQuality(), entry.failed);
    if (tier === null) return null;
    const ready = entry.ready[tier];
    if (ready) return ready;
    this.startLoad(entry, tier);
    return entry.ready.low ?? entry.ready.mid ?? null;
  }

  private startLoad(entry: TilesetEntry, tier: AssetQuality): void {
    const url = entry.urls[tier];
    const variant = entry.meta.variants[tier as "low" | "mid"];
    if (!url || !variant || entry.loading.has(tier)) return;
    entry.loading.add(tier);
    this.loadImage(url).then(
      (image) => {
        entry.loading.delete(tier);
        entry.ready[tier] = { meta: entry.meta, tier, image, tile: variant.tile };
        this.onChange?.();
      },
      (err: unknown) => {
        entry.loading.delete(tier);
        entry.failed.add(tier);
        assetsLogger.warn(`Tile sheet '${url}' failed to load, falling back`, { tilesetId: entry.meta.tilesetId, tier }, err);
        this.onChange?.();
      }
    );
  }
}
