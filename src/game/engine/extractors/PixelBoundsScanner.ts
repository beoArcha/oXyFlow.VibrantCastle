/**
 * Utility for analyzing pixel alpha bounds from HTMLImageElement or raw pixel arrays.
 * Enables zero-drift, pixel-perfect sprite bounding without hardcoded frame coordinates or cell-truncation.
 */
export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  hasContent: boolean;
  footY?: number;
  originX?: number;
  originY?: number;
}

import { assetsLogger } from "../../logger/gameLogger";

export class PixelBoundsScanner {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;

  private static getContext(w: number, h: number): CanvasRenderingContext2D | null {
    if (typeof document === "undefined") return null;
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    }
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    return this.ctx;
  }

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

      const ctx = this.getContext(sw, sh);
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

      // Compute foot center of mass
      let footSumX = 0;
      let footCount = 0;
      const footTop = maxY - Math.max(4, Math.round(ih * 0.25));
      for (let y = footTop; y <= maxY; y++) {
        const rowOffset = y * sw * 4;
        for (let x = minX; x <= maxX; x++) {
          if (data[rowOffset + x * 4 + 3] > alphaThreshold) {
            footSumX += (x - minX);
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
      assetsLogger.debug("PixelBoundsScanner.scanBounds fallback applied", undefined, err);
      return { x: Math.round(x0), y: Math.round(y0), w: Math.round(w), h: Math.round(h), hasContent: true };
    }
  }

  /**
   * Identifies the true vertical row boundaries of a spritesheet by locating the alpha-occupancy valleys
   * between animation tracks. Prevents inter-row sprite bleeding (such as cut-off boots or floating fragments).
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

      const ctx = this.getContext(fullW, fullH);
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

      // 1. Identify non-empty continuous horizontal occupancy bands
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

      // 2. Refine any extra tall band (e.g. height > 1.5x nominal) that contains combined rows
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

      // 3. Build boundaries using the midpoints of transparent gaps between refined bands
      if (refinedBands.length >= 1) {
        const boundaries = [Math.max(0, refinedBands[0].y0 - 2)];
        for (let i = 0; i < refinedBands.length - 1; i++) {
          const gapMid = Math.round((refinedBands[i].y1 + refinedBands[i + 1].y0) / 2);
          boundaries.push(gapMid);
        }
        boundaries.push(fullH);

        // If fewer bands detected than requested rows, pad with fullH so existing rows are never bisected
        while (boundaries.length < totalRows + 1) {
          boundaries.push(fullH);
        }
        return boundaries;
      }

      // Fallback
      return Array.from({ length: totalRows + 1 }, (_, i) => Math.round(i * nominalH));
    } catch (err) {
      assetsLogger.debug("PixelBoundsScanner.findRowBoundaries fallback applied", undefined, err);
      const fallbackH = image.naturalHeight || 1024;
      const nominalH = fallbackH / totalRows;
      return Array.from({ length: totalRows + 1 }, (_, i) => Math.round(i * nominalH));
    }
  }

  /**
   * Scans an entire horizontal row band of an image and isolates all contiguous sprite islands.
   * Eliminates cell-boundary slicing artifacts and stray ghost cuts completely.
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

      const ctx = this.getContext(fullW, bandH);
      if (!ctx) return [];

      ctx.clearRect(0, 0, fullW, bandH);
      ctx.drawImage(image, 0, sy, fullW, bandH, 0, 0, fullW, bandH);

      const imgData = ctx.getImageData(0, 0, fullW, bandH);
      const data = imgData.data;

      // 1D horizontal alpha occupancy profile
      const colOcc = new Int32Array(fullW);
      for (let x = 0; x < fullW; x++) {
        let count = 0;
        for (let y = 0; y < bandH; y++) {
          if (data[(y * fullW + x) * 4 + 3] > alphaThreshold) count++;
        }
        colOcc[x] = count;
      }

      // Find contiguous column segments (islands)
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
      if (inSeg && (fullW - startX >= minIslandWidth)) {
        segments.push({ x0: startX, x1: fullW - 1 });
      }

      // For each segment, compute exact min/max bounds inside band
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

          // Compute foot center of mass (bottom 25% of sprite body)
          let footSumX = 0;
          let footCount = 0;
          const footTop = maxY - Math.max(4, Math.round(ih * 0.25));
          for (let y = footTop; y <= maxY; y++) {
            const rowOffset = y * fullW * 4;
            for (let x = seg.x0; x <= seg.x1; x++) {
              if (data[rowOffset + x * 4 + 3] > alphaThreshold) {
                footSumX += (x - seg.x0);
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
      assetsLogger.debug("PixelBoundsScanner.scanRowIslands fallback applied", undefined, err);
      return [];
    }
  }

  /**
   * Dynamically scans a 2D matrix image (such as mood expression portrait sheets).
   * Finds row bands and column clusters to extract clean bounding boxes for every cell.
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

      const ctx = this.getContext(fullW, fullH);
      if (!ctx) return [];

      ctx.clearRect(0, 0, fullW, fullH);
      ctx.drawImage(image, 0, 0, fullW, fullH);

      const imgData = ctx.getImageData(0, 0, fullW, fullH);
      const data = imgData.data;

      // 1. Scan vertical occupancy to identify row bands
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
      if (inBand && (fullH - startY > 60)) {
        detectedBands.push({ y0: startY, y1: fullH - 1 });
      }

      // If detected row bands match or fallback to equal partitions
      const finalBands: { y0: number; y1: number }[] = [];
      if (detectedBands.length === expectedRows) {
        finalBands.push(...detectedBands);
      } else {
        const stepH = fullH / expectedRows;
        for (let r = 0; r < expectedRows; r++) {
          finalBands.push({ y0: Math.round(r * stepH), y1: Math.round((r + 1) * stepH - 1) });
        }
      }

      // 2. For each band, identify column segments
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
        if (inCol && (fullW - startX > 60)) {
          colSegments.push({ x0: startX, x1: fullW - 1 });
        }

        const rowFrames: BoundingBox[] = [];

        for (let c = 0; c < expectedCols; c++) {
          if (colSegments[c]) {
            const seg = colSegments[c];
            let minY = band.y1, maxY = band.y0;
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
      assetsLogger.debug("PixelBoundsScanner.scanMatrixIslands fallback applied", undefined, err);
      return [];
    }
  }
}

