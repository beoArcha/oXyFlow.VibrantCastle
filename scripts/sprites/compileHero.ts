import type { CompiledHero } from "./compileSprite";
import { spriteError } from "./errors";
import { assertGrid, loadPackedGrid } from "./heroGrid";
import { buildHeroMeta, heroBodyBox } from "./heroMeta";
import { buildHeroSheet, renderHeroTier, type RenderedHeroTier } from "./heroRender";
import type { HeroGrid, HeroSpriteDefinition } from "./heroTypes";
import { loadPaintedFiles, renderPaintedHero } from "./paintedHero";
import { validateHero } from "./heroValidate";
import { sheetToPng } from "./sheetPng";

/** The inline grid when given, otherwise the grid derived from the packed meta of the painted character. */
export function resolveHeroGrid(def: HeroSpriteDefinition, charactersDir: string): HeroGrid {
  if (!def.grid) return loadPackedGrid(def.id, charactersDir);
  assertGrid(def.id, def.grid);
  return def.grid;
}

interface RenderedHero {
  grid: HeroGrid;
  hi8bit: RenderedHeroTier;
  hi16bit: RenderedHeroTier;
}

function renderHero(def: HeroSpriteDefinition, charactersDir: string): RenderedHero {
  const grid = resolveHeroGrid(def, charactersDir);
  if (def.source) return renderPaintedHero(def, grid, loadPaintedFiles(def, charactersDir));
  return { grid, hi8bit: renderHeroTier(def, grid, "hi8bit"), hi16bit: renderHeroTier(def, grid, "hi16bit") };
}

/** Renders, validates and serialises one hero without touching the disk (apart from reading the packed meta). */
export function compileHeroSprite(def: HeroSpriteDefinition, charactersDir: string): CompiledHero {
  const { grid, hi8bit, hi16bit } = renderHero(def, charactersDir);
  const warnings = validateHero(def, grid, hi8bit, hi16bit);
  const bodyBox = heroBodyBox(hi16bit);
  if (!bodyBox) throw spriteError(`Hero "${def.id}" has no opaque idle pixels.`, { id: def.id });
  const sheets = { hi8bit: buildHeroSheet(grid, hi8bit), hi16bit: buildHeroSheet(grid, hi16bit) };
  return {
    hi8bitPng: sheetToPng(sheets.hi8bit),
    hi16bitPng: sheetToPng(sheets.hi16bit),
    metaJson: `${JSON.stringify(buildHeroMeta(def, grid, { hi8bit, hi16bit }, bodyBox), null, 2)}\n`,
    warnings,
    sheets,
  };
}
