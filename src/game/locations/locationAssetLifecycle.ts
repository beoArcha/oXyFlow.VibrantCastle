import { assetLoader } from "@game/engine/assetLoader";
import { getLocation } from "./registry";
import type { LocationDefinition, LocationId } from "./types";

/**
 * Background texture lifecycle for locations.
 * Keeps decoded background memory bounded to (current location + direct portal neighbours),
 * preloads the entered location immediately and its neighbours at idle.
 * Purely asynchronous I/O: never reads or writes simulation state.
 */

export interface ILocationAssetLoader {
  loadTexture(url: string): Promise<unknown>;
  evictTexture(url: string): boolean;
  getTextureStats(): { textureCount: number; decodedBytes: number; pendingCount: number };
}

export interface LocationAssetLifecycleDeps {
  loader?: ILocationAssetLoader;
  resolveLocation?: (id: LocationId) => LocationDefinition | undefined;
  /** Defers background work until the main thread is idle. */
  scheduleIdle?: (task: () => void) => void;
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

export class LocationAssetLifecycle {
  private readonly loader: ILocationAssetLoader;
  private readonly resolveLocation: (id: LocationId) => LocationDefinition | undefined;
  private readonly scheduleIdle: (task: () => void) => void;
  private currentId: LocationId | null = null;
  /** Locations whose layer URLs were requested and may still occupy the cache. */
  private readonly tracked = new Set<LocationId>();
  private generation = 0;

  constructor(deps: LocationAssetLifecycleDeps = {}) {
    this.loader = deps.loader ?? assetLoader;
    this.resolveLocation = deps.resolveLocation ?? ((id) => getLocation(id));
    this.scheduleIdle = deps.scheduleIdle ?? defaultScheduleIdle;
  }

  public get currentLocationId(): LocationId | null {
    return this.currentId;
  }

  /** Background layer URLs of a location (deduplicated). */
  public getLayerUrls(locationId: LocationId): string[] {
    const layers = this.resolveLocation(locationId)?.parallaxBackground?.layers;
    const urls: string[] = [];
    if (!layers) return urls;
    for (const layer of layers) {
      if (layer.imageUrl && !urls.includes(layer.imageUrl)) urls.push(layer.imageUrl);
    }
    return urls;
  }

  /** Direct portal-graph neighbours (outbound portals + canonical next location). */
  public getNeighbours(locationId: LocationId): LocationId[] {
    const def = this.resolveLocation(locationId);
    const result: LocationId[] = [];
    if (!def) return result;
    const add = (id: string | undefined) => {
      if (id && id !== locationId && !result.includes(id as LocationId) && this.resolveLocation(id as LocationId)) {
        result.push(id as LocationId);
      }
    };
    for (const portal of def.portals ?? []) add(portal.targetLocationId);
    add(def.nextLocationId);
    return result;
  }

  /** Loads exactly the background layers of the location. Failures are swallowed (lazy path remains). */
  public async preloadLocation(locationId: LocationId): Promise<void> {
    if (typeof Image === "undefined") return;
    this.tracked.add(locationId);
    await Promise.all(this.getLayerUrls(locationId).map((url) => this.loader.loadTexture(url).catch(() => undefined)));
  }

  /**
   * Evicts the location's textures unless it is the current location or a direct neighbour,
   * and never evicts URLs still needed by those.
   */
  public unloadLocation(locationId: LocationId): void {
    const keep = this.computeKeepUrls();
    for (const url of this.getLayerUrls(locationId)) {
      if (!keep.has(url)) this.loader.evictTexture(url);
    }
    if (!this.isRetained(locationId)) this.tracked.delete(locationId);
  }

  /**
   * Marks a location as entered: evicts stale locations, starts loading its layers right away
   * and preloads its neighbours at idle once its own textures are done. Idempotent.
   */
  public enterLocation(locationId: LocationId): Promise<void> {
    if (this.currentId === locationId) return Promise.resolve();
    this.currentId = locationId;
    const gen = ++this.generation;

    for (const id of Array.from(this.tracked)) {
      if (!this.isRetained(id)) this.unloadLocation(id);
    }

    const own = this.preloadLocation(locationId);
    return own.then(() => {
      this.scheduleIdle(() => {
        void this.preloadNeighbours(locationId, gen);
      });
    });
  }

  public getStats(): LocationAssetStats {
    const s = this.loader.getTextureStats();
    return {
      textureCount: s.textureCount,
      decodedBytes: s.decodedBytes,
      pendingCount: s.pendingCount,
      currentLocationId: this.currentId,
      trackedLocationCount: this.tracked.size,
    };
  }

  private async preloadNeighbours(locationId: LocationId, gen: number): Promise<void> {
    for (const id of this.getNeighbours(locationId)) {
      if (gen !== this.generation) return;
      await this.preloadLocation(id);
    }
  }

  private isRetained(id: LocationId): boolean {
    return id === this.currentId || (this.currentId !== null && this.getNeighbours(this.currentId).includes(id));
  }

  private computeKeepUrls(): Set<string> {
    const keep = new Set<string>();
    if (this.currentId === null) return keep;
    for (const url of this.getLayerUrls(this.currentId)) keep.add(url);
    for (const n of this.getNeighbours(this.currentId)) {
      for (const url of this.getLayerUrls(n)) keep.add(url);
    }
    return keep;
  }
}

export const defaultLocationAssetLifecycle = new LocationAssetLifecycle();
