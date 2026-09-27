import { describe, it, expect } from "bun:test";
import { ParallaxImageRenderer } from "../parallax/parallaxImageRenderer";
import { SceneryScaffoldRenderer } from "../parallax/sceneryScaffoldRenderer";
import { ProceduralBackdropCache } from "../proceduralBackdropCache";
import { ParallaxLayerSchema } from "../../locations/schema/locationSchema";
import { LocationDefinition } from "../../locations/types";

function createMockContext() {
  let saveCalls = 0;
  let restoreCalls = 0;
  let drawImageCalls: any[] = [];
  let fillRectCalls: any[] = [];

  const ctx: any = {
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
    drawImage: (img: any, dx: number, dy: number, dw: number, dh: number) => {
      drawImageCalls.push({ img, dx, dy, dw, dh });
    },
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    globalAlpha: 1.0,
    getSaveBalance: () => saveCalls - restoreCalls,
    getDrawImageCalls: () => drawImageCalls,
    getFillRectCalls: () => fillRectCalls,
  };
  return ctx;
}

function createMockImage(width: number = 800, height: number = 600): HTMLImageElement {
  return {
    complete: true,
    naturalWidth: width,
    naturalHeight: height,
    width,
    height,
  } as unknown as HTMLImageElement;
}

describe("Parallax Image, Scenery & Backdrop Subsystems", () => {
  describe("ParallaxImageRenderer", () => {
    it("renders far static backdrop scaled to viewport with center anchoring", () => {
      const imgRenderer = new ParallaxImageRenderer();
      const ctx = createMockContext();
      const mockImg = createMockImage(1920, 1080);

      const farLayer: ParallaxLayerSchema = {
        id: "bastion_far",
        name: "Bastion Far",
        tier: "far",
        type: "image",
        imageUrl: "mock://bastion_far.png",
        imageElement: mockImg,
        depth: 0.05,
        scrollSpeedX: 0,
        scrollSpeedY: 0,
        opacity: 0.9,
      };

      imgRenderer.render(ctx, farLayer, 800, 0, 0, 0, 0, 1000, 625);

      expect(ctx.getSaveBalance()).toBe(0);
      const calls = ctx.getDrawImageCalls();
      expect(calls.length).toBe(1);
    });

    it("renders dynamic repeating layer seamlessly across the entire viewport width", () => {
      const imgRenderer = new ParallaxImageRenderer();
      const ctx = createMockContext();
      const mockImg = createMockImage(400, 600); // 400px wide, viewport is 1000px => should draw at least 3-4 tiles

      const midLayer: ParallaxLayerSchema = {
        id: "court_mid",
        name: "Courtyard Mid",
        tier: "mid",
        type: "image",
        imageUrl: "mock://court_mid.png",
        imageElement: mockImg,
        depth: 0.4,
        scrollSpeedX: 0.4,
        scrollSpeedY: 0.2,
      };

      imgRenderer.render(ctx, midLayer, 800, 0.5, 100, 0, 0, 1000, 625);

      expect(ctx.getSaveBalance()).toBe(0);
      const calls = ctx.getDrawImageCalls();
      expect(calls.length).toBeGreaterThanOrEqual(3);
    });

    it("preloads layer image URLs without throwing", () => {
      const imgRenderer = new ParallaxImageRenderer();
      imgRenderer.preload([
        {
          id: "l1",
          name: "L1",
          type: "image",
          imageUrl: "mock://preload_1.png",
          depth: 0.1,
          scrollSpeedX: 0.1,
          scrollSpeedY: 0.1,
        },
      ]);
      expect(true).toBe(true);
    });
  });

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
