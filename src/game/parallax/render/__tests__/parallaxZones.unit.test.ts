import { describe, expect, it } from "bun:test";
import type { LocationZoneSchema, ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import type { LocationDefinition } from "@game/locations/types";
import { ParallaxLoadQueue, PARALLAX_LOAD_PRIORITY, type IParallaxTextureDecoder } from "../../loading";
import type { ISectorAtmosphericRenderer } from "@game/renderer/background/atmospheric/atmosphericSectorRenderer";
import { ParallaxSystem } from "../ParallaxSystem";
import type { IParallaxLoader, IParallaxRegistry } from "../types";
import { createMockContext2D } from "@test-utils";

const NOOP_ATMOSPHERIC: ISectorAtmosphericRenderer = {
  renderSectorAtmosphere: () => {},
  renderProceduralFarBackdrop: () => {},
  clearCaches: () => {},
};

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

function makeLocation(zones: LocationZoneSchema[], layers?: ParallaxLayerSchema[]): LocationDefinition {
  return {
    id: "courtyard",
    worldId: "courtyard",
    nameKey: "locName",
    descriptionKey: "locDesc",
    openingNarrationKey: "locOpen",
    width: 4800,
    height: 1040,
    spawnPoint: { x: 140, y: 780 },
    p2SpawnOffset: { x: 46, y: 0 },
    theme: {
      bgGradientTop: "#2c1e33",
      bgGradientBottom: "#d97706",
      ambientParticle: "leaf",
      fogColor: "rgba(251, 191, 36, 0.08)",
      musicIntensity: 0.25,
    },
    zones,
    parallaxBackground: {
      boxWidth: 5400,
      boxHeight: 1160,
      layers: layers ?? [
        {
          id: "courtyard:far",
          name: "Far",
          tier: "far",
          layerKey: "courtyard:far",
          type: "image",
          depth: 0.08,
          scrollSpeedX: 0.04,
          scrollSpeedY: 0.02,
          opaque: true,
        },
        {
          id: "courtyard:var_b",
          name: "Mid",
          tier: "mid",
          layerKey: "courtyard:var_b",
          type: "image",
          depth: 0.45,
          scrollSpeedX: 0.36,
          scrollSpeedY: 0.12,
        },
        {
          id: "courtyard:var_d",
          name: "Close",
          tier: "close",
          layerKey: "courtyard:var_d",
          type: "image",
          depth: 0.86,
          scrollSpeedX: 0.78,
          scrollSpeedY: 0.24,
        },
      ],
    },
    createEntities: () => [],
    createEnemies: () => [],
  };
}

interface DrawSpyRecord {
  readonly tag: string;
  readonly alpha: number;
}

function installDrawSpy(ctx: ReturnType<typeof createMockContext2D>): DrawSpyRecord[] {
  const draws: DrawSpyRecord[] = [];
  const origDraw = ctx.drawImage.bind(ctx);
  ctx.drawImage = ((...args: unknown[]) => {
    const img = args[0] as { tag?: string };
    draws.push({ tag: img.tag ?? "unknown", alpha: ctx.globalAlpha });
    (origDraw as (...innerArgs: unknown[]) => void)(...args);
  }) as CanvasRenderingContext2D["drawImage"];
  return draws;
}

describe("Zone-Aware Parallax Rendering (VC-103)", () => {
  it("should crossfade the closest layer deterministically with injected now when entering and leaving a zone", async () => {
    // Arrange
    let fakeNow = 0;
    const images: Record<string, HTMLImageElement> = {
      "fake://far.png": makeFakeImage("far"),
      "fake://var_b.png": makeFakeImage("var_b"),
      "fake://var_d.png": makeFakeImage("var_d"),
      "fake://var_d_boss.png": makeFakeImage("var_d_boss"),
    };
    const decoder: IParallaxTextureDecoder = {
      async loadAndDecode(url) {
        const tex = images[url];
        if (!tex) return null;
        return { texture: tex, width: tex.width, height: tex.height, decodedBytes: tex.width * tex.height * 4 };
      },
    };
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 2, now: () => fakeNow, fadeDurationMs: 200 });
    await queue.enqueueBatch([
      { cacheKey: "courtyard:far", url: "fake://far.png", priority: PARALLAX_LOAD_PRIORITY.FAR, fadeInOnReady: false },
      { cacheKey: "courtyard:var_b", url: "fake://var_b.png", priority: PARALLAX_LOAD_PRIORITY.LAYER, fadeInOnReady: false },
      { cacheKey: "courtyard:var_d", url: "fake://var_d.png", priority: PARALLAX_LOAD_PRIORITY.LAYER, fadeInOnReady: false },
      { cacheKey: "courtyard:var_d@boss", url: "fake://var_d_boss.png", priority: PARALLAX_LOAD_PRIORITY.ZONE_VARIANT, fadeInOnReady: false },
    ]);

    const registry: IParallaxRegistry = {
      resolve: (key) => {
        if (key === "courtyard:far") return { key, tier: "far", url: "fake://far.png" };
        if (key === "courtyard:var_b") return { key, tier: "mid", url: "fake://var_b.png" };
        if (key === "courtyard:var_d") return { key, tier: "close", url: "fake://var_d.png" };
        if (key === "courtyard:var_d@boss") return { key, tier: "close", url: "fake://var_d_boss.png" };
        return undefined;
      },
    };

    const system = new ParallaxSystem({
      registry,
      loadQueue: queue,
      atmosphericRenderer: NOOP_ATMOSPHERIC,
      now: () => fakeNow,
      zoneCrossfadeDurationMs: 400,
    });
    const location = makeLocation([
      { id: "boss_arena", kind: "boss", scope: "stage", x: 2400, y: 200, width: 600, height: 600, featherPx: 200 },
    ]);

    const ctx = createMockContext2D();
    const draws = installDrawSpy(ctx);

    // 1. Frame at t=0, camera center at x=500 (outside zone)
    fakeNow = 0;
    system.render(ctx, location, 4800, 1040, 1000, 625, 0, 200, 1);
    expect(draws.map((d) => d.tag)).toEqual(["far", "var_b", "var_d"]);
    expect(system.getActiveZoneAlpha()).toBe(0);

    // 2. Frame at t=100, camera jumps inside boss zone (center x=2700, y=512.5)
    draws.length = 0;
    fakeNow = 100;
    system.render(ctx, location, 4800, 1040, 1000, 625, 2200, 200, 2);
    expect(system.getActiveZoneKind()).toBe("boss");
    expect(system.getActiveZoneAlpha()).toBe(0);

    // 3. Frame at t=300 (200ms of 400ms elapsed -> 50% crossfade)
    draws.length = 0;
    fakeNow = 300;
    system.render(ctx, location, 4800, 1040, 1000, 625, 2200, 200, 3);
    expect(system.getActiveZoneAlpha()).toBeCloseTo(0.5, 5);
    const midBase = draws.find((d) => d.tag === "var_d");
    const midVariant = draws.find((d) => d.tag === "var_d_boss");
    expect(midBase?.alpha).toBeCloseTo(0.5, 5);
    expect(midVariant?.alpha).toBeCloseTo(0.5, 5);

    // 4. Frame at t=500 (400ms elapsed -> 100% variant, zero base var_d overdraw)
    draws.length = 0;
    fakeNow = 500;
    system.render(ctx, location, 4800, 1040, 1000, 625, 2200, 200, 4);
    expect(system.getActiveZoneAlpha()).toBe(1);
    expect(draws.some((d) => d.tag === "var_d")).toBe(false);
    expect(draws.find((d) => d.tag === "var_d_boss")?.alpha).toBe(1);
    // Mid layer and opaque FAR remain unaffected
    expect(draws.find((d) => d.tag === "far")?.alpha).toBe(1);
    expect(draws.find((d) => d.tag === "var_b")?.alpha).toBe(1);
    expect(system.hasOpaqueFarBackdrop(location)).toBe(true);

    // 5. Leave zone at t=1000 -> t=1200 (mid-fade out) -> t=1400 (complete)
    fakeNow = 1000;
    system.render(ctx, location, 4800, 1040, 1000, 625, 0, 200, 5);
    expect(system.getActiveZoneAlpha()).toBe(1);

    draws.length = 0;
    fakeNow = 1200;
    system.render(ctx, location, 4800, 1040, 1000, 625, 0, 200, 6);
    expect(system.getActiveZoneAlpha()).toBeCloseTo(0.5, 5);
    expect(draws.find((d) => d.tag === "var_d")?.alpha).toBeCloseTo(0.5, 5);
    expect(draws.find((d) => d.tag === "var_d_boss")?.alpha).toBeCloseTo(0.5, 5);

    draws.length = 0;
    fakeNow = 1400;
    system.render(ctx, location, 4800, 1040, 1000, 625, 0, 200, 7);
    expect(system.getActiveZoneAlpha()).toBe(0);
    expect(system.getActiveZoneKind()).toBeNull();
    expect(draws.some((d) => d.tag === "var_d_boss")).toBe(false);
    expect(draws.find((d) => d.tag === "var_d")?.alpha).toBe(1);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("should crossfade directly between two zones without popping", async () => {
    // Arrange
    let fakeNow = 0;
    const loader: IParallaxLoader = {
      getTexture: (url) => {
        if (url === "fake://far.png") return makeFakeImage("far");
        if (url === "fake://var_d.png") return makeFakeImage("var_d");
        if (url === "fake://var_d_boss.png") return makeFakeImage("var_d_boss");
        if (url === "fake://var_d_rest.png") return makeFakeImage("var_d_rest");
        return null;
      },
      loadTexture: async () => null,
    };
    const registry: IParallaxRegistry = {
      resolve: (key) => {
        if (key === "courtyard:far") return { key, tier: "far", url: "fake://far.png" };
        if (key === "courtyard:var_d") return { key, tier: "close", url: "fake://var_d.png" };
        if (key === "courtyard:var_d@boss") return { key, tier: "close", url: "fake://var_d_boss.png" };
        if (key === "courtyard:var_d@rest") return { key, tier: "close", url: "fake://var_d_rest.png" };
        return undefined;
      },
    };
    const queue = new ParallaxLoadQueue({ now: () => fakeNow });
    const system = new ParallaxSystem({
      registry,
      loader,
      loadQueue: queue,
      atmosphericRenderer: NOOP_ATMOSPHERIC,
      now: () => fakeNow,
      zoneCrossfadeDurationMs: 400,
    });
    const location = makeLocation([
      { id: "rest_zone", kind: "rest", x: 400, y: 200, width: 400, height: 400, featherPx: 100 },
      { id: "boss_zone", kind: "boss", scope: "stage", x: 2400, y: 200, width: 400, height: 400, featherPx: 100 },
    ]);
    const ctx = createMockContext2D();
    const draws = installDrawSpy(ctx);

    // Spawn inside rest_zone
    system.render(ctx, location, 4800, 1040, 1000, 625, 100, 100, 1);
    expect(system.getActiveZoneKind()).toBe("rest");
    expect(system.getActiveZoneAlpha()).toBe(1);

    // Jump straight into boss_zone at t=100
    fakeNow = 100;
    system.render(ctx, location, 4800, 1040, 1000, 625, 2100, 100, 2);
    draws.length = 0;
    fakeNow = 300;
    system.render(ctx, location, 4800, 1040, 1000, 625, 2100, 100, 3);

    const restDraw = draws.find((d) => d.tag === "var_d_rest");
    const bossDraw = draws.find((d) => d.tag === "var_d_boss");
    expect(restDraw?.alpha).toBeCloseTo(0.5, 5);
    expect(bossDraw?.alpha).toBeCloseTo(0.5, 5);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("should enqueue zone variants on the isolated ParallaxLoadQueue only when near", async () => {
    // Arrange
    let fakeNow = 0;
    const decodeCalls: string[] = [];
    const farImg = makeFakeImage("far");
    const closeImg = makeFakeImage("var_d");
    const restImg = makeFakeImage("var_d_rest");
    const decoder: IParallaxTextureDecoder = {
      async loadAndDecode(url) {
        decodeCalls.push(url);
        const tex =
          url === "fake://far.png" ? farImg : url === "fake://var_d.png" ? closeImg : restImg;
        return { texture: tex, width: tex.width, height: tex.height, decodedBytes: tex.width * tex.height * 4 };
      },
    };
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 2, now: () => fakeNow });
    await queue.enqueueBatch([
      { cacheKey: "courtyard:far", url: "fake://far.png", priority: PARALLAX_LOAD_PRIORITY.FAR, fadeInOnReady: false },
      { cacheKey: "courtyard:var_d", url: "fake://var_d.png", priority: PARALLAX_LOAD_PRIORITY.LAYER, fadeInOnReady: false },
    ]);

    const registry: IParallaxRegistry = {
      resolve: (key) => {
        if (key === "courtyard:far") return { key, tier: "far", url: "fake://far.png" };
        if (key === "courtyard:var_d") return { key, tier: "close", url: "fake://var_d.png" };
        if (key === "courtyard:var_d@rest") return { key, tier: "close", url: "fake://var_d_rest.png" };
        return undefined;
      },
    };

    const system = new ParallaxSystem({
      registry,
      loadQueue: queue,
      now: () => fakeNow,
      zonePreloadMarginPx: 300,
    });
    const location = makeLocation([
      { id: "rest_zone", kind: "rest", x: 2000, y: 200, width: 400, height: 400, featherPx: 200 },
    ]);
    const ctx = createMockContext2D();

    // Act 1: Camera center at x=500 -> distance to x=2000 is 1500 > 500 -> NOT near
    system.render(ctx, location, 4800, 1040, 1000, 625, 0, 100, 1);
    await new Promise((r) => setTimeout(r, 0));
    expect(decodeCalls).not.toContain("fake://var_d_rest.png");

    // Act 2: Camera moves near (center at x=1600 -> dist=400 <= 200 + 300) -> enqueues once
    system.render(ctx, location, 4800, 1040, 1000, 625, 1100, 100, 2);
    system.render(ctx, location, 4800, 1040, 1000, 625, 1100, 100, 3);
    await new Promise((r) => setTimeout(r, 0));

    // Assert
    expect(decodeCalls.filter((u) => u === "fake://var_d_rest.png")).toHaveLength(1);
    expect(queue.getTexture("courtyard:var_d@rest")).toBe(restImg);
  });

  it("should fall back to base var_x and apply zone ambientColor tint when variant art is missing", async () => {
    // Arrange
    let fakeNow = 0;
    const farImg = makeFakeImage("far");
    const closeImg = makeFakeImage("var_d");
    const decoder: IParallaxTextureDecoder = {
      async loadAndDecode(url) {
        const tex = url === "fake://far.png" ? farImg : closeImg;
        return { texture: tex, width: tex.width, height: tex.height, decodedBytes: tex.width * tex.height * 4 };
      },
    };
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 2, now: () => fakeNow });
    await queue.enqueueBatch([
      { cacheKey: "courtyard:far", url: "fake://far.png", priority: PARALLAX_LOAD_PRIORITY.FAR, fadeInOnReady: false },
      { cacheKey: "courtyard:var_d", url: "fake://var_d.png", priority: PARALLAX_LOAD_PRIORITY.LAYER, fadeInOnReady: false },
    ]);
    const registry: IParallaxRegistry = {
      resolve: (key) => {
        if (key === "courtyard:far") return { key, tier: "far", url: "fake://far.png" };
        if (key === "courtyard:var_d") return { key, tier: "close", url: "fake://var_d.png" };
        // courtyard:var_d@rest is intentionally absent (no art yet)
        return undefined;
      },
    };

    const system = new ParallaxSystem({
      registry,
      loadQueue: queue,
      atmosphericRenderer: NOOP_ATMOSPHERIC,
      now: () => fakeNow,
      zoneCrossfadeDurationMs: 400,
    });
    const location = makeLocation([
      {
        id: "courtyard_sanctuary_rest",
        kind: "rest",
        x: 1200,
        y: 200,
        width: 400,
        height: 400,
        featherPx: 200,
        ambientColor: "rgba(56, 189, 248, 0.22)",
      },
    ]);
    const ctx = createMockContext2D();
    const draws = installDrawSpy(ctx);
    const fillAlphas: number[] = [];
    const origFillRect = ctx.fillRect.bind(ctx);
    ctx.fillRect = ((...args: Parameters<CanvasRenderingContext2D["fillRect"]>) => {
      if (ctx.fillStyle === "rgba(56, 189, 248, 0.22)") {
        fillAlphas.push(ctx.globalAlpha);
      }
      origFillRect(...args);
    }) as CanvasRenderingContext2D["fillRect"];

    // Act: start outside, jump inside rest zone at t=100, measure at t=300 (0.5) and t=500 (1.0)
    system.render(ctx, location, 4800, 1040, 1000, 625, 0, 100, 1);
    fakeNow = 100;
    system.render(ctx, location, 4800, 1040, 1000, 625, 900, 100, 2);

    draws.length = 0;
    fakeNow = 300;
    system.render(ctx, location, 4800, 1040, 1000, 625, 900, 100, 3);
    expect(draws.find((d) => d.tag === "var_d")?.alpha).toBe(1);
    expect(fillAlphas[fillAlphas.length - 1]).toBeCloseTo(0.5, 5);

    draws.length = 0;
    fakeNow = 500;
    system.render(ctx, location, 4800, 1040, 1000, 625, 900, 100, 4);
    expect(draws.find((d) => d.tag === "var_d")?.alpha).toBe(1);
    expect(fillAlphas[fillAlphas.length - 1]).toBeCloseTo(1, 5);
    expect(system.hasOpaqueFarBackdrop(location)).toBe(true);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("should perform zero gradient or queue allocations across 1,000 frames crossing zones", async () => {
    // Arrange
    let fakeNow = 0;
    const farImg = makeFakeImage("far");
    const closeImg = makeFakeImage("var_d");
    const bossImg = makeFakeImage("var_d_boss");
    const decoder: IParallaxTextureDecoder = {
      async loadAndDecode(url) {
        const tex =
          url === "fake://far.png" ? farImg : url === "fake://var_d.png" ? closeImg : bossImg;
        return { texture: tex, width: tex.width, height: tex.height, decodedBytes: tex.width * tex.height * 4 };
      },
    };
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 2, now: () => fakeNow });
    await queue.enqueueBatch([
      { cacheKey: "courtyard:far", url: "fake://far.png", priority: PARALLAX_LOAD_PRIORITY.FAR, fadeInOnReady: false },
      { cacheKey: "courtyard:var_d", url: "fake://var_d.png", priority: PARALLAX_LOAD_PRIORITY.LAYER, fadeInOnReady: false },
      { cacheKey: "courtyard:var_d@boss", url: "fake://var_d_boss.png", priority: PARALLAX_LOAD_PRIORITY.ZONE_VARIANT, fadeInOnReady: false },
    ]);

    const registry: IParallaxRegistry = {
      resolve: (key) => {
        if (key === "courtyard:far") return { key, tier: "far", url: "fake://far.png" };
        if (key === "courtyard:var_d") return { key, tier: "close", url: "fake://var_d.png" };
        if (key === "courtyard:var_d@boss") return { key, tier: "close", url: "fake://var_d_boss.png" };
        return undefined;
      },
    };

    let enqueueCalls = 0;
    const origEnqueue = queue.enqueue.bind(queue);
    queue.enqueue = (descriptor) => {
      enqueueCalls++;
      return origEnqueue(descriptor);
    };

    const system = new ParallaxSystem({
      registry,
      loadQueue: queue,
      now: () => fakeNow,
      zoneCrossfadeDurationMs: 400,
    });
    const location = makeLocation([
      { id: "rest_zone", kind: "rest", x: 900, y: 200, width: 400, height: 400, featherPx: 260, ambientColor: "rgba(56, 189, 248, 0.2)" },
      { id: "boss_zone", kind: "boss", scope: "stage", x: 2400, y: 200, width: 500, height: 400, featherPx: 260 },
    ]);
    const ctx = createMockContext2D();

    // Warm up frame 1
    system.render(ctx, location, 4800, 1040, 1000, 625, 0, 100, 1);
    const gradsAfterWarmup = ctx.getTotalGradientCount();
    const enqueueAfterWarmup = enqueueCalls;

    // Act: sweep across rest zone, mid-gap, and boss zone for 1,000 frames
    for (let frame = 2; frame <= 1000; frame++) {
      fakeNow += 16;
      const camX = (frame * 4) % 3400;
      system.render(ctx, location, 4800, 1040, 1000, 625, camX, 100, frame);
    }

    // Assert
    expect(ctx.getTotalGradientCount()).toBe(gradsAfterWarmup);
    expect(enqueueCalls).toBe(enqueueAfterWarmup);
    expect(ctx.getSaveBalance()).toBe(0);
    expect(system.hasOpaqueFarBackdrop(location)).toBe(true);
  });
});
