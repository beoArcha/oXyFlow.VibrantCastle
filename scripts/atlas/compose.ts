import type { RgbaImage } from "../lib/png";
import type { LabelledImage } from "./islands";
import type { FramePlacement, PlannedLayout } from "./repackTypes";

/** Pixels beyond the island bboxes that are still copied so anti-aliased edges and soft glow survive. */
const EDGE_PAD = 4;

export function placementOffset(placement: FramePlacement): { dx: number; dy: number } {
  return {
    dx: Math.round(placement.anchorX - placement.sourceAnchorX),
    dy: Math.round(placement.anchorY - placement.sourceAnchorY),
  };
}

function copyFrame(
  source: RgbaImage,
  labelled: LabelledImage,
  target: RgbaImage,
  placement: FramePlacement,
  frameRegion: { x0: number; y0: number; x1: number; y1: number }
): void {
  const own = new Set(placement.group.islands.map((island) => island.id));
  const { extent } = placement.group;
  const { dx, dy } = placementOffset(placement);
  const sx0 = Math.max(0, extent.x - EDGE_PAD);
  const sy0 = Math.max(0, extent.y - EDGE_PAD);
  const sx1 = Math.min(source.width, extent.x + extent.w + EDGE_PAD);
  const sy1 = Math.min(source.height, extent.y + extent.h + EDGE_PAD);

  for (let y = sy0; y < sy1; y++) {
    for (let x = sx0; x < sx1; x++) {
      const si = y * source.width + x;
      const label = labelled.labels[si];
      if (source.data[si * 4 + 3] === 0 || (label !== 0 && !own.has(label))) continue;
      const tx = x + dx;
      const ty = y + dy;
      if (tx < frameRegion.x0 || tx >= frameRegion.x1 || ty < frameRegion.y0 || ty >= frameRegion.y1) continue;
      const ti = (ty * target.width + tx) * 4;
      target.data.set(source.data.subarray(si * 4, si * 4 + 4), ti);
    }
  }
}

export function composeSheet(source: RgbaImage, labelled: LabelledImage, layout: PlannedLayout): RgbaImage {
  const width = layout.columns * layout.cellWidth;
  const height = layout.rows * layout.cellHeight;
  const target: RgbaImage = { width, height, data: new Uint8Array(width * height * 4) };
  layout.placements.forEach((row, rowIndex) => {
    for (const placement of row) {
      copyFrame(source, labelled, target, placement, {
        x0: placement.column * layout.cellWidth,
        x1: (placement.column + placement.span) * layout.cellWidth,
        y0: rowIndex * layout.cellHeight,
        y1: (rowIndex + 1) * layout.cellHeight,
      });
    }
  });
  return target;
}
