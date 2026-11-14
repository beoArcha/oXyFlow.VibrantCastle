import { describe, it, expect } from "bun:test";
import { AssetError, ErrorCode } from "@lib/errors";
import { SpriteSourceFactory } from "../../sprites";
import type { TilesetImageLoader } from "../../tiles/tilesetManager";
import { PropManager } from "../propManager";
import { parsePropMeta } from "../propMeta";
import { createPropMetaJson } from "./propFixtures";

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
  const manager = new PropManager(sprites, loader);
  manager.register(parsePropMeta(createPropMetaJson()), {
    "test_lantern_hi8bit.png": "/p/low.png",
    "test_lantern_hi16bit.png": "/p/mid.png",
  });
  return { sprites, manager, loads };
}

describe("PropManager", () => {
  it("draws nothing for an unknown prop and while the sheet loads", async () => {
    const { manager } = setup();

    expect(manager.resolve("nope")).toBeNull();
    expect(manager.resolve("test_lantern")).toBeNull();
    await flush();
    expect(manager.resolve("test_lantern")?.frameWidth).toBe(16);
  });

  it("maps low to hi-8bit and mid to hi-16bit, switching live", async () => {
    const { sprites, manager, loads } = setup();
    manager.resolve("test_lantern");
    await flush();

    sprites.setQuality("mid");
    expect(manager.resolve("test_lantern")?.tier).toBe("low");
    await flush();

    expect(manager.resolve("test_lantern")?.tier).toBe("mid");
    expect(manager.resolve("test_lantern")?.frameWidth).toBe(32);
    expect(loads).toEqual(["/p/low.png", "/p/mid.png"]);
  });

  it("falls high back to the hi-16bit sheet", async () => {
    const { sprites, manager } = setup();
    sprites.setQuality("high");
    manager.resolve("test_lantern");
    await flush();

    expect(manager.resolve("test_lantern")?.tier).toBe("mid");
  });

  it("falls back to the other tier when a sheet fails to load", async () => {
    const { sprites, manager } = setup({ fail: ["mid.png"] });
    manager.resolve("test_lantern");
    await flush();
    sprites.setQuality("mid");
    manager.resolve("test_lantern");
    await flush();

    expect(manager.resolve("test_lantern")?.tier).toBe("low");
  });

  it("ignores an invalid discovered meta", () => {
    const manager = new PropManager(new SpriteSourceFactory("low"));

    manager.registerDiscovered({
      images: {},
      metas: { "/src/assets/props/bad/bad_prop_meta.json": { propId: "bad" } },
    });

    expect(manager.has("bad")).toBe(false);
  });
});
