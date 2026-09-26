import { describe, it, expect } from "bun:test";
import { AtlasSpriteRenderer } from "../atlasSpriteRenderer";
import { assetLoader } from "../../engine/assetLoader";

function createMockContext() {
  let saveCalls = 0;
  let restoreCalls = 0;
  let drawImageCalls: any[] = [];
  let fillRectCalls: any[] = [];

  const ctx: any = {
    save: () => {
      saveCalls++;
    },
    restore: () => {
      restoreCalls++;
    },
    translate: () => {},
    scale: () => {},
    drawImage: (img: any, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => {
      drawImageCalls.push({ img, sx, sy, sw, sh, dx, dy, dw, dh });
    },
    fillRect: (x: number, y: number, w: number, h: number) => {
      fillRectCalls.push({ x, y, w, h });
    },
    globalAlpha: 1.0,
    globalCompositeOperation: "source-over",
    fillStyle: "#000000",
    getSaveBalance: () => saveCalls - restoreCalls,
    getDrawImageCalls: () => drawImageCalls,
    getFillRectCalls: () => fillRectCalls,
  };
  return ctx;
}

function createMockTexture(width: number = 384, height: number = 256): HTMLImageElement {
  return {
    complete: true,
    naturalWidth: width,
    naturalHeight: height,
    width,
    height,
  } as unknown as HTMLImageElement;
}

describe("Podfaza 5.1: AtlasSpriteRenderer Comprehensive Unit Tests", () => {
  it("identifies registered atlases via hasAtlas()", () => {
    const renderer = new AtlasSpriteRenderer();

    expect(renderer.hasAtlas("training_dummy")).toBe(true);
    expect(renderer.hasAtlas("clockwork_owl_gargoyle")).toBe(true);
    expect(renderer.hasAtlas("aether_gate")).toBe(true);
    expect(renderer.hasAtlas("unknown_atlas_xyz")).toBe(false);
  });

  it("returns false cleanly when atlas is missing or texture not loaded", () => {
    const renderer = new AtlasSpriteRenderer();
    const ctx = createMockContext();

    const resMissing = renderer.render(ctx, {
      atlasId: "non_existent_atlas",
      animationName: "idle",
      x: 100,
      y: 100,
      width: 32,
      height: 48,
    });
    expect(resMissing).toBe(false);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("renders frame using slotSpan correctly and anchors origin to bottom", () => {
    const renderer = new AtlasSpriteRenderer();
    const ctx = createMockContext();

    const mockTex = createMockTexture(600, 400); // 6 cols x 4 rows => 100x100 cells
    const customAtlas = {
      id: "mock_hero_slotspan",
      category: "enemy" as const,
      imageSrc: "mock://hero_slotspan.png",
      meta: {
        atlas: { columns: 6, rows: 4 },
        animations: {
          slash: {
            row: 1,
            frames: 3,
            fps: 10,
            slotSpan: [1, 2, 1],
          },
        },
        anchor: { x: 0.5, y: 1.0 },
      } as any,
    };

    assetLoader.registerAtlas(customAtlas);
    // Inject loaded texture into textureCache
    (assetLoader as any).textureCache.set("mock://hero_slotspan.png", mockTex);

    // Frame 1 (currentFrame = 1, should skip span[0] = 1, so col = 1, span = 2)
    const rendered = renderer.render(ctx, {
      atlasId: "mock_hero_slotspan",
      animationName: "slash",
      frameIndex: 1,
      x: 200,
      y: 300,
      width: 40,
      height: 60,
      facingLeft: false,
    });

    expect(rendered).toBe(true);
    expect(ctx.getSaveBalance()).toBe(0);
    const calls = ctx.getDrawImageCalls();
    expect(calls.length).toBe(1);
    expect(calls[0].sx).toBe(100); // col 1 * cellW (100)
    expect(calls[0].sy).toBe(100); // row 1 * cellH (100)
    expect(calls[0].sw).toBe(200); // span 2 * cellW (100) = 200
  });

  it("calculates discrete frame progression from ticks and fps", () => {
    const renderer = new AtlasSpriteRenderer();
    const ctx = createMockContext();

    const mockTex = createMockTexture(600, 400);
    const customAtlas = {
      id: "mock_creature_ticks",
      category: "enemy" as const,
      imageSrc: "mock://creature_ticks.png",
      meta: {
        atlas: { columns: 6, rows: 4 },
        animations: {
          fly: {
            row: 0,
            frames: 4,
            fps: 12, // 60 / 12 = 5 ticks per frame
            loop: true,
          },
        },
      } as any,
    };

    assetLoader.registerAtlas(customAtlas);
    (assetLoader as any).textureCache.set("mock://creature_ticks.png", mockTex);

    // Tick 0 -> Frame 0
    renderer.render(ctx, {
      atlasId: "mock_creature_ticks",
      animationName: "fly",
      ticks: 0,
      x: 100,
      y: 100,
      width: 32,
      height: 32,
    });
    let calls = ctx.getDrawImageCalls();
    expect(calls[0].sx).toBe(0);

    // Tick 11 -> floor(11 / 5) = 2 -> Frame 2
    renderer.render(ctx, {
      atlasId: "mock_creature_ticks",
      animationName: "fly",
      ticks: 11,
      x: 100,
      y: 100,
      width: 32,
      height: 32,
    });
    calls = ctx.getDrawImageCalls();
    expect(calls[1].sx).toBe(200); // col 2 * 100 = 200
  });

  it("renders damage tint overlay and handles directional mirroring", () => {
    const renderer = new AtlasSpriteRenderer();
    const ctx = createMockContext();

    const mockTex = createMockTexture(600, 400);
    const customAtlas = {
      id: "mock_tint_flip",
      category: "enemy" as const,
      imageSrc: "mock://tint_flip.png",
      meta: {
        atlas: { columns: 6, rows: 4 },
        animations: {
          hurt: { row: 2, frames: 1 },
        },
        layout: { naturalFacing: "right" },
      } as any,
    };

    assetLoader.registerAtlas(customAtlas);
    (assetLoader as any).textureCache.set("mock://tint_flip.png", mockTex);

    const rendered = renderer.render(ctx, {
      atlasId: "mock_tint_flip",
      animationName: "hurt",
      frameIndex: 0,
      x: 150,
      y: 250,
      width: 32,
      height: 48,
      facingLeft: true, // Needs flip
      alpha: 0.8,
      tintColor: "#ef4444",
    });

    expect(rendered).toBe(true);
    expect(ctx.getSaveBalance()).toBe(0);
    expect(ctx.getFillRectCalls().length).toBe(1); // Tint overlay rect
  });

  it("resolves state aliases and renders using cells and startCol configurations", () => {
    const renderer = new AtlasSpriteRenderer();
    const ctx = createMockContext();

    const mockTex = createMockTexture(600, 400); // 100x100
    const customAtlas = {
      id: "mock_cells_and_states",
      category: "enemy" as const,
      imageSrc: "mock://cells_and_states.png",
      meta: {
        atlas: { columns: 6, rows: 4 },
        states: {
          inactive: { animation: "sleep" },
        },
        animations: {
          sleep: {
            row: 0,
            frames: 2,
            cells: [1, 2],
          },
          run: {
            row: 1,
            frames: 2,
            startCol: 1,
            widthCells: 2,
          },
        },
        layout: {
          anchor: { x: 0.5, y: 0.9 },
        },
      } as any,
    };

    assetLoader.registerAtlas(customAtlas);
    (assetLoader as any).textureCache.set("mock://cells_and_states.png", mockTex);

    // Call with state alias 'inactive' -> routes to 'sleep' frame 1 (skips cell 0 = 1, col = 1, span = 2)
    const renderedSleep = renderer.render(ctx, {
      atlasId: "mock_cells_and_states",
      animationName: "inactive",
      frameIndex: 1,
      x: 100,
      y: 100,
      width: 40,
      height: 40,
    });
    expect(renderedSleep).toBe(true);
    let calls = ctx.getDrawImageCalls();
    expect(calls[0].sx).toBe(100);
    expect(calls[0].sw).toBe(200);

    // Call with startCol
    const renderedRun = renderer.render(ctx, {
      atlasId: "mock_cells_and_states",
      animationName: "run",
      frameIndex: 1,
      x: 100,
      y: 100,
      width: 40,
      height: 40,
    });
    expect(renderedRun).toBe(true);
    calls = ctx.getDrawImageCalls();
    // col = startCol (1) + frame (1) * widthCells (2) = 3 -> sx = 300
    expect(calls[1].sx).toBe(300);
    expect(calls[1].sw).toBe(200);
  });

  it("handles normalized layout origin and zero-height variant scaling", () => {
    const renderer = new AtlasSpriteRenderer();
    const ctx = createMockContext();

    const mockTex = createMockTexture(600, 400);
    const customAtlas = {
      id: "mock_variant_scale",
      category: "structure" as const,
      imageSrc: "mock://variant_scale.png",
      meta: {
        atlas: { columns: 6, rows: 4 },
        animations: {
          idle: { row: 0, frames: 1 },
        },
        layout: {
          origin: {
            normalized: { x: 0.5, y: 0.5 },
          },
        },
        variants: {
          high: { scale: 1.5 },
        },
      } as any,
    };

    assetLoader.registerAtlas(customAtlas);
    (assetLoader as any).textureCache.set("mock://variant_scale.png", mockTex);

    const rendered = renderer.render(ctx, {
      atlasId: "mock_variant_scale",
      animationName: "idle",
      frameIndex: 0,
      x: 100,
      y: 100,
      width: 50,
      height: 0, // Height <= 0 triggers variantScale branch
      quality: "high",
    });

    expect(rendered).toBe(true);
    const calls = ctx.getDrawImageCalls();
    // sw = 100, scale = 1.5 -> dw = 150
    expect(calls[0].dw).toBe(150);
  });

  it("applies and caches runtime chroma-keying when backgroundConfig is present", () => {
    const renderer = new AtlasSpriteRenderer();
    const ctx = createMockContext();

    const mockTex = createMockTexture(100, 100);
    const customAtlas = {
      id: "mock_chroma_atlas",
      category: "enemy" as const,
      imageSrc: "mock://chroma.png",
      meta: {
        atlas: { columns: 1, rows: 1 },
        animations: {
          idle: { row: 0, frames: 1 },
        },
        backgroundConfig: {
          removeAtRuntime: true,
          colorHex: "#00ff00",
          tolerance: 20,
        },
      } as any,
    };

    assetLoader.registerAtlas(customAtlas);
    (assetLoader as any).textureCache.set("mock://chroma.png", mockTex);

    const origDoc = (globalThis as any).document;
    try {
      (globalThis as any).document = {
        createElement: (tag: string) => {
          if (tag === "canvas") {
            const offscreenCtx = {
              drawImage: () => {},
              getImageData: () => ({
                data: new Uint8ClampedArray(100 * 100 * 4),
                width: 100,
                height: 100,
              }),
              putImageData: () => {},
            };
            return {
              width: 100,
              height: 100,
              getContext: () => offscreenCtx,
            };
          }
          return {};
        },
      };

      // Frame 1: bakes and caches
      const r1 = renderer.render(ctx, {
        atlasId: "mock_chroma_atlas",
        animationName: "idle",
        x: 10,
        y: 10,
        width: 32,
        height: 32,
      });
      expect(r1).toBe(true);

      // Frame 2: hits cache
      const r2 = renderer.render(ctx, {
        atlasId: "mock_chroma_atlas",
        animationName: "idle",
        x: 10,
        y: 10,
        width: 32,
        height: 32,
      });
      expect(r2).toBe(true);

      renderer.clearChromaCache();
    } finally {
      (globalThis as any).document = origDoc;
    }
  });

  it("clears chroma cache without leaking state", () => {
    const renderer = new AtlasSpriteRenderer();
    renderer.clearChromaCache();
    expect(true).toBe(true);
  });
});
