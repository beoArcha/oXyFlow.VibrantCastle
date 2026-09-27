import { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";

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
  private readonly imageCache: Map<string, HTMLImageElement> = new Map();

  public preload(layers?: readonly ParallaxLayerSchema[]): void {
    if (!layers || typeof Image === "undefined") return;
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (layer.imageUrl && !this.imageCache.has(layer.imageUrl)) {
        const img = new Image();
        img.src = layer.imageUrl;
        this.imageCache.set(layer.imageUrl, img);
      }
    }
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

    let img = layer.imageElement || this.imageCache.get(layer.imageUrl);
    if (!img && typeof Image !== "undefined") {
      img = new Image();
      img.src = layer.imageUrl;
      this.imageCache.set(layer.imageUrl, img);
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    const isFarStatic = layer.tier === "far" || (layer.id.includes("_far") && !layer.id.includes("mid"));

    if (isFarStatic) {
      // Far static backdrop: cleanly scales and stays fixed to the viewport
      const scale = Math.max(viewportWidth / imgW, viewportHeight / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawX = (viewportWidth - drawW) / 2;
      ctx.save();
      if (layer.opacity !== undefined && layer.opacity < 1) {
        ctx.globalAlpha = layer.opacity;
      }
      ctx.drawImage(img, Math.round(drawX), 0, Math.round(drawW), Math.round(drawH));
      ctx.restore();
      return;
    }

    // Scale to fill vertical field + parallax allowance
    const effectiveHeight = Math.max(viewportHeight, boxHeight * 0.85);
    const scale = effectiveHeight / imgH;
    const drawW = imgW * scale;
    const drawH = effectiveHeight;

    const screenX = -scrollX - driftX;
    const maxShiftY = Math.max(0, drawH - viewportHeight);
    const screenY = -progressY * maxShiftY * layer.scrollSpeedY - driftY;

    ctx.save();
    if (layer.opacity !== undefined && layer.opacity < 1) {
      ctx.globalAlpha = layer.opacity;
    }

    // Seamless horizontal repeating across viewport
    let startX = screenX % drawW;
    if (startX > 0) startX -= drawW;

    for (let x = startX; x < viewportWidth + drawW; x += drawW) {
      ctx.drawImage(img, Math.round(x), Math.round(screenY), Math.round(drawW), Math.round(drawH));
    }
    ctx.restore();
  }
}

export const defaultParallaxImageRenderer = new ParallaxImageRenderer();
