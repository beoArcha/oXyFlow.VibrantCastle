import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  LocationAssetLifecycle,
  ILocationAssetLoader,
} from "../locationAssetLifecycle";
import type { LocationDefinition, LocationId } from "../types";

const BYTES_PER_TEXTURE = 2048 * 768 * 4;

class FakeLoader implements ILocationAssetLoader {
  public cache = new Set<string>();
  public loadCalls: string[] = [];
  public evicted: string[] = [];
  public async loadTexture(url: string): Promise<unknown> {
    this.loadCalls.push(url);
    this.cache.add(url);
    return {};
  }
  public evictTexture(url: string): boolean {
    this.evicted.push(url);
    return this.cache.delete(url);
  }
  public getTextureStats() {
    return { textureCount: this.cache.size, decodedBytes: this.cache.size * BYTES_PER_TEXTURE, pendingCount: 0 };
  }
}

function fakeLocation(id: string, urls: string[], targets: string[]): LocationDefinition {
  return {
    id,
    portals: targets.map((t) => ({ id: `p_${t}`, targetLocationId: t, activation: "touch" })),
    parallaxBackground: { layers: urls.map((u) => ({ id: u, imageUrl: u })) },
  } as unknown as LocationDefinition;
}

const asId = (id: string): LocationId => id as LocationId;

describe("LocationAssetLifecycle", () => {
  const originalImage = (globalThis as { Image?: unknown }).Image;
  let loader: FakeLoader;
  let idleTasks: Array<() => void>;

  const graph: Record<string, LocationDefinition> = {
    a: fakeLocation("a", ["a1", "shared"], ["b"]),
    b: fakeLocation("b", ["b1", "shared"], ["c"]),
    c: fakeLocation("c", ["c1"], ["d"]),
    d: fakeLocation("d", ["d1"], []),
  };

  const make = () =>
    new LocationAssetLifecycle({
      loader,
      resolveLocation: (id) => graph[id as string],
      scheduleIdle: (task) => idleTasks.push(task),
    });

  const flushIdle = async () => {
    while (idleTasks.length) idleTasks.shift()!();
    await new Promise((r) => setTimeout(r, 0));
  };

  beforeEach(() => {
    (globalThis as { Image?: unknown }).Image = class {};
    loader = new FakeLoader();
    idleTasks = [];
  });

  afterEach(() => {
    (globalThis as { Image?: unknown }).Image = originalImage;
  });

  it("preloadLocation loads exactly the layers of the location", async () => {
    const lifecycle = make();
    await lifecycle.preloadLocation(asId("a"));
    expect([...loader.loadCalls].sort()).toEqual(["a1", "shared"]);
  });

  it("preloads neighbours only after the current location, at idle", async () => {
    const lifecycle = make();
    await lifecycle.enterLocation(asId("a"));
    expect(loader.loadCalls).toEqual(["a1", "shared"]);
    await flushIdle();
    expect(loader.loadCalls).toEqual(["a1", "shared", "b1", "shared"]);
  });

  it("evicts A on A to B to C, keeping URLs shared with B", async () => {
    const lifecycle = make();
    await lifecycle.enterLocation(asId("a"));
    await flushIdle();
    await lifecycle.enterLocation(asId("b"));
    expect(loader.cache.has("a1")).toBe(false);
    expect(loader.cache.has("shared")).toBe(true);
    await lifecycle.enterLocation(asId("c"));
    expect(loader.evicted).toContain("a1");
    expect(loader.cache.has("b1")).toBe(false);
    expect(loader.cache.has("c1")).toBe(true);
  });

  it("unloadLocation never evicts the current location or a neighbour", async () => {
    const lifecycle = make();
    await lifecycle.enterLocation(asId("a"));
    lifecycle.unloadLocation(asId("a"));
    lifecycle.unloadLocation(asId("b"));
    expect(loader.evicted).toEqual([]);
  });

  it("reports stats", async () => {
    const lifecycle = make();
    await lifecycle.enterLocation(asId("a"));
    const stats = lifecycle.getStats();
    expect(stats.textureCount).toBe(2);
    expect(stats.decodedBytes).toBe(2 * BYTES_PER_TEXTURE);
    expect(stats.currentLocationId).toBe("a");
  });

  it("stops neighbour preloading when the location changes first", async () => {
    const lifecycle = make();
    await lifecycle.enterLocation(asId("a"));
    await lifecycle.enterLocation(asId("d"));
    await flushIdle();
    expect(loader.loadCalls).not.toContain("b1");
  });

  it("never holds more than current + neighbours across all five real locations", async () => {
    const ids: LocationId[] = ["courtyard", "thorn_chasm", "clocktower", "aether_sanctuary", "grand_bastion"];
    const real = new LocationAssetLifecycle({ loader, scheduleIdle: (t) => idleTasks.push(t) });
    for (const id of ids) {
      await real.enterLocation(id);
      await flushIdle();
      const allowed = new Set<string>(real.getLayerUrls(id));
      for (const n of real.getNeighbours(id)) for (const u of real.getLayerUrls(n)) allowed.add(u);
      expect(loader.cache.size).toBeGreaterThan(0);
      for (const u of loader.cache) expect(allowed.has(u)).toBe(true);
    }
  });
});
