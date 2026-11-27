import type { LocationDefinition, LocationTheme } from "@game/locations/types";
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
import {
  defaultParallaxLoadQueue,
  getWorldPlaceholderColors,
  PARALLAX_LOAD_PRIORITY,
  type ParallaxDrawableTexture,
  type ParallaxQueuePriority,
} from "../loading";
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

export interface IParallaxFadeQueue {
  getTexture(keyOrUrl: string): ParallaxDrawableTexture | null;
  isManaged(keyOrUrl: string): boolean;
  getFadeAlpha(keyOrUrl: string, nowMs?: number): number;
  enqueue?(descriptor: {
    readonly cacheKey: string;
    readonly url: string;
    readonly priority: ParallaxQueuePriority;
    readonly subOrder?: number;
    readonly fadeInOnReady?: boolean;
  }): Promise<unknown>;
}

export interface ParallaxSystemDeps {
  registry?: IParallaxRegistry;
  loader?: IParallaxLoader;
  flags?: IParallaxFlags;
  atmosphericRenderer?: ISectorAtmosphericRenderer;
  placeholderRenderer?: IPlaceholderRenderer;
  loadQueue?: IParallaxFadeQueue;
  now?: () => number;
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

const EMPTY_LAYERS: readonly ParallaxLayerSchema[] = [];

function defaultNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function resolveWorldId(location: LocationDefinition): string {
  return location.worldId || location.id;
}

function isDrawableReady(img: ParallaxDrawableTexture | null): boolean {
  if (!img) return false;
  if ("naturalWidth" in img) {
    return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
  }
  return img.width > 0 && img.height > 0;
}

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
  private readonly loadQueue: IParallaxFadeQueue;
  private readonly useExplicitLoadQueue: boolean;
  private readonly now: () => number;

  private readonly placeholderTheme: LocationTheme = {
    bgGradientTop: "",
    bgGradientBottom: "",
    ambientParticle: "dust",
    fogColor: "",
    musicIntensity: 0,
  };
  private placeholderSourceLocation: LocationDefinition | null = null;
  private placeholderLocationView: LocationDefinition | null = null;

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
    this.loadQueue = deps.loadQueue ?? defaultParallaxLoadQueue;
    this.useExplicitLoadQueue = Boolean(deps.loadQueue);
    this.now = deps.now ?? defaultNow;
    this.backdropRenderer = new ParallaxBackdropRenderer(
      (layer) => this.getImage(layer),
      this.atmosphericRenderer
    );
  }

  public clearCaches(): void {
    this.backdropRenderer.clearCaches();
    this.atmosphericRenderer.clearCaches();
    this.placeholderRenderer.clearCaches?.();
    this.placeholderSourceLocation = null;
    this.placeholderLocationView = null;
  }

  public isSupported(locationOrId: string | LocationDefinition): boolean {
    if (typeof locationOrId === "string") {
      return KNOWN_MULTI_LAYER_WORLDS.has(locationOrId);
    }
    if (KNOWN_MULTI_LAYER_WORLDS.has(resolveWorldId(locationOrId))) {
      return true;
    }
    const layers = locationOrId.parallaxBackground?.layers;
    if (!layers || layers.length === 0) return false;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].type === "image") return true;
    }
    return false;
  }

  public hasOpaqueFarBackdrop(location: LocationDefinition, options?: ParallaxRenderOptions): boolean {
    if (!this.isSupported(location)) return false;
    const layers = location.parallaxBackground?.layers;
    if (!layers || layers.length === 0) return false;
    if (!this.isTierEnabled("far", options)) return false;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (resolveBackgroundTier(layer) !== "far") continue;
      if (layer.opaque !== true) continue;
      if (layer.blendMode && layer.blendMode !== "source-over") continue;
      if (isDrawableReady(this.peekImage(layer))) {
        return true;
      }
    }
    return false;
  }

  public preload(layers?: readonly ParallaxLayerSchema[]): void {
    if (!layers) return;
    if (this.useExplicitLoadQueue && this.loadQueue.enqueue) {
      this.enqueueLayersProgressive(layers);
      return;
    }
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
    const worldId = resolveWorldId(location);
    const backdropLocation = this.resolveMetaPlaceholderLocation(location, worldId);
    if (!pb || !pb.layers || pb.layers.length === 0) {
      this.backdropRenderer.renderFallbackBackdrop(ctx, backdropLocation, viewportWidth, viewportHeight);
      return;
    }

    const boxWidth = Math.max(pb.boxWidth || 0, levelWidth + 400);
    const boxHeight = Math.max(pb.boxHeight || 0, levelHeight + 200);
    const extraWidth = Math.max(0, boxWidth - viewportWidth);
    const maxCamX = Math.max(1, levelWidth - viewportWidth);
    const maxCamY = Math.max(1, levelHeight - viewportHeight);
    const progressX = Math.max(0, Math.min(1, cameraX / maxCamX));
    const progressY = Math.max(0, Math.min(1, cameraY / maxCamY));
    const nowMs = this.now();

    this.bucketLayersByTier(pb.layers);

    this.backdropRenderer.renderFarStaticBackdrop(
      ctx,
      backdropLocation,
      this.isTierEnabled("far", options) ? this.tierBuckets.far : EMPTY_LAYERS,
      viewportWidth,
      viewportHeight,
      progressX,
      progressY,
      tickCount
    );

    const worldBossIntensity = this.isTierEnabled("boss_world", options)
      ? computeBossScopeIntensity(location, "world", cameraX, cameraY, viewportWidth, viewportHeight, options?.forceBossScope) *
        this.resolveBucketFadeAlpha(this.tierBuckets.boss_world, nowMs)
      : 0;
    const stageBossIntensity = this.isTierEnabled("boss_stage", options)
      ? computeBossScopeIntensity(location, "stage", cameraX, cameraY, viewportWidth, viewportHeight, options?.forceBossScope) *
        this.resolveBucketFadeAlpha(this.tierBuckets.boss_stage, nowMs)
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
          nowMs,
          showWireframes
        );
      }

      if (tier === "mid") {
        if (worldBossIntensity > 0.01) {
          this.backdropRenderer.renderBossBackdropTier(ctx, this.tierBuckets.boss_world, "boss_world", worldBossIntensity, viewportWidth, viewportHeight, progressX, progressY, tickCount);
        }
        this.atmosphericRenderer.renderSectorAtmosphere(ctx, worldId, viewportWidth, viewportHeight, tickCount);
      }

      if (tier === "mid_close" && stageBossIntensity > 0.01) {
        this.backdropRenderer.renderBossBackdropTier(ctx, this.tierBuckets.boss_stage, "boss_stage", stageBossIntensity, viewportWidth, viewportHeight, progressX, progressY, tickCount);
      }
    }
  }

  private enqueueLayersProgressive(layers: readonly ParallaxLayerSchema[]): void {
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const url = this.resolveLayerUrl(layer);
      if (!url) continue;
      const tier = resolveBackgroundTier(layer);
      const priority: ParallaxQueuePriority =
        tier === "far"
          ? PARALLAX_LOAD_PRIORITY.FAR
          : tier === "boss_stage" || tier === "boss_world"
            ? PARALLAX_LOAD_PRIORITY.EFFECT
            : PARALLAX_LOAD_PRIORITY.LAYER;
      this.loadQueue
        .enqueue!({
          cacheKey: layer.layerKey || url,
          url,
          priority,
          subOrder: layer.depth ?? i * 0.1,
          fadeInOnReady: priority !== PARALLAX_LOAD_PRIORITY.FAR,
        })
        .catch(() => {});
    }
  }

  private resolveMetaPlaceholderLocation(location: LocationDefinition, worldId: string): LocationDefinition {
    const placeholder = getWorldPlaceholderColors(worldId);
    if (!placeholder) return location;
    if (
      location.theme?.bgGradientTop === placeholder.top &&
      location.theme?.bgGradientBottom === placeholder.bottom
    ) {
      return location;
    }

    if (this.placeholderSourceLocation !== location || !this.placeholderLocationView) {
      this.placeholderSourceLocation = location;
      this.placeholderTheme.bgGradientTop = placeholder.top;
      this.placeholderTheme.bgGradientBottom = placeholder.bottom;
      this.placeholderTheme.ambientParticle = location.theme?.ambientParticle ?? "dust";
      this.placeholderTheme.fogColor = location.theme?.fogColor ?? "";
      this.placeholderTheme.musicIntensity = location.theme?.musicIntensity ?? 0;
      this.placeholderLocationView = {
        ...location,
        theme: this.placeholderTheme,
      };
    }
    return this.placeholderLocationView;
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

  private peekImage(layer: ParallaxLayerSchema): HTMLImageElement | null {
    if (layer.imageElement) return layer.imageElement;
    const key = layer.layerKey;
    const url = this.resolveLayerUrl(layer);
    const queued = (key ? this.loadQueue.getTexture(key) : null) ?? (url ? this.loadQueue.getTexture(url) : null);
    if (queued) return queued as HTMLImageElement;
    if (!url) return null;
    return this.loader.getTexture(url);
  }

  private getImage(layer: ParallaxLayerSchema): HTMLImageElement | null {
    if (layer.imageElement) return layer.imageElement;
    const key = layer.layerKey;
    const url = this.resolveLayerUrl(layer);
    const queued = (key ? this.loadQueue.getTexture(key) : null) ?? (url ? this.loadQueue.getTexture(url) : null);
    if (queued) return queued as HTMLImageElement;
    if (!url) return null;

    const cached = this.loader.getTexture(url);
    if (cached) return cached;

    const managed = (key ? this.loadQueue.isManaged(key) : false) || this.loadQueue.isManaged(url);
    if (!managed) {
      this.loader.loadTexture(url).catch(() => {});
    }
    return null;
  }

  private resolveLayerFadeAlpha(layer: ParallaxLayerSchema, nowMs: number): number {
    if (layer.imageElement) return 1;
    const key = layer.layerKey;
    if (key && this.loadQueue.isManaged(key)) {
      return this.loadQueue.getFadeAlpha(key, nowMs);
    }
    const url = this.resolveLayerUrl(layer);
    if (url && this.loadQueue.isManaged(url)) {
      return this.loadQueue.getFadeAlpha(url, nowMs);
    }
    return 1;
  }

  private resolveBucketFadeAlpha(layersInTier: readonly ParallaxLayerSchema[], nowMs: number): number {
    if (layersInTier.length === 0) return 1;
    let maxAlpha = 0;
    for (let i = 0; i < layersInTier.length; i++) {
      const alpha = this.resolveLayerFadeAlpha(layersInTier[i], nowMs);
      if (alpha > maxAlpha) maxAlpha = alpha;
    }
    return maxAlpha;
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
    nowMs: number,
    showWireframes: boolean
  ): void {
    for (let j = 0; j < layersInTier.length; j++) {
      const layer = layersInTier[j];
      const img = this.getImage(layer);
      if (!isDrawableReady(img)) continue;

      const fadeAlpha = this.resolveLayerFadeAlpha(layer, nowMs);
      if (fadeAlpha <= 0.005) continue;

      renderTiledDynamicLayer(
        ctx,
        layer,
        tier,
        img!,
        boxHeight,
        extraWidth,
        progressX,
        progressY,
        viewportWidth,
        viewportHeight,
        tickCount,
        fadeAlpha,
        showWireframes
      );
    }
  }
}
