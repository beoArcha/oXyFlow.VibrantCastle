import { AssetError, ErrorCode } from "../../src/lib/errors";
import { placementOffset } from "./compose";
import type { Rect } from "./islands";
import type { PlannedLayout, PlannedRow, SheetConfig } from "./repackTypes";

export type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as JsonObject) : undefined;
}

export function originNormalized(meta: JsonObject): { x: number; y: number } {
  const origin = asObject(asObject(meta.layout)?.origin);
  const normalized = asObject(origin?.normalized) ?? asObject(meta.anchor);
  return { x: Number(normalized?.x ?? 0.5), y: Number(normalized?.y ?? 1) };
}

export function hasFeetOrigin(meta: JsonObject): boolean {
  return originNormalized(meta).y >= 0.8;
}

function updateAtlas(meta: JsonObject, layout: PlannedLayout, packedImageName: string | undefined): void {
  const atlas = asObject(meta.atlas) ?? {};
  atlas.columns = layout.columns;
  atlas.rows = layout.rows;
  atlas.cellWidth = layout.cellWidth;
  atlas.cellHeight = layout.cellHeight;
  if (typeof atlas.image === "string" && packedImageName) atlas.image = packedImageName;
  meta.atlas = atlas;
}

function updateVariants(meta: JsonObject, layout: PlannedLayout): void {
  const variants = asObject(meta.variants);
  if (!variants) return;
  for (const key of Object.keys(variants)) {
    const variant = asObject(variants[key]);
    const scale = Number(variant?.scale);
    if (!variant || !Number.isFinite(scale)) continue;
    variant.cellWidth = Math.round(layout.cellWidth * scale);
    variant.cellHeight = Math.round(layout.cellHeight * scale);
  }
}

function updateTracks(meta: JsonObject, rows: readonly PlannedRow[], layout: PlannedLayout): void {
  const animations = asObject(meta.animations) ?? {};
  const layoutSection = asObject(meta.layout) ?? {};
  rows.forEach((row, rowIndex) => {
    const name = row.config.animation;
    const spans = layout.placements[rowIndex].map((p) => p.span);
    const existing = asObject(animations[name]);
    const layoutEntry = asObject(layoutSection[name]);
    if (layoutEntry) {
      layoutEntry.row = rowIndex;
      layoutEntry.startCol = 0;
      layoutEntry.frames = row.frames.length;
      layoutEntry.widthCells = Math.max(...spans);
    }
    if (!existing && layoutEntry && spans.every((s) => s === 1)) return;
    if (!existing && !layoutEntry) {
      throw new AssetError(`Animation '${name}' is missing from the original meta`, ErrorCode.ASSET_CORRUPTED, { details: { name } });
    }
    animations[name] = {
      ...existing,
      row: rowIndex,
      frames: row.frames.length,
      fps: row.config.fps ?? existing?.fps ?? 8,
      loop: row.config.loop ?? existing?.loop ?? true,
      wide: spans.some((s) => s > 1),
      slotSpan: spans,
      cells: spans,
    };
  });
  meta.animations = animations;
  meta.layout = layoutSection;
}

export function computeBodyBox(rows: readonly PlannedRow[], layout: PlannedLayout, defaultAnimation: string): Rect {
  const rowIndex = rows.findIndex((row) => row.config.animation === defaultAnimation);
  if (rowIndex < 0) {
    throw new AssetError(`Default animation '${defaultAnimation}' is not part of the config`, ErrorCode.ASSET_CORRUPTED, {
      details: { defaultAnimation },
    });
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const placement of layout.placements[rowIndex]) {
    const { dx, dy } = placementOffset(placement);
    const body = placement.group.body;
    x0 = Math.min(x0, body.x + dx - placement.column * layout.cellWidth);
    x1 = Math.max(x1, body.x + body.w + dx - placement.column * layout.cellWidth);
    y0 = Math.min(y0, body.y + dy - rowIndex * layout.cellHeight);
    y1 = Math.max(y1, body.y + body.h + dy - rowIndex * layout.cellHeight);
  }
  const round = (v: number): number => Math.round(v * 10000) / 10000;
  return {
    x: round(x0 / layout.cellWidth),
    y: round(y0 / layout.cellHeight),
    w: round((x1 - x0) / layout.cellWidth),
    h: round((y1 - y0) / layout.cellHeight),
  };
}

function updateOrdering(meta: JsonObject, rows: readonly PlannedRow[], bodyBox: Rect): void {
  const layoutSection = asObject(meta.layout) ?? {};
  if (Array.isArray(layoutSection.ordering)) layoutSection.ordering = rows.map((r) => r.config.animation);
  layoutSection.bodyBox = bodyBox;
  meta.layout = layoutSection;
}

/** Number arrays stay on one line so `slotSpan` / `cells` remain diff-friendly. */
export function formatMetaJson(meta: JsonObject): string {
  const text = JSON.stringify(meta, null, 2);
  const collapsed = text.replace(/\[\s*(-?[\d.]+(?:,\s*-?[\d.]+)*)\s*\]/g, (_, body: string) => `[${body.split(/,\s*/).join(", ")}]`);
  return `${collapsed}\n`;
}

export function buildPackedMeta(
  original: JsonObject,
  rows: readonly PlannedRow[],
  layout: PlannedLayout,
  config: SheetConfig,
  packedImageName: string
): JsonObject {
  const meta = structuredClone(original);
  updateAtlas(meta, layout, packedImageName);
  updateVariants(meta, layout);
  updateTracks(meta, rows, layout);
  updateOrdering(meta, rows, computeBodyBox(rows, layout, config.defaultAnimation));
  return meta;
}
