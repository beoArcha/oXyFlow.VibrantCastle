import type { Rect } from "./types";

export const intersects = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const horizontalOverlap = (x: number, width: number, r: Rect): number =>
  Math.min(x + width, r.x + r.w) - Math.max(x, r.x);

export const withinBounds = (r: Rect, worldW: number, worldH: number): boolean =>
  r.x >= 0 && r.y >= 0 && r.x + r.w <= worldW && r.y + r.h <= worldH;

/**
 * Right edge up to which the rects (sorted by x) cover `[from, ...)` without a hole.
 */
export function coveredUntil(sortedByX: readonly Rect[], from: number): number {
  let cursor = from;
  for (const r of sortedByX) {
    if (r.x > cursor) break;
    cursor = Math.max(cursor, r.x + r.w);
  }
  return cursor;
}
