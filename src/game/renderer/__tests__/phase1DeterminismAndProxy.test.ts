import { describe, it, expect, beforeEach } from "bun:test";
import { GameRenderer } from "../renderer";
import { ParallaxRenderer } from "../parallaxRenderer";
import { StructureRenderer, defaultStructureRenderer } from "../structureRenderer";
import { LevelEntityRenderer, defaultLevelEntityRenderer } from "../levelEntityRenderer";
import { Entity, CollisionType } from "../../types";
import { CameraState } from "../../engine/cameraManager";
import { ParallaxLayerSchema } from "../../locations/schema/locationSchema";
import gameEngine from "../../loop/engine";

function createLightMockCanvas(): HTMLCanvasElement {
  return {
    getContext: () => ({
      imageSmoothingEnabled: false,
      save: () => {},
      restore: () => {},
      scale: () => {},
      translate: () => {},
      clearRect: () => {},
      fillRect: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      ellipse: () => {},
      fill: () => {},
      stroke: () => {},
      drawImage: () => {},
      fillText: () => {},
      measureText: () => ({ width: 40 }),
      roundRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
    }),
    width: 1000,
    height: 625,
  } as unknown as HTMLCanvasElement;
}

describe("Phase 1: Renderer Determinism, Schema Immutability & Proxy Elimination", () => {
  let mockCanvas: HTMLCanvasElement;
  let mockCamera: CameraState;

  beforeEach(() => {
    mockCanvas = createLightMockCanvas();
    mockCamera = {
      x: 0,
      y: 0,
      shakeOffsetX: 0,
      shakeOffsetY: 0,
    };
  });

  describe("1. Deterministic Tick Parameter & Decoupled Animation Time", () => {
    it("sets currentTickCount deterministically to the passed tickCount parameter", () => {
      const renderer = new GameRenderer(mockCanvas);
      expect(renderer.currentTickCount).toBe(0);

      // Render with explicit tickCount = 42
      renderer.render([], [], [], [], [], mockCamera, 2000, 1000, "high", undefined, "en", 42);
      expect(renderer.currentTickCount).toBe(42);

      // Render again with tickCount = 42.5 (e.g. sub-frame interpolation)
      renderer.render([], [], [], [], [], mockCamera, 2000, 1000, "high", undefined, "en", 42.5);
      expect(renderer.currentTickCount).toBe(42.5);

      // Verify that re-rendering without advancing simulation does not accumulate drift
      renderer.render([], [], [], [], [], mockCamera, 2000, 1000, "high", undefined, "en", 42.5);
      expect(renderer.currentTickCount).toBe(42.5);
    });

    it("verifies gameEngine tracks simulationTicks and freezes them during pause", () => {
      gameEngine.simulationTicks = 100;
      gameEngine.isPaused = true;

      // When paused, fixedUpdate is not called, renderFrame uses alpha without advancing ticks
      const beforeTicks = gameEngine.simulationTick;
      expect(beforeTicks).toBe(100);

      // Simulate a tick call while paused
      gameEngine.tick(1.0);
      expect(gameEngine.simulationTick).toBe(100);

      // Unpause and step
      gameEngine.isPaused = false;
      gameEngine.fixedUpdate(1.0);
      expect(gameEngine.simulationTick).toBeGreaterThan(100);
    });
  });

  describe("2. Schema Immutability in ParallaxRenderer", () => {
    it("does not mutate layer.imageElement during renderImageLayer", () => {
      const parallax = new ParallaxRenderer();
      const mockCtx = mockCanvas.getContext("2d") as unknown as CanvasRenderingContext2D;

      const layer: ParallaxLayerSchema = {
        id: "test_far_image",
        tier: "far",
        depth: 0.1,
        scrollSpeedX: 0.1,
        scrollSpeedY: 0.05,
        type: "image",
        imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      };

      // Ensure layer starts without imageElement
      expect(layer.imageElement).toBeUndefined();

      // Render location containing the image layer
      const location = {
        id: "custom_loc",
        name: "Test Location",
        dimensions: { width: 3000, height: 1000 },
        theme: {
          bgGradientTop: "#000",
          bgGradientBottom: "#111",
          primaryColor: "#222",
          secondaryColor: "#333",
          accentColor: "#444",
          platformColor: "#555",
        },
        parallaxBackground: {
          layers: [layer],
          boxWidth: 3500,
          boxHeight: 1200,
        },
      } as any;

      parallax.render(mockCtx, location, 3000, 1000, 1000, 625, 0, 0, 1);

      // Crucial verification: layer object in location schema was NOT mutated!
      expect(layer.imageElement).toBeUndefined();
    });

    it("preloads layer images into cache ahead of time without schema mutation", () => {
      const parallax = new ParallaxRenderer();
      const layer: ParallaxLayerSchema = {
        id: "preload_test",
        tier: "mid",
        depth: 0.5,
        scrollSpeedX: 0.4,
        scrollSpeedY: 0.2,
        type: "image",
        imageUrl: "http://localhost/test.png",
      };

      parallax.preload([layer]);
      expect(layer.imageElement).toBeUndefined();
    });
  });

  describe("3. Elimination of Redundant LevelEntityRenderer Proxy", () => {
    it("verifies LevelEntityRenderer is an alias to StructureRenderer", () => {
      expect(LevelEntityRenderer).toBe(StructureRenderer);
      expect(defaultLevelEntityRenderer).toBe(defaultStructureRenderer);
    });

    it("injects and routes structureRenderer directly inside GameRenderer", () => {
      let renderCalled = false;
      const customStructureRenderer = {
        render: () => {
          renderCalled = true;
        },
      };

      const renderer = new GameRenderer(mockCanvas, {
        structureRenderer: customStructureRenderer as any,
      });

      const mockEntities: Entity[] = [
        {
          id: "p1",
          type: CollisionType.Solid,
          x: 100,
          y: 200,
          width: 50,
          height: 10,
        },
      ];

      renderer.render([], [], mockEntities, [], [], mockCamera, 2000, 1000, "high", undefined, "en", 10);
      expect(renderCalled).toBe(true);
    });

    it("maintains backward compatibility with legacy levelEntityRenderer dependency injection", () => {
      let legacyRenderCalled = false;
      const legacyRenderer = {
        render: () => {
          legacyRenderCalled = true;
        },
      };

      const renderer = new GameRenderer(mockCanvas, {
        levelEntityRenderer: legacyRenderer as any,
      });

      renderer.render([], [], [{ id: "e1" } as any], [], [], mockCamera, 2000, 1000, "high", undefined, "en", 10);
      expect(legacyRenderCalled).toBe(true);
    });
  });
});
