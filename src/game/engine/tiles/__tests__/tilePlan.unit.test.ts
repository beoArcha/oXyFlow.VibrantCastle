import { describe, it, expect } from "bun:test";
import { buildTilePlan, tileHash, PLAN_STRIDE } from "../tilePlan";
import { parseTilesetMeta, type TilesetMeta } from "../tilesetMeta";
import { createTilesetMetaJson } from "./tilesetFixtures";

const solid = (extra: readonly string[] = []): TilesetMeta => parseTilesetMeta(createTilesetMetaJson("s", "solid", extra));

interface Cell { col: number; row: number; dx: number; dy: number; w: number; h: number; ox: number; oy: number }

function cellsOf(meta: TilesetMeta, x: number, y: number, w: number, h: number): Cell[] {
  const plan = buildTilePlan(meta, x, y, w, h);
  const out: Cell[] = [];
  for (let i = 0; i < plan.count; i++) {
    const o = i * PLAN_STRIDE;
    const c = plan.cells;
    out.push({ col: c[o], row: c[o + 1], dx: c[o + 2], dy: c[o + 3], w: c[o + 4], h: c[o + 5], ox: c[o + 6], oy: c[o + 7] });
  }
  return out;
}

const at = (meta: TilesetMeta, name: string) => meta.tiles[name];
const nameOf = (meta: TilesetMeta, c: Cell) =>
  Object.keys(meta.tiles).find((n) => meta.tiles[n].col === c.col && meta.tiles[n].row === c.row);

describe("buildTilePlan", () => {
  it("lays a thin solid as one ledge row: left, ledge, right", () => {
    const meta = solid();

    const cells = cellsOf(meta, 0, 0, 96, 24);

    expect(cells.map((c) => nameOf(meta, c))).toEqual(["ledge_left", "ledge", "ledge_right"]);
    expect(cells.every((c) => c.h === 24 && c.oy === 0)).toBe(true);
  });

  it("lays a tall solid as top, middle and bottom rows", () => {
    const meta = solid();

    const cells = cellsOf(meta, 0, 0, 96, 96);

    expect(cells.map((c) => nameOf(meta, c))).toEqual([
      "top_left", "top", "top_right", "left", "fill", "right", "bottom_left", "bottom", "bottom_right",
    ]);
  });

  it("uses the centre column names for a one-tile-wide rect", () => {
    const meta = solid();

    const tall = cellsOf(meta, 0, 0, 32, 96);
    const thin = cellsOf(meta, 0, 0, 32, 32);

    expect(tall.map((c) => nameOf(meta, c))).toEqual(["top", "fill", "bottom"]);
    expect(thin).toHaveLength(1);
    expect([thin[0].col, thin[0].row]).toEqual([at(meta, "ledge").col, at(meta, "ledge").row]);
  });

  it("crops the last column and row, keeping the right and bottom borders", () => {
    const meta = solid();

    const cells = cellsOf(meta, 0, 0, 80, 50);

    const lastCol = cells.filter((c) => c.dx === 64);
    expect(lastCol.every((c) => c.w === 16 && c.ox === 16)).toBe(true);
    const lastRow = cells.filter((c) => c.dy === 32);
    expect(lastRow.every((c) => c.h === 18 && c.oy === 14)).toBe(true);
    expect(cells.filter((c) => c.dx < 64).every((c) => c.w === 32 && c.ox === 0)).toBe(true);
  });

  it("tiles the rect exactly: cell areas add up to the rect area", () => {
    const meta = solid();

    const cells = cellsOf(meta, 5, 9, 100, 70);

    expect(cells.reduce((sum, c) => sum + c.w * c.h, 0)).toBe(100 * 70);
  });

  it("is deterministic and picks across variants by position", () => {
    const meta = solid(["fill_2", "fill_3"]);

    const a = cellsOf(meta, 10, 20, 320, 320);
    const b = cellsOf(meta, 10, 20, 320, 320);

    const inner = a.filter((c) => c.dx > 0 && c.dx < 288 && c.dy > 0 && c.dy < 288);
    expect(b).toEqual(a);
    expect(new Set(inner.map((c) => `${c.col},${c.row}`)).size).toBeGreaterThan(1);
    expect(tileHash(1, 2, 3, 4)).toBe(tileHash(1, 2, 3, 4));
    expect(tileHash(1, 2, 3, 4)).not.toBe(tileHash(2, 1, 3, 4));
  });

  it("adds oneway supports every third tile when the tileset ships one", () => {
    const meta = parseTilesetMeta(createTilesetMetaJson("w", "oneway", ["support"]));

    const cells = cellsOf(meta, 0, 0, 320, 14);

    const supports = cells.filter((c) => nameOf(meta, c) === "support");
    expect(supports.map((c) => c.dx)).toEqual([32, 128, 224]);
    expect(supports.every((c) => c.dy === 14 && c.h === 32)).toBe(true);
  });

  it("draws a oneway as a single ledge row even when the rect is tall", () => {
    const meta = parseTilesetMeta(createTilesetMetaJson("w", "oneway"));

    const cells = cellsOf(meta, 0, 0, 64, 90);

    expect(cells).toHaveLength(2);
    expect(cells.every((c) => c.h === 32)).toBe(true);
  });
});
