import { AssetQuality } from "@game/types";
import { assetLoader } from "@game/engine/assetLoader";
import { BackgroundProcessor } from "@game/engine/meta/slicing/BackgroundProcessor";
import {
  IAtlasMetaLike,
  resolveAnimationKeyFromStates,
  resolveAnimationTrack,
  resolveAnchor,
  resolveVariantScale,
  resolveFacingDirection,
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
}

/**
 * Universal AtlasSpriteRenderer (Single Responsibility Principle).
 * Renders sliced frames from registered AtlasMetaDoc or IUniversalMetaDocument sprite atlases with
 * normalized origin anchoring, sub-cell span calculations, optional directional mirroring,
 * and zero-allocation cached runtime chroma-keying.
 */
export class AtlasSpriteRenderer implements IAtlasSpriteRenderer {
  private readonly chromaCache: Map<string, CanvasImageSource> = new Map();

  public hasAtlas(atlasId: string): boolean {
    return !!assetLoader.getAtlas(atlasId);
  }

  public clearChromaCache(): void {
    this.chromaCache.clear();
  }

  private getEffectiveTexture(atlasId: string, texture: HTMLImageElement, meta: IAtlasMetaLike): CanvasImageSource {
    const bgConfig = meta.backgroundConfig;
    if (!bgConfig || !bgConfig.removeAtRuntime || !bgConfig.colorHex) {
      return texture;
    }

    const cached = this.chromaCache.get(atlasId);
    if (cached) return cached;

    if (typeof document === "undefined") {
      return texture;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = texture.naturalWidth;
      canvas.height = texture.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return texture;

      ctx.drawImage(texture, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const keyed = BackgroundProcessor.applyChromaKey(
        imgData,
        bgConfig.colorHex,
        bgConfig.tolerance ?? 15,
        4
      );
      ctx.putImageData(keyed as unknown as ImageData, 0, 0);

      this.chromaCache.set(atlasId, canvas);
      return canvas;
    } catch {
      return texture;
    }
  }

  public render(ctx: CanvasRenderingContext2D, options: RenderAtlasFrameOptions): boolean {
    const atlasItem = assetLoader.getAtlas(options.atlasId);
    if (!atlasItem) return false;

    const texture = assetLoader.getAtlasTexture(options.atlasId);
    if (!texture || !texture.complete || texture.naturalWidth === 0) return false;

    const meta = atlasItem.meta as unknown as IAtlasMetaLike;
    const effectiveTexture = this.getEffectiveTexture(options.atlasId, texture, meta);
    const quality = options.quality || assetLoader.getQuality();

    const cols = meta.atlas?.columns || 6;
    const rows = meta.atlas?.rows || 4;
    const cellW = texture.naturalWidth / cols;
    const cellH = texture.naturalHeight / rows;

    const animKey = resolveAnimationKeyFromStates(meta, options.animationName);
    const animTrack = resolveAnimationTrack(meta, animKey);

    const trackFrames: number = animTrack?.frames ?? 1;
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

    let col = 0;
    let span = 1;

    if (animTrack?.frameIndices && animTrack.frameIndices[currentFrame] !== undefined) {
      col = animTrack.frameIndices[currentFrame];
    } else if (animTrack?.slotSpan && animTrack.slotSpan.length > 0) {
      col = 0;
      for (let i = 0; i < currentFrame; i++) {
        col += animTrack.slotSpan[i] || 1;
      }
      span = animTrack.slotSpan[currentFrame] || 1;
    } else if (animTrack?.cells && animTrack.cells.length > 0) {
      col = 0;
      for (let i = 0; i < currentFrame; i++) {
        col += animTrack.cells[i] || 1;
      }
      span = animTrack.cells[currentFrame] || 1;
    } else if (animTrack?.startCol !== undefined) {
      col = animTrack.startCol + currentFrame * (animTrack.widthCells || 1);
      span = animTrack.widthCells || 1;
    } else {
      col = currentFrame;
    }

    const row = animTrack?.row ?? 0;
    const sx = col * cellW;
    const sy = row * cellH;
    const sw = span * cellW;
    const sh = cellH;

    const anchor = resolveAnchor(meta);
    const extraMultiplier = options.scaleMultiplier ?? 1.0;
    let scale: number;

    if (options.height > 0) {
      const visibleRatio = anchor.y >= 0.8 ? 0.94 : 0.88;
      const baseScale = options.height / (cellH * visibleRatio);
      scale = baseScale * extraMultiplier;
    } else {
      const variantScale = resolveVariantScale(meta, quality);
      scale = variantScale * extraMultiplier;
    }

    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);

    const targetAnchorX = Math.round(options.x + options.width / 2);
    const isGroundAnchored = anchor.y >= 0.8;
    const targetAnchorY = Math.round(
      isGroundAnchored ? options.y + options.height : options.y + options.height / 2
    );

    const drawX = Math.round(targetAnchorX - anchor.x * dw);
    const drawY = Math.round(targetAnchorY - anchor.y * dh);

    ctx.save();

    if (options.alpha !== undefined && options.alpha < 1) {
      ctx.globalAlpha = options.alpha;
    }

    const naturalFacing = resolveFacingDirection(meta);
    const needsFlip =
      naturalFacing === "left"
        ? options.facingLeft === false
        : !!options.facingLeft;

    if (needsFlip) {
      ctx.translate(targetAnchorX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-targetAnchorX, 0);
    }

    ctx.drawImage(effectiveTexture, sx, sy, sw, sh, drawX, drawY, dw, dh);

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
