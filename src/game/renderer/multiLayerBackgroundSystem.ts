import { LocationDefinition } from "@game/locations/types";
import {
  BackgroundLayerTier,
  BossZoneScope,
  ParallaxLayerSchema,
} from "@game/locations/schema/locationSchema";
import { assetLoader } from "@game/engine/assetLoader";
import { debugManager } from "@game/debug/debugManager";
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
import { createLayerRect, resolveFarBackdropRect } from "./background/parallaxGeometry";

export interface MultiLayerRenderOptions {
  /** Override visibility per tier (used by Creation Studio Levels Preview). */
  readonly disabledTiers?: Partial<Record<BackgroundLayerTier, boolean>>;
  /** Force previewing a boss scope regardless of camera coordinates ("stage" | "world" | null). */
  readonly forceBossScope?: BossZoneScope | null;
}

export interface IMultiLayerBackgroundSystem {
  isSupported(locationOrId: string | LocationDefinition): boolean;
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
    tickCount: number,
    options?: MultiLayerRenderOptions
  ): void;
  clearCaches(): void;
}

const KNOWN_MULTI_LAYER_WORLDS = new Set<string>([
  "courtyard",
  "thorn_chasm",
  "ashen_catacombs",
  "clocktower",
  "alchemist_library",
  "aether_sanctuary",
  "grand_bastion",
  "eclipse_crown",
]);

const BOSS_ZONE_FEATHER_PX = 260;

/**
 * MultiLayerBackgroundSystem:
 * High-performance, OCP multi-layered background system for all 8 worlds and 64 stages.
 * - 'far' tier: World-shared vista with subtle horizon camera shift (overscanned cover-fit).
 * - 'mid_far', 'mid', 'mid_close', 'close' tiers: Dynamically tiled shared/world parallax layers.
 * - 'boss_stage' & 'boss_world' tiers: Spatially activated ceremonial arena layers that fade smoothly
 *   as the camera enters a location's Boss Zone (Level Boss or World Boss).
 */
export class MultiLayerBackgroundSystem implements IMultiLayerBackgroundSystem {
  private readonly atmosphericRenderer: ISectorAtmosphericRenderer;
  private readonly farRect = createLayerRect();
  private readonly gradientCache: Map<string, CanvasGradient> = new Map();
  private readonly tierBuckets: Record<BackgroundLayerTier, ParallaxLayerSchema[]> = {
    far: [],
    mid_far: [],
    mid: [],
    mid_close: [],
    close: [],
    boss_stage: [],
    boss_world: [],
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

  public isSupported(locationOrId: string | LocationDefinition): boolean {
    if (typeof locationOrId === "string") {
      return KNOWN_MULTI_LAYER_WORLDS.has(locationOrId);
    }
    if (KNOWN_MULTI_LAYER_WORLDS.has(locationOrId.id)) {
      return true;
    }
    const layers = locationOrId.parallaxBackground?.layers;
    if (!layers || layers.length === 0) return false;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].type === "image") return true;
    }
    return false;
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

  private isTierEnabled(
    tier: BackgroundLayerTier,
    options?: MultiLayerRenderOptions
  ): boolean {
    if (options?.disabledTiers && options.disabledTiers[tier]) {
      return false;
    }
    const debugFlag = debugManager.state.parallaxTiers[tier];
    return debugFlag !== false;
  }

  /**
   * Computes smooth [0..1] visibility weight for a boss scope based on camera viewport overlap
   * with `location.bossZones`, or studio preview override.
   */
  public computeBossScopeIntensity(
    location: LocationDefinition,
    scope: BossZoneScope,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number,
    forceBossScope?: BossZoneScope | null
  ): number {
    if (forceBossScope !== undefined && forceBossScope !== null) {
      return forceBossScope === scope ? 1 : 0;
    }
    const zones = location.bossZones;
    if (!zones || zones.length === 0) return 0;

    const camCenterX = cameraX + viewportWidth * 0.5;
    const camCenterY = cameraY + viewportHeight * 0.5;
    let best = 0;

    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      if (z.scope !== scope) continue;
      const dx =
        camCenterX < z.x
          ? z.x - camCenterX
          : camCenterX > z.x + z.width
            ? camCenterX - (z.x + z.width)
            : 0;
      const dy =
        camCenterY < z.y
          ? z.y - camCenterY
          : camCenterY > z.y + z.height
            ? camCenterY - (z.y + z.height)
            : 0;
      const dist = Math.hypot(dx, dy);
      if (dist <= 0) return 1;
      if (dist < BOSS_ZONE_FEATHER_PX) {
        const t = 1 - dist / BOSS_ZONE_FEATHER_PX;
        const smooth = t * t * (3 - 2 * t);
        if (smooth > best) best = smooth;
      }
    }

    return best;
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
    tickCount: number,
    options?: MultiLayerRenderOptions
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
      this.isTierEnabled("far", options) ? this.tierBuckets.far : [],
      viewportWidth,
      viewportHeight,
      progressX,
      progressY,
      tickCount
    );

    const worldBossIntensity = this.isTierEnabled("boss_world", options)
      ? this.computeBossScopeIntensity(
          location,
          "world",
          cameraX,
          cameraY,
          viewportWidth,
          viewportHeight,
          options?.forceBossScope
        )
      : 0;

    const stageBossIntensity = this.isTierEnabled("boss_stage", options)
      ? this.computeBossScopeIntensity(
          location,
          "stage",
          cameraX,
          cameraY,
          viewportWidth,
          viewportHeight,
          options?.forceBossScope
        )
      : 0;

    for (let i = 0; i < DYNAMIC_TIERS.length; i++) {
      const tier = DYNAMIC_TIERS[i];
      if (this.isTierEnabled(tier, options)) {
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
      }

      if (tier === "mid") {
        // World Boss theatrical backdrop emerges behind closer architecture
        if (worldBossIntensity > 0.01) {
          this.renderBossBackdropTier(
            ctx,
            this.tierBuckets.boss_world,
            "boss_world",
            worldBossIntensity,
            viewportWidth,
            viewportHeight,
            progressX,
            progressY,
            tickCount
          );
        }

        this.atmosphericRenderer.renderSectorAtmosphere(
          ctx,
          location.id,
          viewportWidth,
          viewportHeight,
          tickCount
        );
      }

      if (tier === "mid_close" && stageBossIntensity > 0.01) {
        // Level Boss ceremonial sigil layer emerges inside stage boss arena
        this.renderBossBackdropTier(
          ctx,
          this.tierBuckets.boss_stage,
          "boss_stage",
          stageBossIntensity,
          viewportWidth,
          viewportHeight,
          progressX,
          progressY,
          tickCount
        );
      }
    }
  }

  private renderBossBackdropTier(
    ctx: CanvasRenderingContext2D,
    bossLayers: ParallaxLayerSchema[],
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
      if (!layer.imageUrl) continue;
      const img = layer.imageElement || this.getImage(layer.imageUrl);
      if (!img || !img.complete || img.naturalWidth === 0) continue;

      ctx.save();
      const baseOpacity = layer.opacity !== undefined ? layer.opacity : tier === "boss_world" ? 0.88 : 0.72;
      ctx.globalAlpha = Math.max(0, Math.min(1, baseOpacity * effectiveAlpha));
      if (layer.blendMode) {
        ctx.globalCompositeOperation = layer.blendMode;
      }

      resolveFarBackdropRect(
        this.farRect,
        img.naturalWidth,
        img.naturalHeight,
        viewportWidth * 1.06,
        viewportHeight * 1.04
      );
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

  private renderFarStaticBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    farLayers: ParallaxLayerSchema[],
    viewportWidth: number,
    viewportHeight: number,
    progressX: number,
    progressY: number,
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

      // Overscan slightly by 6% horizontally so the far horizon glides subtly with camera progress
      // while never exposing viewport edges.
      const overscanW = viewportWidth * 1.06;
      const overscanH = viewportHeight * 1.03;
      resolveFarBackdropRect(this.farRect, img.naturalWidth, img.naturalHeight, overscanW, overscanH);
      const maxPanX = Math.max(0, this.farRect.width - viewportWidth);
      const maxPanY = Math.max(0, this.farRect.height - viewportHeight);
      const drawX = Math.round(-progressX * maxPanX);
      const drawY = Math.round(-progressY * maxPanY);

      ctx.drawImage(img, drawX, drawY, this.farRect.width, this.farRect.height);
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
