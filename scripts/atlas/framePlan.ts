import { AssetError, ErrorCode } from "../../src/lib/errors";
import { bodyOf, groupRows, mergeDebris, unionRect, type Island, type LabelledImage } from "./islands";
import type { FrameGroup, PlannedRow, RowConfig } from "./repackTypes";

/** Isolated 1-3 px specks are generation noise and would otherwise widen the frame extent. */
const MIN_ISLAND_AREA = 4;

function toFrameGroup(islands: Island[]): FrameGroup {
  return { islands, body: bodyOf(islands), extent: unionRect(islands) };
}

function splitByCuts(row: readonly Island[], cuts: readonly number[]): Island[][] {
  const buckets: Island[][] = Array.from({ length: cuts.length + 1 }, () => []);
  for (const island of row) {
    const centre = island.x + island.w / 2;
    const bucket = cuts.filter((cut) => centre >= cut).length;
    buckets[bucket].push(island);
  }
  return buckets;
}

function isDropped(island: Island, drop: readonly [number, number][] | undefined): boolean {
  return !!drop && drop.some(([x, y]) => island.x === x && island.y === y);
}

export function detectRows(labelled: LabelledImage): Island[][] {
  return groupRows(labelled.islands);
}

export function planRow(visualRow: readonly Island[], config: RowConfig): PlannedRow {
  const kept = visualRow.filter((island) => island.area >= MIN_ISLAND_AREA && !isDropped(island, config.drop));
  const groups = config.cutsX ? splitByCuts(kept, config.cutsX) : mergeDebris(kept, config.bodyRatio ?? 0.25);
  if (groups.some((g) => g.length === 0)) {
    throw new AssetError(`Animation '${config.animation}' has an empty frame between its x-cuts`, ErrorCode.ASSET_CORRUPTED, {
      details: { animation: config.animation, cutsX: config.cutsX },
    });
  }
  if (groups.length !== config.frames) {
    throw new AssetError(
      `Animation '${config.animation}' detected ${groups.length} frames but the config records ${config.frames}`,
      ErrorCode.ASSET_CORRUPTED,
      { details: { animation: config.animation, detected: groups.length, expected: config.frames } }
    );
  }
  return { config, frames: groups.map(toFrameGroup) };
}

export function planRows(labelled: LabelledImage, configs: readonly RowConfig[]): PlannedRow[] {
  const visualRows = detectRows(labelled);
  return configs.map((config) => {
    const visualRow = visualRows[config.detectedRow];
    if (!visualRow) {
      throw new AssetError(`Detected row ${config.detectedRow} does not exist (found ${visualRows.length})`, ErrorCode.ASSET_CORRUPTED, {
        details: { animation: config.animation, detectedRows: visualRows.length },
      });
    }
    return planRow(visualRow, config);
  });
}
