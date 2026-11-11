import { AssetQuality } from "@game/types";
import { assetLoader } from "@game/engine/assetLoader";
import { rendererLogger } from "@game/logger/gameLogger";
import { BackgroundProcessor } from "@game/engine/meta/slicing/BackgroundProcessor";
import type { AtlasTexture } from "@game/engine/atlas";
import {
  IAtlasMetaLike,
  AtlasRenderInfo,
  getAtlasRenderInfo,
  resolveAnimationKeyFromStates,
  resolveAnimationTrack,
  resolveEffectiveFrameCount,
  resolveFrameColumn,
  resolveFrameSpan,
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

export interface IAtlasSpriteRenderer {
  render(ctx: CanvasRenderingContext2D, options: RenderAtlasFrameOptions): boolean;
  hasAtlas(atlasId: string): boolean;
  hasAnimation(atlasId: string, animationName: string): boolean;
}

/**
 * Renders sliced frames from registered atlas variants (PNG or pre-rasterised SVG sheets) with
 * normalized origin anchoring, multi-cell frames, directional mirroring and cached chroma-keying.
 * Sheets whose meta carries `layout.bodyBox` are scaled and anchored by their body; other sheets
 * keep the legacy visible-ratio heuristic.
 */
export class AtlasSpriteRenderer implements IAtlasSpriteRenderer {
  private chromaCache: WeakMap<AtlasTexture, CanvasImageSource> = new WeakMap();
  private drawX = 0;
  private drawY = 0;
  private drawW = 0;
  private drawH = 0;
  private pivotX = 0;

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
   * Fills the draw rectangle and mirror pivot for one frame spanning `span` cells.
   * Body-box sheets: the body inside the first cell is scaled to the hitbox height and placed
   * on the hitbox (feet or centre); extra cells extend to the right of the first one.
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
    const body = info.body;
    const sw = span * cellW;
    const anchorX = Math.round(options.x + options.width / 2);
    this.pivotX = anchorX;

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

    const animKey = resolveAnimationKeyFromStates(meta, options.animationName);
    const animTrack = resolveAnimationTrack(meta, animKey);

    const trackFrames: number = resolveEffectiveFrameCount(animTrack);
    if (trackFrames <= 0) return false;
    const trackFps: number = animTrack?.fps ?? 8;
    const trackLoop: boolean = animTrack?.loop !== undefined ? animTrack.loop : true;

    let currentFrame = 0;
    if (options.frameIndex !== undefined) {
      currentFrame = Math.abs(options.frameIndex) % Math.max(1, trackFrames);
    } else {
      const ticks = options.ticks ?? 0;
      const frameDuration = Math.max(1, Math.round(60 / Math.max(1, trackFps)));
      const step = Math.floor(ticks / frameDuration);
      currentFrame = trackLoop ? step % trackFrames : Math.min(step, trackFrames - 1);
    }

    const span = resolveFrameSpan(animTrack, currentFrame);
    const sx = resolveFrameColumn(animTrack, currentFrame) * cellW;
    const sy = (animTrack?.row ?? 0) * cellH;
    const sw = span * cellW;

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

    ctx.drawImage(source, sx, sy, sw, cellH, drawX, drawY, dw, dh);

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

export const defaultAtlasSpriteRenderer = new AtlasSpriteRenderer();
