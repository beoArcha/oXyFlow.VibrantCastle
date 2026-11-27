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
import type { ResolvedParallaxQuality } from "@game/types";
import type { ParallaxQualityTier, ParallaxZoneKind } from "../meta";
import {
  buildZoneVariantKey,
  createZoneResolutionBuffer,
  resolveClosestParallaxLayer,
  resolveZoneInto,
} from "../zones";
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

export const DEFAULT_ZONE_CROSSFADE_DURATION_MS = 400;
export const DEFAULT_ZONE_PRELOAD_MARGIN_PX = 520;

const ZONE_KINDS: readonly ParallaxZoneKind[] = ["boss", "rest", "secret", "story"];

interface MutableZoneVariantSlot {
  cacheKey: string;
  url: string | null;
  tint: string | null;
  hasVariantEntry: boolean;
  readonly layer: ParallaxLayerSchema;
}

function createEmptyVariantSlot(): MutableZoneVariantSlot {
  return {
    cacheKey: "",
    url: null,
    tint: null,
    hasVariantEntry: false,
    layer: {
      id: "",
      name: "",
      type: "image",
      depth: 0,
      scrollSpeedX: 0,
      scrollSpeedY: 0,
    },
  };
}

export interface IParallaxFadeQueue {
  getTexture(keyOrUrl: string): ParallaxDrawableTexture | null;
  isManaged(keyOrUrl: string): boolean;
  getFadeAlpha(keyOrUrl: string, nowMs?: number): number;
  beginGeneration?(): number;
  clear?(): void;
  enqueue?(descriptor: {
    readonly cacheKey: string;
    readonly url: string;
    readonly priority: ParallaxQueuePriority;
    readonly subOrder?: number;
    readonly tier?: ParallaxQualityTier;
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
  parallaxQuality?: ResolvedParallaxQuality;
  now?: () => number;
  zoneCrossfadeDurationMs?: number;
  zonePreloadMarginPx?: number;
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
  private parallaxQuality: ResolvedParallaxQuality;
  private readonly now: () => number;
  private readonly zoneCrossfadeDurationMs: number;
  private readonly zonePreloadMarginPx: number;

  private readonly placeholderTheme: LocationTheme = {
    bgGradientTop: "",
    bgGradientBottom: "",
    ambientParticle: "dust",
    fogColor: "",
    musicIntensity: 0,
  };
  private placeholderSourceLocation: LocationDefinition | null = null;
  private placeholderLocationView: LocationDefinition | null = null;

  private readonly zoneResolution = createZoneResolutionBuffer();
  private readonly variantSlots: Record<ParallaxZoneKind, MutableZoneVariantSlot> = {
    boss: createEmptyVariantSlot(),
    rest: createEmptyVariantSlot(),
    secret: createEmptyVariantSlot(),
    story: createEmptyVariantSlot(),
  };
  private readonly pendingVariantUrls = new Set<string>();
  private zoneStateLocation: LocationDefinition | null = null;
  private zoneStateLayers: readonly ParallaxLayerSchema[] | null = null;
  private cachedClosestLayer: ParallaxLayerSchema | null = null;
  private activeZoneKind: ParallaxZoneKind | null = null;
  private activeZoneAlpha = 0;
  private activeAmbientColor: string | null = null;
  private leavingZoneKind: ParallaxZoneKind | null = null;
  private leavingZoneAlpha = 0;
  private leavingAmbientColor: string | null = null;
  private lastZoneNowMs = Number.NaN;
  private lastTargetKind: ParallaxZoneKind | null = null;
  private lastTargetWeight = 0;

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
    this.parallaxQuality = deps.parallaxQuality ?? this.registry.getParallaxQuality?.() ?? "high";
    this.registry.subscribeQuality?.((quality) => {
      this.setParallaxQuality(quality);
    });
    this.now = deps.now ?? defaultNow;
    this.zoneCrossfadeDurationMs =
      deps.zoneCrossfadeDurationMs !== undefined
        ? Math.max(0, deps.zoneCrossfadeDurationMs)
        : DEFAULT_ZONE_CROSSFADE_DURATION_MS;
    this.zonePreloadMarginPx =
      deps.zonePreloadMarginPx !== undefined
        ? Math.max(0, deps.zonePreloadMarginPx)
        : DEFAULT_ZONE_PRELOAD_MARGIN_PX;
    this.backdropRenderer = new ParallaxBackdropRenderer(
      (layer) => this.getImage(layer),
      this.atmosphericRenderer
    );
  }

  public getParallaxQuality(): ResolvedParallaxQuality {
    return this.parallaxQuality;
  }

  public setParallaxQuality(quality: ResolvedParallaxQuality): void {
    if (quality === this.parallaxQuality) return;
    this.parallaxQuality = quality;
    this.zoneStateLocation = null;
    this.zoneStateLayers = null;
    this.cachedClosestLayer = null;
    this.pendingVariantUrls.clear();
    this.resetZoneCrossfadeState();
  }

  public getActiveZoneKind(): ParallaxZoneKind | null {
    return this.activeZoneKind;
  }

  public getActiveZoneAlpha(): number {
    return this.activeZoneAlpha;
  }

  public clearCaches(): void {
    this.backdropRenderer.clearCaches();
    this.atmosphericRenderer.clearCaches();
    this.placeholderRenderer.clearCaches?.();
    this.placeholderSourceLocation = null;
    this.placeholderLocationView = null;
    this.zoneStateLocation = null;
    this.zoneStateLayers = null;
    this.cachedClosestLayer = null;
    this.pendingVariantUrls.clear();
    this.resetZoneCrossfadeState();
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
    if (this.parallaxQuality === "off") return false;
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
    if (!layers || this.parallaxQuality === "off") return;
    if (this.parallaxQuality === "simplified") {
      const farIndex = this.findFarLayerIndex(layers);
      if (farIndex < 0) return;
      const farLayer = layers[farIndex];
      if (this.useExplicitLoadQueue && this.loadQueue.enqueue) {
        this.enqueueLayerProgressive(farLayer, farIndex);
      } else {
        this.preloadLayerViaLoader(farLayer);
      }
      return;
    }
    if (this.useExplicitLoadQueue && this.loadQueue.enqueue) {
      this.enqueueLayersProgressive(layers);
      return;
    }
    for (let i = 0; i < layers.length; i++) {
      this.preloadLayerViaLoader(layers[i]);
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
    if (this.parallaxQuality === "off") {
      this.renderPlaceholderBackdrop(ctx, backdropLocation, viewportWidth, viewportHeight, false);
      return;
    }
    if (!pb || !pb.layers || pb.layers.length === 0) {
      this.renderPlaceholderBackdrop(ctx, backdropLocation, viewportWidth, viewportHeight, false);
      return;
    }

    const boxWidth = Math.max(pb.boxWidth || 0, levelWidth + 400);
    const boxHeight = Math.max(pb.boxHeight || 0, levelHeight + 200);
    const extraWidth = Math.max(0, boxWidth - viewportWidth);
    const maxCamX = Math.max(1, levelWidth - viewportWidth);
    const maxCamY = Math.max(1, levelHeight - viewportHeight);
    const progressX = Math.max(0, Math.min(1, cameraX / maxCamX));
    const progressY = Math.max(0, Math.min(1, cameraY / maxCamY));

    if (this.parallaxQuality === "simplified") {
      this.renderSimplified(
        ctx,
        backdropLocation,
        pb.layers,
        viewportWidth,
        viewportHeight,
        progressX,
        progressY,
        tickCount,
        options
      );
      return;
    }

    const nowMs = this.now();

    this.syncLocationZoneState(location, pb.layers);
    const camCenterX = cameraX + viewportWidth * 0.5;
    const camCenterY = cameraY + viewportHeight * 0.5;
    resolveZoneInto(location, camCenterX, camCenterY, this.zonePreloadMarginPx, this.zoneResolution);
    if (options?.forceBossScope) {
      this.zoneResolution.kind = "boss";
      this.zoneResolution.weight = 1;
      this.zoneResolution.nearKind = "boss";
      this.zoneResolution.nearDistanceSq = 0;
    }
    this.enqueueNearbyZoneVariant();
    this.updateZoneCrossfade(nowMs);

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

  private renderPlaceholderBackdrop(
    ctx: CanvasRenderingContext2D,
    backdropLocation: LocationDefinition,
    viewportWidth: number,
    viewportHeight: number,
    showSilhouette: boolean
  ): void {
    if (this.placeholderRenderer.renderGradientBackdrop) {
      this.placeholderRenderer.renderGradientBackdrop(
        ctx,
        backdropLocation,
        viewportWidth,
        viewportHeight,
        showSilhouette
      );
      return;
    }
    this.backdropRenderer.renderFallbackBackdrop(ctx, backdropLocation, viewportWidth, viewportHeight);
  }

  private renderSimplified(
    ctx: CanvasRenderingContext2D,
    backdropLocation: LocationDefinition,
    layers: readonly ParallaxLayerSchema[],
    viewportWidth: number,
    viewportHeight: number,
    progressX: number,
    progressY: number,
    tickCount: number,
    options?: ParallaxRenderOptions
  ): void {
    this.tierBuckets.far.length = 0;
    let farReady = false;
    const farEnabled = this.isTierEnabled("far", options);

    if (farEnabled) {
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (resolveBackgroundTier(layer) !== "far") continue;
        this.tierBuckets.far.push(layer);
        if (isDrawableReady(this.getImage(layer))) {
          farReady = true;
        }
      }
    }

    if (farReady) {
      this.backdropRenderer.renderFarStaticBackdrop(
        ctx,
        backdropLocation,
        this.tierBuckets.far,
        viewportWidth,
        viewportHeight,
        progressX,
        progressY,
        tickCount
      );
      return;
    }

    this.renderPlaceholderBackdrop(ctx, backdropLocation, viewportWidth, viewportHeight, true);
  }

  private findFarLayerIndex(layers: readonly ParallaxLayerSchema[]): number {
    for (let i = 0; i < layers.length; i++) {
      if (resolveBackgroundTier(layers[i]) === "far") return i;
    }
    return -1;
  }

  private preloadLayerViaLoader(layer: ParallaxLayerSchema): void {
    const url = this.resolveLayerUrl(layer);
    if (!url) return;
    const alreadyLoaded = this.loader.isTextureLoaded
      ? this.loader.isTextureLoaded(url)
      : this.loader.getTexture(url) !== null;
    if (!alreadyLoaded) {
      this.loader.loadTexture(url).catch(() => {});
    }
  }

  private enqueueLayerProgressive(layer: ParallaxLayerSchema, index: number): void {
    const entry = this.resolveRegistryEntry(layer);
    const url = entry?.url ?? layer.imageUrl;
    if (!url) return;
    const tier = resolveBackgroundTier(layer);
    const priority: ParallaxQueuePriority =
      tier === "far"
        ? PARALLAX_LOAD_PRIORITY.FAR
        : tier === "boss_stage" || tier === "boss_world"
          ? PARALLAX_LOAD_PRIORITY.EFFECT
          : PARALLAX_LOAD_PRIORITY.LAYER;
    const resolvedTier: ParallaxQualityTier =
      entry?.resolvedTier ?? (this.parallaxQuality === "simplified" ? "low" : (this.parallaxQuality as ParallaxQualityTier));
    this.loadQueue
      .enqueue!({
        cacheKey: layer.layerKey || url,
        url,
        tier: resolvedTier,
        priority,
        subOrder: layer.depth ?? index * 0.1,
        fadeInOnReady: priority !== PARALLAX_LOAD_PRIORITY.FAR,
      })
      .catch(() => {});
  }

  private enqueueLayersProgressive(layers: readonly ParallaxLayerSchema[]): void {
    for (let i = 0; i < layers.length; i++) {
      this.enqueueLayerProgressive(layers[i], i);
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

  private resolveRegistryEntry(layer: ParallaxLayerSchema) {
    return (
      this.registry.resolve(layer.layerKey, this.parallaxQuality) ??
      this.registry.resolve(layer.imageUrl, this.parallaxQuality) ??
      this.registry.resolve(layer.id, this.parallaxQuality)
    );
  }

  private resolveLayerUrl(layer: ParallaxLayerSchema): string | undefined {
    const entry = this.resolveRegistryEntry(layer);
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
      if (
        layer === this.cachedClosestLayer &&
        (this.activeZoneAlpha > 0.005 || this.leavingZoneAlpha > 0.005)
      ) {
        this.renderClosestLayerWithZoneCrossfade(
          ctx,
          layer,
          tier,
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
        continue;
      }

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

  private renderClosestLayerWithZoneCrossfade(
    ctx: CanvasRenderingContext2D,
    baseLayer: ParallaxLayerSchema,
    tier: BackgroundLayerTier,
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
    const baseImg = this.getImage(baseLayer);
    const baseReady = isDrawableReady(baseImg);
    const fadeAlpha = this.resolveLayerFadeAlpha(baseLayer, nowMs);
    if (fadeAlpha <= 0.005) return;

    const activeSlot = this.activeZoneKind ? this.variantSlots[this.activeZoneKind] : null;
    const activeImg = activeSlot ? this.peekVariantImage(activeSlot) : null;
    const activeReady = activeSlot !== null && isDrawableReady(activeImg);

    const leavingSlot = this.leavingZoneKind ? this.variantSlots[this.leavingZoneKind] : null;
    const leavingImg = leavingSlot ? this.peekVariantImage(leavingSlot) : null;
    const leavingReady = leavingSlot !== null && isDrawableReady(leavingImg);

    const replacedAlpha =
      (activeReady ? this.activeZoneAlpha : 0) + (leavingReady ? this.leavingZoneAlpha : 0);
    const baseWeight = Math.max(0, Math.min(1, 1 - replacedAlpha));

    if (baseReady && baseWeight > 0.005) {
      renderTiledDynamicLayer(
        ctx,
        baseLayer,
        tier,
        baseImg!,
        boxHeight,
        extraWidth,
        progressX,
        progressY,
        viewportWidth,
        viewportHeight,
        tickCount,
        fadeAlpha * baseWeight,
        showWireframes
      );
    }

    if (leavingReady && leavingSlot && this.leavingZoneAlpha > 0.005) {
      renderTiledDynamicLayer(
        ctx,
        leavingSlot.layer,
        tier,
        leavingImg!,
        boxHeight,
        extraWidth,
        progressX,
        progressY,
        viewportWidth,
        viewportHeight,
        tickCount,
        fadeAlpha * this.leavingZoneAlpha,
        false
      );
    }

    if (activeReady && activeSlot && this.activeZoneAlpha > 0.005) {
      renderTiledDynamicLayer(
        ctx,
        activeSlot.layer,
        tier,
        activeImg!,
        boxHeight,
        extraWidth,
        progressX,
        progressY,
        viewportWidth,
        viewportHeight,
        tickCount,
        fadeAlpha * this.activeZoneAlpha,
        showWireframes && baseWeight <= 0.005
      );
    }

    if (baseReady) {
      if (this.leavingZoneAlpha > 0.005 && !leavingReady) {
        const tint = leavingSlot?.tint ?? this.leavingAmbientColor;
        if (tint) {
          this.renderZoneFallbackTint(ctx, tint, fadeAlpha * this.leavingZoneAlpha, viewportWidth, viewportHeight);
        }
      }
      if (this.activeZoneAlpha > 0.005 && !activeReady) {
        const tint = activeSlot?.tint ?? this.activeAmbientColor;
        if (tint) {
          this.renderZoneFallbackTint(ctx, tint, fadeAlpha * this.activeZoneAlpha, viewportWidth, viewportHeight);
        }
      }
    }
  }

  private renderZoneFallbackTint(
    ctx: CanvasRenderingContext2D,
    color: string,
    alpha: number,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    const clamped = Math.max(0, Math.min(1, alpha));
    if (clamped <= 0.005) return;
    ctx.save();
    ctx.globalAlpha = clamped;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    ctx.restore();
  }

  private syncLocationZoneState(
    location: LocationDefinition,
    layers: readonly ParallaxLayerSchema[]
  ): void {
    if (this.zoneStateLocation === location && this.zoneStateLayers === layers) {
      return;
    }
    this.zoneStateLocation = location;
    this.zoneStateLayers = layers;
    this.cachedClosestLayer = resolveClosestParallaxLayer(layers);
    this.resetZoneCrossfadeState();

    const closest = this.cachedClosestLayer;
    for (let i = 0; i < ZONE_KINDS.length; i++) {
      const kind = ZONE_KINDS[i];
      const slot = this.variantSlots[kind];
      const variantKey = closest ? buildZoneVariantKey(closest, kind) : undefined;
      const entry = variantKey ? this.registry.resolve(variantKey, this.parallaxQuality) : undefined;

      if (!closest || !variantKey) {
        slot.cacheKey = "";
        slot.url = null;
        slot.tint = null;
        slot.hasVariantEntry = false;
        continue;
      }

      slot.cacheKey = variantKey;
      slot.url = entry?.url ?? null;
      slot.tint = entry?.tint ?? null;
      slot.hasVariantEntry = Boolean(entry?.url);

      slot.layer.id = variantKey;
      slot.layer.name = closest.name;
      slot.layer.tier = closest.tier;
      slot.layer.layerKey = variantKey;
      slot.layer.type = closest.type;
      slot.layer.depth = closest.depth;
      slot.layer.scrollSpeedX = closest.scrollSpeedX;
      slot.layer.scrollSpeedY = closest.scrollSpeedY;
      slot.layer.autoDriftX = closest.autoDriftX;
      slot.layer.autoDriftY = closest.autoDriftY;
      slot.layer.mirrorTile = closest.mirrorTile;
      slot.layer.opacity = entry?.defaultOpacity ?? closest.opacity;
      slot.layer.blendMode = entry?.defaultBlendMode ?? closest.blendMode;
    }
  }

  private resetZoneCrossfadeState(): void {
    this.activeZoneKind = null;
    this.activeZoneAlpha = 0;
    this.activeAmbientColor = null;
    this.leavingZoneKind = null;
    this.leavingZoneAlpha = 0;
    this.leavingAmbientColor = null;
    this.lastZoneNowMs = Number.NaN;
    this.lastTargetKind = null;
    this.lastTargetWeight = 0;
  }

  private peekVariantImage(slot: MutableZoneVariantSlot): HTMLImageElement | null {
    if (!slot.hasVariantEntry || !slot.url) return null;
    const queued =
      (slot.cacheKey ? this.loadQueue.getTexture(slot.cacheKey) : null) ??
      this.loadQueue.getTexture(slot.url);
    if (queued) return queued as HTMLImageElement;
    return this.loader.getTexture(slot.url);
  }

  private enqueueNearbyZoneVariant(): void {
    const nearKind = this.zoneResolution.nearKind;
    if (!nearKind || !this.cachedClosestLayer) return;
    const slot = this.variantSlots[nearKind];
    if (!slot.hasVariantEntry || !slot.url || !slot.cacheKey) return;

    if (this.loadQueue.enqueue && (this.useExplicitLoadQueue || typeof Image !== "undefined")) {
      if (!this.loadQueue.isManaged(slot.cacheKey) && !this.loadQueue.isManaged(slot.url)) {
        this.loadQueue
          .enqueue({
            cacheKey: slot.cacheKey,
            url: slot.url,
            priority: PARALLAX_LOAD_PRIORITY.ZONE_VARIANT,
            subOrder: this.zoneResolution.nearDistanceSq,
            fadeInOnReady: false,
          })
          .catch(() => {});
      }
      return;
    }

    if (this.loader.getTexture(slot.url)) return;
    if (this.loader.isTextureLoaded?.(slot.url)) return;
    if (this.pendingVariantUrls.has(slot.url)) return;
    this.pendingVariantUrls.add(slot.url);
    this.loader.loadTexture(slot.url).catch(() => {});
  }

  private updateZoneCrossfade(nowMs: number): void {
    const targetKind = this.zoneResolution.kind;
    const targetWeight = this.zoneResolution.weight;
    const targetColor = this.zoneResolution.ambientColor;
    const durationMs = this.zoneCrossfadeDurationMs;

    if (Number.isNaN(this.lastZoneNowMs) || durationMs <= 0) {
      this.activeZoneKind = targetKind;
      this.activeZoneAlpha = targetWeight;
      this.activeAmbientColor = targetColor;
      this.leavingZoneKind = null;
      this.leavingZoneAlpha = 0;
      this.leavingAmbientColor = null;
      this.lastZoneNowMs = nowMs;
      this.lastTargetKind = targetKind;
      this.lastTargetWeight = targetWeight;
      return;
    }

    const dt = Math.max(0, nowMs - this.lastZoneNowMs);
    const step = dt / durationMs;
    this.lastZoneNowMs = nowMs;

    if (this.leavingZoneKind !== null) {
      this.leavingZoneAlpha = Math.max(0, this.leavingZoneAlpha - step);
      if (this.leavingZoneAlpha <= 0) {
        this.leavingZoneKind = null;
        this.leavingAmbientColor = null;
      }
    }

    if (this.activeZoneKind !== null) {
      if (this.lastTargetKind === this.activeZoneKind) {
        const diff = this.lastTargetWeight - this.activeZoneAlpha;
        if (Math.abs(diff) <= step) {
          this.activeZoneAlpha = this.lastTargetWeight;
        } else {
          this.activeZoneAlpha += diff > 0 ? step : -step;
        }
      } else {
        this.activeZoneAlpha = Math.max(0, this.activeZoneAlpha - step);
      }

      if (this.activeZoneAlpha <= 0 && targetKind === null) {
        this.activeZoneKind = null;
        this.activeAmbientColor = null;
      }
    }

    if (targetKind !== null) {
      if (this.activeZoneKind === null) {
        this.activeZoneKind = targetKind;
        this.activeZoneAlpha = 0;
        this.activeAmbientColor = targetColor;
      } else if (targetKind !== this.activeZoneKind) {
        if (this.leavingZoneKind === targetKind) {
          const prevKind = this.activeZoneKind;
          const prevAlpha = this.activeZoneAlpha;
          const prevColor = this.activeAmbientColor;
          this.activeZoneKind = this.leavingZoneKind;
          this.activeZoneAlpha = this.leavingZoneAlpha;
          this.activeAmbientColor = targetColor;
          this.leavingZoneKind = prevKind;
          this.leavingZoneAlpha = prevAlpha;
          this.leavingAmbientColor = prevColor;
        } else {
          if (this.activeZoneAlpha > 0) {
            this.leavingZoneKind = this.activeZoneKind;
            this.leavingZoneAlpha = this.activeZoneAlpha;
            this.leavingAmbientColor = this.activeAmbientColor;
          }
          this.activeZoneKind = targetKind;
          this.activeZoneAlpha = 0;
          this.activeAmbientColor = targetColor;
        }
      } else {
        this.activeAmbientColor = targetColor;
      }
    }

    this.lastTargetKind = targetKind;
    this.lastTargetWeight = targetWeight;
  }
}
