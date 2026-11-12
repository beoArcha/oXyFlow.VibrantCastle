import { describe, it, expect } from "bun:test";
import { AtlasTextureManager, chooseRasterScale, loadSvgTexture } from "../atlas";
import { SpriteSourceFactory } from "../sprites";
import type { AtlasCatalogEntry, AtlasMeta, AtlasVariants, AtlasTextureDeps, ReleasableTexture } from "../atlas";
import type { AssetQuality } from "../../types";

const META = { atlas: { columns: 4, rows: 3 } } as unknown as AtlasMeta;
const TIERS: AssetQuality[] = ["low", "mid", "high"];

function variantsOf(tiers: AssetQuality[]): AtlasVariants {
  const variants: AtlasVariants = {};
  for (const tier of tiers) {
    variants[tier] = { src: `${tier}.${tier === "high" ? "png" : "svg"}`, format: tier === "high" ? "png" : "svg", meta: META };
  }
  return variants;
}

function entryOf(tiers: AssetQuality[]): AtlasCatalogEntry {
  return { id: "imp", category: "enemy", variants: variantsOf(tiers) };
}

function pngImage(): HTMLImageElement {
  return { complete: true, naturalWidth: 400, naturalHeight: 300 } as unknown as HTMLImageElement;
}

interface Harness {
  manager: AtlasTextureManager;
  sprites: SpriteSourceFactory;
  requested: string[];
  released: string[];
  settle(src: string): Promise<void>;
  changes: { count: number };
}

function harness(tiers: AssetQuality[], initial: AssetQuality = "high"): Harness {
  const sprites = new SpriteSourceFactory(initial);
  const requested: string[] = [];
  const released: string[] = [];
  const changes = { count: 0 };
  const images = new Map<string, HTMLImageElement>();
  const waiting = new Map<string, () => void>();

  const gate = (src: string): Promise<void> =>
    new Promise<void>((resolve) => waiting.set(src, resolve));

  const deps: AtlasTextureDeps = {
    getImage: (url) => images.get(url) ?? null,
    loadImage: async (url) => {
      requested.push(url);
      await gate(url);
      images.set(url, pngImage());
    },
    loadSvg: async (src): Promise<ReleasableTexture> => {
      requested.push(src);
      await gate(src);
      return { source: {} as CanvasImageSource, width: 400, height: 300, crisp: true, release: () => released.push(src) };
    },
    canLoad: () => true,
    sprites,
    onChange: () => {
      changes.count++;
    },
  };

  const manager = new AtlasTextureManager(deps);
  manager.register(entryOf(tiers));
  const settle = async (src: string): Promise<void> => {
    waiting.get(src)?.();
    waiting.delete(src);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  };
  return { manager, sprites, requested, released, settle, changes };
}

describe("AtlasTextureManager", () => {
  it("fetches only the resolved variant", () => {
    const { requested } = harness(TIERS, "low");

    expect(requested).toEqual(["low.svg"]);
  });

  it("falls back to mid when the requested low tier does not exist", () => {
    const { requested } = harness(["mid", "high"], "low");

    expect(requested).toEqual(["mid.svg"]);
  });

  it("falls back to high when neither requested nor mid exist", () => {
    const { requested } = harness(["low", "high"], "mid");

    expect(requested).toEqual(["high.png"]);
  });

  it("returns nothing until the variant is ready, then the texture and its meta", async () => {
    const h = harness(["low"], "low");
    expect(h.manager.getSource("imp")).toBeNull();

    await h.settle("low.svg");

    const source = h.manager.getSource("imp");
    expect(source?.tier).toBe("low");
    expect(source?.texture.width).toBe(400);
    expect(source?.meta).toBe(META);
  });

  it("keeps drawing the old texture until the new tier is ready, then releases the old svg raster", async () => {
    const h = harness(["low", "mid", "high"], "low");
    await h.settle("low.svg");
    const lowSource = h.manager.getSource("imp");
    expect(lowSource?.tier).toBe("low");

    h.sprites.setQuality("mid");
    expect(h.requested).toEqual(["low.svg", "mid.svg"]);
    expect(h.manager.getSource("imp")).toBe(lowSource);
    expect(h.released).toEqual([]);

    await h.settle("mid.svg");

    expect(h.manager.getSource("imp")?.tier).toBe("mid");
    expect(h.released).toEqual(["low.svg"]);
  });

  it("switches from an svg tier to the png tier and back", async () => {
    const h = harness(["low", "high"], "low");
    await h.settle("low.svg");

    h.sprites.setQuality("high");
    expect(h.manager.getSource("imp")?.tier).toBe("low");
    await h.settle("high.png");
    expect(h.manager.getSource("imp")?.tier).toBe("high");
    expect(h.released).toEqual(["low.svg"]);

    h.sprites.setQuality("low");
    expect(h.manager.getSource("imp")?.tier).toBe("high");
    await h.settle("low.svg");
    expect(h.manager.getSource("imp")?.tier).toBe("low");
  });

  it("releases a raster that finished after the quality moved on", async () => {
    const h = harness(["low", "mid", "high"], "low");
    await h.settle("low.svg");
    h.sprites.setQuality("mid");
    h.sprites.setQuality("high");

    await h.settle("mid.svg");

    expect(h.released).toContain("mid.svg");
    expect(h.manager.getSource("imp")?.tier).toBe("low");
    await h.settle("high.png");
    expect(h.manager.getSource("imp")?.tier).toBe("high");
  });

  it("notifies listeners when a variant becomes ready", async () => {
    const h = harness(["low"], "low");

    await h.settle("low.svg");

    expect(h.changes.count).toBe(1);
  });

  it("exposes the drawn variant through the legacy view and owns every variant url", async () => {
    const h = harness(["low", "high"], "low");
    expect(h.manager.getView("imp")?.imageSrc).toBe("low.svg");
    await h.settle("low.svg");
    h.sprites.setQuality("high");

    expect(h.manager.getView("imp")?.imageSrc).toBe("low.svg");
    expect(h.manager.ownsUrl("high.png")).toBe(true);
    expect(h.manager.ownsUrl("other.png")).toBe(false);
  });
});

describe("svg raster", () => {
  it("chooses an integer scale that brings a cell to at least 192 px", () => {
    expect(chooseRasterScale(48)).toBe(4);
    expect(chooseRasterScale(96)).toBe(2);
    expect(chooseRasterScale(72)).toBe(3);
    expect(chooseRasterScale(144)).toBe(2);
    expect(chooseRasterScale(192)).toBe(1);
    expect(chooseRasterScale(400)).toBe(1);
    expect(chooseRasterScale(0)).toBe(1);
  });

  function fakeEnv(imageWidth: number, imageHeight: number, withCanvas: boolean) {
    const draws: unknown[][] = [];
    const ctx = {
      imageSmoothingEnabled: true,
      drawImage: (...args: unknown[]) => draws.push(args),
    };
    const canvas = { width: 0, height: 0, getContext: () => ctx };
    const image = {
      naturalWidth: imageWidth,
      naturalHeight: imageHeight,
      width: imageWidth,
      height: imageHeight,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      set src(value: string) {
        if (value) queueMicrotask(() => this.onload?.());
      },
    };
    return {
      draws,
      ctx,
      canvas,
      image,
      env: {
        createImage: () => image as unknown as HTMLImageElement,
        createCanvas: (w: number, h: number) => {
          if (!withCanvas) return null;
          canvas.width = w;
          canvas.height = h;
          return canvas as unknown as HTMLCanvasElement;
        },
      },
    };
  }

  it("rasterises a 48 px cell sheet once at x4 without smoothing", async () => {
    const fake = fakeEnv(192, 144, true);

    const texture = await loadSvgTexture("imp_nes.svg", 4, fake.env);

    expect(texture.width).toBe(768);
    expect(texture.height).toBe(576);
    expect(texture.crisp).toBe(true);
    expect(texture.source).toBe(fake.canvas as unknown as CanvasImageSource);
    expect(fake.ctx.imageSmoothingEnabled).toBe(false);
    expect(fake.draws).toHaveLength(1);
    expect(fake.draws[0].slice(1)).toEqual([0, 0, 768, 576]);
  });

  it("rasterises a 96 px cell sheet at x2", async () => {
    const texture = await loadSvgTexture("imp_snes.svg", 4, fakeEnv(384, 288, true).env);

    expect(texture.width).toBe(768);
    expect(texture.height).toBe(576);
  });

  it("zeroes the canvas on release", async () => {
    const fake = fakeEnv(192, 144, true);
    const texture = await loadSvgTexture("imp_nes.svg", 4, fake.env);

    texture.release();

    expect(fake.canvas.width).toBe(0);
    expect(fake.canvas.height).toBe(0);
  });

  it("degrades to the decoded image when no canvas is available", async () => {
    const fake = fakeEnv(192, 144, false);

    const texture = await loadSvgTexture("imp_nes.svg", 4, fake.env);

    expect(texture.source).toBe(fake.image as unknown as CanvasImageSource);
    expect(texture.width).toBe(192);
    expect(texture.height).toBe(144);
  });

  it("rejects with an asset error when the image cannot be created", async () => {
    const env = { createImage: () => null, createCanvas: () => null };

    await expect(loadSvgTexture("imp_nes.svg", 4, env)).rejects.toMatchObject({ code: "ASSET_LOAD_FAILED" });
  });

  it("rejects when the svg has no intrinsic size", async () => {
    await expect(loadSvgTexture("imp_nes.svg", 4, fakeEnv(0, 0, true).env)).rejects.toMatchObject({
      code: "ASSET_CORRUPTED",
    });
  });
});
