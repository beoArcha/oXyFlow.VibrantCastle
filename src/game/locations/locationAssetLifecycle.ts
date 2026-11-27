import { defaultParallaxRegistry } from "@game/parallax/registry";
import type { IParallaxRegistry } from "@game/parallax/render/types";
import type { ResolvedParallaxQuality } from "@game/types";
import { assetsLogger } from "../logger/gameLogger";
import { resolveBackgroundTier } from "../renderer/background/parallaxTiling";
import {
  PARALLAX_LOAD_PRIORITY,
  ParallaxLoadQueue,
  defaultParallaxLoadQueue,
  type IParallaxTextureDecoder,
  type ParallaxDrawableTexture,
  type ParallaxLoadTaskDescriptor,
} from "../parallax/loading";
import type { ParallaxQualityTier } from "../parallax/meta";
import { LOCATION_REGISTRY } from "./registry";
import type { ParallaxLayerSchema } from "./schema/locationSchema";
import type { LocationDefinition, LocationId } from "./types";

/**
 * Background texture lifecycle for locations.
 * Keeps decoded background memory bounded to (current location + direct portal neighbours),
 * delegates progressive loading to ParallaxLoadQueue, and preloads neighbour far + closest layers at low tier.
 * Purely asynchronous I/O: never reads or writes simulation state.
 */

export interface ILocationAssetLoader {
  loadTexture(url: string): Promise<unknown>;
  evictTexture(url: string): boolean;
  getTextureStats(): { textureCount: number; decodedBytes: number; pendingCount: number };
}

export interface LocationAssetLifecycleDeps {
  loader?: ILocationAssetLoader;
  registry?: IParallaxRegistry;
  queue?: ParallaxLoadQueue;
  resolveLocation?: (id: LocationId) => LocationDefinition | undefined;
  /** Defers background work until the main thread is idle. */
  scheduleIdle?: (task: () => void) => void;
  activeTier?: ParallaxQualityTier;
  parallaxQuality?: ResolvedParallaxQuality;
  resolveTierUrl?: (layer: ParallaxLayerSchema, tier: ParallaxQualityTier) => string | undefined;
}

export interface LocationAssetStats {
  textureCount: number;
  decodedBytes: number;
  pendingCount: number;
  currentLocationId: LocationId | null;
  trackedLocationCount: number;
}

function defaultScheduleIdle(task: () => void): void {
  const g = globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (typeof g.requestIdleCallback === "function") {
    g.requestIdleCallback(task, { timeout: 2000 });
  } else {
    setTimeout(task, 0);
  }
}

function readTextureDimensions(texture: ParallaxDrawableTexture): { width: number; height: number } {
  const metrics = texture as { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number };
  const width = metrics.naturalWidth ?? metrics.width ?? 0;
  const height = metrics.naturalHeight ?? metrics.height ?? 0;
  return { width, height };
}

function createExternalLoaderDecoder(loader: ILocationAssetLoader): IParallaxTextureDecoder {
  return {
    async loadAndDecode(url: string, isCancelled: () => boolean) {
      if (isCancelled()) return null;
      const loaded = await loader.loadTexture(url);
      if (!loaded || isCancelled()) return null;
      const texture = loaded as ParallaxDrawableTexture;
      const { width, height } = readTextureDimensions(texture);
      return {
        texture,
        width,
        height,
        decodedBytes: width * height * 4,
      };
    },
    release() {
      // External ILocationAssetLoader implementations track eviction through evictTexture(url).
    },
  };
}

function isZoneVariantLayer(layer: ParallaxLayerSchema): boolean {
  const key = layer.layerKey ?? "";
  return key.includes("@") || layer.id.includes("_zone_");
}

function isEffectLayer(layer: ParallaxLayerSchema): boolean {
  const tier = resolveBackgroundTier(layer);
  if (tier === "boss_stage" || tier === "boss_world") return true;
  const key = layer.layerKey ?? "";
  return key.includes(":fx_") || layer.id.includes("fx_");
}

function resolveZoneDistanceSq(def: LocationDefinition, layer: ParallaxLayerSchema): number {
  const zones = def.bossZones;
  if (!zones || zones.length === 0) return 0;
  const spawnX = def.spawnPoint?.x ?? 0;
  const spawnY = def.spawnPoint?.y ?? 0;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    if (z.layerId && z.layerId !== layer.id && z.layerKey && z.layerKey !== layer.layerKey) continue;
    const cx = z.x + z.width * 0.5;
    const cy = z.y + z.height * 0.5;
    const dx = cx - spawnX;
    const dy = cy - spawnY;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) best = d2;
  }
  return Number.isFinite(best) ? best : 0;
}

const QUALITY_TIERS: readonly ParallaxQualityTier[] = ["low", "mid", "high"];
const QUALITY_RANK: Readonly<Record<ResolvedParallaxQuality, number>> = {
  off: 0,
  simplified: 1,
  low: 2,
  mid: 3,
  high: 4,
};

interface ResolvedLayerTarget {
  readonly url: string;
  readonly tier: ParallaxQualityTier;
}

function resolveLayerTargetForTier(
  layer: ParallaxLayerSchema,
  requestedTier: ParallaxQualityTier,
  registry: IParallaxRegistry,
  resolveTierUrl?: (layer: ParallaxLayerSchema, tier: ParallaxQualityTier) => string | undefined
): ResolvedLayerTarget | undefined {
  if (resolveTierUrl) {
    const customUrl = resolveTierUrl(layer, requestedTier);
    return customUrl ? { url: customUrl, tier: requestedTier } : undefined;
  }

  const entry = registry.resolveForTier
    ? (registry.resolveForTier(layer.layerKey, requestedTier) ??
      (layer.id ? registry.resolveForTier(layer.id, requestedTier) : undefined))
    : (registry.resolve(layer.layerKey) ?? (layer.id ? registry.resolve(layer.id) : undefined));

  if (entry?.url) {
    return { url: entry.url, tier: entry.resolvedTier ?? requestedTier };
  }
  if (layer.imageUrl) {
    return { url: layer.imageUrl, tier: requestedTier };
  }
  return undefined;
}

function buildLocationLoadTasks(
  def: LocationDefinition,
  quality: ResolvedParallaxQuality,
  registry: IParallaxRegistry,
  resolveTierUrl?: (layer: ParallaxLayerSchema, tier: ParallaxQualityTier) => string | undefined
): ParallaxLoadTaskDescriptor[] {
  if (quality === "off") return [];
  const layers = def.parallaxBackground?.layers;
  if (!layers || layers.length === 0) return [];

  if (quality === "simplified") {
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (resolveBackgroundTier(layer) !== "far") continue;
      const target = resolveLayerTargetForTier(layer, "low", registry, resolveTierUrl);
      if (!target) return [];
      return [
        {
          cacheKey: layer.layerKey || target.url,
          url: target.url,
          tier: target.tier,
          priority: PARALLAX_LOAD_PRIORITY.FAR,
          subOrder: 0,
          fadeInOnReady: false,
        },
      ];
    }
    return [];
  }

  const tasks: ParallaxLoadTaskDescriptor[] = [];
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const target = resolveLayerTargetForTier(layer, quality, registry, resolveTierUrl);
    if (!target) continue;

    const cacheKey = layer.layerKey || target.url;
    const tier = resolveBackgroundTier(layer);

    if (tier === "far") {
      tasks.push({
        cacheKey,
        url: target.url,
        tier: target.tier,
        priority: PARALLAX_LOAD_PRIORITY.FAR,
        subOrder: 0,
        fadeInOnReady: false,
      });
      continue;
    }

    if (isZoneVariantLayer(layer)) {
      tasks.push({
        cacheKey,
        url: target.url,
        tier: target.tier,
        priority: PARALLAX_LOAD_PRIORITY.ZONE_VARIANT,
        subOrder: resolveZoneDistanceSq(def, layer),
        fadeInOnReady: true,
      });
      continue;
    }

    if (isEffectLayer(layer)) {
      tasks.push({
        cacheKey,
        url: target.url,
        tier: target.tier,
        priority: PARALLAX_LOAD_PRIORITY.EFFECT,
        subOrder: layer.depth ?? 0.72,
        fadeInOnReady: true,
      });
      continue;
    }

    tasks.push({
      cacheKey,
      url: target.url,
      tier: target.tier,
      priority: PARALLAX_LOAD_PRIORITY.LAYER,
      subOrder: layer.depth ?? i * 0.1,
      fadeInOnReady: true,
    });
  }
  return tasks;
}

function buildNeighbourLoadTasks(
  def: LocationDefinition,
  quality: ResolvedParallaxQuality,
  registry: IParallaxRegistry,
  resolveTierUrl?: (layer: ParallaxLayerSchema, tier: ParallaxQualityTier) => string | undefined
): ParallaxLoadTaskDescriptor[] {
  if (quality === "off") return [];
  const layers = def.parallaxBackground?.layers;
  if (!layers || layers.length === 0) return [];

  let farLayer: ParallaxLayerSchema | undefined;
  let closestLayer: ParallaxLayerSchema | undefined;
  let maxDepth = -Infinity;

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (!resolveLayerTargetForTier(layer, "low", registry, resolveTierUrl)) continue;
    const tier = resolveBackgroundTier(layer);
    if (tier === "far") {
      farLayer ??= layer;
      continue;
    }
    if (quality === "simplified" || isEffectLayer(layer) || isZoneVariantLayer(layer)) continue;
    const depth = layer.depth ?? i;
    if (depth >= maxDepth) {
      maxDepth = depth;
      closestLayer = layer;
    }
  }

  if (quality !== "simplified" && !farLayer && layers.length > 0) {
    farLayer = layers[0];
  }

  const tasks: ParallaxLoadTaskDescriptor[] = [];
  const pushNeighbour = (layer: ParallaxLayerSchema | undefined, subOrder: number) => {
    if (!layer) return;
    const target = resolveLayerTargetForTier(layer, "low", registry, resolveTierUrl);
    if (!target) return;
    const cacheKey = layer.layerKey || target.url;
    if (tasks.some((t) => t.cacheKey === cacheKey && t.url === target.url)) return;
    tasks.push({
      cacheKey,
      url: target.url,
      tier: target.tier,
      priority: PARALLAX_LOAD_PRIORITY.NEIGHBOUR,
      subOrder,
      fadeInOnReady: false,
    });
  };

  pushNeighbour(farLayer, 0);
  if (quality !== "simplified") {
    pushNeighbour(closestLayer, 1);
  }
  return tasks;
}

export class LocationAssetLifecycle {
  private readonly registry: IParallaxRegistry;
  private readonly externalLoader: ILocationAssetLoader | null;
  private readonly queue: ParallaxLoadQueue;
  private readonly hasCustomBackend: boolean;
  private readonly resolveLocation: (id: LocationId) => LocationDefinition | undefined;
  private readonly scheduleIdle: (task: () => void) => void;
  private parallaxQuality: ResolvedParallaxQuality;
  private readonly customResolveTierUrl?: (layer: ParallaxLayerSchema, tier: ParallaxQualityTier) => string | undefined;

  private currentId: LocationId | null = null;
  /** Locations whose layer URLs were requested and may still occupy the cache. */
  private readonly tracked = new Set<LocationId>();
  private generation = 0;
  private readonly warnedUnknown = new Set<string>();

  constructor(deps: LocationAssetLifecycleDeps = {}) {
    this.registry = deps.registry ?? defaultParallaxRegistry;
    this.externalLoader = deps.loader ?? null;
    this.hasCustomBackend = Boolean(deps.queue || deps.loader);
    if (deps.queue) {
      this.queue = deps.queue;
    } else if (deps.loader) {
      this.queue = new ParallaxLoadQueue({ decoder: createExternalLoaderDecoder(deps.loader) });
    } else {
      this.queue = defaultParallaxLoadQueue;
    }
    this.resolveLocation = deps.resolveLocation ?? ((id) => LOCATION_REGISTRY[id]);
    this.scheduleIdle = deps.scheduleIdle ?? defaultScheduleIdle;
    this.parallaxQuality =
      deps.parallaxQuality ??
      deps.activeTier ??
      (deps.registry ? deps.registry.getParallaxQuality?.() : undefined) ??
      "high";
    this.customResolveTierUrl = deps.resolveTierUrl;
  }

  public getParallaxQuality(): ResolvedParallaxQuality {
    return this.parallaxQuality;
  }

  /**
   * Switches the active parallax quality at runtime without reloading the level:
   * cancels older loads, clears higher-tier or unwanted textures on downgrade/`simplified`/`off`,
   * and re-enqueues the current location (+ idle neighbours) through `ParallaxLoadQueue`.
   */
  public setParallaxQuality(nextQuality: ResolvedParallaxQuality): Promise<void> {
    if (nextQuality === this.parallaxQuality) return Promise.resolve();
    const prevQuality = this.parallaxQuality;
    this.parallaxQuality = nextQuality;

    const gen = ++this.generation;
    this.queue.beginGeneration();

    const shouldClear =
      nextQuality === "off" ||
      nextQuality === "simplified" ||
      QUALITY_RANK[nextQuality] < QUALITY_RANK[prevQuality];

    if (shouldClear) {
      this.evictAllTrackedFromExternalLoader();
      this.queue.clear();
      this.tracked.clear();
    }

    if (nextQuality === "off" || this.currentId === null) {
      return Promise.resolve();
    }

    const locationId = this.currentId;
    const own = this.preloadLocation(locationId);
    return own.then(() => {
      if (gen !== this.generation) return;
      this.scheduleIdle(() => {
        void this.preloadNeighbours(locationId, gen);
      });
    });
  }

  public get currentLocationId(): LocationId | null {
    return this.currentId;
  }

  public get loadQueue(): ParallaxLoadQueue {
    return this.queue;
  }

  /** Background layer URLs of a location (deduplicated). */
  public getLayerUrls(locationId: LocationId): string[] {
    if (this.parallaxQuality === "off") return [];
    const layers = this.resolveLocation(locationId)?.parallaxBackground?.layers;
    const urls: string[] = [];
    if (!layers) return urls;
    const targetTier: ParallaxQualityTier =
      this.parallaxQuality === "simplified" ? "low" : this.parallaxQuality;
    for (const layer of layers) {
      if (this.parallaxQuality === "simplified" && resolveBackgroundTier(layer) !== "far") continue;
      const target = resolveLayerTargetForTier(layer, targetTier, this.registry, this.customResolveTierUrl);
      if (target && !urls.includes(target.url)) urls.push(target.url);
    }
    return urls;
  }

  /** Direct portal-graph neighbours (outbound portals + canonical next location). */
  public getNeighbours(locationId: LocationId): LocationId[] {
    const def = this.resolveLocation(locationId);
    const result: LocationId[] = [];
    if (!def) return result;
    const add = (id: string | undefined) => {
      if (!id || id === locationId || result.includes(id as LocationId)) return;
      if (this.resolveLocation(id as LocationId)) {
        result.push(id as LocationId);
        return;
      }
      this.warnUnknownNeighbour(locationId, id);
    };
    for (const portal of def.portals ?? []) add(portal.targetLocationId);
    add(def.nextLocationId);
    return result;
  }

  private warnUnknownNeighbour(from: LocationId, target: string): void {
    const key = `${from}->${target}`;
    if (this.warnedUnknown.has(key)) return;
    this.warnedUnknown.add(key);
    assetsLogger.warn("Portal targets an unknown location, ignoring it for asset preloading", { from, target });
  }

  /** Loads the background layers of the location via ParallaxLoadQueue. Failures are swallowed. */
  public async preloadLocation(locationId: LocationId): Promise<void> {
    if (this.parallaxQuality === "off") return;
    if (!this.hasCustomBackend && typeof Image === "undefined") return;
    const def = this.resolveLocation(locationId);
    this.tracked.add(locationId);
    if (!def) return;
    const tasks = buildLocationLoadTasks(def, this.parallaxQuality, this.registry, this.customResolveTierUrl);
    if (tasks.length === 0) return;
    await this.queue.enqueueBatch(tasks);
  }

  /**
   * Evicts the location's textures unless it is the current location or a direct neighbour,
   * and never evicts URLs/keys still needed by those.
   */
  public unloadLocation(locationId: LocationId): void {
    const keep = this.computeKeepKeys();
    const layers = this.resolveLocation(locationId)?.parallaxBackground?.layers ?? [];
    for (const layer of layers) {
      const cacheKey = layer.layerKey || layer.id;
      for (const tier of QUALITY_TIERS) {
        const target = resolveLayerTargetForTier(layer, tier, this.registry, this.customResolveTierUrl);
        if (target && !keep.has(target.url)) {
          this.queue.evict(target.url);
          this.externalLoader?.evictTexture(target.url);
        }
      }
      if (cacheKey && !keep.has(cacheKey)) {
        this.queue.evict(cacheKey);
      }
    }
    if (!this.isRetained(locationId)) this.tracked.delete(locationId);
  }

  /**
   * Marks a location as entered: cancels previous pending loads by generation, evicts stale locations,
   * loads its layers progressively by §3.7 priority, and preloads neighbour far+closest at low tier on idle.
   */
  public enterLocation(locationId: LocationId): Promise<void> {
    if (this.currentId === locationId) return Promise.resolve();
    this.currentId = locationId;
    const gen = ++this.generation;
    this.queue.beginGeneration();

    for (const id of Array.from(this.tracked)) {
      if (!this.isRetained(id)) this.unloadLocation(id);
    }

    const own = this.preloadLocation(locationId);
    return own.then(() => {
      if (gen !== this.generation) return;
      this.scheduleIdle(() => {
        void this.preloadNeighbours(locationId, gen);
      });
    });
  }

  public getStats(): LocationAssetStats {
    const q = this.queue.getStats();
    if (this.externalLoader) {
      const s = this.externalLoader.getTextureStats();
      return {
        textureCount: s.textureCount,
        decodedBytes: s.decodedBytes,
        pendingCount: Math.max(s.pendingCount, q.pendingCount + q.inFlightCount),
        currentLocationId: this.currentId,
        trackedLocationCount: this.tracked.size,
      };
    }
    return {
      textureCount: q.textureCount,
      decodedBytes: q.decodedBytes,
      pendingCount: q.pendingCount + q.inFlightCount,
      currentLocationId: this.currentId,
      trackedLocationCount: this.tracked.size,
    };
  }

  private async preloadNeighbours(locationId: LocationId, gen: number): Promise<void> {
    if (this.parallaxQuality === "off") return;
    if (!this.hasCustomBackend && typeof Image === "undefined") return;
    const tasks: ParallaxLoadTaskDescriptor[] = [];
    for (const id of this.getNeighbours(locationId)) {
      if (gen !== this.generation) return;
      const def = this.resolveLocation(id);
      if (!def) continue;
      this.tracked.add(id);
      tasks.push(...buildNeighbourLoadTasks(def, this.parallaxQuality, this.registry, this.customResolveTierUrl));
    }
    if (gen !== this.generation || tasks.length === 0) return;
    await this.queue.enqueueBatch(tasks);
  }

  private evictAllTrackedFromExternalLoader(): void {
    if (!this.externalLoader) return;
    for (const locationId of this.tracked) {
      const layers = this.resolveLocation(locationId)?.parallaxBackground?.layers ?? [];
      for (const layer of layers) {
        for (const tier of QUALITY_TIERS) {
          const target = resolveLayerTargetForTier(layer, tier, this.registry, this.customResolveTierUrl);
          if (target) this.externalLoader.evictTexture(target.url);
        }
      }
    }
  }

  private isRetained(id: LocationId): boolean {
    return id === this.currentId || (this.currentId !== null && this.getNeighbours(this.currentId).includes(id));
  }

  private computeKeepKeys(): Set<string> {
    const keep = new Set<string>();
    if (this.currentId === null || this.parallaxQuality === "off") return keep;
    this.addRetainedKeys(this.currentId, keep);
    for (const n of this.getNeighbours(this.currentId)) {
      this.addRetainedKeys(n, keep);
    }
    return keep;
  }

  private addRetainedKeys(locationId: LocationId, out: Set<string>): void {
    if (this.parallaxQuality === "off") return;
    const layers = this.resolveLocation(locationId)?.parallaxBackground?.layers ?? [];
    const activeTier: ParallaxQualityTier =
      this.parallaxQuality === "simplified" ? "low" : this.parallaxQuality;
    for (const layer of layers) {
      if (this.parallaxQuality === "simplified" && resolveBackgroundTier(layer) !== "far") continue;
      const activeTarget = resolveLayerTargetForTier(layer, activeTier, this.registry, this.customResolveTierUrl);
      const lowTarget = resolveLayerTargetForTier(layer, "low", this.registry, this.customResolveTierUrl);
      if (activeTarget) out.add(activeTarget.url);
      if (lowTarget) out.add(lowTarget.url);
      if (layer.layerKey) out.add(layer.layerKey);
    }
  }
}

export const defaultLocationAssetLifecycle = new LocationAssetLifecycle();
