import { LocationDefinition } from "@game/locations/types";
import {
  BackgroundLayerTier,
  ParallaxLayerSchema,
} from "@game/locations/schema/locationSchema";
import { assetLoader } from "@game/engine/assetLoader";
import {
  ISectorAtmosphericRenderer,
  defaultAtmosphericSectorRenderer,
} from "./background/atmospheric/atmosphericSectorRenderer";
import {
  TIER_ORDER,
  DYNAMIC_TIERS,
  resolveBackgroundTier,
  renderTiledDynamicLayer,
} from "./background/parallaxTiling";

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

/**
 * MultiLayerBackgroundSystem:
 * High-performance multi-layered background system for primary sectors.
 * - 'far' tier: Rendered as a static backdrop, anchored to the viewport.
 * - 'mid_far', 'mid', 'mid_close', 'close' tiers: Dynamically rendered with calculated parallax scrolling.
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

  public isSupported(locationId: string): boolean {
    return (
      locationId === "grand_bastion" ||
      locationId === "thorn_chasm" ||
      locationId === "courtyard" ||
      locationId === "clocktower" ||
      locationId === "aether_sanctuary"
    );
  }

  public preload(layers?: readonly ParallaxLayerSchema[]): void {
    if (!layers || typeof Image === "undefined") return;
    for (let i = 0; i < layers.length; i++) {
      const url = layers[i].imageUrl;
      if (url && !assetLoader.isTextureLoaded(url)) {
        assetLoader.loadTexture(url).catch(() => { });
      }
    }
  }

  private getImage(url: string | undefined): HTMLImageElement | null {
    if (!url || typeof Image === "undefined") return null;
    const cached = assetLoader.getTexture(url);
    if (!cached) {
      assetLoader.loadTexture(url).catch(() => { });
    }
    return cached;
  }

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
    const maxCamX = Math.max(1, levelWidth - viewportWidth);
    const maxCamY = Math.max(1, levelHeight - viewportHeight);

    const progressX = Math.max(0, Math.min(1, cameraX / maxCamX));
    const progressY = Math.max(0, Math.min(1, cameraY / maxCamY));

    for (let t = 0; t < TIER_ORDER.length; t++) {
      this.tierBuckets[TIER_ORDER[t]].length = 0;
    }

    const layers = pb.layers;
    for (let i = 0; i < layers.length; i++) {
      const tier = resolveBackgroundTier(layers[i]);
      this.tierBuckets[tier].push(layers[i]);
    }

    this.renderFarStaticBackdrop(
      ctx,
      location,
      this.tierBuckets.far,
      viewportWidth,
      viewportHeight,
      tickCount
    );

    for (let i = 0; i < DYNAMIC_TIERS.length; i++) {
      const tier = DYNAMIC_TIERS[i];
      const layersInTier = this.tierBuckets[tier];

      for (let j = 0; j < layersInTier.length; j++) {
        const layer = layersInTier[j];
        if (!layer.imageUrl) continue;
        const img = layer.imageElement || this.getImage(layer.imageUrl);
        if (!img || !img.complete || img.naturalWidth === 0) continue;

        renderTiledDynamicLayer(
          ctx,
          layer,
          tier,
          img,
          boxHeight,
          extraWidth,
          progressX,
          progressY,
          viewportWidth,
          viewportHeight,
          tickCount
        );
      }

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

  private renderFarStaticBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    farLayers: ParallaxLayerSchema[],
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();

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
      if (!layer.imageUrl) continue;
      const img = layer.imageElement || this.getImage(layer.imageUrl);
      if (!img || !img.complete || img.naturalWidth === 0) continue;

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

      ctx.drawImage(img, Math.round(drawX), 0, Math.round(drawW), Math.round(drawH));
      ctx.restore();
      imageRendered = true;
    }

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

  private renderFallbackBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    viewportWidth: number,
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
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    ctx.restore();
  }
}

export const defaultMultiLayerBackgroundSystem = new MultiLayerBackgroundSystem();
