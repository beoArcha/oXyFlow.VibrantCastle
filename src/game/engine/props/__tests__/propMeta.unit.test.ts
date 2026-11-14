import { describe, it, expect } from "bun:test";
import { AssetError, ErrorCode } from "@lib/errors";
import { parsePropMeta } from "../propMeta";
import { createPropMetaJson } from "./propFixtures";

describe("parsePropMeta", () => {
  it("parses a complete meta including the glow", () => {
    const meta = parsePropMeta(createPropMetaJson());

    expect(meta.propId).toBe("test_lantern");
    expect(meta.anchor).toBe("top");
    expect(meta.frames).toBe(4);
    expect(meta.variants.low?.frameWidth).toBe(16);
    expect(meta.variants.mid?.frameHeight).toBe(64);
    expect(meta.glow).toEqual({ color: "#ffb347", radius: 72, x: 16, y: 44, flicker: true });
  });

  it("accepts a meta without glow and with a single tier", () => {
    const meta = parsePropMeta(
      createPropMetaJson("chain", "top", {
        glow: undefined,
        variants: { mid: { file: "chain_hi16bit.png", frameWidth: 32, frameHeight: 64 } },
      })
    );

    expect(meta.glow).toBeUndefined();
    expect(meta.variants.low).toBeUndefined();
  });

  it.each([
    ["missing propId", { propId: undefined }],
    ["bad anchor", { anchor: "left" }],
    ["zero frames", { frames: 0 }],
    ["too many frames", { frames: 13 }],
    ["negative fps", { fps: -1 }],
    ["no variants", { variants: {} }],
    ["bad glow radius", { glow: { color: "#fff", radius: 0, x: 0, y: 0 } }],
  ])("rejects %s with ASSET_CORRUPTED", (_name, override) => {
    let thrown: unknown;
    try {
      parsePropMeta(createPropMetaJson("test_lantern", "top", override));
    } catch (err: unknown) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(AssetError);
    expect((thrown as AssetError).code).toBe(ErrorCode.ASSET_CORRUPTED);
  });

  it("rejects a non-object document", () => {
    expect(() => parsePropMeta(null)).toThrow(AssetError);
  });
});
