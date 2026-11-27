import { spriteError } from "./errors";
import { idleBounds, normalizeBounds } from "./frameStats";
import { buildMeta } from "./metaBuilder";
import { buildSheet, renderTier, type SheetImage } from "./render";
import { sheetToSvg } from "./svgWriter";
import type { EnemySpriteDefinition } from "./types";
import { validateSprite } from "./validate";

interface CompiledBase {
  metaJson: string;
  warnings: string[];
  sheets: { hi8bit: SheetImage; hi16bit: SheetImage };
}

/** Enemies ship their sheets as SVG. */
export interface CompiledEnemy extends CompiledBase {
  hi8bitSvg: string;
  hi16bitSvg: string;
}

/** Heroes ship their sheets as lossless PNG: quantized painted frames make SVGs many times larger. */
export interface CompiledHero extends CompiledBase {
  hi8bitPng: Uint8Array;
  hi16bitPng: Uint8Array;
}

export type CompiledSprite = CompiledEnemy | CompiledHero;

import { cellSize } from "./types";

function mergeEnemyBaseMeta(def: EnemySpriteDefinition, bodyBox: ReturnType<typeof normalizeBounds>) {
  const base = structuredClone(def.baseMeta ?? {});
  const hi8bitCell = cellSize(def, "hi8bit");
  const hi16bitCell = cellSize(def, "hi16bit");
  const existingVariants = (base.variants as Record<string, unknown> | undefined) ?? {};
  const highCellW = Number((base.atlas as { cellWidth?: number } | undefined)?.cellWidth) || hi16bitCell;
  base.variants = {
    ...existingVariants,
    low: {
      cellWidth: hi8bitCell,
      cellHeight: hi8bitCell,
      scale: Math.round((hi8bitCell / highCellW) * 10000) / 10000,
      file: `${def.id}_hi8bit.svg`,
    },
    mid: {
      cellWidth: hi16bitCell,
      cellHeight: hi16bitCell,
      scale: Math.round((hi16bitCell / highCellW) * 10000) / 10000,
      file: `${def.id}_hi16bit.svg`,
    },
  };
  if (def.metaStates) {
    const existingStates = (base.states as Record<string, unknown> | undefined) ?? {};
    base.states = { ...existingStates, ...def.metaStates };
  }
  const layout = (base.layout as Record<string, unknown> | undefined) ?? {};
  if (!layout.bodyBox) {
    base.layout = { ...layout, bodyBox };
  }
  return base;
}

/** Renders, validates and serialises one sprite without touching the disk. */
export function compileEnemySprite(def: EnemySpriteDefinition): CompiledEnemy {
  const hi8bit = renderTier(def, "hi8bit");
  const hi16bit = renderTier(def, "hi16bit");
  const warnings = validateSprite(def, hi8bit, hi16bit);
  const bounds = idleBounds(hi16bit);
  if (!bounds) throw spriteError(`Sprite "${def.id}" has no opaque idle pixels.`, { id: def.id });
  const bodyBox = normalizeBounds(bounds, hi16bit.cell);
  const sheets = { hi8bit: buildSheet(def, hi8bit), hi16bit: buildSheet(def, hi16bit) };
  const meta = def.baseMeta ? mergeEnemyBaseMeta(def, bodyBox) : buildMeta(def, bodyBox);
  return {
    hi8bitSvg: sheetToSvg(sheets.hi8bit),
    hi16bitSvg: sheetToSvg(sheets.hi16bit),
    metaJson: `${JSON.stringify(meta, null, 2)}\n`,
    warnings,
    sheets,
  };
}
