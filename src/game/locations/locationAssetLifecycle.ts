import { defaultParallaxRegistry } from "@game/parallax/registry";
import type { IParallaxRegistry } from "@game/parallax/render/types";
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

function resolveLayerUrlForTier(
  layer: ParallaxLayerSchema,
  tier: ParallaxQualityTier,
  resolveTierUrl?: (layer: ParallaxLayerSchema, tier: ParallaxQualityTier) => string | undefined
): string | undefined {
  return resolveTierUrl?.(layer, tier) ?? layer.imageUrl;
}

function buildLocationLoadTasks(
  def: LocationDefinition,
  activeTier: ParallaxQualityTier,
  resolveTierUrl?: (layer: ParallaxLayerSchema, tier: ParallaxQualityTier) => string | undefined
): ParallaxLoadTaskDescriptor[] {
  const layers = def.parallaxBackground?.layers;
  if (!layers || layers.length === 0) return [];

  const tasks: ParallaxLoadTaskDescriptor[] = [];
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const url = resolveLayerUrlForTier(layer, activeTier, resolveTierUrl);
    if (!url) continue;

    const cacheKey = layer.layerKey || url;
    const tier = resolveBackgroundTier(layer);

    if (tier === "far") {
      tasks.push({
        cacheKey,
        url,
        tier: activeTier,
        priority: PARALLAX_LOAD_PRIORITY.FAR,
        subOrder: 0,
        fadeInOnReady: false,
      });
      continue;
    }

    if (isZoneVariantLayer(layer)) {
      tasks.push({
        cacheKey,
        url,
        tier: activeTier,
        priority: PARALLAX_LOAD_PRIORITY.ZONE_VARIANT,
        subOrder: resolveZoneDistanceSq(def, layer),
        fadeInOnReady: true,
      });
      continue;
    }

    if (isEffectLayer(layer)) {
      tasks.push({
        cacheKey,
        url,
        tier: activeTier,
        priority: PARALLAX_LOAD_PRIORITY.EFFECT,
        subOrder: layer.depth ?? 0.72,
        fadeInOnReady: true,
      });
      continue;
    }

    tasks.push({
      cacheKey,
      url,
      tier: activeTier,
      priority: PARALLAX_LOAD_PRIORITY.LAYER,
      subOrder: layer.depth ?? i * 0.1,
      fadeInOnReady: true,
    });
  }
  return tasks;
}

function buildNeighbourLoadTasks(
  def: LocationDefinition,
  resolveTierUrl?: (layer: ParallaxLayerSchema, tier: ParallaxQualityTier) => string | undefined
): ParallaxLoadTaskDescriptor[] {
  const layers = def.parallaxBackground?.layers;
  if (!layers || layers.length === 0) return [];

  let farLayer: ParallaxLayerSchema | undefined;
  let closestLayer: ParallaxLayerSchema | undefined;
  let maxDepth = -Infinity;

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (!resolveLayerUrlForTier(layer, "low", resolveTierUrl)) continue;
    const tier = resolveBackgroundTier(layer);
    if (tier === "far") {
      farLayer ??= layer;
      continue;
    }
    if (isEffectLayer(layer) || isZoneVariantLayer(layer)) continue;
    const depth = layer.depth ?? i;
    if (depth >= maxDepth) {
      maxDepth = depth;
      closestLayer = layer;
    }
  }

  if (!farLayer && layers.length > 0) {
    farLayer = layers[0];
  }

  const tasks: ParallaxLoadTaskDescriptor[] = [];
  const pushNeighbour = (layer: ParallaxLayerSchema | undefined, subOrder: number) => {
    if (!layer) return;
    const url = resolveLayerUrlForTier(layer, "low", resolveTierUrl);
    if (!url) return;
    const cacheKey = layer.layerKey || url;
    if (tasks.some((t) => t.cacheKey === cacheKey && t.url === url)) return;
    tasks.push({
      cacheKey,
      url,
      tier: "low",
      priority: PARALLAX_LOAD_PRIORITY.NEIGHBOUR,
      subOrder,
      fadeInOnReady: false,
    });
  };

  pushNeighbour(farLayer, 0);
  pushNeighbour(closestLayer, 1);
  return tasks;
}

export class LocationAssetLifecycle {
  private readonly registry: IParallaxRegistry;
  private readonly externalLoader: ILocationAssetLoader | null;
  private readonly queue: ParallaxLoadQueue;
  private readonly hasCustomBackend: boolean;
  private readonly resolveLocation: (id: LocationId) => LocationDefinition | undefined;
  private readonly scheduleIdle: (task: () => void) => void;
  private readonly activeTier: ParallaxQualityTier;
  private readonly resolveTierUrl?: (layer: ParallaxLayerSchema, tier: ParallaxQualityTier) => string | undefined;

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
    this.activeTier = deps.activeTier ?? "high";
    this.resolveTierUrl = deps.resolveTierUrl;
  }

  public get currentLocationId(): LocationId | null {
    return this.currentId;
  }

  public get loadQueue(): ParallaxLoadQueue {
    return this.queue;
  }

  /** Background layer URLs of a location (deduplicated). */
  public getLayerUrls(locationId: LocationId): string[] {
    const layers = this.resolveLocation(locationId)?.parallaxBackground?.layers;
    const urls: string[] = [];
    if (!layers) return urls;
    for (const layer of layers) {
      const url = layer.imageUrl ?? this.registry.resolve(layer.layerKey)?.url;
      if (url && !urls.includes(url)) urls.push(url);
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
    if (!this.hasCustomBackend && typeof Image === "undefined") return;
    const def = this.resolveLocation(locationId);
    this.tracked.add(locationId);
    if (!def) return;
    const tasks = buildLocationLoadTasks(def, this.activeTier, this.resolveTierUrl);
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
      const activeUrl = resolveLayerUrlForTier(layer, this.activeTier, this.resolveTierUrl);
      const lowUrl = resolveLayerUrlForTier(layer, "low", this.resolveTierUrl);
      const cacheKey = layer.layerKey || activeUrl || layer.id;

      if (activeUrl && !keep.has(activeUrl)) {
        this.queue.evict(activeUrl);
        this.externalLoader?.evictTexture(activeUrl);
      }
      if (lowUrl && lowUrl !== activeUrl && !keep.has(lowUrl)) {
        this.queue.evict(lowUrl);
        this.externalLoader?.evictTexture(lowUrl);
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
    if (!this.hasCustomBackend && typeof Image === "undefined") return;
    const tasks: ParallaxLoadTaskDescriptor[] = [];
    for (const id of this.getNeighbours(locationId)) {
      if (gen !== this.generation) return;
      const def = this.resolveLocation(id);
      if (!def) continue;
      this.tracked.add(id);
      tasks.push(...buildNeighbourLoadTasks(def, this.resolveTierUrl));
    }
    if (gen !== this.generation || tasks.length === 0) return;
    await this.queue.enqueueBatch(tasks);
  }

  private isRetained(id: LocationId): boolean {
    return id === this.currentId || (this.currentId !== null && this.getNeighbours(this.currentId).includes(id));
  }

  private computeKeepKeys(): Set<string> {
    const keep = new Set<string>();
    if (this.currentId === null) return keep;
    this.addRetainedKeys(this.currentId, keep);
    for (const n of this.getNeighbours(this.currentId)) {
      this.addRetainedKeys(n, keep);
    }
    return keep;
  }

  private addRetainedKeys(locationId: LocationId, out: Set<string>): void {
    const layers = this.resolveLocation(locationId)?.parallaxBackground?.layers ?? [];
    for (const layer of layers) {
      const activeUrl = resolveLayerUrlForTier(layer, this.activeTier, this.resolveTierUrl);
      const lowUrl = resolveLayerUrlForTier(layer, "low", this.resolveTierUrl);
      if (activeUrl) out.add(activeUrl);
      if (lowUrl) out.add(lowUrl);
      if (layer.layerKey) out.add(layer.layerKey);
    }
  }
}

export const defaultLocationAssetLifecycle = new LocationAssetLifecycle();
