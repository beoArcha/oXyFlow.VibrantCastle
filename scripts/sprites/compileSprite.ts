import { spriteError } from "./errors";
import { idleBounds, normalizeBounds } from "./frameStats";
import { buildMeta } from "./metaBuilder";
import { buildSheet, renderTier, type SheetImage } from "./render";
import { sheetToSvg } from "./svgWriter";
import type { EnemySpriteDefinition } from "./types";
import { validateSprite } from "./validate";

export interface CompiledSprite {
  nesSvg: string;
  snesSvg: string;
  metaJson: string;
  warnings: string[];
  sheets: { nes: SheetImage; snes: SheetImage };
}

/** Renders, validates and serialises one sprite without touching the disk. */
export function compileEnemySprite(def: EnemySpriteDefinition): CompiledSprite {
  const nes = renderTier(def, "nes");
  const snes = renderTier(def, "snes");
  const warnings = validateSprite(def, nes, snes);
  const bounds = idleBounds(snes);
  if (!bounds) throw spriteError(`Sprite "${def.id}" has no opaque idle pixels.`, { id: def.id });
  const bodyBox = normalizeBounds(bounds, snes.cell);
  const sheets = { nes: buildSheet(def, nes), snes: buildSheet(def, snes) };
  return {
    nesSvg: sheetToSvg(sheets.nes),
    snesSvg: sheetToSvg(sheets.snes),
    metaJson: `${JSON.stringify(buildMeta(def, bodyBox), null, 2)}\n`,
    warnings,
    sheets,
  };
}
