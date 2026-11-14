import { describe, it, expect } from "bun:test";
import { StructureRenderer } from "../structureRenderer";
import { Entity, CollisionType } from "@game/types";
import { createMockContext2D } from "@test-utils";
import type { ITilesetProvider, ResolvedTileset } from "@game/engine/tiles";
import { parseTilesetMeta } from "@game/engine/tiles";
import { createTilesetMetaJson } from "@game/engine/tiles/__tests__/tilesetFixtures";

const atlas = { hasAtlas: () => false, render: () => false };

function provider(tile: number, id = "test_stone"): ITilesetProvider & { calls: number } {
  const resolved: ResolvedTileset = {
    meta: parseTilesetMeta(createTilesetMetaJson(id)),
    tier: tile === 16 ? "low" : "mid",
    image: {} as CanvasImageSource,
    tile,
  };
  const p = { calls: 0, resolve: (name: string) => ((p.calls++, name === id) ? resolved : null) };
  return p;
}

const platform = (over: Partial<Entity> = {}): Entity =>
  ({ id: "p", type: CollisionType.Solid, x: 100.4, y: 200.6, width: 80, height: 24, tileset: "test_stone", ...over }) as Entity;

describe("StructureRenderer platform tilesets", () => {
  it("draws tiles instead of procedural rects when the tileset is loaded", () => {
    const ctx = createMockContext2D();
    const renderer = new StructureRenderer(atlas as never, provider(32));

    renderer.render(ctx, [platform()], "en", 0);

    expect(ctx.getDrawImageCalls()).toHaveLength(3);
    expect(ctx.getFillRectCalls()).toHaveLength(0);
  });

  it("uses integer destination rects anchored at the rounded entity origin", () => {
    const ctx = createMockContext2D();
    const renderer = new StructureRenderer(atlas as never, provider(32));

    renderer.render(ctx, [platform()], "en", 0);

    for (const call of ctx.getDrawImageCalls()) {
      for (let i = 1; i < 9; i++) expect(Number.isInteger(call[i] as number)).toBe(true);
    }
    const first = ctx.getDrawImageCalls()[0];
    expect([first[5], first[6]]).toEqual([100, 201]);
  });

  it("scales hi-8bit source rects by tile / worldTile and crops the last column", () => {
    const ctx = createMockContext2D();
    const renderer = new StructureRenderer(atlas as never, provider(16));

    renderer.render(ctx, [platform()], "en", 0);

    const last = ctx.getDrawImageCalls()[2];
    expect([last[3], last[4]]).toEqual([8, 12]);
    expect([last[7], last[8]]).toEqual([16, 24]);
  });

  it("falls back to the procedural drawing without a tileset, with an unknown one, or while unloaded", () => {
    const withNone = createMockContext2D();
    const unknown = createMockContext2D();
    const unloaded = createMockContext2D();

    new StructureRenderer(atlas as never, provider(32)).render(withNone, [platform({ tileset: undefined })], "en", 0);
    new StructureRenderer(atlas as never, provider(32)).render(unknown, [platform({ tileset: "missing" })], "en", 0);
    new StructureRenderer(atlas as never, { resolve: () => null }).render(unloaded, [platform()], "en", 0);

    for (const ctx of [withNone, unknown, unloaded]) {
      expect(ctx.getDrawImageCalls()).toHaveLength(0);
      expect(ctx.getFillRectCalls().length).toBeGreaterThan(0);
    }
  });

  it("draws the same cells every frame and honours view culling", () => {
    const renderer = new StructureRenderer(atlas as never, provider(32));
    const a = createMockContext2D();
    const b = createMockContext2D();
    const e = platform();

    renderer.render(a, [e], "en", 0);
    renderer.render(b, [e], "en", 99);

    expect(b.getDrawImageCalls().map((c) => c.slice(1))).toEqual(a.getDrawImageCalls().map((c) => c.slice(1)));
    const culled = createMockContext2D();
    const view = { intersects: () => false, entitiesTotal: 0, entitiesDrawn: 0 };
    renderer.render(culled, [e], "en", 0, view as never);
    expect(culled.getDrawImageCalls()).toHaveLength(0);
  });

  it("tiles oneway platforms too", () => {
    const ctx = createMockContext2D();
    const meta = createTilesetMetaJson("wood", "oneway");
    const p: ITilesetProvider = {
      resolve: () => ({ meta: parseTilesetMeta(meta), tier: "mid", image: {} as CanvasImageSource, tile: 32 }),
    };

    new StructureRenderer(atlas as never, p).render(
      ctx,
      [platform({ type: CollisionType.OneWay, tileset: "wood", height: 14 })],
      "en",
      0
    );

    expect(ctx.getDrawImageCalls()).toHaveLength(3);
    expect(ctx.getDrawImageCalls()[0][4]).toBe(14);
  });
});
