import type { HeroLayout } from "./heroLayout";
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
 * Packed meta keeps every field of the original except the per-animation frame counts and the
 * per-tier sheet sizes, which describe the repacked art.
 */
export function buildHeroMeta(
  original: JsonObject,
  rows: readonly PlannedRow[],
  layout: HeroLayout,
  tiers: Record<string, TierSize>
): JsonObject {
  const meta = structuredClone(original);
  const columns = Number(asObject(meta.atlas).columns ?? 12);
  const rowCount = Number(asObject(meta.atlas).rows ?? 8);
  const columnWidth = layout.width / columns;

  const animations = asObject(meta.animations);
  rows.forEach((row, rowIndex) => {
    const existing = asObject(animations[row.config.animation]);
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
