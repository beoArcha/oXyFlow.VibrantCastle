import { spriteError } from "./errors";
import { idleBounds, normalizeBounds } from "./frameStats";
import { buildMeta } from "./metaBuilder";
import { buildSheet, renderTier, type SheetImage } from "./render";
import { sheetToSvg } from "./svgWriter";
import type { EnemySpriteDefinition } from "./types";
import { validateSprite } from "./validate";

export interface CompiledSprite {
  hi8bitSvg: string;
  hi16bitSvg: string;
  metaJson: string;
  warnings: string[];
  sheets: { hi8bit: SheetImage; hi16bit: SheetImage };
}

/** Renders, validates and serialises one sprite without touching the disk. */
export function compileEnemySprite(def: EnemySpriteDefinition): CompiledSprite {
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
