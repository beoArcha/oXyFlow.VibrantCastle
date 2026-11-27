import type { LocationDefinition } from "@game/locations/types";
import type {
  BackgroundLayerTier,
  ParallaxLayerSchema,
} from "@game/locations/schema/locationSchema";
import {
  type ISectorAtmosphericRenderer,
  defaultAtmosphericSectorRenderer,
} from "@game/renderer/background/atmospheric/atmosphericSectorRenderer";
import {
  TIER_ORDER,
  DYNAMIC_TIERS,
  resolveBackgroundTier,
  renderTiledDynamicLayer,
} from "@game/renderer/background/parallaxTiling";
import { ParallaxBackdropRenderer } from "./ParallaxBackdropRenderer";
import { computeBossScopeIntensity } from "./bossZoneIntensity";
import { defaultPlaceholderRenderer } from "./PlaceholderRenderer";
import type {
  IParallaxFlags,
  IParallaxLoader,
  IParallaxRegistry,
  IParallaxSystem,
  IPlaceholderRenderer,
  ParallaxRenderOptions,
} from "./types";

export interface ParallaxSystemDeps {
  registry?: IParallaxRegistry;
  loader?: IParallaxLoader;
  flags?: IParallaxFlags;
  atmosphericRenderer?: ISectorAtmosphericRenderer;
  placeholderRenderer?: IPlaceholderRenderer;
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

const DEFAULT_REGISTRY: IParallaxRegistry = {
  resolve: () => undefined,
};

const DEFAULT_LOADER: IParallaxLoader = {
  getTexture: () => null,
  loadTexture: () => Promise.resolve(null),
  isTextureLoaded: () => false,
};

const DEFAULT_FLAGS: IParallaxFlags = {
  isTierEnabled: () => true,
  showWireframes: () => false,
};

/**
 * Single parallax rendering pipeline for multi-layer image worlds and procedural placeholders.
 * Reads textures, layer metadata, and debug flags strictly through injected ports.
 */
export class ParallaxSystem implements IParallaxSystem {
  private readonly registry: IParallaxRegistry;
  private readonly loader: IParallaxLoader;
  private readonly flags: IParallaxFlags;
  private readonly atmosphericRenderer: ISectorAtmosphericRenderer;
  private readonly placeholderRenderer: IPlaceholderRenderer;
  private readonly backdropRenderer: ParallaxBackdropRenderer;
  private readonly tierBuckets: Record<BackgroundLayerTier, ParallaxLayerSchema[]> = {
    far: [],
    mid_far: [],
    mid: [],
    mid_close: [],
    close: [],
    boss_stage: [],
    boss_world: [],
  };

  constructor(deps: ParallaxSystemDeps = {}) {
    this.registry = deps.registry ?? DEFAULT_REGISTRY;
    this.loader = deps.loader ?? DEFAULT_LOADER;
    this.flags = deps.flags ?? DEFAULT_FLAGS;
    this.atmosphericRenderer = deps.atmosphericRenderer ?? defaultAtmosphericSectorRenderer;
    this.placeholderRenderer = deps.placeholderRenderer ?? defaultPlaceholderRenderer;
    this.backdropRenderer = new ParallaxBackdropRenderer(
      (layer) => this.getImage(layer),
      this.atmosphericRenderer
    );
  }

  public clearCaches(): void {
    this.backdropRenderer.clearCaches();
    this.atmosphericRenderer.clearCaches();
    this.placeholderRenderer.clearCaches?.();
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
    if (!layers) return;
    for (let i = 0; i < layers.length; i++) {
      const url = this.resolveLayerUrl(layers[i]);
      if (!url) continue;
      const alreadyLoaded = this.loader.isTextureLoaded
        ? this.loader.isTextureLoaded(url)
        : this.loader.getTexture(url) !== null;
      if (!alreadyLoaded) {
        this.loader.loadTexture(url).catch(() => {});
      }
    }
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
    options?: ParallaxRenderOptions
  ): void {
    if (!this.isSupported(location)) {
      this.placeholderRenderer.render(
        ctx,
        location,
        levelWidth,
        levelHeight,
        viewportWidth,
        viewportHeight,
        cameraX,
        cameraY,
        tickCount
      );
      return;
    }

    const pb = location.parallaxBackground;
    if (!pb || !pb.layers || pb.layers.length === 0) {
      this.backdropRenderer.renderFallbackBackdrop(ctx, location, viewportWidth, viewportHeight);
      return;
    }

    const boxWidth = Math.max(pb.boxWidth || 0, levelWidth + 400);
    const boxHeight = Math.max(pb.boxHeight || 0, levelHeight + 200);
    const extraWidth = Math.max(0, boxWidth - viewportWidth);
    const maxCamX = Math.max(1, levelWidth - viewportWidth);
    const maxCamY = Math.max(1, levelHeight - viewportHeight);
    const progressX = Math.max(0, Math.min(1, cameraX / maxCamX));
    const progressY = Math.max(0, Math.min(1, cameraY / maxCamY));

    this.bucketLayersByTier(pb.layers);

    this.backdropRenderer.renderFarStaticBackdrop(
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
      ? computeBossScopeIntensity(location, "world", cameraX, cameraY, viewportWidth, viewportHeight, options?.forceBossScope)
      : 0;
    const stageBossIntensity = this.isTierEnabled("boss_stage", options)
      ? computeBossScopeIntensity(location, "stage", cameraX, cameraY, viewportWidth, viewportHeight, options?.forceBossScope)
      : 0;
    const showWireframes = this.flags.showWireframes();

    for (let i = 0; i < DYNAMIC_TIERS.length; i++) {
      const tier = DYNAMIC_TIERS[i];
      if (this.isTierEnabled(tier, options)) {
        this.renderDynamicTier(
          ctx,
          tier,
          this.tierBuckets[tier],
          boxHeight,
          extraWidth,
          progressX,
          progressY,
          viewportWidth,
          viewportHeight,
          tickCount,
          showWireframes
        );
      }

      if (tier === "mid") {
        if (worldBossIntensity > 0.01) {
          this.backdropRenderer.renderBossBackdropTier(ctx, this.tierBuckets.boss_world, "boss_world", worldBossIntensity, viewportWidth, viewportHeight, progressX, progressY, tickCount);
        }
        this.atmosphericRenderer.renderSectorAtmosphere(ctx, location.id, viewportWidth, viewportHeight, tickCount);
      }

      if (tier === "mid_close" && stageBossIntensity > 0.01) {
        this.backdropRenderer.renderBossBackdropTier(ctx, this.tierBuckets.boss_stage, "boss_stage", stageBossIntensity, viewportWidth, viewportHeight, progressX, progressY, tickCount);
      }
    }
  }

  private bucketLayersByTier(layers: readonly ParallaxLayerSchema[]): void {
    for (let t = 0; t < TIER_ORDER.length; t++) {
      this.tierBuckets[TIER_ORDER[t]].length = 0;
    }
    for (let i = 0; i < layers.length; i++) {
      const tier = resolveBackgroundTier(layers[i]);
      this.tierBuckets[tier].push(layers[i]);
    }
  }

  private resolveLayerUrl(layer: ParallaxLayerSchema): string | undefined {
    const entry =
      this.registry.resolve(layer.layerKey) ??
      this.registry.resolve(layer.imageUrl) ??
      this.registry.resolve(layer.id);
    return entry?.url ?? layer.imageUrl;
  }

  private getImage(layer: ParallaxLayerSchema): HTMLImageElement | null {
    if (layer.imageElement) return layer.imageElement;
    const url = this.resolveLayerUrl(layer);
    if (!url) return null;
    const cached = this.loader.getTexture(url);
    if (!cached) {
      this.loader.loadTexture(url).catch(() => {});
    }
    return cached;
  }

  private isTierEnabled(tier: BackgroundLayerTier, options?: ParallaxRenderOptions): boolean {
    if (options?.disabledTiers && options.disabledTiers[tier]) {
      return false;
    }
    return this.flags.isTierEnabled(tier);
  }

  private renderDynamicTier(
    ctx: CanvasRenderingContext2D,
    tier: BackgroundLayerTier,
    layersInTier: readonly ParallaxLayerSchema[],
    boxHeight: number,
    extraWidth: number,
    progressX: number,
    progressY: number,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number,
    showWireframes: boolean
  ): void {
    for (let j = 0; j < layersInTier.length; j++) {
      const layer = layersInTier[j];
      const img = this.getImage(layer);
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
        tickCount,
        1,
        showWireframes
      );
    }
  }
}
