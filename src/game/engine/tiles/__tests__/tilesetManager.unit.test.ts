import { describe, it, expect } from "bun:test";
import { AssetError, ErrorCode } from "@lib/errors";
import { SpriteSourceFactory } from "../../sprites";
import { TilesetManager, type TilesetImageLoader } from "../tilesetManager";
import { parseTilesetMeta } from "../tilesetMeta";
import { createTilesetMetaJson } from "./tilesetFixtures";

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function setup(opts: { fail?: readonly string[] } = {}) {
  const loads: string[] = [];
  const loader: TilesetImageLoader = (url) => {
    loads.push(url);
    return opts.fail?.some((f) => url.includes(f))
      ? Promise.reject(new AssetError("load failed", ErrorCode.ASSET_LOAD_FAILED))
      : Promise.resolve({ url } as unknown as CanvasImageSource);
  };
  const sprites = new SpriteSourceFactory("low");
  const manager = new TilesetManager(sprites, loader);
  manager.register(parseTilesetMeta(createTilesetMetaJson("test_stone")), {
    "test_stone_hi8bit.png": "/t/low.png",
    "test_stone_hi16bit.png": "/t/mid.png",
  });
  return { sprites, manager, loads };
}

describe("TilesetManager", () => {
  it("returns null for an unknown tileset and while the sheet is loading", async () => {
    const { manager } = setup();

    expect(manager.resolve("nope")).toBeNull();
    expect(manager.resolve("test_stone")).toBeNull();
    await flush();
    expect(manager.resolve("test_stone")?.tile).toBe(16);
  });

  it("maps low to hi-8bit and mid to hi-16bit, loading each sheet once", async () => {
    const { sprites, manager, loads } = setup();
    manager.resolve("test_stone");
    await flush();

    sprites.setQuality("mid");
    manager.resolve("test_stone");
    manager.resolve("test_stone");
    await flush();

    expect(manager.resolve("test_stone")?.tile).toBe(32);
    expect(manager.resolve("test_stone")?.tier).toBe("mid");
    expect(loads).toEqual(["/t/low.png", "/t/mid.png"]);
  });

  it("keeps drawing the ready tier while the new quality loads", async () => {
    const { sprites, manager } = setup();
    manager.resolve("test_stone");
    await flush();

    sprites.setQuality("mid");

    expect(manager.resolve("test_stone")?.tier).toBe("low");
  });

  it("falls high back to mid", async () => {
    const { sprites, manager, loads } = setup();
    sprites.setQuality("high");
    manager.resolve("test_stone");
    await flush();

    expect(manager.resolve("test_stone")?.tier).toBe("mid");
    expect(loads).toEqual(["/t/mid.png"]);
  });

  it("marks a failed tier and falls back to the other sheet", async () => {
    const { sprites, manager, loads } = setup({ fail: ["mid.png"] });
    sprites.setQuality("mid");
    manager.resolve("test_stone");
    await flush();
    manager.resolve("test_stone");
    await flush();

    expect(manager.resolve("test_stone")?.tier).toBe("low");
    expect(loads.filter((u) => u === "/t/mid.png")).toHaveLength(1);
  });

  it("returns null when every tier failed", async () => {
    const { manager } = setup({ fail: ["low.png", "mid.png"] });
    for (let i = 0; i < 3; i++) {
      manager.resolve("test_stone");
      await flush();
    }

    expect(manager.resolve("test_stone")).toBeNull();
  });

  it("registerDiscovered pairs sheets with their meta folder and skips invalid metas", () => {
    const sprites = new SpriteSourceFactory("low");
    const manager = new TilesetManager(sprites, () => Promise.resolve({} as CanvasImageSource));

    manager.registerDiscovered({
      metas: {
        "/src/assets/tiles/test_stone/test_stone_tiles_meta.json": createTilesetMetaJson("test_stone"),
        "/src/assets/tiles/bad/bad_tiles_meta.json": { tilesetId: "bad" },
      },
      images: {
        "/src/assets/tiles/test_stone/test_stone_hi8bit.png": "/a.png",
        "/src/assets/tiles/test_stone/test_stone_hi16bit.png": "/b.png",
      },
    });

    expect(manager.has("test_stone")).toBe(true);
    expect(manager.has("bad")).toBe(false);
  });
});
