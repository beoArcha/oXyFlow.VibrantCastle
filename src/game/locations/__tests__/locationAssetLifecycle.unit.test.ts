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

  it("preloads neighbours only after the current location, at idle, skipping already-cached shared textures", async () => {
    const lifecycle = make();
    await lifecycle.enterLocation(asId("a"));
    expect(loader.loadCalls).toEqual(["a1", "shared"]);
    await flushIdle();
    expect(loader.loadCalls).toEqual(["a1", "shared", "b1"]);
  });

  it("should load current location layers in §3.7 priority order and preload only neighbour far+closest at low tier", async () => {
    // Arrange
    const layeredGraph: Record<string, LocationDefinition> = {
      curr: {
        id: "curr",
        portals: [{ id: "p_next", targetLocationId: "next", activation: "touch" }],
        parallaxBackground: {
          boxWidth: 4000,
          boxHeight: 1200,
          layers: [
            { id: "c_close", name: "Close", type: "image", tier: "close", depth: 0.86, scrollSpeedX: 0.8, scrollSpeedY: 0.2, imageUrl: "curr_close_high.png" },
            { id: "c_fx", name: "Sigil", type: "image", tier: "boss_stage", depth: 0.72, scrollSpeedX: 0.4, scrollSpeedY: 0.1, imageUrl: "curr_fx_high.png" },
            { id: "c_mid", name: "Mid", type: "image", tier: "mid", depth: 0.45, scrollSpeedX: 0.35, scrollSpeedY: 0.1, imageUrl: "curr_mid_high.png" },
            { id: "c_far", name: "Far", type: "image", tier: "far", depth: 0.08, scrollSpeedX: 0.04, scrollSpeedY: 0.02, imageUrl: "curr_far_high.png" },
          ],
        },
      } as unknown as LocationDefinition,
      next: {
        id: "next",
        portals: [],
        parallaxBackground: {
          boxWidth: 4000,
          boxHeight: 1200,
          layers: [
            { id: "n_far", name: "Next Far", type: "image", tier: "far", layerKey: "next:far", depth: 0.08, scrollSpeedX: 0.04, scrollSpeedY: 0.02, imageUrl: "next_far_high.png" },
            { id: "n_mid", name: "Next Mid", type: "image", tier: "mid", layerKey: "next:var_b", depth: 0.45, scrollSpeedX: 0.35, scrollSpeedY: 0.1, imageUrl: "next_mid_high.png" },
            { id: "n_close", name: "Next Close", type: "image", tier: "close", layerKey: "next:var_d", depth: 0.86, scrollSpeedX: 0.8, scrollSpeedY: 0.2, imageUrl: "next_close_high.png" },
            { id: "n_fx", name: "Next Fx", type: "image", tier: "boss_stage", layerKey: "next:fx_sigil", depth: 0.72, scrollSpeedX: 0.4, scrollSpeedY: 0.1, imageUrl: "next_fx_high.png" },
          ],
        },
      } as unknown as LocationDefinition,
    };

    const lifecycle = new LocationAssetLifecycle({
      loader,
      resolveLocation: (id) => layeredGraph[id as string],
      scheduleIdle: (task) => idleTasks.push(task),
      resolveTierUrl: (layer, tier) => layer.imageUrl?.replace("_high.png", `_${tier}.png`),
    });

    // Act
    await lifecycle.enterLocation(asId("curr"));
    await flushIdle();

    // Assert
    expect(loader.loadCalls).toEqual([
      "curr_far_high.png",
      "curr_mid_high.png",
      "curr_close_high.png",
      "curr_fx_high.png",
      "next_far_low.png",
      "next_close_low.png",
    ]);
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

  it("treats an unknown portal target as no neighbour and never preloads a fallback location", async () => {
    // Arrange
    const withTypo: Record<string, LocationDefinition> = {
      ...graph,
      a: fakeLocation("a", ["a1"], ["no_such_location"]),
      courtyard: fakeLocation("courtyard", ["court1"], []),
    };
    const lifecycle = new LocationAssetLifecycle({
      loader,
      resolveLocation: (id) => withTypo[id as string],
      scheduleIdle: (task) => idleTasks.push(task),
    });

    // Act
    await lifecycle.enterLocation(asId("a"));
    await flushIdle();

    // Assert
    expect(lifecycle.getNeighbours(asId("a"))).toEqual([]);
    expect(loader.loadCalls).toEqual(["a1"]);
  });

  it("resolves unknown ids strictly against the real registry by default", () => {
    const real = new LocationAssetLifecycle({ loader, scheduleIdle: (t) => idleTasks.push(t) });

    expect(real.getLayerUrls(asId("not_a_location"))).toEqual([]);
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
      const allowed = new Set<string>([...real.getLayerUrls(id), ...real.getLayerUrls(id, "low")]);
      for (const n of real.getNeighbours(id)) {
        for (const u of real.getLayerUrls(n)) allowed.add(u);
        for (const u of real.getLayerUrls(n, "low")) allowed.add(u);
      }
      expect(loader.cache.size).toBeGreaterThan(0);
      for (const u of loader.cache) expect(allowed.has(u)).toBe(true);
    }
  });
});
