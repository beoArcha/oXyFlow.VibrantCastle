import { variantsOf } from "./tilesetNames";

/** Base names for a thin platform: `ledge_left`, middle `ledge`, `ledge_right`; one cell uses `ledge` only. */
export function stripBaseNames(width: number): string[] {
  if (width === 1) return ["ledge"];
  return ["ledge_left", ...Array.from({ length: width - 2 }, () => "ledge"), "ledge_right"];
}

/** Base names for a tall platform, row-major; a single column uses the middle names only. */
export function blockBaseNames(columns: number, rows: number): string[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, col) => blockBaseName(row, col, columns, rows)),
  );
}

function sideOf(col: number, columns: number): string {
  if (columns === 1) return "";
  if (col === 0) return "left";
  return col === columns - 1 ? "right" : "";
}

function blockBaseName(row: number, col: number, columns: number, rows: number): string {
  const side = sideOf(col, columns);
  if (row === 0) return side ? `top_${side}` : "top";
  if (row === rows - 1) return side ? `bottom_${side}` : "bottom";
  return side || "fill";
}

/**
 * Integer hash of a tile position and its platform origin; a fixed input always gives the same variant.
 * Must stay identical to `tileHash` in src/game/engine/tiles/tilePlan.ts (scripts cannot import the runtime),
 * so the tiling demo shows the same variants the game draws.
 */
export function variantHash(col: number, row: number, originX: number, originY: number): number {
  let h = Math.imul(col | 0, 73856093) ^ Math.imul(row | 0, 19349663);
  h ^= Math.imul(Math.round(originX) | 0, 83492791) ^ Math.imul(Math.round(originY) | 0, 668265263);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return (h ^ (h >>> 16)) >>> 0;
}

const variantNumber = (name: string): number => Number(/_(\d+)$/.exec(name)?.[1] ?? 0);

/** Picks the base tile or one of its numbered variants (base first, then `_2`, `_3`... in numeric order, like the runtime). */
export function chooseTile(tiles: readonly string[], base: string, col: number, row: number, originX: number, originY: number): string {
  const variants = variantsOf(tiles, base).sort((a, b) => variantNumber(a) - variantNumber(b));
  const choices = [base, ...variants];
  return choices[variantHash(col, row, originX, originY) % choices.length];
}
