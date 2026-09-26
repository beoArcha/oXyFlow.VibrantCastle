import { ISlicingStrategy, SlicingContext } from "./ISlicingStrategy";
import { ResolvedFrameRect, SlicingMethod } from "../types";
import { BackgroundProcessor, IPixelBuffer } from "./BackgroundProcessor";
import { LoggerManager } from "../../../../lib/logger";

export interface AutoIslandConfig {
  minWidth?: number;
  minHeight?: number;
  padding?: number;
  rowThresholdRatio?: number;
}

/**
 * AutoIslandSlicingStrategy: Smart algorithmic slicing (Connected Components Bounding Box).
 * Scans pixel buffer, ignores background (transparent alpha or chroma color with tolerance),
 * and automatically extracts sprite bounding boxes sorted into rows and columns.
 */
export class AutoIslandSlicingStrategy implements ISlicingStrategy {
  public readonly method: SlicingMethod = "auto_islands";

  public slice(context: SlicingContext, rawConfig?: unknown): ResolvedFrameRect[] {
    const buffer: IPixelBuffer | undefined = context.pixelBuffer;
    if (!buffer || buffer.width <= 0 || buffer.height <= 0) {
      LoggerManager.getInstance()
        .getLogger("AtlasSlicing")
        .warn("AutoIsland strategy requires a valid pixel buffer to detect sprite contours.");
      return [];
    }

    const config = this.normalizeConfig(rawConfig);
    const { minWidth, minHeight, padding, rowThresholdRatio } = config;

    const w = buffer.width;
    const h = buffer.height;
    const data = buffer.data;

    // 1. Determine background tester
    const bgConfig = context.backgroundConfig;
    const isChroma = bgConfig?.mode === "color" && Boolean(bgConfig.colorHex);
    const targetRgb = isChroma ? BackgroundProcessor.hexToRgb(bgConfig.colorHex!) : { r: 0, g: 0, b: 0 };
    const tolerance = bgConfig?.tolerance !== undefined ? bgConfig.tolerance : 15;

    const isNonEmptyPixel = (x: number, y: number): boolean => {
      const offset = (y * w + x) * 4;
      const a = data[offset + 3];
      if (a < 15) return false;

      if (isChroma) {
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const dist = BackgroundProcessor.colorDistance({ r, g, b }, targetRgb);
        if (dist <= tolerance) return false;
      }

      return true;
    };

    // 2. Visited map (1 byte per pixel)
    const visited = new Uint8Array(w * h);
    const rawBoxes: { minX: number; maxX: number; minY: number; maxY: number }[] = [];

    // Queue for BFS flood-fill
    // To minimize memory reallocations, allocate a reusable queue array or flat buffer
    const queueX = new Int32Array(w * h);
    const queueY = new Int32Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (visited[idx] === 1) continue;
        visited[idx] = 1;

        if (!isNonEmptyPixel(x, y)) continue;

        // Start BFS flood-fill for island
        let qHead = 0;
        let qTail = 0;

        queueX[qTail] = x;
        queueY[qTail] = y;
        qTail++;

        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;

        while (qHead < qTail) {
          const cx = queueX[qHead];
          const cy = queueY[qHead];
          qHead++;

          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // 4-neighborhood
          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];

          for (let n = 0; n < 4; n++) {
            const nx = neighbors[n][0];
            const ny = neighbors[n][1];

            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nIdx = ny * w + nx;
              if (visited[nIdx] === 0) {
                visited[nIdx] = 1;
                if (isNonEmptyPixel(nx, ny)) {
                  queueX[qTail] = nx;
                  queueY[qTail] = ny;
                  qTail++;
                }
              }
            }
          }
        }

        const boxW = maxX - minX + 1;
        const boxH = maxY - minY + 1;

        if (boxW >= minWidth && boxH >= minHeight) {
          rawBoxes.push({ minX, maxX, minY, maxY });
        }
      }
    }

    if (rawBoxes.length === 0) {
      return [];
    }

    // 3. Optional box padding and clamping
    const paddedBoxes = rawBoxes.map((b) => ({
      x: Math.max(0, b.minX - padding),
      y: Math.max(0, b.minY - padding),
      width: Math.min(w - Math.max(0, b.minX - padding), b.maxX - b.minX + 1 + padding * 2),
      height: Math.min(h - Math.max(0, b.minY - padding), b.maxY - b.minY + 1 + padding * 2),
    }));

    // 4. Calculate average height for row clustering
    const avgHeight =
      paddedBoxes.reduce((sum, b) => sum + b.height, 0) / Math.max(1, paddedBoxes.length);
    const rowTolerance = avgHeight * rowThresholdRatio;

    // Sort top-to-bottom
    paddedBoxes.sort((a, b) => a.y - b.y);

    // Group into horizontal rows
    const rows: { y: number; boxes: typeof paddedBoxes }[] = [];

    paddedBoxes.forEach((box) => {
      const centerY = box.y + box.height / 2;
      let targetRow = rows.find((r) => Math.abs(r.y - centerY) <= rowTolerance);

      if (!targetRow) {
        targetRow = { y: centerY, boxes: [] };
        rows.push(targetRow);
      }
      targetRow.boxes.push(box);
    });

    // Sort rows by Y
    rows.sort((a, b) => a.y - b.y);

    // Sort each row by X (left to right) and build ResolvedFrameRects
    const frames: ResolvedFrameRect[] = [];

    rows.forEach((rowObj, rIdx) => {
      rowObj.boxes.sort((a, b) => a.x - b.x);

      rowObj.boxes.forEach((box, cIdx) => {
        frames.push({
          id: `island_${rIdx}_${cIdx}`,
          row: rIdx,
          col: cIdx,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          frameIndex: cIdx,
        });
      });
    });

    const logger = LoggerManager.getInstance().getLogger("AtlasSlicing");
    logger.debug(`AutoIsland extracted ${frames.length} sprite islands across ${rows.length} rows`, {
      islandsCount: frames.length,
      rowsCount: rows.length,
      minWidth,
      minHeight,
    });

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

  private normalizeConfig(rawConfig?: unknown): Required<AutoIslandConfig> {
    if (typeof rawConfig === "object" && rawConfig !== null) {
      const c = rawConfig as Partial<AutoIslandConfig>;
      return {
        minWidth: Math.max(2, Number(c.minWidth) || 8),
        minHeight: Math.max(2, Number(c.minHeight) || 8),
        padding: Math.max(0, Number(c.padding) || 0),
        rowThresholdRatio: Math.max(0.1, Number(c.rowThresholdRatio) || 0.5),
      };
    }

    return {
      minWidth: 8,
      minHeight: 8,
      padding: 0,
      rowThresholdRatio: 0.5,
    };
  }
}

export const defaultAutoIslandSlicingStrategy = new AutoIslandSlicingStrategy();
