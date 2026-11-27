export interface ParallaxSurfaceDrawContext {
  imageSmoothingEnabled: boolean;
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void;
}

export interface ParallaxSurfaceTarget {
  readonly source: CanvasImageSource;
  readonly width: number;
  readonly height: number;
  readonly ctx: ParallaxSurfaceDrawContext | null;
  commit?: () => { readonly source: CanvasImageSource; readonly release?: () => void };
  release?: () => void;
}

export type ParallaxSurfaceFactory = (width: number, height: number) => ParallaxSurfaceTarget | null;

export interface ResolvedParallaxSurface {
  source: CanvasImageSource;
  width: number;
  height: number;
}

export interface ParallaxSurfaceCacheOptions {
  readonly factory?: ParallaxSurfaceFactory;
  readonly maxEntries?: number;
  readonly maxDimension?: number;
  readonly maxCreationsPerFrame?: number;
}

interface CachedSurfaceEntry {
  readonly sourceKey: object;
  readonly surface: CanvasImageSource;
  readonly width: number;
  readonly height: number;
  readonly smoothing: boolean;
  readonly release?: () => void;
}

const DEFAULT_MAX_ENTRIES = 24;
const DEFAULT_MAX_DIMENSION = 2560;

export function isPreScaledBitmapSource(source: CanvasImageSource): boolean {
  return (
    typeof (source as { close?: unknown }).close === "function" &&
    typeof (source as { width?: unknown }).width === "number" &&
    !("src" in source)
  );
}

export function resolveSourcePixelWidth(img: { width: number; naturalWidth: number }): number {
  return isPreScaledBitmapSource(img as unknown as CanvasImageSource) ? img.width : img.naturalWidth;
}

export function resolveSourcePixelHeight(img: { height: number; naturalHeight: number }): number {
  return isPreScaledBitmapSource(img as unknown as CanvasImageSource) ? img.height : img.naturalHeight;
}

export function createResolvedParallaxSurface(): ResolvedParallaxSurface {
  return { source: null as unknown as CanvasImageSource, width: 0, height: 0 };
}

/**
 * Bounded per-source offscreen surface cache that pre-scales parallax textures once
 * to the viewport/canvas draw dimensions instead of resampling large bitmaps every frame.
 * Zero heap allocations on cache hits.
 */
export class ParallaxSurfaceCache {
  private readonly factory?: ParallaxSurfaceFactory;
  private readonly maxEntries: number;
  private readonly maxDimension: number;
  private readonly maxCreationsPerFrame: number;
  private creationsThisFrame = 0;
  private cache = new WeakMap<object, CachedSurfaceEntry>();
  private readonly tracked: CachedSurfaceEntry[] = [];

  constructor(options: ParallaxSurfaceCacheOptions = {}) {
    this.factory = options.factory;
    this.maxEntries = Math.max(1, options.maxEntries ?? DEFAULT_MAX_ENTRIES);
    this.maxDimension = Math.max(64, options.maxDimension ?? DEFAULT_MAX_DIMENSION);
    this.maxCreationsPerFrame =
      options.maxCreationsPerFrame !== undefined
        ? Math.max(1, Math.floor(options.maxCreationsPerFrame))
        : Number.POSITIVE_INFINITY;
  }

  public get size(): number {
    return this.tracked.length;
  }

  public beginFrame(): void {
    this.creationsThisFrame = 0;
  }

  public evict(source: object): boolean {
    const existing = this.cache.get(source);
    if (!existing) return false;
    this.removeTrackedEntry(existing);
    return true;
  }

  public clear(): void {
    for (let i = 0; i < this.tracked.length; i++) {
      this.tracked[i].release?.();
    }
    this.tracked.length = 0;
    this.cache = new WeakMap<object, CachedSurfaceEntry>();
    this.creationsThisFrame = 0;
  }

  public resolve(
    source: CanvasImageSource,
    srcWidth: number,
    srcHeight: number,
    desiredWidth: number,
    desiredHeight: number,
    allowUpscale: boolean,
    smoothing: boolean,
    out: ResolvedParallaxSurface
  ): ResolvedParallaxSurface {
    if (!this.factory || srcWidth <= 0 || srcHeight <= 0 || desiredWidth <= 0 || desiredHeight <= 0) {
      out.source = source;
      out.width = srcWidth;
      out.height = srcHeight;
      return out;
    }

    let targetW = Math.max(1, Math.round(desiredWidth));
    let targetH = Math.max(1, Math.round(desiredHeight));

    if (!allowUpscale && (targetW > srcWidth || targetH > srcHeight)) {
      const shrink = Math.min(1, srcWidth / targetW, srcHeight / targetH);
      targetW = Math.max(1, Math.round(targetW * shrink));
      targetH = Math.max(1, Math.round(targetH * shrink));
    }

    if (targetW > this.maxDimension || targetH > this.maxDimension) {
      const cap = Math.min(this.maxDimension / targetW, this.maxDimension / targetH);
      targetW = Math.max(1, Math.round(targetW * cap));
      targetH = Math.max(1, Math.round(targetH * cap));
    }

    if (
      isPreScaledBitmapSource(source) &&
      Math.abs(srcWidth - targetW) <= 1 &&
      Math.abs(srcHeight - targetH) <= 1
    ) {
      out.source = source;
      out.width = srcWidth;
      out.height = srcHeight;
      return out;
    }

    const sourceKey = source as object;
    const existing = this.cache.get(sourceKey);
    if (
      existing &&
      existing.width === targetW &&
      existing.height === targetH &&
      existing.smoothing === smoothing
    ) {
      out.source = existing.surface;
      out.width = existing.width;
      out.height = existing.height;
      return out;
    }

    if (this.creationsThisFrame >= this.maxCreationsPerFrame) {
      out.source = source;
      out.width = srcWidth;
      out.height = srcHeight;
      return out;
    }

    const created = this.factory(targetW, targetH);
    if (!created || !created.ctx) {
      out.source = source;
      out.width = srcWidth;
      out.height = srcHeight;
      return out;
    }

    this.creationsThisFrame++;
    created.ctx.imageSmoothingEnabled = smoothing;
    created.ctx.drawImage(source, 0, 0, targetW, targetH);
    const committed = created.commit ? created.commit() : null;
    const finalSource = committed ? committed.source : created.source;
    const finalRelease = committed ? committed.release : created.release;

    if (existing) {
      this.removeTrackedEntry(existing);
    }

    if (this.tracked.length >= this.maxEntries) {
      const evicted = this.tracked.shift();
      if (evicted) {
        this.cache.delete(evicted.sourceKey);
        evicted.release?.();
      }
    }

    const entry: CachedSurfaceEntry = {
      sourceKey,
      surface: finalSource,
      width: created.width,
      height: created.height,
      smoothing,
      release: finalRelease,
    };
    this.cache.set(sourceKey, entry);
    this.tracked.push(entry);

    out.source = entry.surface;
    out.width = entry.width;
    out.height = entry.height;
    return out;
  }

  private removeTrackedEntry(target: CachedSurfaceEntry): void {
    const idx = this.tracked.indexOf(target);
    if (idx >= 0) {
      this.tracked.splice(idx, 1);
    }
    this.cache.delete(target.sourceKey);
    target.release?.();
  }
}
