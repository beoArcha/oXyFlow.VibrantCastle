import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { decodePngFile, type RgbaImage } from "../lib/png";
import { spriteError } from "./errors";
import { measure } from "./frameStats";
import {
  evenCeil,
  heroCell,
  type HeroCell,
  type HeroGrid,
  type HeroSpriteDefinition,
  type PaintedFrameRect,
  type PaintedSource,
} from "./heroTypes";
import { runHeroDraw, type RenderedHeroTier } from "./heroRender";
import { PixelCanvas, TRANSPARENT } from "./pixelCanvas";
import {
  addToHistogram,
  ALPHA_CUTOFF,
  applyPalette,
  buildPalette,
  downscale2x,
  remapColor,
  thresholdAlpha,
} from "./quantize";
import { toHex } from "./colors";
import type { Tier } from "./types";

/**
 * Transparent hi-16bit pixels kept free on the left, right and top of every frame. The outline of hi-8bit is one
 * hi-8bit pixel (two hi-16bit pixels) wide and validation wants one transparent pixel beyond it.
 */
export const PAINTED_MARGIN = 4;

/** Painted sheet name inside the character folder: the full-size painting every quality is derived from. */
export const paintedSheetName = (id: string): string => `${id}_level_1_high_packed.png`;

/** One painted frame: its opaque pixels cut out of the sheet and the feet column the runtime anchors it by. */
export interface PaintedFrame {
  anim: string;
  frame: number;
  span: number;
  /** Cropped RGBA of the opaque (alpha >= 50 %) bounds. */
  image: RgbaImage;
  /** Feet column inside the cropped frame: mean x of the opaque pixels of the lowest quarter of its height. */
  footX: number;
}

function cropOpaque(sheet: RgbaImage, rect: PaintedFrameRect, label: string): RgbaImage {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;
  const x1 = Math.min(sheet.width, rect.x + rect.width);
  const y1 = Math.min(sheet.height, rect.y + rect.height);
  for (let y = Math.max(0, rect.y); y < y1; y++) {
    for (let x = Math.max(0, rect.x); x < x1; x++) {
      if (sheet.data[(y * sheet.width + x) * 4 + 3] < ALPHA_CUTOFF) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) throw spriteError(`Painted frame ${label}: the rect ${JSON.stringify(rect)} holds no opaque pixels.`, { label, rect });
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const from = ((minY + y) * sheet.width + minX) * 4;
    data.set(sheet.data.subarray(from, from + width * 4), y * width * 4);
  }
  return { width, height, data };
}

/**
 * Mean x of the opaque pixels in the lowest quarter (at least four rows) of the frame. This is exactly how the runtime
 * finds the feet of a painted frame (`IslandDetector`), so anchoring the same column keeps painted and pixel frames aligned.
 */
export function footColumn(image: RgbaImage): number {
  const rows = Math.max(4, Math.round(image.height * 0.25));
  let sum = 0;
  let count = 0;
  for (let y = Math.max(0, image.height - 1 - rows); y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (image.data[(y * image.width + x) * 4 + 3] < ALPHA_CUTOFF) continue;
      sum += x;
      count++;
    }
  }
  return count > 0 ? Math.round(sum / count) : Math.round(image.width / 2);
}

export interface PaintedFiles {
  sheet: RgbaImage;
  frameRects: Record<string, PaintedFrameRect>;
}

function readFrameRects(file: string, id: string): Record<string, PaintedFrameRect> {
  const raw = JSON.parse(readFileSync(file, "utf8")) as { frameRects?: Record<string, PaintedFrameRect> };
  if (!raw.frameRects) throw spriteError(`Packed meta of "${id}" has no frameRects; a painted source needs them.`, { id, file });
  return raw.frameRects;
}

/** The painted sheet and frame rects of a hero: injected by the definition (tests) or read from its character folder. */
export function loadPaintedFiles(def: HeroSpriteDefinition, charactersDir: string): PaintedFiles {
  const source = def.source;
  if (!source) throw spriteError(`Hero "${def.id}" has no painted source.`, { id: def.id });
  if (source.image && source.frameRects) return { sheet: source.image, frameRects: source.frameRects };
  const folder = join(charactersDir, def.id);
  const png = join(folder, paintedSheetName(def.id));
  const meta = join(folder, `${def.id}_packed_meta.json`);
  for (const file of [png, meta]) {
    if (!existsSync(file)) throw spriteError(`Hero "${def.id}" needs the painted source file ${file}.`, { id: def.id, file });
  }
  return { sheet: source.image ?? decodePngFile(png), frameRects: source.frameRects ?? readFrameRects(meta, def.id) };
}

export function extractPaintedFrames(grid: HeroGrid, files: PaintedFiles): PaintedFrame[] {
  return grid.ordering.flatMap((anim) =>
    grid.animations[anim].cells.map((span, frame) => {
      const rect = files.frameRects[`${anim}_${frame}`];
      if (!rect) throw spriteError(`Painted frame ${anim}_${frame} has no entry in frameRects.`, { anim, frame });
      const image = cropOpaque(files.sheet, rect, `${anim}_${frame}`);
      return { anim, frame, span, image, footX: footColumn(image) };
    }),
  );
}

/**
 * Grows the hi-16bit cell until every painted frame fits its slot at 1:1 and picks the feet column shared by all slots.
 * The cell never shrinks below the painted one; hi-8bit stays exactly half of it (both are even).
 */
export function fitPaintedGrid(grid: HeroGrid, frames: readonly PaintedFrame[]): HeroGrid {
  const base = heroCell(grid, "hi16bit");
  const anchorX = evenCeil(Math.max(...frames.map((f) => f.footX)) + PAINTED_MARGIN);
  let width = base.width;
  let height = base.height;
  for (const f of frames) {
    const right = anchorX - f.footX + f.image.width + PAINTED_MARGIN;
    width = Math.max(width, Math.ceil(right / f.span));
    height = Math.max(height, f.image.height + PAINTED_MARGIN);
  }
  const cell: HeroCell = { width: evenCeil(width), height: evenCeil(height) };
  return { ...grid, cell, anchorX };
}

/** The hi-16bit RGBA of one slot: the painted frame at 1:1, feet column on `anchorX`, lowest opaque row on the bottom row. */
export function placeFrame(frame: PaintedFrame, cell: HeroCell, anchorX: number): RgbaImage {
  const width = cell.width * frame.span;
  const out = new Uint8Array(width * cell.height * 4);
  const left = anchorX - frame.footX;
  const top = cell.height - frame.image.height;
  const { image } = frame;
  if (left < 0 || left + image.width > width || top < 0) {
    throw spriteError(`Painted frame ${frame.anim}_${frame.frame} does not fit its ${width}x${cell.height} slot.`, { anim: frame.anim, frame: frame.frame });
  }
  for (let y = 0; y < image.height; y++) {
    const from = y * image.width * 4;
    out.set(image.data.subarray(from, from + image.width * 4), ((top + y) * width + left) * 4);
  }
  return { width, height: cell.height, data: out };
}

type Slot = { anim: string; frame: number; span: number };

function toCanvas(width: number, height: number, pixels: Int32Array): PixelCanvas {
  const canvas = new PixelCanvas(width, height);
  canvas.data.set(pixels);
  return canvas;
}

/** Moves a frame down so that its lowest opaque row is the bottom row (feet line); thresholding can leave a gap there. */
function dropToFloor(canvas: PixelCanvas): void {
  const bounds = measure(canvas);
  if (!bounds) return;
  const gap = canvas.height - 1 - bounds.maxY;
  if (gap <= 0) return;
  canvas.data.copyWithin(gap * canvas.width, 0, (canvas.height - gap) * canvas.width);
  canvas.data.fill(TRANSPARENT, 0, gap * canvas.width);
}

function renderTier(
  def: HeroSpriteDefinition,
  source: PaintedSource,
  grid: HeroGrid,
  tier: Tier,
  slots: readonly (Slot & { rgba: RgbaImage })[],
): RenderedHeroTier {
  const cell = heroCell(grid, tier);
  const remaps = source.remap ?? [];
  const remapped = new Map<number, number>();
  const remap = (rgb: number): number => {
    if (rgb === TRANSPARENT || remaps.length === 0) return rgb;
    let mapped = remapped.get(rgb);
    if (mapped === undefined) {
      mapped = remapColor(rgb, remaps);
      remapped.set(rgb, mapped);
    }
    return mapped;
  };
  const thresholded = slots.map((slot) => thresholdAlpha(slot.rgba).map(remap));
  const histogram = new Map<number, number>();
  thresholded.forEach((pixels) => addToHistogram(histogram, pixels, tier));
  const palette = buildPalette(histogram, source.colors[tier], tier);
  const outline = toHex(palette[0], tier);

  const frames: RenderedHeroTier["frames"] = {};
  slots.forEach((slot, i) => {
    const canvas = toCanvas(slot.rgba.width, slot.rgba.height, applyPalette(thresholded[i], palette, tier));
    dropToFloor(canvas);
    canvas.outline(outline);
    runHeroDraw(def, tier, canvas, slot.anim, slot.frame, slot.span);
    (frames[slot.anim] ??= [])[slot.frame] = canvas;
  });
  return { tier, cell, frames };
}

export interface RenderedPaintedHero {
  /** The input grid with the fitted cell and feet column. */
  grid: HeroGrid;
  hi8bit: RenderedHeroTier;
  hi16bit: RenderedHeroTier;
}

/** Builds both tiers of a painted hero: placement at 1:1 (hi-16bit) and 2x average (hi-8bit), then threshold, remap, palette, outline, hooks. */
export function renderPaintedHero(def: HeroSpriteDefinition, grid: HeroGrid, files: PaintedFiles): RenderedPaintedHero {
  const { source } = def;
  if (!source) throw spriteError(`Hero "${def.id}" has no painted source.`, { id: def.id });
  const frames = extractPaintedFrames(grid, files);
  const fitted = fitPaintedGrid(grid, frames);
  const cell = heroCell(fitted, "hi16bit");
  const slots16 = frames.map((f) => ({ anim: f.anim, frame: f.frame, span: f.span, rgba: placeFrame(f, cell, fitted.anchorX ?? 0) }));
  const slots8 = slots16.map((slot) => ({ ...slot, rgba: downscale2x(slot.rgba) }));
  const hi16bit = renderTier(def, source, fitted, "hi16bit", slots16);
  const hi8bit = renderTier(def, source, fitted, "hi8bit", slots8);
  return { grid: fitted, hi8bit, hi16bit };
}

/** Distinct colours used by a rendered tier, sorted by value. */
export function paletteOf(rendered: RenderedHeroTier): number[] {
  const used = new Set<number>();
  for (const list of Object.values(rendered.frames)) for (const canvas of list) canvas.data.forEach((rgb) => rgb !== TRANSPARENT && used.add(rgb));
  return [...used].sort((a, b) => a - b);
}
