import { snapTo } from "./colors";
import { spriteError } from "./errors";
import { PixelCanvas, TRANSPARENT } from "./pixelCanvas";
import {
  TIER_LABEL,
  cellSize,
  definedAnimations,
  specOf,
  type AnimationName,
  type EnemySpriteDefinition,
  type Tier,
} from "./types";

export interface RenderedTier {
  tier: Tier;
  cell: number;
  frames: Partial<Record<AnimationName, PixelCanvas[]>>;
}

export interface SheetImage {
  tier: Tier;
  cell: number;
  cellHeight: number;
  columns: number;
  rows: number;
  width: number;
  height: number;
  /** Snapped packed 0xRRGGBB per pixel, or TRANSPARENT. */
  pixels: Int32Array;
}

export function sheetColumns(def: EnemySpriteDefinition): number {
  return Math.max(...definedAnimations(def).map((name) => specOf(def, name).frames));
}

function drawFrame(def: EnemySpriteDefinition, tier: Tier, cell: number, anim: AnimationName, frame: number) {
  const canvas = new PixelCanvas(cell, cell);
  try {
    def.draw[tier](canvas, anim, frame);
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw spriteError(
      `Sprite "${def.id}" ${TIER_LABEL[tier]} animation "${anim}" frame ${frame}: ${reason}`,
      { id: def.id, tier, anim, frame },
      cause,
    );
  }
  return canvas;
}

export function renderTier(def: EnemySpriteDefinition, tier: Tier): RenderedTier {
  const cell = cellSize(def, tier);
  const frames: RenderedTier["frames"] = {};
  for (const name of definedAnimations(def)) {
    const count = specOf(def, name).frames;
    frames[name] = Array.from({ length: count }, (_, frame) => drawFrame(def, tier, cell, name, frame));
  }
  return { tier, cell, frames };
}

export function buildSheet(def: EnemySpriteDefinition, rendered: RenderedTier): SheetImage {
  const names = definedAnimations(def);
  const columns = sheetColumns(def);
  const { cell, tier } = rendered;
  const width = columns * cell;
  const height = names.length * cell;
  const pixels = new Int32Array(width * height).fill(TRANSPARENT);
  names.forEach((name, row) => {
    (rendered.frames[name] ?? []).forEach((canvas, column) => {
      blit(canvas, pixels, width, column * cell, row * cell, tier);
    });
  });
  return { tier, cell, cellHeight: cell, columns, rows: names.length, width, height, pixels };
}

export function blit(canvas: PixelCanvas, target: Int32Array, targetWidth: number, ox: number, oy: number, tier: Tier) {
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const rgb = canvas.pixelAt(x, y);
      if (rgb !== TRANSPARENT) target[(oy + y) * targetWidth + ox + x] = snapTo(rgb, tier);
    }
  }
}
