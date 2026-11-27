import { TRANSPARENT } from "./pixelCanvas";
import type { SheetImage } from "./render";
import { tileLayout, type TileCell } from "./tilesetLayout";
import { parseTileName } from "./tilesetNames";
import type { RenderedTileset } from "./tilesetRender";
import type { TilesetKind, TilesetSpriteDefinition } from "./tilesetTypes";
import { TIER_LABEL } from "./types";
import { sameAfterScaling } from "./validate";

export interface RenderedTilesets {
  hi8bit: RenderedTileset;
  hi16bit: RenderedTileset;
}

export interface TilesetCheck {
  problems: string[];
  warnings: string[];
}

/** Families whose left and right edges meet their own kind along a platform. */
const SEAM_FAMILIES: readonly string[] = ["top", "fill", "ledge", "bottom"];

/** Share of rows whose opaque/transparent edge may disagree before the seam is reported. */
const MAX_SEAM_MISMATCH = 0.25;

function pixelAt(sheet: SheetImage, cell: TileCell, x: number, y: number): number {
  return sheet.pixels[(cell.row * sheet.cell + y) * sheet.width + cell.col * sheet.cell + x];
}

function transparentCount(sheet: SheetImage, cell: TileCell): number {
  let count = 0;
  for (let y = 0; y < sheet.cell; y++) {
    for (let x = 0; x < sheet.cell; x++) {
      if (pixelAt(sheet, cell, x, y) === TRANSPARENT) count++;
    }
  }
  return count;
}

/** Oneway ledges hang over open air below the walkable surface, so their lower part may be transparent. */
function mayBeTransparent(kind: TilesetKind, name: string): boolean {
  const { base } = parseTileName(name);
  return kind === "oneway" && (base.startsWith("ledge") || base === "support");
}

function tierProblems(kind: TilesetKind, sheet: SheetImage, cells: readonly TileCell[]): string[] {
  const label = TIER_LABEL[sheet.tier];
  const area = sheet.cell * sheet.cell;
  return cells.flatMap((cell) => {
    const transparent = transparentCount(sheet, cell);
    if (transparent === area) return [`${label} tile "${cell.name}" is empty; draw something visible.`];
    if (transparent === 0 || mayBeTransparent(kind, cell.name)) return [];
    return [`${label} tile "${cell.name}" must be fully opaque: ${transparent} of ${area} pixels are transparent.`];
  });
}

function redrawProblems(rendered: RenderedTilesets, cells: readonly TileCell[]): string[] {
  const { hi8bit, hi16bit } = rendered;
  const area = hi8bit.sheet.cell * hi8bit.sheet.cell;
  return cells.flatMap((cell, index) => {
    if (transparentCount(hi8bit.sheet, cell) === area) return [];
    if (!sameAfterScaling(hi8bit.canvases[index], hi16bit.canvases[index])) return [];
    return [`hi-16bit tile "${cell.name}" is identical to hi-8bit scaled 2x; redraw it with more detail.`];
  });
}

function rowsWithDifferentEdge(sheet: SheetImage, right: TileCell, left: TileCell): number {
  let rows = 0;
  for (let y = 0; y < sheet.cell; y++) {
    const rightOpaque = pixelAt(sheet, right, sheet.cell - 1, y) !== TRANSPARENT;
    const leftOpaque = pixelAt(sheet, left, 0, y) !== TRANSPARENT;
    if (rightOpaque !== leftOpaque) rows++;
  }
  return rows;
}

function seamWarnings(sheet: SheetImage, cells: readonly TileCell[]): string[] {
  const label = TIER_LABEL[sheet.tier];
  const area = sheet.cell * sheet.cell;
  const family = cells.filter(
    (cell) => SEAM_FAMILIES.includes(parseTileName(cell.name).base) && transparentCount(sheet, cell) < area,
  );
  return family.flatMap((right) =>
    family.flatMap((left) => {
      const rows = rowsWithDifferentEdge(sheet, right, left);
      if (rows / sheet.cell <= MAX_SEAM_MISMATCH) return [];
      return [
        `${label} seam: "${right.name}" meets "${left.name}" on ${rows} of ${sheet.cell} rows with a different opaque/transparent edge; the walkable surface steps there.`,
      ];
    }),
  );
}

/** Collects every problem (fatal) and seam warning (advisory) for both tiers of a tileset. */
export function checkTileset(def: TilesetSpriteDefinition, rendered: RenderedTilesets): TilesetCheck {
  const { cells } = tileLayout(def.tiles);
  const problems = [
    ...tierProblems(def.kind, rendered.hi8bit.sheet, cells),
    ...tierProblems(def.kind, rendered.hi16bit.sheet, cells),
    ...redrawProblems(rendered, cells),
  ];
  const warnings = [...seamWarnings(rendered.hi8bit.sheet, cells), ...seamWarnings(rendered.hi16bit.sheet, cells)];
  return { problems, warnings };
}
