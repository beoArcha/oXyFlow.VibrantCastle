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

/** Renders, validates and serialises one sprite without touching the disk. */
export function compileEnemySprite(def: EnemySpriteDefinition): CompiledEnemy {
  const hi8bit = renderTier(def, "hi8bit");
  const hi16bit = renderTier(def, "hi16bit");
  const warnings = validateSprite(def, hi8bit, hi16bit);
  const bounds = idleBounds(hi16bit);
  if (!bounds) throw spriteError(`Sprite "${def.id}" has no opaque idle pixels.`, { id: def.id });
  const bodyBox = normalizeBounds(bounds, hi16bit.cell);
  const sheets = { hi8bit: buildSheet(def, hi8bit), hi16bit: buildSheet(def, hi16bit) };
  return {
    hi8bitSvg: sheetToSvg(sheets.hi8bit),
    hi16bitSvg: sheetToSvg(sheets.hi16bit),
    metaJson: `${JSON.stringify(buildMeta(def, bodyBox), null, 2)}\n`,
    warnings,
    sheets,
  };
}
