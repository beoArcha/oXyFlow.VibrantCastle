import type { RgbaImage } from "../lib/png";
import type { HeroLayout } from "./heroLayout";
import { OPAQUE_ALPHA } from "./islands";
import type { JsonObject } from "./metaBuilder";
import type { PlannedRow } from "./repackTypes";

export interface TierSize {
  width: number;
  height: number;
}

function asObject(value: unknown): JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as JsonObject) : {};
}

/**
 * Computes a frame's normalized feet pivot from the bottom-quarter solid-pixel centroid.
 */
function computeFeetPivot(sheet: RgbaImage, x: number, y: number, width: number, height: number): { x: number; y: number } {
  const yStart = Math.floor(height * 0.75);
  let sumX = 0;
  let count = 0;
  for (let dy = yStart; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const alpha = sheet.data[((y + dy) * sheet.width + (x + dx)) * 4 + 3];
      if (alpha >= OPAQUE_ALPHA) {
        sumX += dx;
        count++;
      }
    }
  }
  const px = count > 0 ? Math.round((sumX / count / width) * 10000) / 10000 : 0.5;
  return { x: px, y: 1 };
}

/**
 * Packed meta keeps every field of the original except the per-animation frame counts and the
 * per-tier sheet sizes, which describe the repacked art.
 */
export function buildHeroMeta(
  original: JsonObject,
  rows: readonly PlannedRow[],
  layout: HeroLayout,
  tiers: Record<string, TierSize>,
  highSheet: RgbaImage
): JsonObject {
  const meta = structuredClone(original);
  const atlas = asObject(meta.atlas);
  const columns = Number(atlas.columns ?? 12);
  const rowCount = Number(atlas.rows ?? 8);
  const columnWidth = layout.width / columns;
  // Packed tiers carry distinct per-tier cell dimensions under `variants`, so source-grid cell sizes no longer apply.
  delete atlas.cellWidth;
  delete atlas.cellHeight;
  meta.atlas = atlas;

  const animations = asObject(meta.animations);
  rows.forEach((row, rowIndex) => {
    // Every animation owns a packed row now, so indices into a shared source row no longer apply.
    const { frameIndices: _sharedRowIndices, ...existing } = asObject(animations[row.config.animation]);
    const spans = layout.placements[rowIndex].map((p) => Math.max(1, Math.ceil(p.group.extent.w / columnWidth)));
    animations[row.config.animation] = {
      ...existing,
      row: rowIndex,
      frames: row.frames.length,
      fps: row.config.fps ?? existing.fps ?? 8,
      loop: row.config.loop ?? existing.loop ?? true,
      wide: spans.some((s) => s > 1),
      slotSpan: spans,
      cells: spans,
    };
  });
  meta.animations = animations;

  // Frames sit between grid slots, so the studio needs their exact rectangles and feet pivots to slice them.
  const frameRects: JsonObject = {};
  rows.forEach((row, rowIndex) => {
    layout.placements[rowIndex].forEach((p, frame) => {
      const { w: width, h: height } = p.group.extent;
      frameRects[`${row.config.animation}_${frame}`] = {
        x: p.x,
        y: p.y,
        width,
        height,
        pivot: computeFeetPivot(highSheet, p.x, p.y, width, height),
      };
    });
  });
  meta.frameRects = frameRects;

  const variants = asObject(meta.variants);
  for (const [quality, size] of Object.entries(tiers)) {
    variants[quality] = {
      ...asObject(variants[quality]),
      cellWidth: Math.round(size.width / columns),
      cellHeight: Math.round(size.height / rowCount),
      sheetWidth: size.width,
      sheetHeight: size.height,
    };
  }
  meta.variants = variants;
  return meta;
}
