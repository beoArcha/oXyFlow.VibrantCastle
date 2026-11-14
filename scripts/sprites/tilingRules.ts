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

/** Integer hash of a tile position and its platform origin; a fixed input always gives the same variant. */
export function variantHash(col: number, row: number, originX: number, originY: number): number {
  let h = Math.imul(col, 0x9e3779b1) ^ Math.imul(row, 0x85ebca77) ^ Math.imul(originX, 0xc2b2ae3d) ^ Math.imul(originY, 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  return (h ^ (h >>> 13)) >>> 0;
}

/** Picks the base tile or one of its numbered variants for a position; stable across frames. */
export function chooseTile(tiles: readonly string[], base: string, col: number, row: number, originX: number, originY: number): string {
  const choices = [base, ...variantsOf(tiles, base)];
  return choices[variantHash(col, row, originX, originY) % choices.length];
}
