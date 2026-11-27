import { describe, it, expect } from "bun:test";
import { ParallaxSystem } from "../ParallaxSystem";
import { ParallaxBackdropRenderer } from "../ParallaxBackdropRenderer";
import type { IParallaxLoader, IParallaxRegistry } from "../types";
import {
  AtmosphericSectorRenderer,
  type ISectorAtmosphericRenderer,
} from "@game/renderer/background/atmospheric/atmosphericSectorRenderer";
import { GameRenderer } from "@game/renderer/renderer";
import { CameraState } from "@game/engine/cameraManager";
import type { LocationDefinition } from "@game/locations/types";
import type { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import { getLocation } from "@game/locations";
import { createMockCanvas, createMockContext2D } from "@test-utils";

function makeFakeImage(width = 2048, height = 768): HTMLImageElement {
  return {
    complete: true,
    naturalWidth: width,
    naturalHeight: height,
    width,
    height,
  } as unknown as HTMLImageElement;
}

function makeLocationFixture(overrides: Partial<LocationDefinition> = {}): LocationDefinition {
  return {
    id: "courtyard_m2",
    worldId: "courtyard",
    stageNumber: 2,
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
    createEntities: () => [],
    createEnemies: () => [],
    ...overrides,
  };
}

function makeFarLayer(overrides: Partial<ParallaxLayerSchema> = {}): ParallaxLayerSchema {
  return {
    id: "bg_far",
    name: "Far Sky",
    tier: "far",
    layerKey: "world:courtyard:far",
    type: "image",
    depth: 0.08,
    scrollSpeedX: 0.04,
    scrollSpeedY: 0.02,
    opaque: true,
    ...overrides,
  };
}

describe("Parallax Render Hygiene (VC-102b)", () => {
  describe("Allocation Spy Over 1,000 Frames & Cached Identity", () => {
    it("should create zero new gradient objects across 1,000 frames after warm-up in ParallaxSystem", () => {
      // Arrange
      const ctx = createMockContext2D();
      let linearCalls = 0;
      let radialCalls = 0;
      const origLinear = ctx.createLinearGradient;
      const origRadial = ctx.createRadialGradient;
      ctx.createLinearGradient = (...args: Parameters<CanvasRenderingContext2D["createLinearGradient"]>) => {
        linearCalls++;
        return origLinear(...args);
      };
      ctx.createRadialGradient = (...args: Parameters<CanvasRenderingContext2D["createRadialGradient"]>) => {
        radialCalls++;
        return origRadial(...args);
      };

      const system = new ParallaxSystem();
      const location = getLocation("aether_sanctuary");

      // Act
      system.render(ctx, location, 3000, 1000, 1280, 720, 0, 0, 1);
      const warmupLinear = linearCalls;
      const warmupRadial = radialCalls;

      for (let frame = 2; frame <= 1000; frame++) {
        system.render(ctx, location, 3000, 1000, 1280, 720, frame % 400, 0, frame);
      }

      // Assert
      expect(warmupLinear + warmupRadial).toBeGreaterThan(0);
      expect(linearCalls).toBe(warmupLinear);
      expect(radialCalls).toBe(warmupRadial);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("should return cached gradient objects by identity from AtmosphericSectorRenderer helpers", () => {
      // Arrange
      const ctx = createMockContext2D();
      const atmospheric = new AtmosphericSectorRenderer();
      const linearStops: readonly (readonly [number, string])[] = [
        [0, "#111111"],
        [1, "#000000"],
      ];
      const radialStops: readonly (readonly [number, string])[] = [
        [0, "#ff0000"],
        [1, "rgba(0,0,0,0)"],
      ];

      // Act
      const lin1 = atmospheric.getOrCreateLinearGradient(ctx, "lin_id", 0, 0, 0, 720, linearStops);
      const lin2 = atmospheric.getOrCreateLinearGradient(ctx, "lin_id", 0, 0, 0, 720, linearStops);
      const rad1 = atmospheric.getOrCreateRadialGradient(ctx, "rad_id", 640, 360, 20, 640, 360, 500, radialStops);
      const rad2 = atmospheric.getOrCreateRadialGradient(ctx, "rad_id", 640, 360, 20, 640, 360, 500, radialStops);

      // Assert
      expect(lin1).toBe(lin2);
      expect(rad1).toBe(rad2);
      expect(ctx.getLinearGradientCount()).toBe(1);
      expect(ctx.getRadialGradientCount()).toBe(1);
    });

    it("should return cached gradient objects by identity from ParallaxBackdropRenderer and evict past bounded limit", () => {
      // Arrange
      const ctx = createMockContext2D();
      const atmospheric = new AtmosphericSectorRenderer();
      const backdrop = new ParallaxBackdropRenderer(() => null, atmospheric);
      const stops: readonly (readonly [number, string])[] = [
        [0, "#222222"],
        [1, "#000000"],
      ];

      // Act
      const g1 = backdrop.getOrCreateLinearGradient(ctx, "k0", 0, 0, 0, 720, stops);
      const g1Again = backdrop.getOrCreateLinearGradient(ctx, "k0", 0, 0, 0, 720, stops);
      for (let i = 1; i <= 40; i++) {
        backdrop.getOrCreateLinearGradient(ctx, `k${i}`, 0, 0, 0, 720, stops);
      }
      const g1AfterEviction = backdrop.getOrCreateLinearGradient(ctx, "k0", 0, 0, 0, 720, stops);

      // Assert
      expect(g1).toBe(g1Again);
      expect(g1AfterEviction).not.toBe(g1);
    });
  });

  describe("Opaque Far Layer & Overdraw Skipping", () => {
    it("should skip under-far gradient fill and clamp far alpha to 1 when far layer is drawn and opaque", () => {
      // Arrange
      const ctx = createMockContext2D();
      const farImg = makeFakeImage();
      const backdrop = new ParallaxBackdropRenderer(() => farImg, new AtmosphericSectorRenderer());
      const farLayer = makeFarLayer({ opaque: true, opacity: 0.25 });
      const location = makeLocationFixture({
        parallaxBackground: { boxWidth: 5400, boxHeight: 1160, layers: [farLayer] },
      });

      // Act
      backdrop.renderFarStaticBackdrop(ctx, location, [farLayer], 1280, 720, 0.2, 0.1, 5);

      // Assert
      expect(ctx.getLinearGradientCount()).toBe(0);
      expect(ctx.getFillRectCalls().length).toBe(0);
      expect(ctx.getDrawImageCalls().length).toBe(1);
      expect(ctx.globalAlpha).toBe(1);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("should draw under-far gradient fill and honour opacity when far layer is not opaque", () => {
      // Arrange
      const ctx = createMockContext2D();
      const farImg = makeFakeImage();
      let recordedAlpha = -1;
      const origDrawImage = ctx.drawImage.bind(ctx);
      ctx.drawImage = ((...args: unknown[]) => {
        recordedAlpha = ctx.globalAlpha;
        (origDrawImage as (...innerArgs: unknown[]) => void)(...args);
      }) as CanvasRenderingContext2D["drawImage"];
      const backdrop = new ParallaxBackdropRenderer(() => farImg, new AtmosphericSectorRenderer());
      const farLayer = makeFarLayer({ opaque: false, opacity: 0.65 });
      const location = makeLocationFixture({
        parallaxBackground: { boxWidth: 5400, boxHeight: 1160, layers: [farLayer] },
      });

      // Act
      backdrop.renderFarStaticBackdrop(ctx, location, [farLayer], 1280, 720, 0.2, 0.1, 5);

      // Assert
      expect(ctx.getLinearGradientCount()).toBe(1);
      expect(ctx.getFillRectCalls().length).toBe(1);
      expect(recordedAlpha).toBeCloseTo(0.65, 4);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("should skip canvas clear/fill in GameRenderer when far layer is drawn and opaque without shake", () => {
      // Arrange
      const { canvas, ctx } = createMockCanvas(1280, 720);
      const farImg = makeFakeImage();
      const fakeRegistry: IParallaxRegistry = {
        resolve: (key) => (key === "world:courtyard:far" ? { key, tier: "far", url: "fake://far.png" } : undefined),
      };
      const fakeLoader: IParallaxLoader = {
        getTexture: (url) => (url === "fake://far.png" ? farImg : null),
        loadTexture: async () => null,
        isTextureLoaded: (url) => url === "fake://far.png",
      };
      const parallaxSystem = new ParallaxSystem({ registry: fakeRegistry, loader: fakeLoader });
      const renderer = new GameRenderer(canvas, { parallaxSystem }, { hardwareAcceleration: true });
      const farLayer = makeFarLayer({ opaque: true });
      const location = makeLocationFixture({
        id: "courtyard",
        parallaxBackground: { boxWidth: 5400, boxHeight: 1160, layers: [farLayer] },
      });
      const camera: CameraState = { x: 0, y: 0, shakeOffsetX: 0, shakeOffsetY: 0 };

      // Act
      renderer.render([], [], [], [], [], camera, 4800, 1040, location, "en", 10);

      // Assert
      expect(ctx.getClearRectCalls().length).toBe(0);
      expect(ctx.getFillRectCalls().length).toBe(1); // Only the courtyard sector atmosphere overlay, zero canvas clear or under-far fill.
      expect(ctx.getDrawImageCalls().length).toBe(1);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("should still fill canvas in GameRenderer when camera shake is active even if far layer is opaque", () => {
      // Arrange
      const { canvas, ctx } = createMockCanvas(1280, 720);
      const farImg = makeFakeImage();
      const fakeLoader: IParallaxLoader = {
        getTexture: () => farImg,
        loadTexture: async () => null,
      };
      const parallaxSystem = new ParallaxSystem({ loader: fakeLoader });
      const renderer = new GameRenderer(canvas, { parallaxSystem }, { hardwareAcceleration: true });
      const farLayer = makeFarLayer({ opaque: true, imageUrl: "fake://far.png" });
      const location = makeLocationFixture({
        id: "courtyard",
        parallaxBackground: { boxWidth: 5400, boxHeight: 1160, layers: [farLayer] },
      });
      const camera: CameraState = { x: 0, y: 0, shakeOffsetX: 4, shakeOffsetY: -2 };

      // Act
      renderer.render([], [], [], [], [], camera, 4800, 1040, location, "en", 10);

      // Assert
      expect(ctx.getFillRectCalls().length).toBe(2); // 1 canvas clear fill + 1 courtyard sector atmosphere fill.
      expect(ctx.getSaveBalance()).toBe(0);
    });
  });

  describe("World-Keyed Atmosphere (courtyard_m2 fixture)", () => {
    it("should pass worldId instead of location id to atmospheric renderer for courtyard_m2", () => {
      // Arrange
      const seenWorldIds: string[] = [];
      const spyAtmospheric: ISectorAtmosphericRenderer = {
        renderSectorAtmosphere: (_ctx, worldId) => {
          seenWorldIds.push(worldId);
        },
        renderProceduralFarBackdrop: () => {},
        clearCaches: () => {},
      };
      const system = new ParallaxSystem({ atmosphericRenderer: spyAtmospheric });
      const courtyardM2 = makeLocationFixture({
        id: "courtyard_m2",
        worldId: "courtyard",
        parallaxBackground: {
          boxWidth: 5400,
          boxHeight: 1160,
          layers: [makeFarLayer()],
        },
      });
      const ctx = createMockContext2D();

      // Act
      const supported = system.isSupported(courtyardM2);
      system.render(ctx, courtyardM2, 4800, 1040, 1280, 720, 0, 0, 1);

      // Assert
      expect(supported).toBe(true);
      expect(seenWorldIds).toEqual(["courtyard"]);
    });

    it("should render courtyard autumn haze and procedural theme for courtyard_m2 via worldId", () => {
      // Arrange
      const ctxM2 = createMockContext2D();
      const ctxBase = createMockContext2D();
      const systemM2 = new ParallaxSystem({ atmosphericRenderer: new AtmosphericSectorRenderer() });
      const systemBase = new ParallaxSystem({ atmosphericRenderer: new AtmosphericSectorRenderer() });
      const baseCourtyard = makeLocationFixture({ id: "courtyard", worldId: "courtyard" });
      const courtyardM2 = makeLocationFixture({
        id: "courtyard_m2",
        worldId: "courtyard",
        parallaxBackground: {
          boxWidth: 5400,
          boxHeight: 1160,
          layers: [makeFarLayer()],
        },
      });
      baseCourtyard.parallaxBackground = courtyardM2.parallaxBackground;

      // Act
      systemM2.render(ctxM2, courtyardM2, 4800, 1040, 1280, 720, 0, 0, 25);
      systemBase.render(ctxBase, baseCourtyard, 4800, 1040, 1280, 720, 0, 0, 25);

      // Assert
      expect(ctxM2.getLinearGradientCount()).toBe(ctxBase.getLinearGradientCount());
      expect(ctxM2.getRadialGradientCount()).toBe(ctxBase.getRadialGradientCount());
      expect(ctxM2.getFillRectCalls()).toEqual(ctxBase.getFillRectCalls());
      expect(ctxM2.getSaveBalance()).toBe(0);
    });
  });
});
