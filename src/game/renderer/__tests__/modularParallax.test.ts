import { describe, it, expect } from "bun:test";
import { ParallaxRenderer } from "../parallaxRenderer";
import { CelestialRenderer, defaultCelestialRenderer } from "../parallax/celestialRenderer";
import { CastleSilhouetteRenderer, defaultCastleSilhouetteRenderer } from "../parallax/castleSilhouetteRenderer";
import { MountainRidgeRenderer, defaultMountainRidgeRenderer } from "../parallax/mountainRidgeRenderer";
import { AtmosphericFogRenderer, defaultAtmosphericFogRenderer } from "../parallax/atmosphericFogRenderer";
import { SceneryScaffoldRenderer, defaultSceneryScaffoldRenderer } from "../parallax/sceneryScaffoldRenderer";
import { LocationDefinition } from "@game/locations/types";
import { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import { createMockContext2D as createMockContext } from "@test-utils";

const mockLocation: LocationDefinition = {
  id: "test_sanctuary",
  name: "Test Sanctuary",
  dimensions: { width: 3000, height: 1000 },
  theme: {
    bgGradientTop: "#111827",
    bgGradientBottom: "#030712",
    primaryColor: "#38bdf8",
    secondaryColor: "#6366f1",
    accentColor: "#f59e0b",
    platformColor: "#475569",
    fogColor: "rgba(56, 189, 248, 0.1)",
  },
  parallaxBackground: {
    boxWidth: 4000,
    boxHeight: 1200,
    layers: [
      {
        id: "sky_layer",
        name: "Sky",
        type: "sky_gradient",
        depth: 0.01,
        scrollSpeedX: 0.0,
        scrollSpeedY: 0.02,
      },
      {
        id: "sun_layer",
        name: "Celestial Sun",
        type: "celestial",
        depth: 0.05,
        scrollSpeedX: 0.05,
        scrollSpeedY: 0.05,
        elements: [
          { type: "circle", x: 2000, y: 300, radius: 40, color: "#fbbf24" },
        ],
      },
      {
        id: "castle_distant",
        name: "Castle Spire",
        type: "castle_silhouettes",
        depth: 0.15,
        scrollSpeedX: 0.15,
        scrollSpeedY: 0.1,
      },
      {
        id: "mountains",
        name: "Mountain Crags",
        type: "mountain_ridges",
        depth: 0.3,
        scrollSpeedX: 0.3,
        scrollSpeedY: 0.15,
      },
      {
        id: "scenery",
        name: "Scenery",
        type: "scenery_trees",
        depth: 0.45,
        scrollSpeedX: 0.45,
        scrollSpeedY: 0.2,
      },
      {
        id: "fog",
        name: "Atmospheric Fog",
        type: "fog_overlay",
        depth: 0.6,
        scrollSpeedX: 0.0,
        scrollSpeedY: 0.05,
        autoDriftX: 0.5,
      },
    ],
  },
} as unknown as LocationDefinition;

describe("Modular Parallax Subsystems", () => {
  describe("ParallaxRenderer Orchestrator Delegation & DIP", () => {
    it("renders complete parallax background without crashing and preserves save/restore balance", () => {
      const ctx = createMockContext();
      const parallax = new ParallaxRenderer();

      parallax.render(ctx, mockLocation, 3000, 1000, 1000, 625, 500, 200, 120);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("allows injecting mock sub-renderers via dependency injection (DIP)", () => {
      let celestialCalled = false;
      let castleCalled = false;
      let mountainCalled = false;
      let fogCalled = false;

      const mockCelestial = {
        render: () => {
          celestialCalled = true;
        },
      };
      const mockCastle = {
        render: () => {
          castleCalled = true;
        },
        drawNeedleSpire: () => { },
      };
      const mockMountain = {
        render: () => {
          mountainCalled = true;
        },
      };
      const mockFog = {
        renderSkyGradient: () => { },
        renderFogOverlay: () => {
          fogCalled = true;
        },
      };

      const parallax = new ParallaxRenderer({
        celestialRenderer: mockCelestial as any,
        castleSilhouetteRenderer: mockCastle as any,
        mountainRidgeRenderer: mockMountain as any,
        atmosphericFogRenderer: mockFog as any,
      });

      const ctx = createMockContext();
      parallax.render(ctx, mockLocation, 3000, 1000, 1000, 625, 100, 100, 1);

      expect(celestialCalled).toBe(true);
      expect(castleCalled).toBe(true);
      expect(mountainCalled).toBe(true);
      expect(fogCalled).toBe(true);
    });
  });

  describe("CelestialRenderer", () => {
    it("renders celestial circle and caches gradient across frames", () => {
      const ctx = createMockContext();
      const celestial = new CelestialRenderer();
      const layer: ParallaxLayerSchema = {
        id: "celestial_test",
        name: "Test Moon",
        type: "celestial",
        depth: 0.1,
        scrollSpeedX: 0.05,
        scrollSpeedY: 0.05,
        elements: [{ type: "circle", x: 500, y: 200, radius: 30, color: "#38bdf8" }],
      };

      // Frame 1 creates gradient
      celestial.render(ctx, layer, 1000, 625, 0, 0, 0.5, 0.5, 0, 0, 0, 0, 1000, 625, 1);
      const gradsFrame1 = ctx.getRadialGradientCount();
      expect(gradsFrame1).toBe(1);
      expect(ctx.getSaveBalance()).toBe(0);

      // Frame 2 uses cached gradient
      celestial.render(ctx, layer, 1000, 625, 0, 0, 0.5, 0.5, 0, 0, 0, 0, 1000, 625, 2);
      expect(ctx.getRadialGradientCount()).toBe(gradsFrame1);
      expect(ctx.getSaveBalance()).toBe(0);
    });
  });

  describe("CastleSilhouetteRenderer", () => {
    it("renders needle spires for distant layers and fortress bastions for mid layers", () => {
      const ctx = createMockContext();
      const castle = defaultCastleSilhouetteRenderer;

      const distantLayer: ParallaxLayerSchema = {
        id: "distant_castle",
        name: "Distant Spires",
        type: "castle_silhouettes",
        depth: 0.1,
        scrollSpeedX: 0.1,
        scrollSpeedY: 0.05,
      };

      castle.render(ctx, mockLocation, distantLayer, 2000, 800, 1000, 200, 0.2, 0.3, 1000, 625, 60);
      expect(ctx.getSaveBalance()).toBe(0);

      const midLayer: ParallaxLayerSchema = {
        id: "mid_castle",
        name: "Mid Fortress",
        type: "castle_silhouettes",
        depth: 0.3,
        scrollSpeedX: 0.3,
        scrollSpeedY: 0.1,
      };

      castle.render(ctx, mockLocation, midLayer, 2000, 800, 1000, 200, 0.4, 0.5, 1000, 625, 60);
      expect(ctx.getSaveBalance()).toBe(0);
    });
  });

  describe("MountainRidgeRenderer", () => {
    it("draws jagged polygons and crest rim highlights", () => {
      const ctx = createMockContext();
      const mountain = defaultMountainRidgeRenderer;
      const layer: ParallaxLayerSchema = {
        id: "ridge_test",
        name: "Mountain Ridge",
        type: "mountain_ridges",
        depth: 0.25,
        scrollSpeedX: 0.25,
        scrollSpeedY: 0.1,
      };

      mountain.render(ctx, mockLocation, layer, 3000, 1000, 2000, 400, 0.3, 0.4, 1000, 625);
      expect(ctx.getSaveBalance()).toBe(0);
    });
  });

  describe("AtmosphericFogRenderer", () => {
    it("renders twinkling starfield and smooth mist ribbon", () => {
      const ctx = createMockContext();
      const fog = defaultAtmosphericFogRenderer;
      const skyLayer: ParallaxLayerSchema = {
        id: "sky",
        name: "Sky",
        type: "sky_gradient",
        depth: 0.01,
        scrollSpeedX: 0,
        scrollSpeedY: 0.02,
      };

      fog.renderSkyGradient(ctx, mockLocation, skyLayer, 1000, 625, 0.5, 60);
      expect(ctx.getSaveBalance()).toBe(0);

      const fogLayer: ParallaxLayerSchema = {
        id: "fog",
        name: "Fog",
        type: "fog_overlay",
        depth: 0.5,
        scrollSpeedX: 0,
        scrollSpeedY: 0.05,
      };

      fog.renderFogOverlay(ctx, fogLayer, 1000, 625, 0.5, 10, 60);
      expect(ctx.getSaveBalance()).toBe(0);
    });
  });

  describe("SceneryScaffoldRenderer", () => {
    it("renders trees, clockwork gears, and custom geometric shapes", () => {
      const ctx = createMockContext();
      const scenery = defaultSceneryScaffoldRenderer;

      const treeLayer: ParallaxLayerSchema = {
        id: "scenery_trees",
        name: "Trees",
        type: "scenery_trees",
        depth: 0.4,
        scrollSpeedX: 0.4,
        scrollSpeedY: 0.2,
      };

      scenery.renderScenery(ctx, mockLocation, treeLayer, 2000, 800, 1000, 200, 0.5, 0.5, 1000, 625, 30);
      expect(ctx.getSaveBalance()).toBe(0);

      const customShapesLayer: ParallaxLayerSchema = {
        id: "shapes",
        name: "Shapes",
        type: "custom_shapes",
        depth: 0.4,
        scrollSpeedX: 0.4,
        scrollSpeedY: 0.2,
        elements: [
          { type: "rect", x: 100, y: 200, width: 50, height: 80, color: "#1e293b" },
          { type: "circle", x: 300, y: 150, radius: 25, color: "#334155" },
          { type: "castle_tower", x: 500, y: 100, width: 70, height: 220, color: "#0f172a" },
          { type: "pillar", x: 700, y: 250, width: 20, height: 150, color: "#1e293b" },
          { type: "tree", x: 850, y: 300, color: "#064e3b" },
        ],
      };

      scenery.renderCustomShapes(ctx, customShapesLayer, 2000, 800, 1000, 200, 0.5, 0.5, 0, 0, 1000, 625);
      expect(ctx.getSaveBalance()).toBe(0);
    });
  });
});
