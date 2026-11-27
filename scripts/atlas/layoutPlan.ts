import type { FrameGroup, FramePlacement, PlannedLayout, PlannedRow } from "./repackTypes";

interface FrameExtents {
  anchorX: number;
  anchorY: number;
  left: number;
  right: number;
  up: number;
  down: number;
}

const evenCeil = (value: number): number => Math.ceil(value / 2) * 2;

function frameExtents(group: FrameGroup, feetOrigin: boolean, groupCentred: boolean): FrameExtents {
  const { body, extent } = group;
  const source = groupCentred ? extent : body;
  const anchorX = source.x + source.w / 2;
  const anchorY = feetOrigin ? source.y + source.h : source.y + source.h / 2;
  return {
    anchorX,
    anchorY,
    left: anchorX - extent.x,
    right: extent.x + extent.w - anchorX,
    up: anchorY - extent.y,
    down: extent.y + extent.h - anchorY,
  };
}

function spanFor(extents: FrameExtents, cellWidth: number, margin: number): number {
  return Math.max(1, Math.ceil((extents.right + margin + cellWidth / 2) / cellWidth));
}

function totalColumns(spansByRow: number[][]): number {
  return Math.max(...spansByRow.map((spans) => spans.reduce((a, b) => a + b, 0)));
}

/**
 * Picks the cell width with the smallest sheet area. Left overflow can never be spanned away, so the
 * width is bounded below by it; right-hand FX wider than that bound occupies extra whole cells.
 */
function chooseCellWidth(extents: FrameExtents[][], cellHeight: number, margin: number): number {
  const all = extents.flat();
  const minWidth = evenCeil(2 * (Math.max(...all.map((e) => e.left)) + margin));
  const maxWidth = Math.max(minWidth, evenCeil(2 * (Math.max(...all.map((e) => e.right)) + margin)));
  let best = maxWidth;
  let bestArea = Infinity;
  for (let width = minWidth; width <= maxWidth; width += 2) {
    const spans = extents.map((row) => row.map((e) => spanFor(e, width, margin)));
    const area = width * totalColumns(spans) * cellHeight * extents.length;
    if (area < bestArea) {
      bestArea = area;
      best = width;
    }
  }
  return best;
}

export function planLayout(rows: readonly PlannedRow[], margin: number, feetOrigin: boolean): PlannedLayout {
  const extents = rows.map((row) => row.frames.map((group) => frameExtents(group, feetOrigin, row.config.centre === "group")));
  const flat = extents.flat();

  const maxUp = Math.max(...flat.map((e) => e.up));
  const maxDown = Math.max(...flat.map((e) => e.down));
  const bottomPad = margin + (feetOrigin ? Math.max(0, maxDown) : 0);
  const cellHeight = feetOrigin
    ? evenCeil(maxUp + margin + bottomPad)
    : evenCeil(2 * (Math.max(maxUp, maxDown) + margin));
  const anchorY = feetOrigin ? cellHeight - bottomPad : cellHeight / 2;

  const cellWidth = chooseCellWidth(extents, cellHeight, margin);
  const placements: FramePlacement[][] = rows.map((row, r) => {
    let column = 0;
    return row.frames.map((group, f) => {
      const span = spanFor(extents[r][f], cellWidth, margin);
      const placement: FramePlacement = {
        group,
        column,
        span,
        anchorX: column * cellWidth + cellWidth / 2,
        anchorY: r * cellHeight + anchorY,
        sourceAnchorX: extents[r][f].anchorX,
        sourceAnchorY: extents[r][f].anchorY,
      };
      column += span;
      return placement;
    });
  });

  return {
    cellWidth,
    cellHeight,
    columns: totalColumns(placements.map((row) => row.map((p) => p.span))),
    rows: rows.length,
    margin,
    feetOrigin,
    placements,
  };
}
