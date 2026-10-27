import { BoundingBox, getScanCanvasContext } from "./scanContext";
import { assetsLogger } from "../../logger/gameLogger";

/**
 * Dedicated detector for horizontal sprite row islands and 2D matrix cluster grids.
 * Isolates non-empty pixel alpha clusters without manual frame coordinate clipping.
 */
export class IslandDetector {
  /**
   * Scans a horizontal row band and isolates all contiguous sprite islands.
   */
  public static scanRowIslands(
    image: HTMLImageElement,
    y0: number,
    y1: number,
    alphaThreshold: number = 25,
    minIslandWidth: number = 8
  ): BoundingBox[] {
    if (typeof document === "undefined" || !image || !image.complete || image.naturalWidth === 0) {
      return [];
    }

    try {
      const fullW = image.naturalWidth;
      const bandH = Math.max(1, Math.round(y1 - y0));
      const sy = Math.max(0, Math.min(image.naturalHeight - 1, Math.round(y0)));

      const ctx = getScanCanvasContext(fullW, bandH);
      if (!ctx) return [];

      ctx.clearRect(0, 0, fullW, bandH);
      ctx.drawImage(image, 0, sy, fullW, bandH, 0, 0, fullW, bandH);

      const imgData = ctx.getImageData(0, 0, fullW, bandH);
      const data = imgData.data;

      const colOcc = new Int32Array(fullW);
      for (let x = 0; x < fullW; x++) {
        let count = 0;
        for (let y = 0; y < bandH; y++) {
          if (data[(y * fullW + x) * 4 + 3] > alphaThreshold) count++;
        }
        colOcc[x] = count;
      }

      const segments: { x0: number; x1: number }[] = [];
      let inSeg = false;
      let startX = 0;

      for (let x = 0; x < fullW; x++) {
        if (colOcc[x] > 0 && !inSeg) {
          inSeg = true;
          startX = x;
        } else if (colOcc[x] === 0 && inSeg) {
          inSeg = false;
          if (x - startX >= minIslandWidth) {
            segments.push({ x0: startX, x1: x - 1 });
          }
        }
      }
      if (inSeg && fullW - startX >= minIslandWidth) {
        segments.push({ x0: startX, x1: fullW - 1 });
      }

      const boxes: BoundingBox[] = [];
      for (const seg of segments) {
        let minY = bandH, maxY = -1;
        for (let y = 0; y < bandH; y++) {
          const rowOffset = y * fullW * 4;
          for (let x = seg.x0; x <= seg.x1; x++) {
            if (data[rowOffset + x * 4 + 3] > alphaThreshold) {
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxY >= minY) {
          const iw = seg.x1 - seg.x0 + 1;
          const ih = maxY - minY + 1;

          let footSumX = 0;
          let footCount = 0;
          const footTop = maxY - Math.max(4, Math.round(ih * 0.25));
          for (let y = footTop; y <= maxY; y++) {
            const rowOffset = y * fullW * 4;
            for (let x = seg.x0; x <= seg.x1; x++) {
              if (data[rowOffset + x * 4 + 3] > alphaThreshold) {
                footSumX += x - seg.x0;
                footCount++;
              }
            }
          }
          const originX = footCount > 0 ? Math.round(footSumX / footCount) : Math.round(iw * 0.5);

          boxes.push({
            x: seg.x0,
            y: sy + minY,
            w: iw,
            h: ih,
            originX,
            originY: ih,
            footY: sy + maxY,
            hasContent: true,
          });
        }
      }

      return boxes;
    } catch (err) {
      assetsLogger.debug(
        "IslandDetector.scanRowIslands fallback applied",
        { operation: "scanRowIslands", y0, y1, imageWidth: image.width },
        err
      );
      return [];
    }
  }

  /**
   * Dynamically scans a 2D matrix image and extracts clean bounding boxes for every cell.
   */
  public static scanMatrixGrid(
    image: HTMLImageElement,
    expectedRows: number = 5,
    expectedCols: number = 5,
    alphaThreshold: number = 25
  ): BoundingBox[][] {
    if (typeof document === "undefined" || !image || !image.complete || image.naturalWidth === 0) {
      return [];
    }

    try {
      const fullW = image.naturalWidth;
      const fullH = image.naturalHeight;

      const ctx = getScanCanvasContext(fullW, fullH);
      if (!ctx) return [];

      ctx.clearRect(0, 0, fullW, fullH);
      ctx.drawImage(image, 0, 0, fullW, fullH);

      const imgData = ctx.getImageData(0, 0, fullW, fullH);
      const data = imgData.data;

      const rowOcc = new Int32Array(fullH);
      for (let y = 0; y < fullH; y++) {
        let count = 0;
        const rowOffset = y * fullW * 4;
        for (let x = 0; x < fullW; x++) {
          if (data[rowOffset + x * 4 + 3] > alphaThreshold) count++;
        }
        rowOcc[y] = count;
      }

      const detectedBands: { y0: number; y1: number }[] = [];
      let inBand = false;
      let startY = 0;

      for (let y = 0; y < fullH; y++) {
        if (rowOcc[y] > 40 && !inBand) {
          inBand = true;
          startY = y;
        } else if (rowOcc[y] <= 40 && inBand) {
          inBand = false;
          if (y - startY > 60) {
            detectedBands.push({ y0: startY, y1: y - 1 });
          }
        }
      }
      if (inBand && fullH - startY > 60) {
        detectedBands.push({ y0: startY, y1: fullH - 1 });
      }

      const finalBands: { y0: number; y1: number }[] = [];
      if (detectedBands.length === expectedRows) {
        finalBands.push(...detectedBands);
      } else {
        const stepH = fullH / expectedRows;
        for (let r = 0; r < expectedRows; r++) {
          finalBands.push({ y0: Math.round(r * stepH), y1: Math.round((r + 1) * stepH - 1) });
        }
      }

      const matrix: BoundingBox[][] = [];

      for (let r = 0; r < expectedRows; r++) {
        const band = finalBands[r];
        const bandH = band.y1 - band.y0 + 1;

        const colOcc = new Int32Array(fullW);
        for (let x = 0; x < fullW; x++) {
          let count = 0;
          for (let y = band.y0; y <= band.y1; y++) {
            if (data[(y * fullW + x) * 4 + 3] > alphaThreshold) count++;
          }
          colOcc[x] = count;
        }

        const colSegments: { x0: number; x1: number }[] = [];
        let inCol = false;
        let startX = 0;

        for (let x = 0; x < fullW; x++) {
          if (colOcc[x] > 30 && !inCol) {
            inCol = true;
            startX = x;
          } else if (colOcc[x] <= 30 && inCol) {
            inCol = false;
            if (x - startX > 60) {
              colSegments.push({ x0: startX, x1: x - 1 });
            }
          }
        }
        if (inCol && fullW - startX > 60) {
          colSegments.push({ x0: startX, x1: fullW - 1 });
        }

        const rowFrames: BoundingBox[] = [];

        for (let c = 0; c < expectedCols; c++) {
          if (colSegments[c]) {
            const seg = colSegments[c];
            let minY = band.y1;
            let maxY = band.y0;
            for (let y = band.y0; y <= band.y1; y++) {
              const rowOffset = y * fullW * 4;
              for (let x = seg.x0; x <= seg.x1; x++) {
                if (data[rowOffset + x * 4 + 3] > alphaThreshold) {
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }
            rowFrames.push({
              x: seg.x0,
              y: minY,
              w: seg.x1 - seg.x0 + 1,
              h: maxY - minY + 1,
              footY: maxY,
              hasContent: true,
            });
          } else {
            const stepW = fullW / expectedCols;
            rowFrames.push({
              x: Math.round(c * stepW),
              y: band.y0,
              w: Math.round(stepW),
              h: bandH,
              footY: band.y1,
              hasContent: true,
            });
          }
        }
        matrix.push(rowFrames);
      }

      return matrix;
    } catch (err) {
      assetsLogger.debug(
        "IslandDetector.scanMatrixGrid fallback applied",
        { operation: "scanMatrixGrid", expectedRows, expectedCols, imageWidth: image.width, imageHeight: image.height },
        err
      );
      return [];
    }
  }
}
