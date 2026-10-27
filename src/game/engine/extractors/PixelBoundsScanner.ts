import { assetsLogger } from "../../logger/gameLogger";
import { getScanCanvasContext, BoundingBox } from "./scanContext";
import { IslandDetector } from "./IslandDetector";

export type { BoundingBox };

export class PixelBoundsScanner {
  /**
   * Scans an HTMLImageElement sub-region for non-transparent pixels.
   */
  public static scanImageRegion(
    image: HTMLImageElement,
    x0: number,
    y0: number,
    w: number,
    h: number,
    alphaThreshold: number = 25
  ): BoundingBox {
    if (typeof document === "undefined" || !image || !image.complete || image.naturalWidth === 0) {
      return { x: Math.round(x0), y: Math.round(y0), w: Math.round(w), h: Math.round(h), hasContent: true };
    }

    try {
      const sw = Math.max(1, Math.round(w));
      const sh = Math.max(1, Math.round(h));
      const sx = Math.max(0, Math.min(image.naturalWidth - 1, Math.round(x0)));
      const sy = Math.max(0, Math.min(image.naturalHeight - 1, Math.round(y0)));

      const ctx = getScanCanvasContext(sw, sh);
      if (!ctx) {
        return { x: sx, y: sy, w: sw, h: sh, hasContent: true };
      }

      ctx.clearRect(0, 0, sw, sh);
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

      const imgData = ctx.getImageData(0, 0, sw, sh);
      const data = imgData.data;

      let minX = sw, maxX = -1, minY = sh, maxY = -1;

      for (let y = 0; y < sh; y++) {
        const rowOffset = y * sw * 4;
        for (let x = 0; x < sw; x++) {
          const alpha = data[rowOffset + x * 4 + 3];
          if (alpha > alphaThreshold) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX === -1) {
        return { x: sx, y: sy, w: sw, h: sh, hasContent: false };
      }

      const iw = maxX - minX + 1;
      const ih = maxY - minY + 1;

      let footSumX = 0;
      let footCount = 0;
      const footTop = maxY - Math.max(4, Math.round(ih * 0.25));
      for (let y = footTop; y <= maxY; y++) {
        const rowOffset = y * sw * 4;
        for (let x = minX; x <= maxX; x++) {
          if (data[rowOffset + x * 4 + 3] > alphaThreshold) {
            footSumX += x - minX;
            footCount++;
          }
        }
      }
      const originX = footCount > 0 ? Math.round(footSumX / footCount) : Math.round(iw * 0.5);

      return {
        x: sx + minX,
        y: sy + minY,
        w: iw,
        h: ih,
        originX,
        originY: ih,
        footY: sy + maxY,
        hasContent: true,
      };
    } catch (err) {
      assetsLogger.debug(
        "PixelBoundsScanner.scanBounds fallback applied",
        { operation: "scanBounds", imageWidth: image.width, imageHeight: image.height },
        err
      );
      return { x: Math.round(x0), y: Math.round(y0), w: Math.round(w), h: Math.round(h), hasContent: true };
    }
  }

  /**
   * Identifies vertical row boundaries of a spritesheet by locating alpha valleys between tracks.
   */
  public static findRowBoundaries(
    image: HTMLImageElement,
    totalRows: number = 8,
    alphaThreshold: number = 25
  ): number[] {
    if (typeof document === "undefined" || !image || !image.complete || image.naturalWidth === 0) {
      const fallbackH = image?.naturalHeight || 1024;
      const nominalH = fallbackH / totalRows;
      return Array.from({ length: totalRows + 1 }, (_, i) => Math.round(i * nominalH));
    }

    try {
      const fullW = image.naturalWidth;
      const fullH = image.naturalHeight;

      const ctx = getScanCanvasContext(fullW, fullH);
      if (!ctx) {
        const nominalH = fullH / totalRows;
        return Array.from({ length: totalRows + 1 }, (_, i) => Math.round(i * nominalH));
      }

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

      const bands: { y0: number; y1: number }[] = [];
      let inBand = false;
      let startY = 0;
      for (let y = 0; y < fullH; y++) {
        if (rowOcc[y] > 5 && !inBand) {
          inBand = true;
          startY = y;
        } else if (rowOcc[y] <= 5 && inBand) {
          inBand = false;
          if (y - startY >= 10) {
            bands.push({ y0: startY, y1: y - 1 });
          }
        }
      }
      if (inBand && fullH - startY >= 10) {
        bands.push({ y0: startY, y1: fullH - 1 });
      }

      const nominalH = fullH / totalRows;
      const refinedBands: { y0: number; y1: number }[] = [];
      for (const b of bands) {
        const h = b.y1 - b.y0 + 1;
        if (h > nominalH * 1.5) {
          let minOcc = Infinity;
          let minOccY = -1;
          const margin = Math.round(nominalH * 0.35);
          for (let y = b.y0 + margin; y <= b.y1 - margin; y++) {
            if (rowOcc[y] < minOcc) {
              minOcc = rowOcc[y];
              minOccY = y;
            }
          }
          if (minOccY !== -1 && minOcc < rowOcc[b.y0 + Math.round(nominalH * 0.5)] * 0.4) {
            refinedBands.push({ y0: b.y0, y1: minOccY - 1 });
            refinedBands.push({ y0: minOccY, y1: b.y1 });
            continue;
          }
        }
        refinedBands.push(b);
      }

      if (refinedBands.length >= 1) {
        const boundaries = [Math.max(0, refinedBands[0].y0 - 2)];
        for (let i = 0; i < refinedBands.length - 1; i++) {
          const gapMid = Math.round((refinedBands[i].y1 + refinedBands[i + 1].y0) / 2);
          boundaries.push(gapMid);
        }
        boundaries.push(fullH);

        while (boundaries.length < totalRows + 1) {
          boundaries.push(fullH);
        }
        return boundaries;
      }

      return Array.from({ length: totalRows + 1 }, (_, i) => Math.round(i * nominalH));
    } catch (err) {
      assetsLogger.debug(
        "PixelBoundsScanner.findRowBoundaries fallback applied",
        { operation: "findRowBoundaries", imageWidth: image.width, imageHeight: image.height },
        err
      );
      const fallbackH = image.naturalHeight || 1024;
      const nominalH = fallbackH / totalRows;
      return Array.from({ length: totalRows + 1 }, (_, i) => Math.round(i * nominalH));
    }
  }

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
    return IslandDetector.scanRowIslands(image, y0, y1, alphaThreshold, minIslandWidth);
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
    return IslandDetector.scanMatrixGrid(image, expectedRows, expectedCols, alphaThreshold);
  }
}
