import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameRenderer, IRendererDependencies } from "../renderer";
import { ProceduralBackdropCache } from "../proceduralBackdropCache";
import { MultiLayerBackgroundSystem } from "../multiLayerBackgroundSystem";
import { debugManager } from "@game/debug/debugManager";
import { Player, Enemy, Entity, Projectile, Particle, PlayerId } from "@game/types";
import { CameraState } from "@game/engine/cameraManager";
import { LocationDefinition } from "@game/locations/types";
import { assetLoader } from "@game/engine/assetLoader";
import { createMockCanvas, createMockContext2D } from "@test-utils";

describe("GameRenderer Integration & Verification", () => {
  beforeEach(() => {
    debugManager.state.showHitboxes = false;
    debugManager.state.showProfiler = false;
  });

  afterEach(() => {
    debugManager.state.showHitboxes = false;
    debugManager.state.showProfiler = false;
  });

  describe("Viewport, Resolution & Hardware Acceleration Configuration", () => {
    it("computes accurate scale factor and viewport bounds based on 1000 baseline units", () => {
      const { canvas, ctx } = createMockCanvas(1920, 1080);
      const renderer = new GameRenderer(canvas as any);

      renderer.setDimensions(1920, 1080, 1, "pixel");

      expect(renderer.scale).toBeCloseTo(1.92, 2);
      expect(renderer.viewportWidth).toBeCloseTo(1000, 1);
      expect(renderer.viewportHeight).toBeCloseTo(562.5, 1);
      expect(ctx.imageSmoothingEnabled).toBe(false);

      // Change to smooth mode
      renderer.setDimensions(1280, 720, 1, "smooth");
      expect(renderer.scale).toBeCloseTo(1.28, 2);
      expect(ctx.imageSmoothingEnabled).toBe(true);
    });

    it("clamps minimum canvas dimensions to 320x200 and scale factor to 0.2", () => {
      const { canvas } = createMockCanvas(100, 100);
      const renderer = new GameRenderer(canvas as any);

      renderer.setDimensions(100, 100, 1);

      expect(canvas.width).toBe(320);
      expect(canvas.height).toBe(200);
      expect(renderer.scale).toBeGreaterThanOrEqual(0.2);
    });

    it("supports toggling hardware acceleration mode dynamically", () => {
      const { canvas } = createMockCanvas(1000, 600);
      let resizeCalled = false;
      const mockBackdropCache = {
        resize: () => {
          resizeCalled = true;
        },
        renderSky: () => { },
        renderCastles: () => { },
        renderTree: () => { },
      };

      const renderer = new GameRenderer(canvas as any, {
        proceduralBackdropCache: mockBackdropCache as any,
      });

      expect(renderer.isHardwareAccelerated).toBe(true);

      renderer.setHardwareAcceleration(false);
      expect(renderer.isHardwareAccelerated).toBe(false);

      renderer.setHardwareAcceleration(true);
      expect(renderer.isHardwareAccelerated).toBe(true);
      expect(resizeCalled).toBe(true);
    });

    it("sets asset quality and updates assetLoader", () => {
      const origImage = (globalThis as any).Image;
      try {
        (globalThis as any).Image = class {
          onload: any;
          onerror: any;
          src: string = "";
        };

        const { canvas } = createMockCanvas();
        const renderer = new GameRenderer(canvas as any);

        renderer.setAssetQuality("low");
        expect(renderer.assetQuality).toBe("low");
        expect(assetLoader.getQuality()).toBe("low");

        renderer.setAssetQuality("high");
        expect(renderer.assetQuality).toBe("high");
        expect(assetLoader.getQuality()).toBe("high");
      } finally {
        (globalThis as any).Image = origImage;
      }
    });

    it("throws EngineError if canvas 2D context cannot be acquired", () => {
      const brokenCanvas: any = {
        width: 800,
        height: 600,
        getContext: () => null,
      };

      expect(() => new GameRenderer(brokenCanvas)).toThrow();
    });
  });

  describe("Full Scene Orchestration & Strict State Preservation", () => {
    it("renders complete scene with parallax location without leaking canvas state", () => {
      const { canvas, ctx } = createMockCanvas(1000, 600);

      let parallaxRenderCalled = false;
      let structureRenderCalled = false;
      let actorRenderCalled = false;
      let fxRenderCalled = false;

      const deps: IRendererDependencies = {
        parallaxRenderer: {
          render: () => {
            parallaxRenderCalled = true;
          },
        } as any,
        structureRenderer: {
          render: () => {
            structureRenderCalled = true;
          },
        } as any,
        actorRenderer: {
          renderPlayers: () => {
            actorRenderCalled = true;
          },
          renderEnemies: () => { },
        } as any,
        fxRenderer: {
          renderParticles: () => {
            fxRenderCalled = true;
          },
          renderProjectiles: () => { },
        } as any,
      };

      const renderer = new GameRenderer(canvas as any, deps);

      const camera: CameraState = {
        x: 200,
        y: 100,
        shakeOffsetX: 4,
        shakeOffsetY: -2,
      };

      const mockLocation: LocationDefinition = {
        id: "grand_bastion",
        name: "Grand Bastion",
        parallaxBackground: {
          layers: [],
        },
      } as any;

      renderer.render(
        [],
        [],
        [],
        [],
        [],
        camera,
        3000,
        1500,
        "high",
        mockLocation,
        "en",
        120
      );

      expect(parallaxRenderCalled).toBe(true);
      expect(structureRenderCalled).toBe(true);
      expect(actorRenderCalled).toBe(true);
      expect(fxRenderCalled).toBe(true);
      expect(renderer.currentTickCount).toBe(120);
      expect(renderer.cameraX).toBe(200);
      expect(renderer.cameraY).toBe(100);

      // Canvas Save/Restore balance MUST be exactly 0
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("falls back to ProceduralBackdropCache when location has no parallaxBackground", () => {
      const { canvas, ctx } = createMockCanvas(1000, 600);

      let renderSkyCalled = false;
      let renderCastlesCalled = false;
      let renderTreeCalled = false;

      const mockBackdropCache = {
        renderSky: () => {
          renderSkyCalled = true;
        },
        renderCastles: () => {
          renderCastlesCalled = true;
        },
        renderTree: () => {
          renderTreeCalled = true;
        },
        resize: () => { },
      };

      const renderer = new GameRenderer(canvas as any, {
        proceduralBackdropCache: mockBackdropCache as any,
      });

      const camera: CameraState = {
        x: 0,
        y: 0,
        shakeOffsetX: 0,
        shakeOffsetY: 0,
      };

      renderer.render([], [], [], [], [], camera, 2000, 1000);

      expect(renderSkyCalled).toBe(true);
      expect(renderCastlesCalled).toBe(true);
      expect(renderTreeCalled).toBe(true);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("uses clearRect when hardware acceleration is disabled", () => {
      const { canvas, ctx } = createMockCanvas(800, 600);
      const renderer = new GameRenderer(canvas as any, {}, { hardwareAcceleration: false });

      const camera: CameraState = {
        x: 0,
        y: 0,
        shakeOffsetX: 0,
        shakeOffsetY: 0,
      };

      renderer.render([], [], [], [], [], camera, 1000, 1000);

      expect(ctx.getClearRectCalls().length).toBeGreaterThan(0);
      expect(ctx.getSaveBalance()).toBe(0);
    });
  });

  describe("Debug & Profiler Overlays Integration", () => {
    it("renders FPS counter overlay when showFps is true and profiler is inactive", () => {
      const { canvas, ctx } = createMockCanvas(1000, 600);
      const renderer = new GameRenderer(canvas as any);

      const camera: CameraState = {
        x: 0,
        y: 0,
        shakeOffsetX: 0,
        shakeOffsetY: 0,
      };

      renderer.render(
        [],
        [],
        [],
        [],
        [],
        camera,
        1000,
        1000,
        "high",
        undefined,
        "en",
        0,
        { targetFps: 60, measuredFps: 59, showFps: true }
      );

      const texts = ctx.getTextCalls();
      expect(texts.some((t: string) => t.includes("59 / 60 FPS • GPU"))).toBe(true);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("routes to HitboxRenderer when debugManager showHitboxes is true", () => {
      const { canvas, ctx } = createMockCanvas(1000, 600);
      let hitboxesRendered = false;

      const mockHitboxRenderer = {
        renderHitboxes: () => {
          hitboxesRendered = true;
        },
        renderSensorRays: () => { },
        renderTileWireframe: () => { },
        renderProfiler: () => { },
      };

      const renderer = new GameRenderer(canvas as any, {
        hitboxRenderer: mockHitboxRenderer as any,
      });

      debugManager.state.showHitboxes = true;

      const camera: CameraState = {
        x: 0,
        y: 0,
        shakeOffsetX: 0,
        shakeOffsetY: 0,
      };

      renderer.render([], [], [], [], [], camera, 1000, 1000);

      expect(hitboxesRendered).toBe(true);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("routes to DebugProfilerOverlay and suppresses basic FPS badge when showProfiler is true", () => {
      const { canvas, ctx } = createMockCanvas(1000, 600);
      let profilerRendered = false;

      const mockProfilerOverlay = {
        render: () => {
          profilerRendered = true;
        },
      };

      const renderer = new GameRenderer(canvas as any, {
        debugProfilerOverlay: mockProfilerOverlay as any,
      });

      debugManager.state.showProfiler = true;

      const camera: CameraState = {
        x: 0,
        y: 0,
        shakeOffsetX: 0,
        shakeOffsetY: 0,
      };

      renderer.render(
        [],
        [],
        [],
        [],
        [],
        camera,
        1000,
        1000,
        "high",
        undefined,
        "en",
        0,
        { targetFps: 60, measuredFps: 60, showFps: true }
      );

      expect(profilerRendered).toBe(true);
      // Basic FPS badge should be suppressed
      const texts = ctx.getTextCalls();
      expect(texts.some((t: string) => t.includes("60 / 60 FPS • GPU"))).toBe(false);
      expect(ctx.getSaveBalance()).toBe(0);
    });
  });

  describe("ProceduralBackdropCache & MultiLayer System Extended Coverage", () => {
    it("bakes textures and performs GPU quad blits in ProceduralBackdropCache", () => {
      // Mock global document with canvas support for offscreen bake buffers
      const origDoc = (globalThis as any).document;
      try {
        (globalThis as any).document = {
          createElement: (tag: string) => {
            if (tag === "canvas") {
              const { canvas } = createMockCanvas(500, 500);
              return canvas;
            }
            return {};
          },
        };

        const cache = new ProceduralBackdropCache();
        const mainCtx = createMockContext2D();

        cache.resize(1200, 700);
        // Repeated resize with same dimensions should no-op
        cache.resize(1200, 700);

        cache.renderSky(mainCtx, 1200, 700, 100);
        cache.renderCastles(mainCtx, 1200, 100);
        cache.renderTree(mainCtx, 400, 300);

        expect(mainCtx.getDrawImageCalls().length).toBeGreaterThan(0);
      } finally {
        (globalThis as any).document = origDoc;
      }
    });

    it("renders repeating dynamic tiers and fallback backdrop in MultiLayerBackgroundSystem", () => {
      const mlSystem = new MultiLayerBackgroundSystem();
      const ctx = createMockContext2D();

      const dummyImage: any = {
        complete: true,
        naturalWidth: 800,
        naturalHeight: 600,
      };

      const locationWithLayers: LocationDefinition = {
        id: "grand_bastion",
        name: "Grand Bastion",
        theme: {
          bgGradientTop: "#2a150b",
          bgGradientBottom: "#0d0502",
        },
        parallaxBackground: {
          oversizedBox: { width: 3000, height: 1500 },
          layers: [
            {
              id: "far_sky",
              tier: "far",
              scrollSpeedX: 0.1,
              scrollSpeedY: 0.05,
              opacity: 0.8,
              imageUrl: "/assets/far.png",
              imageElement: dummyImage,
            },
            {
              id: "mid_clouds",
              tier: "mid",
              scrollSpeedX: 0.5,
              scrollSpeedY: 0.2,
              autoDriftX: 0.2,
              autoDriftY: 0,
              opacity: 0.9,
              imageUrl: "/assets/mid.png",
              imageElement: dummyImage,
            },
          ],
        },
      } as any;

      debugManager.state.showHitboxes = true;

      mlSystem.render(
        ctx,
        locationWithLayers,
        3000,
        1500,
        1000,
        600,
        200,
        100,
        60
      );

      expect(ctx.getDrawImageCalls().length).toBeGreaterThan(0);
      expect(ctx.getSaveBalance()).toBe(0);

      // Also verify empty layers fallback
      const emptyLocation: LocationDefinition = {
        id: "empty_room",
        name: "Empty Room",
        parallaxBackground: {
          layers: [],
        },
      } as any;

      mlSystem.render(
        ctx,
        emptyLocation,
        1000,
        1000,
        800,
        600,
        0,
        0,
        0
      );
      expect(ctx.getSaveBalance()).toBe(0);
    });
  });
});
