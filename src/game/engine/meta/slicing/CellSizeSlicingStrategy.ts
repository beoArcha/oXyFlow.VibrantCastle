import { ISlicingStrategy, SlicingContext } from "./ISlicingStrategy";
import { ResolvedFrameRect, SlicingMethod, ICellSizeSlicingParams } from "../types";

/**
 * CellSizeSlicingStrategy: Slices by fixed cell dimensions (width x height)
 * with optional start offsets and gutters.
 * Avoids fractional-pixel sub-pixel tearing on non-standard sheet dimensions.
 */
export class CellSizeSlicingStrategy implements ISlicingStrategy {
  public readonly method: SlicingMethod = "by_cell_size";

  public slice(context: SlicingContext, rawConfig?: unknown): ResolvedFrameRect[] {
    const config = this.normalizeConfig(rawConfig);
    const { cellWidth, cellHeight, offsetX, offsetY, spacingX, spacingY } = config;

    const effectiveW = cellWidth + spacingX;
    const effectiveH = cellHeight + spacingY;

    const availableCols = Math.max(
      1,
      Math.floor((context.textureWidth - offsetX) / (effectiveW > 0 ? effectiveW : 1))
    );
    const availableRows = Math.max(
      1,
      Math.floor((context.textureHeight - offsetY) / (effectiveH > 0 ? effectiveH : 1))
    );

    const frames: ResolvedFrameRect[] = [];
    const anims = context.animations ?? {};
    const animEntries = Object.entries(anims);

    if (animEntries.length > 0) {
      animEntries.forEach(([trackName, trackData]) => {
        if (!trackData || typeof trackData !== "object") return;

        const row = Number(trackData.row) || 0;
        const frameCount = Math.max(1, Number(trackData.frames) || 1);

        let currentCol = trackData.startCol !== undefined ? Number(trackData.startCol) : 0;

        for (let f = 0; f < frameCount; f++) {
          let col = currentCol;
          let span = 1;

          if (Array.isArray(trackData.frameIndices) && trackData.frameIndices[f] !== undefined) {
            col = Number(trackData.frameIndices[f]);
          } else if (Array.isArray(trackData.slotSpan) && trackData.slotSpan[f] !== undefined) {
            span = Math.max(1, Number(trackData.slotSpan[f]));
          } else if (Array.isArray(trackData.cells) && trackData.cells[f] !== undefined) {
            span = Math.max(1, Number(trackData.cells[f]));
          } else if (trackData.widthCells !== undefined) {
            span = Math.max(1, Number(trackData.widthCells));
          }

          const x = offsetX + col * effectiveW;
          const y = offsetY + row * effectiveH;
          const width = span * cellWidth + Math.max(0, span - 1) * spacingX;
          const height = cellHeight;

          frames.push({
            id: `${trackName}_${f}`,
            trackName,
            frameIndex: f,
            row,
            col,
            x,
            y,
            width,
            height,
          });

          if (!Array.isArray(trackData.frameIndices)) {
            currentCol += span;
          }
        }
      });

      return frames;
    }

    // Fallback: slice all cells fitting into dimensions
    for (let r = 0; r < availableRows; r++) {
      for (let c = 0; c < availableCols; c++) {
        frames.push({
          id: `cell_${r}_${c}`,
          row: r,
          col: c,
          x: offsetX + c * effectiveW,
          y: offsetY + r * effectiveH,
          width: cellWidth,
          height: cellHeight,
        });
      }
    }

    return frames;
  }

  public findFrame(x: number, y: number, frames: readonly ResolvedFrameRect[]): ResolvedFrameRect | null {
    for (let i = frames.length - 1; i >= 0; i--) {
      const f = frames[i];
      if (x >= f.x && x < f.x + f.width && y >= f.y && y < f.y + f.height) {
        return f;
      }
    }
    return null;
  }

  private normalizeConfig(rawConfig?: unknown): Required<ICellSizeSlicingParams> {
    if (typeof rawConfig === "object" && rawConfig !== null) {
      const c = rawConfig as Partial<ICellSizeSlicingParams>;
      return {
        cellWidth: Math.max(1, Number(c.cellWidth) || 64),
        cellHeight: Math.max(1, Number(c.cellHeight) || 64),
        offsetX: Math.max(0, Number(c.offsetX) || 0),
        offsetY: Math.max(0, Number(c.offsetY) || 0),
        spacingX: Math.max(0, Number(c.spacingX) || 0),
        spacingY: Math.max(0, Number(c.spacingY) || 0),
      };
    }

    return {
      cellWidth: 64,
      cellHeight: 64,
      offsetX: 0,
      offsetY: 0,
      spacingX: 0,
      spacingY: 0,
    };
  }
}

export const defaultCellSizeSlicingStrategy = new CellSizeSlicingStrategy();
