import { spriteError } from "./errors";
import { frameColumn, heroCell, heroRows, type HeroCell, type HeroGrid, type HeroSpriteDefinition } from "./heroTypes";
import { PixelCanvas, TRANSPARENT } from "./pixelCanvas";
import { blit, type SheetImage } from "./render";
import { TIER_LABEL, type Tier } from "./types";

export interface RenderedHeroTier {
  tier: Tier;
  cell: HeroCell;
  frames: Record<string, PixelCanvas[]>;
}

function drawFrame(def: HeroSpriteDefinition, tier: Tier, cell: HeroCell, anim: string, frame: number, span: number) {
  const canvas = new PixelCanvas(cell.width * span, cell.height);
  runHeroDraw(def, tier, canvas, anim, frame, span);
  return canvas;
}

/** Runs the draw function of one tier on a canvas, naming tier, animation and frame in any error. */
export function runHeroDraw(def: HeroSpriteDefinition, tier: Tier, canvas: PixelCanvas, anim: string, frame: number, span: number): void {
  const draw = def.draw?.[tier];
  if (!draw) return;
  try {
    draw(canvas, anim, frame, span);
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw spriteError(
      `Hero "${def.id}" ${TIER_LABEL[tier]} animation "${anim}" frame ${frame}: ${reason}`,
      { id: def.id, tier, anim, frame },
      cause,
    );
  }
}

export function renderHeroTier(def: HeroSpriteDefinition, grid: HeroGrid, tier: Tier): RenderedHeroTier {
  const cell = heroCell(grid, tier);
  const frames: RenderedHeroTier["frames"] = {};
  for (const name of grid.ordering) {
    frames[name] = grid.animations[name].cells.map((span, frame) => drawFrame(def, tier, cell, name, frame, span));
  }
  return { tier, cell, frames };
}

export function buildHeroSheet(grid: HeroGrid, rendered: RenderedHeroTier): SheetImage {
  const { cell, tier } = rendered;
  const width = grid.columns * cell.width;
  const height = heroRows(grid) * cell.height;
  const pixels = new Int32Array(width * height).fill(TRANSPARENT);
  grid.ordering.forEach((name, row) => {
    const anim = grid.animations[name];
    rendered.frames[name].forEach((canvas, frame) => {
      blit(canvas, pixels, width, frameColumn(anim, frame) * cell.width, row * cell.height, tier);
    });
  });
  return { tier, cell: cell.width, cellHeight: cell.height, columns: grid.columns, rows: heroRows(grid), width, height, pixels };
}
