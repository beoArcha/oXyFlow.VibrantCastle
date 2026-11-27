import { defineHeroSprite } from "../defineHeroSprite";
import type { HeroDrawFn, HeroGrid, HeroSpriteDefinition } from "../heroTypes";
import type { PixelCanvas } from "../pixelCanvas";

/** hi-16bit cell 40x48, hi-8bit cell 20x24; idle has two frames, jump is airborne, attack is one wide slot. */
export const MINIMAL_GRID: HeroGrid = {
  ordering: ["idle", "jump", "attack"],
  columns: 2,
  packedCell: { width: 40, height: 48 },
  animations: {
    idle: { row: 0, frames: 2, fps: 4, loop: true, cells: [1, 1] },
    jump: { row: 1, frames: 1, fps: 6, loop: false, cells: [1] },
    attack: { row: 2, frames: 1, fps: 8, loop: false, cells: [2] },
  },
};

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 8x18 block in hi-8bit units: feet on the bottom row (y = 23), 75 % of the cell height. */
export const VALID_BLOCK: Block = { x: 6, y: 6, w: 8, h: 18 };

export function drawBlock(c: PixelCanvas, block: Block, scale: number, color: string, shift = 0): void {
  c.rect((block.x + shift) * scale, block.y * scale, block.w * scale, block.h * scale, color);
}

const airborneOffset = (anim: string): number => (anim === "jump" ? -4 : 0);

export const hi8bitBlock: HeroDrawFn = (c, anim, frame) =>
  drawBlock(c, { ...VALID_BLOCK, y: VALID_BLOCK.y + airborneOffset(anim) }, 1, "#888", frame);

export const hi16bitBlock: HeroDrawFn = (c, anim, frame) =>
  drawBlock(c, { ...VALID_BLOCK, y: VALID_BLOCK.y + airborneOffset(anim) }, 2, "#a99", frame);

/** Smallest hero that compiles; override single fields to build a failing case. */
export function aHero(overrides: Partial<HeroSpriteDefinition> = {}): HeroSpriteDefinition {
  return defineHeroSprite({
    id: "test_hero",
    description: "Minimal block hero used by compiler tests.",
    grid: MINIMAL_GRID,
    draw: { hi8bit: hi8bitBlock, hi16bit: hi16bitBlock },
    ...overrides,
  });
}
