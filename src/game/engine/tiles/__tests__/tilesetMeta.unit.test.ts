import { describe, it, expect } from "bun:test";
import { AssetError } from "@lib/errors";
import { parseTilesetMeta } from "../tilesetMeta";
import { createTilesetMetaJson } from "./tilesetFixtures";

describe("parseTilesetMeta", () => {
  it("parses a valid solid meta", () => {
    const meta = parseTilesetMeta(createTilesetMetaJson("test_stone"));

    expect(meta.tilesetId).toBe("test_stone");
    expect(meta.kind).toBe("solid");
    expect(meta.worldTile).toBe(32);
    expect(meta.variants.low?.tile).toBe(16);
    expect(meta.tiles.top).toEqual({ col: 1, row: 0 });
  });

  it("groups numeric-suffixed variants behind their base tile in numeric order", () => {
    const raw = createTilesetMetaJson("test_stone", "solid", ["fill_3", "fill_2", "top_2"]);

    const meta = parseTilesetMeta(raw);

    expect(meta.choices.fill).toEqual([meta.tiles.fill, meta.tiles.fill_2, meta.tiles.fill_3]);
    expect(meta.choices.top).toHaveLength(2);
    expect(meta.choices.fill_2).toBeUndefined();
  });

  it("rejects a missing required tile with a structured AssetError", () => {
    const raw = createTilesetMetaJson();
    delete (raw.tiles as Record<string, unknown>).fill;

    expect(() => parseTilesetMeta(raw)).toThrow(AssetError);
  });

  it("requires only the ledge tiles for oneway", () => {
    expect(parseTilesetMeta(createTilesetMetaJson("wood", "oneway")).kind).toBe("oneway");
  });

  it("rejects tiles outside the grid, bad kind and missing variants", () => {
    const outside = createTilesetMetaJson();
    (outside.tiles as Record<string, unknown>).top = { col: 9, row: 0 };
    const kind = { ...createTilesetMetaJson(), kind: "wall" };
    const noVariants = { ...createTilesetMetaJson(), variants: {} };

    expect(() => parseTilesetMeta(outside)).toThrow(AssetError);
    expect(() => parseTilesetMeta(kind)).toThrow(AssetError);
    expect(() => parseTilesetMeta(noVariants)).toThrow(AssetError);
    expect(() => parseTilesetMeta(null)).toThrow(AssetError);
  });
});
