import type { LocationDefinition } from "@game/locations/types";
import type { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import type { ISectorAtmosphericRenderer } from "@game/renderer/background/atmospheric/atmosphericSectorRenderer";
import { createLayerRect, resolveFarBackdropRect } from "@game/renderer/background/parallaxGeometry";
import {
  BoundedLinearGradientCache,
  createLinearGradientSpec,
  prepareLinearGradientSpec,
  resetLinearGradientSpec,
  type LinearGradientStop,
} from "./gradientCache";

/**
 * Renders full-viewport parallax backdrops (far vista, fallback gradient, and boss arena overlays)
 * with precomputed bounded linear gradients and zero per-frame render allocations.
 */
export class ParallaxBackdropRenderer {
  private readonly farRect = createLayerRect();
  private readonly gradientCache = new BoundedLinearGradientCache();
  private readonly farGradientSpec = createLinearGradientSpec();
  private readonly fallbackGradientSpec = createLinearGradientSpec();

  constructor(
    private readonly resolveImage: (layer: ParallaxLayerSchema) => HTMLImageElement | null,
    private readonly atmosphericRenderer: ISectorAtmosphericRenderer
  ) {}

  public clearCaches(): void {
    this.gradientCache.clear();
    resetLinearGradientSpec(this.farGradientSpec);
    resetLinearGradientSpec(this.fallbackGradientSpec);
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
    const hasOpaqueFar = this.hasDrawableOpaqueFar(farLayers);
    if (!hasOpaqueFar) {
      this.drawUnderFarGradient(ctx, location, viewportWidth, viewportHeight);
    }

    let imageRendered = false;
    for (let i = 0; i < farLayers.length; i++) {
      const layer = farLayers[i];
      const img = this.resolveImage(layer);
      if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) continue;

      const isOpaqueFar = layer.opaque === true;
      const rawAlpha = layer.opacity !== undefined ? layer.opacity : 1;
      const targetAlpha = isOpaqueFar ? 1 : Math.max(0, Math.min(1, rawAlpha));
      const needsStateSave = targetAlpha < 1 || Boolean(layer.blendMode) || (isOpaqueFar && ctx.globalAlpha !== 1);

      if (needsStateSave) {
        ctx.save();
        ctx.globalAlpha = targetAlpha;
        if (layer.blendMode) {
          ctx.globalCompositeOperation = layer.blendMode;
        }
      }

      // Overscan slightly by 6% horizontally so the far horizon glides subtly without exposing viewport edges.
      resolveFarBackdropRect(this.farRect, img.naturalWidth, img.naturalHeight, viewportWidth * 1.06, viewportHeight * 1.03);
      const maxPanX = Math.max(0, this.farRect.width - viewportWidth);
      const maxPanY = Math.max(0, this.farRect.height - viewportHeight);
      ctx.drawImage(img, Math.round(-progressX * maxPanX), Math.round(-progressY * maxPanY), this.farRect.width, this.farRect.height);

      if (needsStateSave) {
        ctx.restore();
      }
      imageRendered = true;
    }

    if (!imageRendered) {
      ctx.save();
      this.atmosphericRenderer.renderProceduralFarBackdrop(ctx, location, viewportWidth, viewportHeight, tickCount);
      ctx.restore();
    }
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
    const worldId = location.worldId || location.id;
    const topColor = location.theme?.bgGradientTop || "#1c0b05";
    const bottomColor = location.theme?.bgGradientBottom || "#0a0301";
    prepareLinearGradientSpec(this.fallbackGradientSpec, "fallback_", worldId, topColor, bottomColor, viewportHeight);

    ctx.save();
    ctx.fillStyle = this.getOrCreateLinearGradient(
      ctx,
      this.fallbackGradientSpec.key,
      0,
      0,
      0,
      viewportHeight,
      this.fallbackGradientSpec.stops
    );
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    ctx.restore();
  }

  public getOrCreateLinearGradient(
    ctx: CanvasRenderingContext2D,
    key: string,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stops: readonly LinearGradientStop[]
  ): CanvasGradient {
    return this.gradientCache.getOrCreate(ctx, key, x0, y0, x1, y1, stops);
  }

  private hasDrawableOpaqueFar(farLayers: readonly ParallaxLayerSchema[]): boolean {
    for (let i = 0; i < farLayers.length; i++) {
      const layer = farLayers[i];
      if (layer.opaque !== true) continue;
      if (layer.blendMode && layer.blendMode !== "source-over") continue;
      const img = this.resolveImage(layer);
      if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        return true;
      }
    }
    return false;
  }

  private drawUnderFarGradient(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    const worldId = location.worldId || location.id;
    const topColor = location.theme?.bgGradientTop || (worldId === "thorn_chasm" ? "#14041a" : "#2a150b");
    const bottomColor = location.theme?.bgGradientBottom || (worldId === "thorn_chasm" ? "#08010d" : "#0d0502");
    prepareLinearGradientSpec(this.farGradientSpec, "far_bg_", worldId, topColor, bottomColor, viewportHeight);

    ctx.save();
    ctx.fillStyle = this.getOrCreateLinearGradient(
      ctx,
      this.farGradientSpec.key,
      0,
      0,
      0,
      viewportHeight,
      this.farGradientSpec.stops
    );
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    ctx.restore();
  }
}
