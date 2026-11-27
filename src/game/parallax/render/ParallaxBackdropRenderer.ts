import type { LocationDefinition } from "@game/locations/types";
import type { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import type { ISectorAtmosphericRenderer } from "@game/renderer/background/atmospheric/atmosphericSectorRenderer";
import { createLayerRect, resolveFarBackdropRect } from "@game/renderer/background/parallaxGeometry";

/**
 * Renders full-viewport parallax backdrops (far vista, fallback gradient, and boss arena overlays)
 * with cached linear gradients and zero per-frame rect allocations.
 */
export class ParallaxBackdropRenderer {
  private readonly farRect = createLayerRect();
  private readonly gradientCache: Map<string, CanvasGradient> = new Map();

  constructor(
    private readonly resolveImage: (layer: ParallaxLayerSchema) => HTMLImageElement | null,
    private readonly atmosphericRenderer: ISectorAtmosphericRenderer
  ) {}

  public clearCaches(): void {
    this.gradientCache.clear();
  }

  public renderFarStaticBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    farLayers: readonly ParallaxLayerSchema[],
    viewportWidth: number,
    viewportHeight: number,
    progressX: number,
    progressY: number,
    tickCount: number
  ): void {
    ctx.save();

    const topColor = location.theme?.bgGradientTop || (location.id === "thorn_chasm" ? "#14041a" : "#2a150b");
    const bottomColor = location.theme?.bgGradientBottom || (location.id === "thorn_chasm" ? "#08010d" : "#0d0502");
    ctx.fillStyle = this.getOrCreateLinearGradient(ctx, `far_bg_${location.id}_${viewportHeight}`, 0, 0, 0, viewportHeight, [
      [0, topColor],
      [1, bottomColor],
    ]);
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    let imageRendered = false;
    for (let i = 0; i < farLayers.length; i++) {
      const layer = farLayers[i];
      const img = this.resolveImage(layer);
      if (!img || !img.complete || img.naturalWidth === 0) continue;

      ctx.save();
      if (layer.opacity !== undefined) {
        ctx.globalAlpha = layer.opacity;
      }

      // Overscan slightly by 6% horizontally so the far horizon glides subtly without exposing viewport edges.
      resolveFarBackdropRect(this.farRect, img.naturalWidth, img.naturalHeight, viewportWidth * 1.06, viewportHeight * 1.03);
      const maxPanX = Math.max(0, this.farRect.width - viewportWidth);
      const maxPanY = Math.max(0, this.farRect.height - viewportHeight);
      ctx.drawImage(img, Math.round(-progressX * maxPanX), Math.round(-progressY * maxPanY), this.farRect.width, this.farRect.height);
      ctx.restore();
      imageRendered = true;
    }

    if (!imageRendered) {
      this.atmosphericRenderer.renderProceduralFarBackdrop(ctx, location, viewportWidth, viewportHeight, tickCount);
    }

    ctx.restore();
  }

  public renderBossBackdropTier(
    ctx: CanvasRenderingContext2D,
    bossLayers: readonly ParallaxLayerSchema[],
    tier: "boss_stage" | "boss_world",
    intensity: number,
    viewportWidth: number,
    viewportHeight: number,
    progressX: number,
    progressY: number,
    tickCount: number
  ): void {
    const pulse = 0.92 + Math.sin(tickCount * 0.04) * 0.08;
    const effectiveAlpha = intensity * pulse;

    for (let i = 0; i < bossLayers.length; i++) {
      const layer = bossLayers[i];
      const img = this.resolveImage(layer);
      if (!img || !img.complete || img.naturalWidth === 0) continue;

      ctx.save();
      const baseOpacity = layer.opacity !== undefined ? layer.opacity : tier === "boss_world" ? 0.88 : 0.72;
      ctx.globalAlpha = Math.max(0, Math.min(1, baseOpacity * effectiveAlpha));
      if (layer.blendMode) {
        ctx.globalCompositeOperation = layer.blendMode;
      }

      resolveFarBackdropRect(this.farRect, img.naturalWidth, img.naturalHeight, viewportWidth * 1.06, viewportHeight * 1.04);
      const shiftX = (0.5 - progressX) * viewportWidth * 0.04;
      const shiftY = (0.5 - progressY) * viewportHeight * 0.02;
      ctx.drawImage(
        img,
        Math.round(this.farRect.x - viewportWidth * 0.03 + shiftX),
        Math.round(this.farRect.y - viewportHeight * 0.02 + shiftY),
        this.farRect.width,
        this.farRect.height
      );
      ctx.restore();
    }
  }

  public renderFallbackBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    ctx.save();
    const topColor = location.theme?.bgGradientTop || "#1c0b05";
    const bottomColor = location.theme?.bgGradientBottom || "#0a0301";
    ctx.fillStyle = this.getOrCreateLinearGradient(ctx, `fallback_${location.id}_${viewportHeight}`, 0, 0, 0, viewportHeight, [
      [0, topColor],
      [1, bottomColor],
    ]);
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    ctx.restore();
  }

  private getOrCreateLinearGradient(
    ctx: CanvasRenderingContext2D,
    key: string,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stops: readonly [number, string][]
  ): CanvasGradient {
    let grad = this.gradientCache.get(key);
    if (!grad) {
      grad = ctx.createLinearGradient(x0, y0, x1, y1);
      for (let i = 0; i < stops.length; i++) {
        grad.addColorStop(stops[i][0], stops[i][1]);
      }
      this.gradientCache.set(key, grad);
    }
    return grad;
  }
}
