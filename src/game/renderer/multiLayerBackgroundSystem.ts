import { LocationDefinition } from "../locations/types";
import {
  BackgroundLayerTier,
  ParallaxLayerSchema,
} from "../locations/schema/locationSchema";
import { debugManager } from "../debug/debugManager";
import { assetLoader } from "../engine/assetLoader";
import {
  ISectorAtmosphericRenderer,
  defaultAtmosphericSectorRenderer,
} from "./background/atmospheric/atmosphericSectorRenderer";

export interface IMultiLayerBackgroundSystem {
  isSupported(locationId: string): boolean;
  preload(layers?: readonly ParallaxLayerSchema[]): void;
  render(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    levelWidth: number,
    levelHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    cameraX: number,
    cameraY: number,
    tickCount: number
  ): void;
  clearCaches(): void;
}

const TIER_ORDER: readonly BackgroundLayerTier[] = [
  "far",
  "mid_far",
  "mid",
  "mid_close",
  "close",
];

const DYNAMIC_TIERS: readonly BackgroundLayerTier[] = [
  "mid_far",
  "mid",
  "mid_close",
  "close",
] as const;

const DEFAULT_TIER_SPEEDS: Readonly<
  Record<BackgroundLayerTier, { readonly x: number; readonly y: number }>
> = {
  far: { x: 0.0, y: 0.0 }, // static
  mid_far: { x: 0.22, y: 0.09 },
  mid: { x: 0.42, y: 0.18 },
  mid_close: { x: 0.65, y: 0.3 },
  close: { x: 0.85, y: 0.45 },
};

/**
 * MultiLayerBackgroundSystem:
 * Implements a high-performance multi-layered background system for all primary sectors.
 * - 'far' tier: Rendered as a static backdrop, anchored to the viewport without camera parallax movement.
 * - 'mid_far', 'mid', 'mid_close', 'close' tiers: Dynamically rendered with calculated parallax scrolling.
 * Integrated with centralized assetLoader (AGENT.md § 4.1).
 */
export class MultiLayerBackgroundSystem implements IMultiLayerBackgroundSystem {
  private readonly atmosphericRenderer: ISectorAtmosphericRenderer;
  private readonly gradientCache: Map<string, CanvasGradient> = new Map();
  private readonly tierBuckets: Record<BackgroundLayerTier, ParallaxLayerSchema[]> = {
    far: [],
    mid_far: [],
    mid: [],
    mid_close: [],
    close: [],
  };

  constructor(deps: { atmosphericRenderer?: ISectorAtmosphericRenderer } = {}) {
    this.atmosphericRenderer = deps.atmosphericRenderer || defaultAtmosphericSectorRenderer;
  }

  public clearCaches(): void {
    this.gradientCache.clear();
    this.atmosphericRenderer.clearCaches();
  }

  public clearGradientCache(): void {
    this.clearCaches();
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

  /**
   * Check if a location is configured for or targeted by the multi-layered background system.
   */
  public isSupported(locationId: string): boolean {
    return (
      locationId === "grand_bastion" ||
      locationId === "thorn_chasm" ||
      locationId === "courtyard" ||
      locationId === "clocktower" ||
      locationId === "aether_sanctuary"
    );
  }

  /**
   * Preload background textures into the centralized assetLoader texture cache.
   */
  public preload(layers?: readonly ParallaxLayerSchema[]): void {
    if (!layers || typeof Image === "undefined") return;
    for (let i = 0; i < layers.length; i++) {
      const url = layers[i].imageUrl;
      if (url && !assetLoader.isTextureLoaded(url)) {
        assetLoader.loadTexture(url).catch(() => {});
      }
    }
  }

  private getImage(url: string | undefined): HTMLImageElement | null {
    if (!url || typeof Image === "undefined") return null;
    const cached = assetLoader.getTexture(url);
    if (!cached) {
      assetLoader.loadTexture(url).catch(() => {});
    }
    return cached;
  }

  /**
   * Resolves the layer tier from the layer schema, id, or name.
   */
  private resolveTier(layer: ParallaxLayerSchema): BackgroundLayerTier {
    if (layer.tier) return layer.tier;

    const id = layer.id.toLowerCase();
    if (id.includes("mid_far") || id.includes("mid-far")) return "mid_far";
    if (id.includes("mid_close") || id.includes("mid-close") || id.includes("close_mid")) return "mid_close";
    if (id.includes("far") && !id.includes("mid")) return "far";
    if (id.includes("close") && !id.includes("mid")) return "close";
    if (id.includes("mid")) return "mid";

    // Depth-based fallback
    if (layer.depth <= 0.15) return "far";
    if (layer.depth <= 0.35) return "mid_far";
    if (layer.depth <= 0.55) return "mid";
    if (layer.depth <= 0.75) return "mid_close";
    return "close";
  }

  /**
   * Main rendering method for the multi-layered background system.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    levelWidth: number,
    levelHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    cameraX: number,
    cameraY: number,
    tickCount: number
  ): void {
    const pb = location.parallaxBackground;
    if (!pb || !pb.layers || pb.layers.length === 0) {
      this.renderFallbackBackdrop(ctx, location, viewportWidth, viewportHeight);
      return;
    }

    const boxWidth = Math.max(pb.boxWidth || 0, levelWidth + 400);
    const boxHeight = Math.max(pb.boxHeight || 0, levelHeight + 200);

    const extraWidth = Math.max(0, boxWidth - viewportWidth);
    const extraHeight = Math.max(0, boxHeight - viewportHeight);

    const maxCamX = Math.max(1, levelWidth - viewportWidth);
    const maxCamY = Math.max(1, levelHeight - viewportHeight);

    const progressX = Math.max(0, Math.min(1, cameraX / maxCamX));
    const progressY = Math.max(0, Math.min(1, cameraY / maxCamY));

    // Clear pre-allocated tier buckets
    for (let t = 0; t < TIER_ORDER.length; t++) {
      this.tierBuckets[TIER_ORDER[t]].length = 0;
    }

    // Sort into pre-allocated buckets without GC allocations
    const layers = pb.layers;
    for (let i = 0; i < layers.length; i++) {
      const tier = this.resolveTier(layers[i]);
      this.tierBuckets[tier].push(layers[i]);
    }

    // 1. Render 'far' static backdrop
    this.renderFarStaticBackdrop(
      ctx,
      location,
      this.tierBuckets.far,
      viewportWidth,
      viewportHeight,
      tickCount
    );

    // 2. Render dynamic tiers in back-to-front order
    for (let i = 0; i < DYNAMIC_TIERS.length; i++) {
      const tier = DYNAMIC_TIERS[i];
      const layersInTier = this.tierBuckets[tier];

      for (let j = 0; j < layersInTier.length; j++) {
        const layer = layersInTier[j];
        this.renderDynamicLayer(
          ctx,
          layer,
          tier,
          boxHeight,
          extraWidth,
          progressX,
          progressY,
          viewportWidth,
          viewportHeight,
          tickCount
        );
      }

      // Atmospheric environmental depth blending between mid and close tiers
      if (tier === "mid") {
        this.atmosphericRenderer.renderSectorAtmosphere(
          ctx,
          location.id,
          viewportWidth,
          viewportHeight,
          tickCount
        );
      }
    }
  }

  /**
   * Renders the 'far' layer as a static backdrop.
   */
  private renderFarStaticBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    farLayers: ParallaxLayerSchema[],
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();

    // Solid base gradient underneath image
    const topColor = location.theme?.bgGradientTop || (location.id === "thorn_chasm" ? "#14041a" : "#2a150b");
    const bottomColor = location.theme?.bgGradientBottom || (location.id === "thorn_chasm" ? "#08010d" : "#0d0502");
    const bgGrad = this.getOrCreateLinearGradient(
      ctx,
      `far_bg_${location.id}_${viewportHeight}`,
      0,
      0,
      0,
      viewportHeight,
      [
        [0, topColor],
        [1, bottomColor],
      ]
    );
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    let imageRendered = false;

    for (let i = 0; i < farLayers.length; i++) {
      const layer = farLayers[i];
      if (layer.imageUrl) {
        const img = layer.imageElement || this.getImage(layer.imageUrl);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          if (layer.opacity !== undefined) {
            ctx.globalAlpha = layer.opacity;
          }

          const scale = Math.max(
            viewportWidth / img.naturalWidth,
            viewportHeight / img.naturalHeight
          );
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          const drawX = (viewportWidth - drawW) / 2;
          const drawY = 0;

          ctx.drawImage(img, Math.round(drawX), Math.round(drawY), Math.round(drawW), Math.round(drawH));
          ctx.restore();
          imageRendered = true;
        }
      }
    }

    // If far image is loading, provide procedural stylized backdrop
    if (!imageRendered) {
      this.atmosphericRenderer.renderProceduralFarBackdrop(
        ctx,
        location,
        viewportWidth,
        viewportHeight,
        tickCount
      );
    }

    ctx.restore();
  }

  /**
   * Renders a dynamic layer ('mid_far', 'mid', 'mid_close', 'close') on top of the static backdrop.
   */
  private renderDynamicLayer(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    tier: BackgroundLayerTier,
    boxHeight: number,
    extraWidth: number,
    progressX: number,
    progressY: number,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    if (!layer.imageUrl) return;

    const img = layer.imageElement || this.getImage(layer.imageUrl);
    if (!img || !img.complete || img.naturalWidth === 0) return;

    ctx.save();
    if (layer.opacity !== undefined && layer.opacity < 1) {
      ctx.globalAlpha = layer.opacity;
    }

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    const effectiveHeight = Math.max(viewportHeight, boxHeight * 0.85);
    const scale = effectiveHeight / imgH;
    const drawW = imgW * scale;
    const drawH = effectiveHeight;

    const speed = DEFAULT_TIER_SPEEDS[tier] || { x: 0.5, y: 0.2 };
    const scrollSpeedX = layer.scrollSpeedX !== undefined ? layer.scrollSpeedX : speed.x;
    const scrollSpeedY = layer.scrollSpeedY !== undefined ? layer.scrollSpeedY : speed.y;

    const driftX = layer.autoDriftX ? tickCount * layer.autoDriftX : 0;
    const driftY = layer.autoDriftY ? tickCount * layer.autoDriftY : 0;

    const scrollX = progressX * extraWidth * scrollSpeedX;
    const screenX = -scrollX - driftX;

    const maxShiftY = Math.max(0, drawH - viewportHeight);
    const screenY = -progressY * maxShiftY * scrollSpeedY - driftY;

    let startX = screenX % drawW;
    if (startX > 0) startX -= drawW;

    for (let x = startX; x < viewportWidth + drawW; x += drawW) {
      ctx.drawImage(img, Math.round(x), Math.round(screenY), Math.round(drawW), Math.round(drawH));
    }

    // Debug Tier Boundary Wireframes
    if (debugManager.state.showHitboxes) {
      ctx.save();
      ctx.strokeStyle =
        tier === "mid_far"
          ? "#38bdf8"
          : tier === "mid"
          ? "#22c55e"
          : tier === "mid_close"
          ? "#eab308"
          : "#ec4899";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(0, 0, viewportWidth, viewportHeight);
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(`TIER: ${tier.toUpperCase()} [${layer.id}]`, 14, 24 + DYNAMIC_TIERS.indexOf(tier) * 16);
      ctx.restore();
    }

    ctx.restore();
  }

  private renderFallbackBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    _viewportWidth: number,
    viewportHeight: number
  ): void {
    ctx.save();
    const key = `fallback_${location.id}_${viewportHeight}`;
    const topColor = location.theme?.bgGradientTop || "#1c0b05";
    const bottomColor = location.theme?.bgGradientBottom || "#0a0301";
    const grad = this.getOrCreateLinearGradient(
      ctx,
      key,
      0,
      0,
      0,
      viewportHeight,
      [
        [0, topColor],
        [1, bottomColor],
      ]
    );
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, _viewportWidth, viewportHeight);
    ctx.restore();
  }
}

export const defaultMultiLayerBackgroundSystem = new MultiLayerBackgroundSystem();
