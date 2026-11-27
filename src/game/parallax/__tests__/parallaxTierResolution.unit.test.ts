import { describe, expect, it } from "bun:test";
import { LocationAssetLifecycle } from "@game/locations/locationAssetLifecycle";
import type { LocationDefinition, LocationId } from "@game/locations/types";
import { createMockContext2D } from "@test-utils";
import { ParallaxLoadQueue, type IParallaxTextureDecoder, type ParallaxDrawableTexture } from "../loading";
import { ParallaxRegistry, type ParallaxDiscoveryData } from "../registry";
import { ParallaxSystem } from "../render";

function makeFakeTexture(tag: string, width = 1024, height = 512): ParallaxDrawableTexture {
  return {
    tag,
    complete: true,
    naturalWidth: width,
    naturalHeight: height,
    width,
    height,
  } as unknown as ParallaxDrawableTexture;
}

function makeTieredDiscovery(): ParallaxDiscoveryData {
  return {
    metas: {
      "/src/assets/parallax/courtyard/courtyard_parallax_meta.json": {
        worldId: "courtyard",
        placeholder: { top: "#2c1e33", bottom: "#d97706", silhouette: "#93595a" },
        layers: {
          far: { band: "far", opaque: true, depth: 0.08, speed: [0.04, 0.02] },
          var_a: { band: "mid_far", depth: 0.24, speed: [0.18, 0.07], tiling: "mirror" },
          var_d: { band: "close", depth: 0.86, speed: [0.78, 0.24], zones: { boss: {} } },
        },
        effects: {
          sigil: { kind: "image", band: "mid_close", source: "_shared:fx_sigil", blend: "screen", opacity: 0.68 },
        },
        generated: {},
      },
      "/src/assets/parallax/thorn_chasm/thorn_chasm_parallax_meta.json": {
        worldId: "thorn_chasm",
        placeholder: { top: "#14041a", bottom: "#08010d", silhouette: "#220a2e" },
        layers: {
          far: { band: "far", opaque: true, depth: 0.08, speed: [0.04, 0.02] },
          var_d: { band: "close", depth: 0.86, speed: [0.78, 0.24] },
        },
        generated: {},
      },
    },
    images: {
      "/src/assets/parallax/courtyard/courtyard_far_hi8bit.png": "courtyard_far_hi8bit.png",
      "/src/assets/parallax/courtyard/courtyard_far_hi16bit.png": "courtyard_far_hi16bit.png",
      "/src/assets/parallax/courtyard/courtyard_far_high.png": "courtyard_far_high.png",
      "/src/assets/parallax/courtyard/courtyard_var_a_hi8bit.png": "courtyard_var_a_hi8bit.png",
      "/src/assets/parallax/courtyard/courtyard_var_a_high.png": "courtyard_var_a_high.png",
      "/src/assets/parallax/courtyard/courtyard_var_d_high.png": "courtyard_var_d_high.png",
      "/src/assets/parallax/courtyard/courtyard_var_d_zone_boss_high.png": "courtyard_var_d_zone_boss_high.png",
      "/src/assets/parallax/_shared/fx_sigil_high.jpg": "fx_sigil_high.jpg",
      "/src/assets/parallax/thorn_chasm/thorn_chasm_far_hi8bit.png": "thorn_chasm_far_hi8bit.png",
      "/src/assets/parallax/thorn_chasm/thorn_chasm_var_d_hi8bit.png": "thorn_chasm_var_d_hi8bit.png",
    },
  };
}

function makeCourtyardLocation(zones: LocationDefinition["zones"] = []): LocationDefinition {
  return {
    id: "courtyard" as LocationId,
    worldId: "courtyard",
    nameKey: "locName",
    descriptionKey: "locDesc",
    openingNarrationKey: "locOpen",
    width: 4800,
    height: 1040,
    spawnPoint: { x: 140, y: 780 },
    p2SpawnOffset: { x: 46, y: 0 },
    theme: {
      bgGradientTop: "#000000",
      bgGradientBottom: "#000000",
      ambientParticle: "leaf",
      fogColor: "rgba(0,0,0,0)",
      musicIntensity: 0.25,
    },
    portals: [{ id: "p_thorn", targetLocationId: "thorn_chasm", activation: "touch" }],
    zones,
    parallaxBackground: {
      boxWidth: 5400,
      boxHeight: 1160,
      layers: [
        { id: "courtyard:far", name: "Far", tier: "far", layerKey: "courtyard:far", type: "image", depth: 0.08, scrollSpeedX: 0.04, scrollSpeedY: 0.02, opaque: true },
        { id: "courtyard:var_a", name: "Mid Far", tier: "mid_far", layerKey: "courtyard:var_a", type: "image", depth: 0.24, scrollSpeedX: 0.18, scrollSpeedY: 0.07 },
        { id: "courtyard:var_d", name: "Close", tier: "close", layerKey: "courtyard:var_d", type: "image", depth: 0.86, scrollSpeedX: 0.78, scrollSpeedY: 0.24 },
        { id: "_shared:fx_sigil", name: "Sigil", tier: "boss_stage", layerKey: "_shared:fx_sigil", type: "image", depth: 0.72, scrollSpeedX: 0.44, scrollSpeedY: 0.14, blendMode: "screen" },
      ],
    },
    createEntities: () => [],
    createEnemies: () => [],
  };
}

function makeThornLocation(): LocationDefinition {
  return {
    ...makeCourtyardLocation(),
    id: "thorn_chasm" as LocationId,
    worldId: "thorn_chasm",
    portals: [],
    parallaxBackground: {
      boxWidth: 5400,
      boxHeight: 1160,
      layers: [
        { id: "thorn_chasm:far", name: "Far", tier: "far", layerKey: "thorn_chasm:far", type: "image", depth: 0.08, scrollSpeedX: 0.04, scrollSpeedY: 0.02, opaque: true },
        { id: "thorn_chasm:var_d", name: "Close", tier: "close", layerKey: "thorn_chasm:var_d", type: "image", depth: 0.86, scrollSpeedX: 0.78, scrollSpeedY: 0.24 },
      ],
    },
  };
}

function makeRecorderDecoder(released?: ParallaxDrawableTexture[]) {
  const decodedUrls: string[] = [];
  const decoder: IParallaxTextureDecoder = {
    async loadAndDecode(url) {
      decodedUrls.push(url);
      const tex = makeFakeTexture(url);
      return { texture: tex, width: 1024, height: 512, decodedBytes: 1024 * 512 * 4 };
    },
    release(tex) {
      released?.push(tex);
    },
  };
  return { decoder, decodedUrls };
}

describe("Parallax Tier Resolution & Modes (VC-105b)", () => {
  it("should enqueue 0 loads on an isolated queue when parallaxQuality is off", async () => {
    // Arrange
    const registry = new ParallaxRegistry(makeTieredDiscovery(), "off");
    const { decoder, decodedUrls } = makeRecorderDecoder();
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 1 });
    const courtyard = makeCourtyardLocation();
    const lifecycle = new LocationAssetLifecycle({
      registry,
      queue,
      parallaxQuality: "off",
      resolveLocation: (id) => (id === "courtyard" ? courtyard : undefined),
      scheduleIdle: (task) => task(),
    });

    // Act
    await lifecycle.enterLocation("courtyard" as LocationId);

    // Assert
    expect(decodedUrls).toEqual([]);
    expect(queue.getStats().textureCount).toBe(0);
    expect(queue.getStats().pendingCount).toBe(0);
  });

  it("should enqueue exactly 1 far image per location and skip mid, close, zone, and fx layers in simplified mode", async () => {
    // Arrange
    const registry = new ParallaxRegistry(makeTieredDiscovery(), "simplified");
    const { decoder, decodedUrls } = makeRecorderDecoder();
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 1 });
    const courtyard = makeCourtyardLocation([
      { id: "boss_zone", kind: "boss", scope: "stage", x: 100, y: 100, width: 400, height: 400 },
    ]);
    const thorn = makeThornLocation();
    const idleTasks: Array<() => void> = [];
    const lifecycle = new LocationAssetLifecycle({
      registry,
      queue,
      parallaxQuality: "simplified",
      resolveLocation: (id) => (id === "courtyard" ? courtyard : id === "thorn_chasm" ? thorn : undefined),
      scheduleIdle: (task) => idleTasks.push(task),
    });

    // Act
    await lifecycle.enterLocation("courtyard" as LocationId);
    const currentOnlyCount = decodedUrls.length;
    while (idleTasks.length > 0) idleTasks.shift()!();
    await new Promise((r) => setTimeout(r, 0));

    // Assert
    expect(currentOnlyCount).toBe(1);
    expect(decodedUrls).toEqual(["courtyard_far_hi8bit.png", "thorn_chasm_far_hi8bit.png"]);
    expect(queue.getStats().textureCount).toBe(2);
  });

  it("should switch from high to off at runtime by clearing the isolated load queue and releasing textures", async () => {
    // Arrange
    const released: ParallaxDrawableTexture[] = [];
    const registry = new ParallaxRegistry(makeTieredDiscovery(), "high");
    const { decoder, decodedUrls } = makeRecorderDecoder(released);
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 2 });
    const courtyard = makeCourtyardLocation();
    const lifecycle = new LocationAssetLifecycle({
      registry,
      queue,
      parallaxQuality: "high",
      resolveLocation: (id) => (id === "courtyard" ? courtyard : undefined),
      scheduleIdle: () => {},
    });
    await lifecycle.enterLocation("courtyard" as LocationId);
    const highCount = decodedUrls.length;

    // Act
    registry.setParallaxQuality("off");
    await lifecycle.setParallaxQuality("off");

    // Assert
    expect(highCount).toBe(4);
    expect(released.length).toBe(4);
    expect(queue.getStats().textureCount).toBe(0);
    expect(queue.getStats().decodedBytes).toBe(0);
  });

  it("should switch from high to simplified and from low to high at runtime without reloading the location", async () => {
    // Arrange
    const released: ParallaxDrawableTexture[] = [];
    const registry = new ParallaxRegistry(makeTieredDiscovery(), "high");
    const { decoder, decodedUrls } = makeRecorderDecoder(released);
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 2 });
    const courtyard = makeCourtyardLocation();
    const lifecycle = new LocationAssetLifecycle({
      registry,
      queue,
      parallaxQuality: "high",
      resolveLocation: (id) => (id === "courtyard" ? courtyard : undefined),
      scheduleIdle: () => {},
    });
    await lifecycle.enterLocation("courtyard" as LocationId);
    decodedUrls.length = 0;

    // Act
    registry.setParallaxQuality("simplified");
    await lifecycle.setParallaxQuality("simplified");
    const afterSimplifiedUrls = [...decodedUrls];
    decodedUrls.length = 0;
    registry.setParallaxQuality("high");
    await lifecycle.setParallaxQuality("high");
    const afterUpgradeUrls = [...decodedUrls];

    // Assert
    expect(afterSimplifiedUrls).toEqual(["courtyard_far_hi8bit.png"]);
    expect(afterUpgradeUrls).toContain("courtyard_far_high.png");
    expect(afterUpgradeUrls).toContain("courtyard_var_a_high.png");
    expect(queue.hasTier("courtyard:far", "high")).toBe(true);
  });

  it("should render only meta placeholder gradient in off mode with zero drawImage calls and zero allocations", () => {
    // Arrange
    const registry = new ParallaxRegistry(makeTieredDiscovery(), "off");
    const { decoder, decodedUrls } = makeRecorderDecoder();
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 1 });
    const system = new ParallaxSystem({
      registry,
      loadQueue: queue,
      parallaxQuality: "off",
    });
    const courtyard = makeCourtyardLocation();
    const ctx = createMockContext2D();

    // Act
    system.preload(courtyard.parallaxBackground?.layers);
    system.render(ctx, courtyard, 4800, 1040, 1280, 720, 0, 0, 1);
    const gradsAfterWarmup = ctx.getTotalGradientCount();
    for (let tick = 2; tick <= 60; tick++) {
      system.render(ctx, courtyard, 4800, 1040, 1280, 720, tick * 5, 0, tick);
    }

    // Assert
    expect(decodedUrls).toEqual([]);
    expect(ctx.getDrawImageCalls().length).toBe(0);
    expect(ctx.getFillRectCalls().length).toBe(60);
    expect(ctx.getTotalGradientCount()).toBe(gradsAfterWarmup);
    expect(system.hasOpaqueFarBackdrop(courtyard)).toBe(false);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("should render placeholder gradient with silhouette before far is ready and opaque far only once ready in simplified mode", async () => {
    // Arrange
    const registry = new ParallaxRegistry(makeTieredDiscovery(), "simplified");
    const { decoder } = makeRecorderDecoder();
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 1 });
    const system = new ParallaxSystem({
      registry,
      loadQueue: queue,
      parallaxQuality: "simplified",
    });
    const courtyard = makeCourtyardLocation();
    const ctx = createMockContext2D();

    // Act
    system.render(ctx, courtyard, 4800, 1040, 1280, 720, 0, 0, 1);
    const fillsBeforeLoad = ctx.getFillRectCalls().length;
    const drawsBeforeLoad = ctx.getDrawImageCalls().length;
    await queue.enqueue({
      cacheKey: "courtyard:far",
      url: "courtyard_far_hi8bit.png",
      tier: "low",
      priority: 1,
      fadeInOnReady: false,
    });
    system.render(ctx, courtyard, 4800, 1040, 1280, 720, 100, 0, 2);

    // Assert
    expect(fillsBeforeLoad).toBe(2);
    expect(drawsBeforeLoad).toBe(0);
    expect(ctx.getDrawImageCalls().length).toBe(1);
    expect(system.hasOpaqueFarBackdrop(courtyard)).toBe(true);
    expect(ctx.getSaveBalance()).toBe(0);
  });
});
