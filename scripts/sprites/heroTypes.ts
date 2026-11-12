import type { PixelCanvas } from "./pixelCanvas";
import type { Tier } from "./types";

export interface HeroAnimationGrid {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
  /** Column span of each frame; frame f starts at the sum of the spans before it. */
  cells: number[];
}

export interface HeroGrid {
  /** Row order of the sheet. */
  ordering: string[];
  columns: number;
  /** Packed `mid` cell of the painted sheet; both retro cells are derived from it. */
  packedCell: { width: number; height: number };
  animations: Record<string, HeroAnimationGrid>;
}

export type HeroDrawFn = (c: PixelCanvas, anim: string, frame: number, span: number) => void;

export interface HeroSpriteDefinition {
  id: string;
  description: string;
  grid?: HeroGrid;
  draw: { hi8bit: HeroDrawFn; hi16bit: HeroDrawFn };
}

export interface HeroCell {
  width: number;
  height: number;
}

/** Animations whose feet are allowed to leave the bottom row of the slot. */
export const AIRBORNE_ANIMATIONS: readonly string[] = ["jump", "fall"];

const evenUp = (n: number): number => n + (n % 2);

/** hi-16bit cell is the packed mid cell rounded up to even; hi-8bit is exactly half of it. */
export function heroCell(grid: HeroGrid, tier: Tier): HeroCell {
  const width = evenUp(grid.packedCell.width);
  const height = evenUp(grid.packedCell.height);
  return tier === "hi16bit" ? { width, height } : { width: width / 2, height: height / 2 };
}

export function heroRows(grid: HeroGrid): number {
  return grid.ordering.length;
}

/** First column of frame `frame` inside its animation row. */
export function frameColumn(anim: HeroAnimationGrid, frame: number): number {
  return anim.cells.slice(0, frame).reduce((sum, span) => sum + span, 0);
}
