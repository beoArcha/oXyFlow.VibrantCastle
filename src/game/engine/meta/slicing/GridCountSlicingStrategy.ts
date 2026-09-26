import { ISlicingStrategy, SlicingContext } from "./ISlicingStrategy";
import { ResolvedFrameRect, SlicingMethod, IAtlasGrid } from "../types";

export interface GridCountConfig {
  columns: number;
  rows: number;
  cellWidth?: number;
  cellHeight?: number;
  spacing?: number;
  safeMargin?: number;
}

/**
 * GridCountSlicingStrategy: Slices by traditional column & row grid (columns x rows).
 * Supports slotSpan, cells arrays, startCol/widthCells, and discrete frameIndices.
 */
export class GridCountSlicingStrategy implements ISlicingStrategy {
  public readonly method: SlicingMethod = "by_count";

  public slice(context: SlicingContext, rawConfig?: unknown): ResolvedFrameRect[] {
    const config = this.normalizeConfig(context, rawConfig);
    const cellW = config.cellWidth ?? Math.floor(context.textureWidth / Math.max(1, config.columns));
    const cellH = config.cellHeight ?? Math.floor(context.textureHeight / Math.max(1, config.rows));
    const spacing = config.spacing ?? 0;

    const frames: ResolvedFrameRect[] = [];

    // 1. If animations are defined, resolve them with full fidelity
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

          const x = col * (cellW + spacing);
          const y = row * (cellH + spacing);
          const width = span * cellW;
          const height = cellH;

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

          // Advance currentCol if frameIndices not specified
          if (!Array.isArray(trackData.frameIndices)) {
            currentCol += span;
          }
        }
      });

      return frames;
    }

    // 2. Fallback: if no animations defined, slice all grid cells
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.columns; c++) {
        frames.push({
          id: `cell_${r}_${c}`,
          row: r,
          col: c,
          x: c * (cellW + spacing),
          y: r * (cellH + spacing),
          width: cellW,
          height: cellH,
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

  private normalizeConfig(context: SlicingContext, rawConfig?: unknown): GridCountConfig {
    if (typeof rawConfig === "object" && rawConfig !== null) {
      const c = rawConfig as Partial<IAtlasGrid & GridCountConfig>;
      return {
        columns: Math.max(1, Number(c.columns) || 6),
        rows: Math.max(1, Number(c.rows) || 4),
        cellWidth: c.cellWidth ? Math.max(1, Number(c.cellWidth)) : undefined,
        cellHeight: c.cellHeight ? Math.max(1, Number(c.cellHeight)) : undefined,
        spacing: Math.max(0, Number(c.spacing) || 0),
        safeMargin: Math.max(0, Number(c.safeMargin) || 0),
      };
    }

    return {
      columns: 6,
      rows: 4,
    };
  }
}

export const defaultGridCountSlicingStrategy = new GridCountSlicingStrategy();
