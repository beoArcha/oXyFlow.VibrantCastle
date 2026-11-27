import { AssetError, ErrorCode } from "../../src/lib/errors";
import type { FrameGroup, HeroConfig, PlannedRow } from "./repackTypes";

/** Sheet width is rounded up so that the half-size tier keeps an integral width per grid column pair. */
const WIDTH_STEP = 24;

export interface HeroPlacement {
  group: FrameGroup;
  /** Destination x of the frame extent's left edge. */
  x: number;
  /** Destination y of the frame extent's top edge; extents are bottom-aligned on the row baseline. */
  y: number;
}

export interface HeroLayout {
  width: number;
  height: number;
  /** Baseline (bottom edge of the row band) per row. */
  baselines: number[];
  placements: HeroPlacement[][];
}

function rowWidth(row: PlannedRow, config: HeroConfig): number {
  const frames = row.frames.reduce((sum, group) => sum + group.extent.w, 0);
  return frames + config.gapX * (row.frames.length - 1) + 2 * config.marginX;
}

/**
 * Stacks rows into a sheet of fixed height. The runtime derives its feet-to-pixel scale from
 * `sheetHeight / 8`, so the packed sheet must keep the original height instead of growing.
 */
export function planHeroLayout(rows: readonly PlannedRow[], config: HeroConfig, sheetHeight: number): HeroLayout {
  const rowHeights = rows.map((row) => Math.max(...row.frames.map((group) => group.extent.h)));
  const free = sheetHeight - rowHeights.reduce((a, b) => a + b, 0);
  const gap = Math.floor(free / (rows.length + 1));
  if (gap < config.minGapY) {
    throw new AssetError(
      `Rows need ${sheetHeight - free} px but only ${gap} px gaps fit in ${sheetHeight} px (minimum ${config.minGapY})`,
      ErrorCode.ASSET_CORRUPTED,
      { details: { sheetHeight, rowHeights, minGapY: config.minGapY } }
    );
  }
  const width = Math.ceil(Math.max(...rows.map((row) => rowWidth(row, config))) / WIDTH_STEP) * WIDTH_STEP;

  const baselines: number[] = [];
  let top = gap;
  for (const rowHeight of rowHeights) {
    baselines.push(top + rowHeight);
    top += rowHeight + gap;
  }
  const placements = rows.map((row, r) => {
    let x = config.marginX;
    return row.frames.map((group) => {
      const placement: HeroPlacement = { group, x, y: baselines[r] - group.extent.h };
      x += group.extent.w + config.gapX;
      return placement;
    });
  });
  return { width, height: sheetHeight, baselines, placements };
}
