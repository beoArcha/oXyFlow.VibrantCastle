import { AssetQuality } from "../types";
import { AtlasMetaDoc } from "../engine/spriteTypes";
import { assetLoader } from "../engine/assetLoader";

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
 * Renders sliced frames from any registered AtlasMetaDoc sprite atlas with
 * normalized origin anchoring, sub-cell span calculations, and optional directional mirroring.
 */
export class AtlasSpriteRenderer implements IAtlasSpriteRenderer {
  public hasAtlas(atlasId: string): boolean {
    return !!assetLoader.getAtlas(atlasId);
  }

  public render(ctx: CanvasRenderingContext2D, options: RenderAtlasFrameOptions): boolean {
    const atlasItem = assetLoader.getAtlas(options.atlasId);
    if (!atlasItem) return false;

    const texture = assetLoader.getAtlasTexture(options.atlasId);
    if (!texture || !texture.complete || texture.naturalWidth === 0) return false;

    const meta: AtlasMetaDoc = atlasItem.meta;
    const quality = options.quality || assetLoader.getQuality();

    // 1. Resolve cell dimensions from metadata variants or nominal atlas grid
    const cellW =
      meta.variants?.[quality]?.cellWidth ??
      meta.atlas?.cellWidth ??
      Math.round(texture.naturalWidth / (meta.atlas?.columns || 6));
    const cellH =
      meta.variants?.[quality]?.cellHeight ??
      meta.atlas?.cellHeight ??
      Math.round(texture.naturalHeight / (meta.atlas?.rows || 4));

    // 2. Resolve animation track name (check state aliases e.g. inactive -> idle)
    let animKey = options.animationName;
    if (meta.states?.[animKey]?.animation) {
      animKey = meta.states[animKey].animation;
    }

    const animTrack =
      meta.animations?.[animKey] ||
      meta.layout?.[animKey] ||
      (meta.animations ? Object.values(meta.animations)[0] : null);

    const trackFrames: number = animTrack?.frames ?? 1;
    const trackFps: number = animTrack?.fps ?? 8;
    const trackLoop: boolean = animTrack?.loop !== undefined ? animTrack.loop : true;

    // 3. Compute discrete frame index
    let currentFrame = 0;
    if (options.frameIndex !== undefined) {
      currentFrame = Math.abs(options.frameIndex) % Math.max(1, trackFrames);
    } else {
      const ticks = options.ticks ?? 0;
      const frameDuration = Math.max(1, Math.round(60 / Math.max(1, trackFps)));
      const step = Math.floor(ticks / frameDuration);
      currentFrame = trackLoop ? step % trackFrames : Math.min(step, trackFrames - 1);
    }

    // 4. Calculate source bounding rectangle
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

    // 5. Determine normalized anchor / origin
    let anchorX = 0.5;
    let anchorY = 1.0;

    if (meta.anchor) {
      anchorX = meta.anchor.x;
      anchorY = meta.anchor.y;
    } else if (meta.layout?.origin?.normalized) {
      anchorX = meta.layout.origin.normalized.x;
      anchorY = meta.layout.origin.normalized.y;
    }

    // Target scale calculation: fit entity smoothly
    const variantScale = meta.variants?.[quality]?.scale ?? 1.0;
    const extraMultiplier = options.scaleMultiplier ?? 1.0;
    const scale = variantScale * extraMultiplier;

    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);

    // Target world anchor point
    const targetAnchorX = Math.round(options.x + options.width / 2);
    const targetAnchorY = Math.round(
      anchorY >= 0.85 ? options.y + options.height : options.y + options.height / 2
    );

    const drawX = Math.round(targetAnchorX - anchorX * dw);
    const drawY = Math.round(targetAnchorY - anchorY * dh);

    ctx.save();

    if (options.alpha !== undefined && options.alpha < 1) {
      ctx.globalAlpha = options.alpha;
    }

    // Directional mirroring (e.g. facingLeft)
    if (options.facingLeft) {
      ctx.translate(targetAnchorX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-targetAnchorX, 0);
    }

    // Draw main sprite
    ctx.drawImage(texture, sx, sy, sw, sh, drawX, drawY, dw, dh);

    // Damage flash tint overlay
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
