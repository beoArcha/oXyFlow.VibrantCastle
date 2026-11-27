import { describe, it, expect } from "bun:test";
import {
  ParallaxSurfaceCache,
  createResolvedParallaxSurface,
  type ParallaxSurfaceDrawContext,
  type ParallaxSurfaceFactory,
} from "../ParallaxSurfaceCache";
import { ParallaxSystem } from "../ParallaxSystem";
import type { IParallaxRegistry } from "../types";
import {
  ParallaxLoadQueue,
  PARALLAX_LOAD_PRIORITY,
  type IParallaxTextureDecoder,
} from "../../loading";
import { drawHorizontalTilesClipped, renderTiledDynamicLayer } from "@game/renderer/background/parallaxTiling";
import type { LocationDefinition } from "@game/locations/types";
import type { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import { createMockContext2D } from "@test-utils";

function makeFakeImage(tag: string, width = 2048, height = 768): HTMLImageElement {
  return {
    tag,
    complete: true,
    naturalWidth: width,
    naturalHeight: height,
    width,
    height,
  } as unknown as HTMLImageElement;
}

function createFakeSurfaceFactory() {
  const created: Array<{ width: number; height: number; smoothing: boolean; released: boolean }> = [];
  const drawCalls: Array<{ src: unknown; dx: number; dy: number; dw: number; dh: number }> = [];

  const factory: ParallaxSurfaceFactory = (width, height) => {
    const record = { width, height, smoothing: true, released: false };
    created.push(record);
    const source = { tag: `surface_${created.length}`, width, height } as unknown as CanvasImageSource;
    const ctx: ParallaxSurfaceDrawContext = {
      set imageSmoothingEnabled(value: boolean) {
        record.smoothing = value;
      },
      get imageSmoothingEnabled() {
        return record.smoothing;
      },
      drawImage(image, dx, dy, dw, dh) {
        drawCalls.push({ src: image, dx, dy, dw, dh });
      },
    };
    return {
      source,
      width,
      height,
      ctx,
      release: () => {
        record.released = true;
      },
    };
  };

  return { factory, created, drawCalls };
}

function makeLocationFixture(layers: ParallaxLayerSchema[]): LocationDefinition {
  return {
    id: "grand_bastion",
    worldId: "grand_bastion",
    stageNumber: 7,
    nameKey: "locName",
    descriptionKey: "locDesc",
    openingNarrationKey: "locOpen",
    width: 4800,
    height: 1200,
    spawnPoint: { x: 140, y: 780 },
    p2SpawnOffset: { x: 46, y: 0 },
    theme: {
      bgGradientTop: "#1e1b4b",
      bgGradientBottom: "#b45309",
      ambientParticle: "dust",
      fogColor: "rgba(0,0,0,0.2)",
      musicIntensity: 0.5,
    },
    parallaxBackground: {
      boxWidth: 5200,
      boxHeight: 1400,
      layers,
    },
    createEntities: () => [],
    createEnemies: () => [],
  };
}

describe("ParallaxSurfaceCache", () => {
  it("should pre-scale once per source and reuse cached surface across repeated frames", () => {
    // Arrange
    const { factory, created, drawCalls } = createFakeSurfaceFactory();
    const cache = new ParallaxSurfaceCache({ factory, maxEntries: 8, maxDimension: 2560 });
    const img = makeFakeImage("far", 2048, 768);
    const out = createResolvedParallaxSurface();

    // Act
    cache.resolve(img, 2048, 768, 1850, 694, true, false, out);
    const firstSource = out.source;
    for (let i = 0; i < 1000; i++) {
      cache.resolve(img, 2048, 768, 1850, 694, true, false, out);
    }

    // Assert
    expect(created.length).toBe(1);
    expect(created[0]).toEqual({ width: 1850, height: 694, smoothing: false, released: false });
    expect(drawCalls.length).toBe(1);
    expect(out.source).toBe(firstSource);
    expect(cache.size).toBe(1);
  });

  it("should prevent upscaling past source size when allowUpscale is false", () => {
    // Arrange
    const { factory, created } = createFakeSurfaceFactory();
    const cache = new ParallaxSurfaceCache({ factory, maxDimension: 2560 });
    const img = makeFakeImage("screen_jpg", 1376, 768);
    const out = createResolvedParallaxSurface();

    // Act
    cache.resolve(img, 1376, 768, 2752, 1536, false, false, out);

    // Assert
    expect(created.length).toBe(1);
    expect(created[0].width).toBe(1376);
    expect(created[0].height).toBe(768);
    expect(out.width).toBe(1376);
    expect(out.height).toBe(768);
  });

  it("should cap oversized target dimensions proportionally to maxDimension", () => {
    // Arrange
    const { factory, created } = createFakeSurfaceFactory();
    const cache = new ParallaxSurfaceCache({ factory, maxDimension: 2560 });
    const img = makeFakeImage("wide", 2172, 724);
    const out = createResolvedParallaxSurface();

    // Act
    cache.resolve(img, 2172, 724, 5120, 1706, true, false, out);

    // Assert
    expect(created.length).toBe(1);
    expect(created[0].width).toBe(2560);
    expect(created[0].height).toBe(853);
  });

  it("should release the replaced surface on dimension or smoothing change and on clear", () => {
    // Arrange
    const { factory, created } = createFakeSurfaceFactory();
    const cache = new ParallaxSurfaceCache({ factory });
    const img = makeFakeImage("var_a", 2172, 724);
    const out = createResolvedParallaxSurface();

    // Act
    cache.resolve(img, 2172, 724, 1800, 600, true, false, out);
    cache.resolve(img, 2172, 724, 1920, 640, true, false, out);
    cache.resolve(img, 2172, 724, 1920, 640, true, true, out);
    const releasedBeforeClear = created.map((c) => c.released);
    cache.clear();

    // Assert
    expect(releasedBeforeClear).toEqual([true, true, false]);
    expect(created[2].released).toBe(true);
    expect(cache.size).toBe(0);
  });

  it("should evict the oldest entry FIFO when exceeding maxEntries", () => {
    // Arrange
    const { factory, created } = createFakeSurfaceFactory();
    const cache = new ParallaxSurfaceCache({ factory, maxEntries: 2 });
    const out = createResolvedParallaxSurface();
    const img1 = makeFakeImage("img1", 1024, 512);
    const img2 = makeFakeImage("img2", 1024, 512);
    const img3 = makeFakeImage("img3", 1024, 512);

    // Act
    cache.resolve(img1, 1024, 512, 800, 400, true, false, out);
    cache.resolve(img2, 1024, 512, 800, 400, true, false, out);
    cache.resolve(img3, 1024, 512, 800, 400, true, false, out);

    // Assert
    expect(cache.size).toBe(2);
    expect(created[0].released).toBe(true);
    expect(created[1].released).toBe(false);
    expect(created[2].released).toBe(false);
  });

  it("should fall back to the raw source when factory is missing or returns null", () => {
    // Arrange
    const cacheNoFactory = new ParallaxSurfaceCache();
    const cacheNullFactory = new ParallaxSurfaceCache({ factory: () => null });
    const img = makeFakeImage("raw", 2048, 768);
    const out = createResolvedParallaxSurface();

    // Act & Assert
    cacheNoFactory.resolve(img, 2048, 768, 1280, 720, true, false, out);
    expect(out.source).toBe(img);
    expect(out.width).toBe(2048);

    cacheNullFactory.resolve(img, 2048, 768, 1280, 720, true, false, out);
    expect(out.source).toBe(img);
    expect(out.height).toBe(768);
  });
});

describe("ParallaxSystem + Isolated Queue + Pre-scaled Surface Integration", () => {
  it("should pre-scale loaded textures once via injected queue and surfaceFactory across frames", async () => {
    // Arrange
    const farImg = makeFakeImage("far", 2050, 767);
    const midImg = makeFakeImage("var_b", 2172, 724);
    const textures: Record<string, HTMLImageElement> = {
      "fake://far.png": farImg,
      "fake://var_b.png": midImg,
    };
    const decoder: IParallaxTextureDecoder = {
      async loadAndDecode(url) {
        const tex = textures[url];
        if (!tex) return null;
        return { texture: tex, width: tex.naturalWidth, height: tex.naturalHeight, decodedBytes: 1024 };
      },
    };
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 2, fadeDurationMs: 0 });
    await queue.enqueueBatch([
      { cacheKey: "grand_bastion:far", url: "fake://far.png", priority: PARALLAX_LOAD_PRIORITY.FAR, fadeInOnReady: false },
      { cacheKey: "grand_bastion:var_b", url: "fake://var_b.png", priority: PARALLAX_LOAD_PRIORITY.LAYER, fadeInOnReady: false },
    ]);

    const registry: IParallaxRegistry = {
      resolve: (key) => {
        if (key === "grand_bastion:far") return { key, tier: "far", url: "fake://far.png" };
        if (key === "grand_bastion:var_b") return { key, tier: "mid", url: "fake://var_b.png" };
        return undefined;
      },
    };

    const { factory, created } = createFakeSurfaceFactory();
    const system = new ParallaxSystem({
      registry,
      loadQueue: queue,
      surfaceFactory: factory,
    });
    const location = makeLocationFixture([
      {
        id: "grand_bastion:far",
        name: "Far",
        tier: "far",
        layerKey: "grand_bastion:far",
        type: "image",
        depth: 0.08,
        scrollSpeedX: 0.04,
        scrollSpeedY: 0.02,
        opaque: true,
      },
      {
        id: "grand_bastion:var_b",
        name: "Mid",
        tier: "mid",
        layerKey: "grand_bastion:var_b",
        type: "image",
        depth: 0.45,
        scrollSpeedX: 0.36,
        scrollSpeedY: 0.12,
        mirrorTile: true,
      },
    ]);
    const ctx = createMockContext2D(1280, 672);

    // Act
    for (let frame = 0; frame < 5; frame++) {
      system.render(ctx, location, 4800, 1200, 1000, 525, frame * 60, 100, frame);
    }

    // Assert
    expect(created.length).toBe(2);
    expect(ctx.getSaveBalance()).toBe(0);
    expect(ctx.getDrawImageCalls().length).toBeGreaterThanOrEqual(10);

    system.clearCaches();
    expect(created.every((c) => c.released)).toBe(true);
  });

  it("should clip horizontal tiles strictly within the viewport bounds for mirrored and normal layers", () => {
    // Arrange
    const ctx = createMockContext2D(1000, 525);
    const img = makeFakeImage("tile", 2172, 724);

    // Act
    drawHorizontalTilesClipped(ctx, img, 2172, 724, -500, -150, 3584, 1195, 1000, 525, true);
    renderTiledDynamicLayer(
      ctx,
      {
        id: "mid",
        name: "Mid",
        tier: "mid",
        type: "image",
        depth: 0.45,
        scrollSpeedX: 0.36,
        scrollSpeedY: 0.12,
        mirrorTile: false,
      },
      "mid",
      img,
      1400,
      4200,
      0.5,
      0.5,
      1000,
      525,
      10
    );

    // Assert
    const calls = ctx.getDrawImageCalls();
    expect(calls.length).toBe(2);
    for (const call of calls) {
      expect(call.length).toBe(9);
      const dx = call[5] as number;
      const dy = call[6] as number;
      const dw = call[7] as number;
      const dh = call[8] as number;
      expect(dx).toBeGreaterThanOrEqual(0);
      expect(dy).toBeGreaterThanOrEqual(0);
      expect(dx + dw).toBeLessThanOrEqual(1000);
      expect(dy + dh).toBeLessThanOrEqual(525);
    }
    expect(ctx.getSaveBalance()).toBe(0);
  });
});
