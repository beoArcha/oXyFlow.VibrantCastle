import type { AssetQuality } from "../../types";
import { assetsLogger } from "../../logger/gameLogger";
import type {
  AtlasCatalogEntry,
  AtlasTexture,
  AtlasVariant,
  RegisteredAtlasItem,
  ResolvedAtlasSource,
} from "./atlasTypes";
import type { ISpriteSourceFactory } from "../sprites/spriteSourceTypes";
import type { ReleasableTexture } from "./svgRaster";

export interface AtlasTextureDeps {
  /** Decoded PNG sheet if it is already cached. */
  getImage(url: string): HTMLImageElement | null;
  loadImage(url: string): Promise<unknown>;
  loadSvg(src: string, columns: number): Promise<ReleasableTexture>;
  canLoad(): boolean;
  /** Owns the quality and the tier fallback chain; the manager follows its changes. */
  sprites: ISpriteSourceFactory;
  onChange(): void;
}

interface AtlasSlot {
  entry: AtlasCatalogEntry;
  desired: AssetQuality;
  failed: Set<AssetQuality>;
  pending: Set<AssetQuality>;
  active: ResolvedAtlasSource | null;
  svgRasters: Map<AssetQuality, ReleasableTexture>;
  pngWrappers: Map<string, { image: HTMLImageElement; texture: AtlasTexture }>;
  view: RegisteredAtlasItem | null;
}

function readColumns(variant: AtlasVariant): number {
  const columns = (variant.meta as { atlas?: { columns?: number } }).atlas?.columns;
  return columns && columns > 0 ? columns : 1;
}

/**
 * Owns the quality variants of every registered atlas: resolves the tier to draw,
 * fetches only that variant and keeps drawing the previous one until the new one is ready.
 */
export class AtlasTextureManager {
  private readonly slots = new Map<string, AtlasSlot>();

  constructor(private readonly deps: AtlasTextureDeps) {
    deps.sprites.subscribe((quality) => this.setQuality(quality));
  }

  public register(entry: AtlasCatalogEntry): void {
    this.slots.get(entry.id)?.svgRasters.forEach((raster) => raster.release());
    const slot: AtlasSlot = {
      entry,
      desired: this.deps.sprites.resolveTier(entry.variants) ?? "high",
      failed: new Set(),
      pending: new Set(),
      active: null,
      svgRasters: new Map(),
      pngWrappers: new Map(),
      view: null,
    };
    this.slots.set(entry.id, slot);
    this.advance(slot);
  }

  public setQuality(quality: AssetQuality): void {
    for (const slot of this.slots.values()) {
      slot.desired = this.deps.sprites.resolveTier(slot.entry.variants, quality, slot.failed) ?? slot.desired;
      this.advance(slot);
    }
  }

  /** Texture and meta to draw this frame, or null while nothing is ready yet. */
  public getSource(id: string): ResolvedAtlasSource | null {
    const slot = this.slots.get(id);
    if (!slot) return null;
    const active = slot.active;
    if (active !== null && active.tier === slot.desired) return active;
    this.advance(slot);
    return slot.active;
  }

  public getView(id: string): RegisteredAtlasItem | undefined {
    const slot = this.slots.get(id);
    if (!slot) return undefined;
    const tier = slot.active?.tier ?? slot.desired;
    const variant = slot.entry.variants[tier] ?? slot.entry.variants[slot.desired];
    if (!variant) return undefined;
    if (slot.view?.imageSrc !== variant.src || slot.view.meta !== variant.meta) {
      slot.view = {
        id: slot.entry.id,
        category: slot.entry.category,
        imageSrc: variant.src,
        meta: variant.meta,
        variants: slot.entry.variants,
      };
    }
    return slot.view;
  }

  public getAllViews(): RegisteredAtlasItem[] {
    const views: RegisteredAtlasItem[] = [];
    for (const id of this.slots.keys()) {
      const view = this.getView(id);
      if (view) views.push(view);
    }
    return views;
  }

  public ownsUrl(url: string): boolean {
    for (const slot of this.slots.values()) {
      for (const variant of Object.values(slot.entry.variants)) {
        if (variant?.src === url) return true;
      }
    }
    return false;
  }

  private advance(slot: AtlasSlot): void {
    const variant = slot.entry.variants[slot.desired];
    if (!variant) return;
    const texture = this.readyTexture(slot, slot.desired, variant);
    if (texture) {
      this.promote(slot, slot.desired, variant, texture);
      return;
    }
    this.startLoad(slot, slot.desired, variant);
  }

  private readyTexture(slot: AtlasSlot, tier: AssetQuality, variant: AtlasVariant): AtlasTexture | null {
    if (variant.format === "svg") return slot.svgRasters.get(tier) ?? null;
    const image = this.deps.getImage(variant.src);
    if (!image || !image.complete || image.naturalWidth === 0) return null;
    const cached = slot.pngWrappers.get(variant.src);
    if (cached && cached.image === image) return cached.texture;
    const texture: AtlasTexture = {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      crisp: false,
    };
    slot.pngWrappers.set(variant.src, { image, texture });
    return texture;
  }

  private promote(slot: AtlasSlot, tier: AssetQuality, variant: AtlasVariant, texture: AtlasTexture): void {
    const previous = slot.active;
    slot.active = { id: slot.entry.id, tier, texture, meta: variant.meta };
    if (previous && previous.tier !== tier) this.releaseTier(slot, previous.tier);
  }

  private releaseTier(slot: AtlasSlot, tier: AssetQuality): void {
    const raster = slot.svgRasters.get(tier);
    if (!raster) return;
    raster.release();
    slot.svgRasters.delete(tier);
  }

  private startLoad(slot: AtlasSlot, tier: AssetQuality, variant: AtlasVariant): void {
    if (!this.deps.canLoad() || slot.pending.has(tier) || slot.failed.has(tier)) return;
    slot.pending.add(tier);
    const task: Promise<void> =
      variant.format === "svg"
        ? this.deps.loadSvg(variant.src, readColumns(variant)).then((raster) => {
            slot.svgRasters.set(tier, raster);
          })
        : this.deps.loadImage(variant.src).then(() => undefined);
    task.then(
      () => this.finishLoad(slot, tier),
      (err: unknown) => this.failLoad(slot, tier, err)
    );
  }

  private finishLoad(slot: AtlasSlot, tier: AssetQuality): void {
    slot.pending.delete(tier);
    if (this.slots.get(slot.entry.id) !== slot || slot.desired !== tier) {
      this.releaseTier(slot, tier);
      return;
    }
    this.advance(slot);
    this.deps.onChange();
  }

  private failLoad(slot: AtlasSlot, tier: AssetQuality, err: unknown): void {
    slot.pending.delete(tier);
    slot.failed.add(tier);
    assetsLogger.warn(`Atlas variant '${tier}' of '${slot.entry.id}' failed to load`, undefined, err);
    if (this.slots.get(slot.entry.id) !== slot || slot.desired !== tier) return;
    const fallback = this.deps.sprites.resolveTier(slot.entry.variants, tier, slot.failed);
    if (fallback === null) return;
    slot.desired = fallback;
    this.advance(slot);
  }
}
