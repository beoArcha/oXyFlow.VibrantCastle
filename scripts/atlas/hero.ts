import type { RgbaImage } from "../lib/png";
import { planRows } from "./framePlan";
import { composeHeroSheet, halveSheet } from "./heroCompose";
import { planHeroLayout, type HeroLayout } from "./heroLayout";
import { buildHeroMeta } from "./heroMeta";
import { labelIslands } from "./islands";
import type { JsonObject } from "./metaBuilder";
import type { HeroConfig, PlannedRow } from "./repackTypes";

export type HeroTier = "low" | "mid" | "high";

export interface HeroResult {
  sheets: Record<HeroTier, RgbaImage>;
  meta: JsonObject;
  layout: HeroLayout;
  rows: PlannedRow[];
}

/**
 * Re-lays every frame of a hero sheet as its own island. The source is the `high` tier; `mid` is
 * pixel-identical to it in the shipped art and `low` is its exact half-size box downscale.
 */
export function repackHero(source: RgbaImage, originalMeta: JsonObject, config: HeroConfig): HeroResult {
  const labelled = labelIslands(source, config.alphaThreshold);
  const rows = planRows(labelled, config.rows);
  const layout = planHeroLayout(rows, config, source.height);
  const high = composeHeroSheet(source, labelled, layout);
  const low = halveSheet(high);
  const meta = buildHeroMeta(originalMeta, rows, layout, {
    low: { width: low.width, height: low.height },
    mid: { width: high.width, height: high.height },
    high: { width: high.width, height: high.height },
  });
  return { sheets: { low, mid: high, high }, meta, layout, rows };
}

export function describeHero(id: string, source: RgbaImage, result: HeroResult): string[] {
  const { layout, rows, sheets } = result;
  const lines = [
    `${id}: ${source.width}x${source.height} -> high/mid ${sheets.high.width}x${sheets.high.height}, low ${sheets.low.width}x${sheets.low.height}`,
  ];
  rows.forEach((row, r) => {
    const widths = layout.placements[r].map((p) => p.group.extent.w).join(",");
    lines.push(`  row ${r} ${row.config.animation}: ${row.frames.length} frames, widths [${widths}], baseline y=${layout.baselines[r]}`);
  });
  return lines;
}
