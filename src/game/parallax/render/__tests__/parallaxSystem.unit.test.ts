import { describe, it, expect } from "bun:test";
import { ParallaxSystem } from "../ParallaxSystem";
import { ParallaxLoadQueue, PARALLAX_LOAD_PRIORITY, type IParallaxTextureDecoder } from "../../loading";
import type { IParallaxFlags, IParallaxLoader, IParallaxRegistry, IPlaceholderRenderer } from "../types";
import type { ISectorAtmosphericRenderer } from "@game/renderer/background/atmospheric/atmosphericSectorRenderer";
import type { LocationDefinition } from "@game/locations/types";
import type { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import { LOCATION_REGISTRY } from "@game/locations/registry";
import { createMockContext2D } from "@test-utils";

function makeFakeImage(width = 1024, height = 512): HTMLImageElement {
  return {
    complete: true,
    naturalWidth: width,
    naturalHeight: height,
    width,
    height,
  } as unknown as HTMLImageElement;
}

function makeLocation(overrides: Partial<LocationDefinition> = {}): LocationDefinition {
  return {
    id: "custom_arena",
    nameKey: "locName",
    descriptionKey: "locDesc",
    openingNarrationKey: "locOpen",
    width: 3000,
    height: 1000,
    spawnPoint: { x: 100, y: 500 },
    p2SpawnOffset: { x: 40, y: 0 },
    theme: {
      bgGradientTop: "#111111",
      bgGradientBottom: "#000000",
      ambientParticle: "dust",
      fogColor: "rgba(0,0,0,0.2)",
      musicIntensity: 0.5,
    },
    createEntities: () => [],
    createEnemies: () => [],
    ...overrides,
  };
}

function makeImageLayer(overrides: Partial<ParallaxLayerSchema> = {}): ParallaxLayerSchema {
  return {
    id: "layer_1",
    name: "Layer 1",
    type: "image",
    depth: 0.4,
    scrollSpeedX: 0.3,
    scrollSpeedY: 0.1,
    ...overrides,
  };
}

describe("ParallaxSystem", () => {
  it("should report all 8 shipped locations as supported and backed solely by image layers", () => {
    // Arrange
    const system = new ParallaxSystem();
    const shippedLocations = Object.values(LOCATION_REGISTRY);

    // Act
    const supportStatuses = shippedLocations.map((loc) => ({
      id: loc.id,
      supported: system.isSupported(loc),
      layerTypes: Array.from(new Set((loc.parallaxBackground?.layers ?? []).map((l) => l.type))),
    }));

    // Assert
    expect(supportStatuses.length).toBe(8);
    for (const status of supportStatuses) {
      expect(status.supported).toBe(true);
      expect(status.layerTypes).toEqual(["image"]);
    }
  });

  it("should resolve URLs through injected registry and preload missing textures via loader", () => {
    // Arrange
    const loadedUrls: string[] = [];
    const fakeRegistry: IParallaxRegistry = {
      resolve: (key) => (key === "world:courtyard:far" ? { key, tier: "far", url: "resolved://far.png" } : undefined),
    };
    const fakeLoader: IParallaxLoader = {
      getTexture: () => null,
      isTextureLoaded: (url) => url === "resolved://already.png",
      loadTexture: async (url) => {
        loadedUrls.push(url);
        return null;
      },
    };
    const system = new ParallaxSystem({ registry: fakeRegistry, loader: fakeLoader });
    const layers = [
      makeImageLayer({ id: "far_1", layerKey: "world:courtyard:far", tier: "far" }),
      makeImageLayer({ id: "mid_1", imageUrl: "resolved://already.png", tier: "mid" }),
    ];

    // Act
    system.preload(layers);

    // Assert
    expect(loadedUrls).toEqual(["resolved://far.png"]);
  });

  it("should skip tiers disabled by injected flags", () => {
    // Arrange
    const farImg = makeFakeImage();
    const midImg = makeFakeImage();
    const fakeRegistry: IParallaxRegistry = {
      resolve: (key) => {
        if (key === "k_far") return { key, tier: "far", url: "fake://far.png" };
        if (key === "k_mid") return { key, tier: "mid", url: "fake://mid.png" };
        return undefined;
      },
    };
    const fakeLoader: IParallaxLoader = {
      getTexture: (url) => (url === "fake://far.png" ? farImg : url === "fake://mid.png" ? midImg : null),
      loadTexture: async () => null,
    };
    const fakeFlags: IParallaxFlags = {
      isTierEnabled: (tier) => tier !== "mid",
      showWireframes: () => false,
    };
    const system = new ParallaxSystem({ registry: fakeRegistry, loader: fakeLoader, flags: fakeFlags });
    const location = makeLocation({
      parallaxBackground: {
        boxWidth: 3400,
        boxHeight: 1200,
        layers: [
          makeImageLayer({ id: "far", tier: "far", layerKey: "k_far" }),
          makeImageLayer({ id: "mid", tier: "mid", layerKey: "k_mid" }),
        ],
      },
    });
    const ctx = createMockContext2D();

    // Act
    system.render(ctx, location, 3000, 1000, 1000, 625, 0, 0, 1);

    // Assert
    expect(ctx.getDrawImageCalls().length).toBe(1);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("should draw tier wireframes when flags.showWireframes returns true", () => {
    // Arrange
    const midImg = makeFakeImage();
    const fakeLoader: IParallaxLoader = {
      getTexture: () => midImg,
      loadTexture: async () => null,
    };
    const fakeFlags: IParallaxFlags = {
      isTierEnabled: () => true,
      showWireframes: () => true,
    };
    const system = new ParallaxSystem({ loader: fakeLoader, flags: fakeFlags });
    const location = makeLocation({
      parallaxBackground: {
        boxWidth: 3400,
        boxHeight: 1200,
        layers: [makeImageLayer({ id: "mid_arch", tier: "mid", imageUrl: "fake://mid.png" })],
      },
    });
    const ctx = createMockContext2D();

    // Act
    system.render(ctx, location, 3000, 1000, 1000, 625, 0, 0, 1);

    // Assert
    expect(ctx.getTextCalls().some((text) => text.includes("TIER: MID [mid_arch]"))).toBe(true);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("should delegate non-image locations to injected PlaceholderRenderer", () => {
    // Arrange
    let placeholderCalls = 0;
    const fakePlaceholder: IPlaceholderRenderer = {
      render: () => {
        placeholderCalls++;
      },
    };
    const system = new ParallaxSystem({ placeholderRenderer: fakePlaceholder });
    const location = makeLocation({
      id: "procedural_room",
      parallaxBackground: {
        boxWidth: 3400,
        boxHeight: 1200,
        layers: [
          {
            id: "sky",
            name: "Sky",
            type: "sky_gradient",
            depth: 0.05,
            scrollSpeedX: 0,
            scrollSpeedY: 0,
          },
        ],
      },
    });
    const ctx = createMockContext2D();

    // Act
    system.render(ctx, location, 3000, 1000, 1000, 625, 0, 0, 1);

    // Assert
    expect(placeholderCalls).toBe(1);
  });

  it("should fall back to procedural far backdrop when far texture is not loaded yet", () => {
    // Arrange
    let proceduralFarCalls = 0;
    const fakeAtmospheric: ISectorAtmosphericRenderer = {
      renderSectorAtmosphere: () => {},
      renderProceduralFarBackdrop: () => {
        proceduralFarCalls++;
      },
      clearCaches: () => {},
    };
    const system = new ParallaxSystem({ atmosphericRenderer: fakeAtmospheric });
    const location = makeLocation({
      id: "courtyard",
      parallaxBackground: {
        boxWidth: 3400,
        boxHeight: 1200,
        layers: [makeImageLayer({ id: "far", tier: "far", imageUrl: "pending://far.png" })],
      },
    });
    const ctx = createMockContext2D();

    // Act
    system.render(ctx, location, 3000, 1000, 1000, 625, 0, 0, 1);

    // Assert
    expect(proceduralFarCalls).toBe(1);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("should forward clearCaches to atmospheric and placeholder renderers", () => {
    // Arrange
    let atmosphericCleared = 0;
    let placeholderCleared = 0;
    const system = new ParallaxSystem({
      atmosphericRenderer: {
        renderSectorAtmosphere: () => {},
        renderProceduralFarBackdrop: () => {},
        clearCaches: () => {
          atmosphericCleared++;
        },
      },
      placeholderRenderer: {
        render: () => {},
        clearCaches: () => {
          placeholderCleared++;
        },
      },
    });

    // Act
    system.clearCaches();

    // Assert
    expect(atmosphericCleared).toBe(1);
    expect(placeholderCleared).toBe(1);
  });

  it("should render frame 1 immediately with far placeholder colours from meta when far texture is pending", () => {
    // Arrange
    const queue = new ParallaxLoadQueue({
      decoder: {
        loadAndDecode: () => new Promise(() => {}),
      },
    });
    const system = new ParallaxSystem({ loadQueue: queue });
    const location = makeLocation({
      id: "courtyard_m2",
      worldId: "courtyard",
      theme: {
        bgGradientTop: "#000000",
        bgGradientBottom: "#000000",
        ambientParticle: "leaf",
        fogColor: "rgba(0,0,0,0)",
        musicIntensity: 0.2,
      },
      parallaxBackground: {
        boxWidth: 4000,
        boxHeight: 1200,
        layers: [makeImageLayer({ id: "far", tier: "far", layerKey: "courtyard:far", imageUrl: "courtyard_far.png" })],
      },
    });
    const ctx = createMockContext2D();

    // Act
    system.render(ctx, location, 3000, 1000, 1280, 720, 0, 0, 1);

    // Assert
    expect(ctx.getFillRectCalls().length).toBeGreaterThan(0);
    expect(ctx.getDrawImageCalls().length).toBe(0);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("should fade in a combination layer from 0 to 1 over 200 ms after becoming ready in ParallaxLoadQueue", async () => {
    // Arrange
    let fakeNow = 500;
    const midImg = makeFakeImage(1024, 512);
    const decoder: IParallaxTextureDecoder = {
      async loadAndDecode() {
        return { texture: midImg, width: 1024, height: 512, decodedBytes: 1024 * 512 * 4 };
      },
    };
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 1, now: () => fakeNow, fadeDurationMs: 200 });
    await queue.enqueue({
      cacheKey: "courtyard:var_b",
      url: "mid.png",
      priority: PARALLAX_LOAD_PRIORITY.LAYER,
      fadeInOnReady: true,
    });
    const system = new ParallaxSystem({ loadQueue: queue, now: () => fakeNow });
    const location = makeLocation({
      id: "courtyard",
      worldId: "courtyard",
      parallaxBackground: {
        boxWidth: 4000,
        boxHeight: 1200,
        layers: [makeImageLayer({ id: "mid", tier: "mid", layerKey: "courtyard:var_b", imageUrl: "mid.png" })],
      },
    });

    const recordedAlphas: number[] = [];
    const ctx = createMockContext2D();
    const origDraw = ctx.drawImage.bind(ctx);
    ctx.drawImage = ((...args: unknown[]) => {
      recordedAlphas.push(ctx.globalAlpha);
      (origDraw as (...inner: unknown[]) => void)(...args);
    }) as CanvasRenderingContext2D["drawImage"];

    // Act
    fakeNow = 500;
    ctx.globalAlpha = 1;
    system.render(ctx, location, 3000, 1000, 1000, 625, 0, 0, 1);
    fakeNow = 600;
    ctx.globalAlpha = 1;
    system.render(ctx, location, 3000, 1000, 1000, 625, 0, 0, 2);
    fakeNow = 700;
    ctx.globalAlpha = 1;
    system.render(ctx, location, 3000, 1000, 1000, 625, 0, 0, 3);

    // Assert
    expect(recordedAlphas.length).toBe(2);
    expect(recordedAlphas[0]).toBeCloseTo(0.5, 4);
    expect(recordedAlphas[1]).toBe(1);
    expect(ctx.getSaveBalance()).toBe(0);
  });
});
