import { AssetQuality } from "../types";
import {
  AtlasMetaDoc,
  IUniversalMetaDocument,
  ICreatureMetaDocument,
  IStructureMetaDocument,
} from "../engine/spriteTypes";
import { assetLoader } from "../engine/assetLoader";
import { BackgroundProcessor } from "../engine/meta/slicing/BackgroundProcessor";

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
 * Renders sliced frames from any registered AtlasMetaDoc or IUniversalMetaDocument sprite atlas with
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

  private getEffectiveTexture(atlasId: string, texture: HTMLImageElement, meta: any): CanvasImageSource {
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

    const meta: IUniversalMetaDocument | ICreatureMetaDocument | IStructureMetaDocument | AtlasMetaDoc = atlasItem.meta;
    const effectiveTexture = this.getEffectiveTexture(options.atlasId, texture, meta);
    const quality = options.quality || assetLoader.getQuality();

    // 1. Resolve source cell dimensions directly from actual texture dimensions & atlas grid
    const cols = meta.atlas?.columns || 6;
    const rows = meta.atlas?.rows || 4;
    const cellW = texture.naturalWidth / cols;
    const cellH = texture.naturalHeight / rows;

    // 2. Resolve animation track name (check state aliases e.g. inactive -> idle)
    let animKey = options.animationName;
    if ("states" in meta && meta.states) {
      const statesObj: any = "states" in meta.states ? (meta.states as any).states : meta.states;
      if (statesObj?.[animKey]?.animation) {
        animKey = statesObj[animKey].animation;
      }
    }

    let animTrack: any = null;
    if ("animations" in meta && meta.animations) {
      const animsObj: any = "animations" in meta.animations ? (meta.animations as any).animations : meta.animations;
      let firstAnim: any = null;
      if (animsObj && typeof animsObj === "object") {
        for (const k in animsObj) {
          firstAnim = animsObj[k];
          break;
        }
      }
      animTrack = animsObj?.[animKey] || (meta as any).layout?.[animKey] || firstAnim;
    }

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

    if ("anchor" in meta && (meta as any).anchor) {
      anchorX = (meta as any).anchor.x;
      anchorY = (meta as any).anchor.y;
    } else if (meta.layout?.anchor) {
      anchorX = meta.layout.anchor.x;
      anchorY = meta.layout.anchor.y;
    } else if (meta.layout?.origin?.normalized) {
      anchorX = meta.layout.origin.normalized.x;
      anchorY = meta.layout.origin.normalized.y;
    }

    // 6. Target scale calculation: fit entity hitbox smoothly
    const extraMultiplier = options.scaleMultiplier ?? 1.0;
    let scale: number;

    if (options.height > 0) {
      // The sprite character/structure occupies ~90-95% of cell height
      const visibleRatio = anchorY >= 0.8 ? 0.94 : 0.88;
      const baseScale = options.height / (cellH * visibleRatio);
      scale = baseScale * extraMultiplier;
    } else {
      let variantScale = 1.0;
      if ("variants" in meta && meta.variants) {
        const variantsObj: any = "variants" in meta.variants ? (meta.variants as any).variants : meta.variants;
        variantScale = variantsObj?.[quality]?.scale ?? 1.0;
      }
      scale = variantScale * extraMultiplier;
    }

    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);

    // 7. Target world anchor point and draw coordinates
    const targetAnchorX = Math.round(options.x + options.width / 2);
    const isGroundAnchored = anchorY >= 0.8;
    const targetAnchorY = Math.round(
      isGroundAnchored ? options.y + options.height : options.y + options.height / 2
    );

    const drawX = Math.round(targetAnchorX - anchorX * dw);
    const drawY = Math.round(targetAnchorY - anchorY * dh);

    ctx.save();

    if (options.alpha !== undefined && options.alpha < 1) {
      ctx.globalAlpha = options.alpha;
    }

    // 8. Directional mirroring (respecting asset's natural orientation)
    const naturalFacing =
      (meta as any).naturalFacing ||
      (meta as any).defaultFacing ||
      meta.layout?.naturalFacing ||
      meta.layout?.defaultFacing ||
      "right";

    const needsFlip =
      naturalFacing === "left"
        ? options.facingLeft === false
        : !!options.facingLeft;

    if (needsFlip) {
      ctx.translate(targetAnchorX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-targetAnchorX, 0);
    }

    // 9. Draw main sprite
    ctx.drawImage(effectiveTexture, sx, sy, sw, sh, drawX, drawY, dw, dh);

    // 10. Damage flash tint overlay
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
