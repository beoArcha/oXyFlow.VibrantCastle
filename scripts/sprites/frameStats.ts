import { TRANSPARENT, type PixelCanvas } from "./pixelCanvas";
import type { RenderedTier } from "./render";

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Bounding box of opaque pixels, or null for an empty canvas. */
export function measure(canvas: PixelCanvas): Bounds | null {
  let bounds: Bounds | null = null;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (canvas.pixelAt(x, y) === TRANSPARENT) continue;
      bounds = bounds
        ? {
            minX: Math.min(bounds.minX, x),
            minY: Math.min(bounds.minY, y),
            maxX: Math.max(bounds.maxX, x),
            maxY: Math.max(bounds.maxY, y),
          }
        : { minX: x, minY: y, maxX: x, maxY: y };
    }
  }
  return bounds;
}

export function unionBounds(list: (Bounds | null)[]): Bounds | null {
  let union: Bounds | null = null;
  for (const b of list) {
    if (!b) continue;
    union = union
      ? {
          minX: Math.min(union.minX, b.minX),
          minY: Math.min(union.minY, b.minY),
          maxX: Math.max(union.maxX, b.maxX),
          maxY: Math.max(union.maxY, b.maxY),
        }
      : b;
  }
  return union;
}

/** Union of the opaque pixels over all idle frames of one tier. */
export function idleBounds(rendered: RenderedTier): Bounds | null {
  return unionBounds((rendered.frames.idle ?? []).map(measure));
}

export interface NormalizedBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const round4 = (n: number): number => Math.round(n * 10000) / 10000;

export function normalizeBox(bounds: Bounds, cellWidth: number, cellHeight: number): NormalizedBox {
  return {
    x: round4(bounds.minX / cellWidth),
    y: round4(bounds.minY / cellHeight),
    w: round4((bounds.maxX - bounds.minX + 1) / cellWidth),
    h: round4((bounds.maxY - bounds.minY + 1) / cellHeight),
  };
}

export function normalizeBounds(bounds: Bounds, cell: number): NormalizedBox {
  return normalizeBox(bounds, cell, cell);
}
