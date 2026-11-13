import type { RgbaImage } from "../lib/png";
import type { PixelCanvas } from "./pixelCanvas";
import type { HueRemap } from "./quantize";
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
  /**
   * hi-16bit cell that replaces the one derived from `packedCell` (even numbers, hi-8bit is half of it). Set by the
   * compiler for painted sources whose frames do not fit the painted cell; never read from the packed meta.
   */
  cell?: HeroCell;
  /** Pixel column of the feet inside the first cell of every hi-16bit slot; replaces the body-box centre as origin. */
  anchorX?: number;
}

export type HeroDrawFn = (c: PixelCanvas, anim: string, frame: number, span: number) => void;

/** Tight rect of one painted frame in the painted PNG, the format of `frameRects` in `<id>_packed_meta.json`. */
export interface PaintedFrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Builds the hero tiers from the painted frames with the deterministic quantizer instead of drawing them. */
export interface PaintedSource {
  kind: "painted";
  /** Global palette size per tier (the darkest entry is the outline colour). */
  colors: { hi8bit: number; hi16bit: number };
  /** Reserved: dithering is not implemented, only `false` is accepted. */
  dither?: false;
  /** Hue remaps applied to the painted colours before the palettes are built (first match wins). */
  remap?: HueRemap[];
  /** Painted sheet to use instead of `<id>_level_1_high_packed.png` (tests). */
  image?: RgbaImage;
  /** Painted frame rects to use instead of the `frameRects` of the packed meta (tests). */
  frameRects?: Record<string, PaintedFrameRect>;
}

export interface HeroSpriteDefinition {
  id: string;
  description: string;
  grid?: HeroGrid;
  /** Painted source: every frame is built from the painted frame and `draw` hooks only touch it up afterwards. */
  source?: PaintedSource;
  /** Hand-drawn contract: both functions are required without a `source`; with one they run after the base. */
  draw?: { hi8bit?: HeroDrawFn; hi16bit?: HeroDrawFn };
}

export interface HeroCell {
  width: number;
  height: number;
}

/** Animations whose feet are allowed to leave the bottom row of the slot. */
export const AIRBORNE_ANIMATIONS: readonly string[] = ["jump", "fall"];

const evenUp = (n: number): number => n + (n % 2);

export const evenCeil = evenUp;

/** hi-16bit cell is the packed mid cell rounded up to even (unless the grid carries a fitted cell); hi-8bit is exactly half of it. */
export function heroCell(grid: HeroGrid, tier: Tier): HeroCell {
  const width = grid.cell?.width ?? evenUp(grid.packedCell.width);
  const height = grid.cell?.height ?? evenUp(grid.packedCell.height);
  return tier === "hi16bit" ? { width, height } : { width: width / 2, height: height / 2 };
}

/**
 * Cell width of a tier relative to the painted `mid` cell, so that the runtime draws every tier at the painted world size.
 * Independent of a fitted cell: hi-16bit frames are painted pixels 1:1, hi-8bit frames are half size.
 */
export function heroScale(grid: HeroGrid, tier: Tier): number {
  const factor = tier === "hi16bit" ? 1 : 0.5;
  return (evenUp(grid.packedCell.width) * factor) / grid.packedCell.width;
}

export function heroRows(grid: HeroGrid): number {
  return grid.ordering.length;
}

/** First column of frame `frame` inside its animation row. */
export function frameColumn(anim: HeroAnimationGrid, frame: number): number {
  return anim.cells.slice(0, frame).reduce((sum, span) => sum + span, 0);
}
