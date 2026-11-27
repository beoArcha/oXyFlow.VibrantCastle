import { spriteError } from "../errors";
import { measure } from "../frameStats";
import { PixelCanvas, TRANSPARENT } from "../pixelCanvas";
import { blit, type SheetImage } from "../render";
import { sheetToSvg } from "../svgWriter";

export type AssetCategory = "enemies" | "structures" | "props";

export type Hi8bitDrawFn = (c: PixelCanvas, rowName: string, row: number, frame: number) => void;

export interface Hi8bitDefinition {
  id: string;
  category: AssetCategory;
  description: string;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  rows: readonly string[];
  /** Keeps 1 px transparent margin on top/left/right; bottom margin required only when false. */
  requireBottomMargin: boolean;
  draw: Hi8bitDrawFn;
}

const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

/** Validates a hi-8bit placeholder sprite definition and returns it unchanged. */
export function defineHi8bit(def: Hi8bitDefinition): Hi8bitDefinition {
  if (!ID_PATTERN.test(def.id)) {
    throw spriteError(`Hi8bit sprite id ${JSON.stringify(def.id)} must be snake_case.`, { id: def.id });
  }
  if (!Number.isInteger(def.cellWidth) || def.cellWidth < 8 || !Number.isInteger(def.cellHeight) || def.cellHeight < 8) {
    throw spriteError(`Hi8bit sprite "${def.id}" needs integer cell dimensions >= 8.`, { id: def.id });
  }
  if (!Number.isInteger(def.columns) || def.columns < 1 || def.rows.length < 1) {
    throw spriteError(`Hi8bit sprite "${def.id}" needs at least 1 column and 1 row.`, { id: def.id });
  }
  if (typeof def.draw !== "function") {
    throw spriteError(`Hi8bit sprite "${def.id}" needs a draw function.`, { id: def.id });
  }
  return def;
}

function validateCell(def: Hi8bitDefinition, canvas: PixelCanvas, rowName: string, frame: number): string[] {
  const at = `"${def.id}" ${rowName} frame ${frame}`;
  const bounds = measure(canvas);
  if (!bounds) return [`${at}: frame is empty.`];

  const problems: string[] = [];
  if (bounds.minX === 0) problems.push(`${at}: opaque pixels touch left edge.`);
  if (bounds.maxX === def.cellWidth - 1) problems.push(`${at}: opaque pixels touch right edge.`);
  if (bounds.minY === 0) problems.push(`${at}: opaque pixels touch top edge.`);
  if (def.requireBottomMargin && bounds.maxY === def.cellHeight - 1) {
    problems.push(`${at}: opaque pixels touch bottom edge.`);
  }
  return problems;
}

/** Renders and validates every cell of a hi-8bit placeholder into a crisp SVG string. */
export function compileHi8bitSvg(def: Hi8bitDefinition): string {
  const width = def.columns * def.cellWidth;
  const height = def.rows.length * def.cellHeight;
  const pixels = new Int32Array(width * height).fill(TRANSPARENT);
  const problems: string[] = [];

  def.rows.forEach((rowName, row) => {
    for (let col = 0; col < def.columns; col++) {
      const cell = new PixelCanvas(def.cellWidth, def.cellHeight);
      def.draw(cell, rowName, row, col);
      problems.push(...validateCell(def, cell, rowName, col));
      blit(cell, pixels, width, col * def.cellWidth, row * def.cellHeight, "hi8bit");
    }
  });

  if (problems.length > 0) {
    throw spriteError(`Hi8bit sprite "${def.id}" failed validation:\n  - ${problems.join("\n  - ")}`, {
      id: def.id,
      problems,
    });
  }

  const sheet: SheetImage = {
    tier: "hi8bit",
    cell: def.cellWidth,
    cellHeight: def.cellHeight,
    columns: def.columns,
    rows: def.rows.length,
    width,
    height,
    pixels,
  };
  return sheetToSvg(sheet);
}
