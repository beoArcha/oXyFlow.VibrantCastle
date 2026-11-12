import type { CompiledSprite } from "./compileSprite";
import { spriteError } from "./errors";
import { assertGrid, loadPackedGrid } from "./heroGrid";
import { buildHeroMeta, heroBodyBox } from "./heroMeta";
import { buildHeroSheet, renderHeroTier } from "./heroRender";
import type { HeroGrid, HeroSpriteDefinition } from "./heroTypes";
import { validateHero } from "./heroValidate";
import { sheetToSvg } from "./svgWriter";

/** The inline grid when given, otherwise the grid derived from the packed meta of the painted character. */
export function resolveHeroGrid(def: HeroSpriteDefinition, charactersDir: string): HeroGrid {
  if (!def.grid) return loadPackedGrid(def.id, charactersDir);
  assertGrid(def.id, def.grid);
  return def.grid;
}

/** Renders, validates and serialises one hero without touching the disk (apart from reading the packed meta). */
export function compileHeroSprite(def: HeroSpriteDefinition, charactersDir: string): CompiledSprite {
  const grid = resolveHeroGrid(def, charactersDir);
  const hi8bit = renderHeroTier(def, grid, "hi8bit");
  const hi16bit = renderHeroTier(def, grid, "hi16bit");
  const warnings = validateHero(def, grid, hi8bit, hi16bit);
  const bodyBox = heroBodyBox(hi16bit);
  if (!bodyBox) throw spriteError(`Hero "${def.id}" has no opaque idle pixels.`, { id: def.id });
  const sheets = { hi8bit: buildHeroSheet(grid, hi8bit), hi16bit: buildHeroSheet(grid, hi16bit) };
  return {
    hi8bitSvg: sheetToSvg(sheets.hi8bit),
    hi16bitSvg: sheetToSvg(sheets.hi16bit),
    metaJson: `${JSON.stringify(buildHeroMeta(def, grid, { hi8bit, hi16bit }, bodyBox), null, 2)}\n`,
    warnings,
    sheets,
  };
}
