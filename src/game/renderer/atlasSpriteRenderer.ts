import { AssetQuality } from "@game/types";
import { assetLoader } from "@game/engine/assetLoader";
import { rendererLogger } from "@game/logger/gameLogger";
import { BackgroundProcessor } from "@game/engine/meta/slicing/BackgroundProcessor";
import type { AtlasTexture } from "@game/engine/atlas";
import {
  IAtlasMetaLike,
  IAtlasFrameRect,
  AtlasRenderInfo,
  getAtlasRenderInfo,
  resolveAnimationKeyFromStates,
  resolveAnimationTrack,
  resolveEffectiveFrameCount,
  resolveFrameColumn,
  resolveFrameSpan,
  resolveTrackFrameRects,
  hasAnimationTrack,
  resolveVariantScale,
} from "./atlasMetadataResolver";

export interface RenderAtlasFrameOptions {
  atlasId: string;
  animationName: string;
  frameIndex?: number;
  ticks?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  facingLeft?: boolean;
  alpha?: number;
  tintColor?: string;
  scaleMultiplier?: number;
  quality?: AssetQuality;
}

/**
 * Draws a sub-rectangle of one animation frame stretched into a destination rectangle.
 * The region is normalized to the frame's body box (the whole cell when the sheet has none), so
 * callers can slice a structure into lintel / body / base without knowing the cell size.
 */
export interface RenderAtlasRegionOptions {
  atlasId: string;
  animationName: string;
  ticks: number;
  regionX: number;
  regionY: number;
  regionW: number;
  regionH: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IAtlasSpriteRenderer {
  render(ctx: CanvasRenderingContext2D, options: RenderAtlasFrameOptions): boolean;
  /** Stretches a body-box region of the current frame into the destination rect; false when unavailable. */
  renderRegion(ctx: CanvasRenderingContext2D, options: RenderAtlasRegionOptions): boolean;
  /** World width / height ratio of the sheet's body box; 0 when the atlas or its body box is unknown. */
  getBodyAspect(atlasId: string): number;
  hasAtlas(atlasId: string): boolean;
  hasAnimation(atlasId: string, animationName: string): boolean;
}

/**
 * Renders sliced frames from registered atlas variants (PNG or pre-rasterised SVG sheets) with
 * exact per-frame bounding rects (`slicing.tracks`), runtime alpha-island fallback (`auto_islands`),
 * normalized origin anchoring, multi-cell frames, directional mirroring and cached chroma-keying.
 */
export class AtlasSpriteRenderer implements IAtlasSpriteRenderer {
  private chromaCache: WeakMap<AtlasTexture, CanvasImageSource> = new WeakMap();
  private autoIslandCache: WeakMap<AtlasTexture, Map<number, readonly IAtlasFrameRect[]>> = new WeakMap();
  private drawX = 0;
  private drawY = 0;
  private drawW = 0;
  private drawH = 0;
  private pivotX = 0;
  private selSx = 0;
  private selSy = 0;
  private selSw = 0;
  private selSh = 0;
  private selRefH = 0;
  private selAnchorX = 0.5;
  private selAnchorY = 1.0;
  private selHasCustomRect = false;

  public hasAtlas(atlasId: string): boolean {
    return !!assetLoader.getAtlas(atlasId);
  }

  public hasAnimation(atlasId: string, animationName: string): boolean {
    const atlasItem = assetLoader.getAtlas(atlasId);
    if (!atlasItem) return false;
    return hasAnimationTrack(atlasItem.meta as unknown as IAtlasMetaLike, animationName);
  }

  public clearChromaCache(): void {
    this.chromaCache = new WeakMap();
    this.autoIslandCache = new WeakMap();
  }

  private getEffectiveSource(texture: AtlasTexture, meta: IAtlasMetaLike): CanvasImageSource {
    const bgConfig = meta.backgroundConfig;
    if (!bgConfig || !bgConfig.removeAtRuntime || !bgConfig.colorHex) {
      return texture.source;
    }

    const cached = this.chromaCache.get(texture);
    if (cached) return cached;

    if (typeof document === "undefined") {
      return texture.source;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = texture.width;
      canvas.height = texture.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return texture.source;

      ctx.drawImage(texture.source, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const keyed = BackgroundProcessor.applyChromaKey(
        imgData,
        bgConfig.colorHex,
        bgConfig.tolerance ?? 15,
        4
      );
      ctx.putImageData(keyed as unknown as ImageData, 0, 0);

      this.chromaCache.set(texture, canvas);
      return canvas;
    } catch (err: unknown) {
      rendererLogger.warn("Failed to process chroma key for atlas texture", undefined, err);
      return texture.source;
    }
  }

  /**
   * Runtime fallback when a sheet declares `slicing.method === "auto_islands"` without
   * precomputed `slicing.tracks`. Computes per-row tight alpha bounding rects once per texture.
   */
  private detectRowIslands(
    texture: AtlasTexture,
    source: CanvasImageSource,
    rowIndex: number,
    totalRows: number
  ): readonly IAtlasFrameRect[] | null {
    if (typeof document === "undefined" || totalRows <= 0) return null;
    let rowMap = this.autoIslandCache.get(texture);
    if (rowMap?.has(rowIndex)) return rowMap.get(rowIndex) ?? null;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = texture.width;
      canvas.height = texture.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(source, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, widthOr(texture.width), widthOr(texture.height));

      const bandH = height / totalRows;
      const y0 = Math.max(0, Math.floor(rowIndex * bandH));
      const y1 = Math.min(height - 1, Math.ceil((rowIndex + 1) * bandH) - 1);

      const rects: IAtlasFrameRect[] = [];
      let inSpan = false;
      let spanStart = 0;

      for (let x = 0; x <= width; x++) {
        let opaque = false;
        if (x < width) {
          for (let y = y0; y <= y1; y++) {
            if (data[(y * width + x) * 4 + 3] > 20) {
              opaque = true;
              break;
            }
          }
        }
        if (opaque && !inSpan) {
          inSpan = true;
          spanStart = x;
        } else if (!opaque && inSpan) {
          inSpan = false;
          const x1 = x - 1;
          if (x1 - spanStart >= 8) {
            let minY = y1;
            let maxY = y0;
            for (let y = y0; y <= y1; y++) {
              for (let ix = spanStart; ix <= x1; ix++) {
                if (data[(y * width + ix) * 4 + 3] > 20) {
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                  break;
                }
              }
            }
            if (maxY >= minY) {
              rects.push({ x: spanStart, y: minY, w: x1 - spanStart + 1, h: maxY - minY + 1 });
            }
          }
        }
      }

      if (!rowMap) {
        rowMap = new Map();
        this.autoIslandCache.set(texture, rowMap);
      }
      rowMap.set(rowIndex, rects);
      return rects.length > 0 ? rects : null;
    } catch {
      return null;
    }
  }

  /**
   * Fills the draw rectangle and mirror pivot for one frame spanning `span` cells or a custom rect.
   * Custom-rect sheets scale uniformly against `selRefH` and anchor on the hitbox baseline/centre
   * so frames with variable widths (spread wings, glowing portals) never jitter or stretch.
   */
  private placeFrame(
    info: AtlasRenderInfo,
    options: RenderAtlasFrameOptions,
    quality: AssetQuality,
    meta: IAtlasMetaLike,
    cellW: number,
    cellH: number,
    span: number
  ): void {
    const extraMultiplier = options.scaleMultiplier ?? 1.0;
    const anchorX = Math.round(options.x + options.width / 2);
    this.pivotX = anchorX;

    if (this.selHasCustomRect) {
      const refH = this.selRefH > 0 ? this.selRefH : Math.max(1, this.selSh);
      const scale =
        options.height > 0
          ? (options.height / refH) * extraMultiplier
          : resolveVariantScale(meta, quality) * extraMultiplier;
      this.drawW = Math.round(this.selSw * scale);
      this.drawH = Math.round(this.selSh * scale);
      const anchorY = Math.round(
        info.groundAnchored ? options.y + options.height : options.y + options.height / 2
      );
      this.drawX = Math.round(anchorX - this.selAnchorX * this.drawW);
      this.drawY = Math.round(anchorY - this.selAnchorY * this.drawH);
      return;
    }

    const body = info.body;
    const sw = span * cellW;

    if (body && options.height > 0) {
      const scale = (options.height / (body.height * cellH)) * extraMultiplier;
      const anchorY = Math.round(info.groundAnchored ? options.y + options.height : options.y + options.height / 2);
      const bodyY = info.groundAnchored ? body.footY : body.centerY;
      this.drawW = Math.round(sw * scale);
      this.drawH = Math.round(cellH * scale);
      this.drawX = Math.round(anchorX - body.centerX * cellW * scale);
      this.drawY = Math.round(anchorY - bodyY * cellH * scale);
      return;
    }

    let scale: number;
    if (options.height > 0) {
      const visibleRatio = info.anchorY >= 0.8 ? 0.94 : 0.88;
      scale = (options.height / (cellH * visibleRatio)) * extraMultiplier;
    } else {
      scale = resolveVariantScale(meta, quality) * extraMultiplier;
    }
    this.drawW = Math.round(sw * scale);
    this.drawH = Math.round(cellH * scale);
    const anchorY = Math.round(
      info.anchorY >= 0.8 ? options.y + options.height : options.y + options.height / 2
    );
    this.drawX = Math.round(anchorX - info.anchorX * this.drawW);
    this.drawY = Math.round(anchorY - info.anchorY * this.drawH);
  }

  /**
   * Picks the animation frame for `ticks` (or an explicit `frameIndex`) and stores its source rect in
   * `selSx` / `selSy` / `selSw` / `selSh`. Returns the frame span in cells (1 for custom rects),
   * or 0 when the animation has no frames.
   */
  private selectFrame(
    meta: IAtlasMetaLike,
    info: AtlasRenderInfo,
    cellW: number,
    cellH: number,
    animationName: string,
    frameIndex: number | undefined,
    ticks: number | undefined,
    texture?: AtlasTexture,
    source?: CanvasImageSource
  ): number {
    this.selHasCustomRect = false;
    const animKey = resolveAnimationKeyFromStates(meta, animationName);
    const animTrack = resolveAnimationTrack(meta, animKey);

    let explicitRects = resolveTrackFrameRects(meta, animKey, animTrack);
    if (!explicitRects && meta.slicing?.method === "auto_islands" && texture && source) {
      explicitRects = this.detectRowIslands(texture, source, animTrack?.row ?? 0, info.rows);
    }

    const trackFrames: number = resolveEffectiveFrameCount(animTrack, explicitRects);
    if (trackFrames <= 0) return 0;
    const trackFps: number = animTrack?.fps ?? 8;
    const trackLoop: boolean = animTrack?.loop !== undefined ? animTrack.loop : true;

    let currentFrame = 0;
    if (frameIndex !== undefined) {
      currentFrame = Math.abs(frameIndex) % Math.max(1, trackFrames);
    } else {
      const frameDuration = Math.max(1, Math.round(60 / Math.max(1, trackFps)));
      const step = Math.floor((ticks ?? 0) / frameDuration);
      currentFrame = trackLoop ? step % trackFrames : Math.min(step, trackFrames - 1);
    }

    if (explicitRects && explicitRects.length > 0) {
      const rect = explicitRects[Math.min(currentFrame, explicitRects.length - 1)];
      this.selSx = rect.x;
      this.selSy = rect.y;
      this.selSw = rect.w;
      this.selSh = rect.h;
      this.selRefH = rect.refH ?? meta.slicing?.referenceHeight ?? rect.h;
      this.selAnchorX = rect.anchorX ?? info.anchorX;
      this.selAnchorY = rect.anchorY ?? (info.groundAnchored ? 1.0 : info.anchorY);
      this.selHasCustomRect = true;
      return 1;
    }

    const span = resolveFrameSpan(animTrack, currentFrame);
    this.selSx = resolveFrameColumn(animTrack, currentFrame) * cellW;
    this.selSy = (animTrack?.row ?? 0) * cellH;
    this.selSw = span * cellW;
    this.selSh = cellH;
    return span;
  }

  public getBodyAspect(atlasId: string): number {
    const resolved = assetLoader.getAtlasSource(atlasId);
    if (!resolved || resolved.texture.width <= 0 || resolved.texture.height <= 0) return 0;
    const info = getAtlasRenderInfo(resolved.meta as unknown as IAtlasMetaLike);
    if (!info.body) return 0;
    const cellW = resolved.texture.width / info.cols;
    const cellH = resolved.texture.height / info.rows;
    return (info.body.width * cellW) / (info.body.height * cellH);
  }

  public renderRegion(ctx: CanvasRenderingContext2D, options: RenderAtlasRegionOptions): boolean {
    const resolved = assetLoader.getAtlasSource(options.atlasId);
    if (!resolved) return false;
    const texture = resolved.texture;
    if (texture.width <= 0 || texture.height <= 0) return false;

    const meta = resolved.meta as unknown as IAtlasMetaLike;
    const info = getAtlasRenderInfo(meta);
    const cellW = texture.width / info.cols;
    const cellH = texture.height / info.rows;
    if (this.selectFrame(meta, info, cellW, cellH, options.animationName, undefined, options.ticks) <= 0) return false;

    const body = info.body;
    const originX = body ? body.x : 0;
    const originY = body ? body.y : 0;
    const spanW = body ? body.width : 1;
    const spanH = body ? body.height : 1;
    const column = this.selSx;
    const frameW = this.selHasCustomRect ? this.selSw : cellW;
    const frameH = this.selHasCustomRect ? this.selSh : cellH;
    const srcX = column + (originX + options.regionX * spanW) * frameW;
    const srcY = this.selSy + (originY + options.regionY * spanH) * frameH;
    const srcW = options.regionW * spanW * frameW;
    const srcH = options.regionH * spanH * frameH;
    if (srcW <= 0 || srcH <= 0 || options.width <= 0 || options.height <= 0) return false;

    const smoothing = ctx.imageSmoothingEnabled;
    if (texture.crisp) ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.getEffectiveSource(texture, meta), srcX, srcY, srcW, srcH, options.x, options.y, options.width, options.height);
    ctx.imageSmoothingEnabled = smoothing;
    return true;
  }

  public render(ctx: CanvasRenderingContext2D, options: RenderAtlasFrameOptions): boolean {
    const resolved = assetLoader.getAtlasSource(options.atlasId);
    if (!resolved) return false;

    const texture = resolved.texture;
    if (texture.width <= 0 || texture.height <= 0) return false;

    const meta = resolved.meta as unknown as IAtlasMetaLike;
    const info = getAtlasRenderInfo(meta);
    const source = this.getEffectiveSource(texture, meta);
    const quality = options.quality || assetLoader.getQuality();

    const cellW = texture.width / info.cols;
    const cellH = texture.height / info.rows;

    const span = this.selectFrame(
      meta,
      info,
      cellW,
      cellH,
      options.animationName,
      options.frameIndex,
      options.ticks,
      texture,
      source
    );
    if (span <= 0) return false;
    const sx = this.selSx;
    const sy = this.selSy;
    const sw = this.selSw;
    const sh = this.selSh;

    this.placeFrame(info, options, quality, meta, cellW, cellH, span);
    const { drawX, drawY, drawW: dw, drawH: dh, pivotX } = this;

    ctx.save();

    if (options.alpha !== undefined && options.alpha < 1) {
      ctx.globalAlpha = options.alpha;
    }
    if (texture.crisp) {
      ctx.imageSmoothingEnabled = false;
    }

    const needsFlip =
      info.facing === "left" ? options.facingLeft === false : !!options.facingLeft;

    if (needsFlip) {
      ctx.translate(pivotX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-pivotX, 0);
    }

    ctx.drawImage(source, sx, sy, sw, sh, drawX, drawY, dw, dh);

    if (options.tintColor) {
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = options.tintColor;
      ctx.fillRect(drawX, drawY, dw, dh);
      ctx.restore();
    }

    ctx.restore();
    return true;
  }
}

function widthOr(v: number): number {
  return Math.max(1, Math.round(v));
}

export const defaultAtlasSpriteRenderer = new AtlasSpriteRenderer();
