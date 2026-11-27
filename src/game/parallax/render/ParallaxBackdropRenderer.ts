import type { LocationDefinition } from "@game/locations/types";
import type { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import type { ISectorAtmosphericRenderer } from "@game/renderer/background/atmospheric/atmosphericSectorRenderer";
import { createLayerRect, resolveFarBackdropRect } from "@game/renderer/background/parallaxGeometry";

type GradientStop = [number, string];

interface PrecomputedLinearGradientSpec {
  worldId: string;
  topColor: string;
  bottomColor: string;
  height: number;
  key: string;
  readonly stops: readonly [GradientStop, GradientStop];
}

const MAX_GRADIENT_CACHE_SIZE = 32;

function createGradientSpec(): PrecomputedLinearGradientSpec {
  return {
    worldId: "",
    topColor: "",
    bottomColor: "",
    height: -1,
    key: "",
    stops: [
      [0, ""],
      [1, ""],
    ],
  };
}

/**
 * Renders full-viewport parallax backdrops (far vista, fallback gradient, and boss arena overlays)
 * with precomputed bounded linear gradients and zero per-frame render allocations.
 */
export class ParallaxBackdropRenderer {
  private readonly farRect = createLayerRect();
  private readonly gradientCache: Map<string, CanvasGradient> = new Map();
  private readonly farGradientSpec = createGradientSpec();
  private readonly fallbackGradientSpec = createGradientSpec();

  constructor(
    private readonly resolveImage: (layer: ParallaxLayerSchema) => HTMLImageElement | null,
    private readonly atmosphericRenderer: ISectorAtmosphericRenderer
  ) {}

  public clearCaches(): void {
    this.gradientCache.clear();
    this.resetGradientSpec(this.farGradientSpec);
    this.resetGradientSpec(this.fallbackGradientSpec);
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
    this.prepareGradientSpec(this.fallbackGradientSpec, "fallback_", worldId, topColor, bottomColor, viewportHeight);

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
    stops: readonly (readonly [number, string])[]
  ): CanvasGradient {
    let grad = this.gradientCache.get(key);
    if (!grad) {
      grad = ctx.createLinearGradient(x0, y0, x1, y1);
      for (let i = 0; i < stops.length; i++) {
        grad.addColorStop(stops[i][0], stops[i][1]);
      }
      if (this.gradientCache.size >= MAX_GRADIENT_CACHE_SIZE && !this.gradientCache.has(key)) {
        const oldestKey = this.gradientCache.keys().next().value;
        if (oldestKey !== undefined) {
          this.gradientCache.delete(oldestKey);
        }
      }
      this.gradientCache.set(key, grad);
    }
    return grad;
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
    this.prepareGradientSpec(this.farGradientSpec, "far_bg_", worldId, topColor, bottomColor, viewportHeight);

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

  private prepareGradientSpec(
    spec: PrecomputedLinearGradientSpec,
    prefix: string,
    worldId: string,
    topColor: string,
    bottomColor: string,
    viewportHeight: number
  ): void {
    if (
      spec.worldId === worldId &&
      spec.topColor === topColor &&
      spec.bottomColor === bottomColor &&
      spec.height === viewportHeight
    ) {
      return;
    }

    spec.worldId = worldId;
    spec.topColor = topColor;
    spec.bottomColor = bottomColor;
    spec.height = viewportHeight;
    spec.key = `${prefix}${worldId}_${topColor}_${bottomColor}_${viewportHeight}`;
    spec.stops[0][1] = topColor;
    spec.stops[1][1] = bottomColor;
  }

  private resetGradientSpec(spec: PrecomputedLinearGradientSpec): void {
    spec.worldId = "";
    spec.topColor = "";
    spec.bottomColor = "";
    spec.height = -1;
    spec.key = "";
    spec.stops[0][1] = "";
    spec.stops[1][1] = "";
  }
}
