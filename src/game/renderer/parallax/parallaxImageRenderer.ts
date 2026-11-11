import { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import {
  MirrorableLayer,
  createLayerRect,
  resolveFarBackdropRect,
  resolveLayerDrawHeight,
  resolveLayerScreenY,
} from "../background/parallaxGeometry";
import { assetLoader } from "@game/engine/assetLoader";
import { drawHorizontalTiles } from "../background/parallaxTiling";

export interface IParallaxImageRenderer {
  preload(layers?: readonly ParallaxLayerSchema[]): void;
  render(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    boxHeight: number,
    progressY: number,
    scrollX: number,
    driftX: number,
    driftY: number,
    viewportWidth: number,
    viewportHeight: number
  ): void;
}

/**
 * Dedicated renderer for static image backgrounds and repeating horizontal parallax layers.
 * Handles texture caching, vertical fitting, and seamless wrapping without GC allocations.
 */
export class ParallaxImageRenderer implements IParallaxImageRenderer {
  private readonly farRect = createLayerRect();

  public preload(layers?: readonly ParallaxLayerSchema[]): void {
    if (!layers || typeof Image === "undefined") return;
    for (let i = 0; i < layers.length; i++) {
      const url = layers[i].imageUrl;
      if (url && !assetLoader.isTextureLoaded(url)) {
        assetLoader.loadTexture(url).catch(() => {});
      }
    }
  }

  private getImage(url: string): HTMLImageElement | null {
    const cached = assetLoader.getTexture(url);
    if (!cached && typeof Image !== "undefined") {
      assetLoader.loadTexture(url).catch(() => {});
    }
    return cached;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    boxHeight: number,
    progressY: number,
    scrollX: number,
    driftX: number,
    driftY: number,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    if (!layer.imageUrl) return;

    const img = layer.imageElement || this.getImage(layer.imageUrl);
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const isFarStatic = layer.tier === "far" || (layer.id.includes("_far") && !layer.id.includes("mid"));

    if (isFarStatic) {
      resolveFarBackdropRect(this.farRect, img.naturalWidth, img.naturalHeight, viewportWidth, viewportHeight);
      ctx.save();
      if (layer.opacity !== undefined && layer.opacity < 1) {
        ctx.globalAlpha = layer.opacity;
      }
      ctx.drawImage(img, this.farRect.x, this.farRect.y, this.farRect.width, this.farRect.height);
      ctx.restore();
      return;
    }

    const drawH = resolveLayerDrawHeight(img.naturalHeight, boxHeight, viewportHeight);
    const drawW = img.naturalWidth * (drawH / img.naturalHeight);
    const screenX = -scrollX - driftX;
    const screenY = resolveLayerScreenY(drawH, viewportHeight, progressY, layer.scrollSpeedY, driftY);

    ctx.save();
    if (layer.opacity !== undefined && layer.opacity < 1) {
      ctx.globalAlpha = layer.opacity;
    }
    drawHorizontalTiles(ctx, img, screenX, screenY, drawW, drawH, viewportWidth, (layer as MirrorableLayer).mirrorTile === true);
    ctx.restore();
  }
}

export const defaultParallaxImageRenderer = new ParallaxImageRenderer();
