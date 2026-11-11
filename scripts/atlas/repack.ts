import type { RgbaImage } from "../lib/png";
import { composeSheet } from "./compose";
import { planRows } from "./framePlan";
import { labelIslands } from "./islands";
import { planLayout } from "./layoutPlan";
import { buildPackedMeta, hasFeetOrigin, type JsonObject } from "./metaBuilder";
import type { PlannedLayout, PlannedRow, SheetConfig } from "./repackTypes";

export interface RepackResult {
  image: RgbaImage;
  meta: JsonObject;
  layout: PlannedLayout;
  rows: PlannedRow[];
}

export function planSheet(source: RgbaImage, originalMeta: JsonObject, config: SheetConfig) {
  const labelled = labelIslands(source);
  const rows = planRows(labelled, config.rows);
  const layout = planLayout(rows, config.margin, hasFeetOrigin(originalMeta));
  return { labelled, rows, layout };
}

export function repackSheet(source: RgbaImage, originalMeta: JsonObject, config: SheetConfig, packedImageName: string): RepackResult {
  const { labelled, rows, layout } = planSheet(source, originalMeta, config);
  const image = composeSheet(source, labelled, layout);
  const meta = buildPackedMeta(originalMeta, rows, layout, config, packedImageName);
  return { image, meta, layout, rows };
}

export function describePlan(id: string, source: RgbaImage, rows: readonly PlannedRow[], layout: PlannedLayout): string[] {
  const outW = layout.columns * layout.cellWidth;
  const outH = layout.rows * layout.cellHeight;
  const ratio = (outW * outH) / (source.width * source.height);
  const lines = [
    `${id}: ${source.width}x${source.height} -> ${outW}x${outH} (${layout.columns}x${layout.rows} cells of ${layout.cellWidth}x${layout.cellHeight}, area x${ratio.toFixed(2)}, ${layout.feetOrigin ? "feet" : "centre"} origin)`,
  ];
  rows.forEach((row, r) => {
    const spans = layout.placements[r].map((p) => p.span).join(",");
    lines.push(`  row ${r} ${row.config.animation}: ${row.frames.length} frames, spans [${spans}] (source row ${row.config.detectedRow})`);
  });
  if (ratio > 1.5) lines.push(`  WARNING: packed area is ${ratio.toFixed(2)}x the original (budget 1.5x)`);
  return lines;
}
