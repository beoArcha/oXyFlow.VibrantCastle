import { describe, it, expect } from "bun:test";
import { SceneryScaffoldRenderer } from "@game/parallax/render/placeholder/sceneryScaffoldRenderer";
import { ProceduralBackdropCache } from "../proceduralBackdropCache";
import { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import { LocationDefinition } from "@game/locations/types";

function createMockContext() {
  let saveCalls = 0;
  let restoreCalls = 0;
  const fillRectCalls: Array<{ x: number; y: number; w: number; h: number }> = [];

  const ctx = {
    canvas: { width: 1000, height: 625 },
    save: () => {
      saveCalls++;
    },
    restore: () => {
      restoreCalls++;
    },
    translate: () => {},
    rotate: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    arc: () => {},
    rect: () => {},
    fillRect: (x: number, y: number, w: number, h: number) => {
      fillRectCalls.push({ x, y, w, h });
    },
    strokeRect: () => {},
    fill: () => {},
    stroke: () => {},
    drawImage: () => {},
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    globalAlpha: 1.0,
    getSaveBalance: () => saveCalls - restoreCalls,
    getFillRectCalls: () => fillRectCalls,
  };
  return ctx as unknown as CanvasRenderingContext2D & { getSaveBalance: () => number };
}

describe("Parallax Scenery & Backdrop Subsystems", () => {

  describe("SceneryScaffoldRenderer Thematic Geometry", () => {
    it("renders Clocktower mechanical shaft and rotating gears", () => {
      const scenery = new SceneryScaffoldRenderer();
      const ctx = createMockContext();
      const loc = { id: "clocktower", theme: {} } as LocationDefinition;
      const layer: ParallaxLayerSchema = {
        id: "scenery_tower",
        name: "Gears",
        type: "scenery_trees",
        depth: 0.3,
        scrollSpeedX: 0.3,
        scrollSpeedY: 0.1,
      };

      scenery.renderScenery(ctx, loc, layer, 2000, 800, 1000, 200, 0.3, 0.4, 1000, 625, 60);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("renders Aether Sanctuary floating aqueducts", () => {
      const scenery = new SceneryScaffoldRenderer();
      const ctx = createMockContext();
      const loc = { id: "aether_sanctuary", theme: {} } as LocationDefinition;
      const layer: ParallaxLayerSchema = {
        id: "scenery_aether",
        name: "Aqueduct",
        type: "scenery_trees",
        depth: 0.3,
        scrollSpeedX: 0.3,
        scrollSpeedY: 0.1,
      };

      scenery.renderScenery(ctx, loc, layer, 2000, 800, 1000, 200, 0.3, 0.4, 1000, 625, 60);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("renders Thorn Chasm brambles and sharp thorn spikes", () => {
      const scenery = new SceneryScaffoldRenderer();
      const ctx = createMockContext();
      const loc = { id: "thorn_chasm", theme: {} } as LocationDefinition;
      const layer: ParallaxLayerSchema = {
        id: "scenery_chasm",
        name: "Brambles",
        type: "scenery_trees",
        depth: 0.3,
        scrollSpeedX: 0.3,
        scrollSpeedY: 0.1,
      };

      scenery.renderScenery(ctx, loc, layer, 2000, 800, 1000, 200, 0.3, 0.4, 1000, 625, 60);
      expect(ctx.getSaveBalance()).toBe(0);
    });
  });

  describe("ProceduralBackdropCache", () => {
    it("handles renderSky, renderCastles, and renderTree safely", () => {
      const cache = new ProceduralBackdropCache();
      const ctx = createMockContext();

      cache.renderSky(ctx, 1000, 625, 100);
      cache.renderCastles(ctx, 1000, 100);
      cache.renderTree(ctx, 200, 300);
      cache.resize(1200, 700);

      expect(ctx.getSaveBalance()).toBe(0);
    });
  });
});
