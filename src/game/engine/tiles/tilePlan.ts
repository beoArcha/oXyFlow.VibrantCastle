import type { TileCell, TilesetMeta } from "./tilesetMeta";

/** Number of integers per cell in `TilePlan.cells`. */
export const PLAN_STRIDE = 8;

/**
 * Pre-computed draw list for one platform rectangle. Each cell is `PLAN_STRIDE` integers:
 * `col, row` (sheet cell), `dx, dy` (destination offset from the entity origin, world units),
 * `w, h` (visible size, world units, at most one tile) and `ox, oy` (source offset inside the tile,
 * world units, used by cropped edge tiles that keep their border visible).
 */
export interface TilePlan {
  readonly width: number;
  readonly height: number;
  readonly count: number;
  readonly cells: Int32Array;
}

/** Deterministic hash of a tile position, stable across frames and reloads. */
export function tileHash(col: number, row: number, x: number, y: number): number {
  let h = Math.imul(col | 0, 73856093) ^ Math.imul(row | 0, 19349663);
  h ^= Math.imul(Math.round(x) | 0, 83492791) ^ Math.imul(Math.round(y) | 0, 668265263);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return (h ^ (h >>> 16)) >>> 0;
}

function pick(meta: TilesetMeta, name: string, col: number, row: number, x: number, y: number): TileCell {
  const options = meta.choices[name] ?? [meta.tiles[name]];
  return options.length === 1 ? options[0] : options[tileHash(col, row, x, y) % options.length];
}

const SUPPORT_EVERY = 3;

/**
 * Lays the tiles of a platform rectangle (see the tileset contract):
 * grid anchored at the top-left, thin rects use one ledge row, tall solids use top / middle / bottom
 * rows, one-tile-wide rects use the centre column names, the last column and row are cropped.
 * Cropped last column / row keep their right / bottom border; cropped ledge rows keep their top rim.
 */
export function buildTilePlan(meta: TilesetMeta, x: number, y: number, width: number, height: number): TilePlan {
  const wt = meta.worldTile;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const cols = Math.ceil(w / wt);
  const thin = meta.kind === "oneway" || h <= wt;
  const rows = thin ? 1 : Math.ceil(h / wt);
  const hasSupport = meta.kind === "oneway" && "support" in meta.tiles;
  const out: number[] = [];

  for (let r = 0; r < rows; r++) {
    const cellH = thin ? Math.min(h, wt) : Math.min(wt, h - r * wt);
    const lastRow = r === rows - 1;
    const oy = !thin && lastRow && rows > 1 ? wt - cellH : 0;
    for (let c = 0; c < cols; c++) {
      const cellW = Math.min(wt, w - c * wt);
      const lastCol = c === cols - 1;
      const side = cols === 1 ? "" : c === 0 ? "_left" : lastCol ? "_right" : "";
      let base: string;
      if (thin) base = `ledge${side}`;
      else if (r === 0) base = `top${side}`;
      else if (lastRow) base = `bottom${side}`;
      else base = side === "" ? "fill" : side.slice(1);
      const cell = pick(meta, base, c, r, x, y);
      const ox = lastCol && cols > 1 ? wt - cellW : 0;
      out.push(cell.col, cell.row, c * wt, r * wt, cellW, cellH, ox, oy);
    }
  }

  if (hasSupport) {
    const drop = Math.min(h, wt);
    for (let c = 1; c < cols; c += SUPPORT_EVERY) {
      const cellW = Math.min(wt, w - c * wt);
      const cell = pick(meta, "support", c, 1, x, y);
      out.push(cell.col, cell.row, c * wt, drop, cellW, wt, 0, 0);
    }
  }
  return { width, height, count: out.length / PLAN_STRIDE, cells: Int32Array.from(out) };
}
