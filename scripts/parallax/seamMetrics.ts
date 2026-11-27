import type { RgbaImage } from "../lib/png";

export interface SeamMeasurement {
  /** Mean absolute RGBA difference between the right-most and left-most columns. */
  seamDiff: number;
  /** Mean absolute RGBA difference between two adjacent interior columns, the natural detail floor. */
  neighbourDiff: number;
  /** Rows where at least one of the compared pixels has non-zero alpha. */
  comparedRows: number;
}

export type SeamVerdict = "pass" | "warn";

export const SEAM_WARN_THRESHOLD = 10;

function columnDifference(image: RgbaImage, colA: number, colB: number): { mean: number; rows: number } {
  const { width, height, data } = image;
  let sum = 0;
  let rows = 0;
  for (let y = 0; y < height; y++) {
    const a = (y * width + colA) * 4;
    const b = (y * width + colB) * 4;
    if (data[a + 3] === 0 && data[b + 3] === 0) continue;
    sum +=
      Math.abs(data[a] - data[b]) +
      Math.abs(data[a + 1] - data[b + 1]) +
      Math.abs(data[a + 2] - data[b + 2]) +
      Math.abs(data[a + 3] - data[b + 3]);
    rows++;
  }
  return { mean: rows === 0 ? 0 : sum / (rows * 4), rows };
}

export function measureHorizontalSeam(image: RgbaImage): SeamMeasurement {
  const seam = columnDifference(image, image.width - 1, 0);
  const mid = Math.floor(image.width / 2);
  const neighbour = columnDifference(image, mid, mid + 1);
  return { seamDiff: seam.mean, neighbourDiff: neighbour.mean, comparedRows: seam.rows };
}

export function seamVerdict(measurement: SeamMeasurement, threshold: number = SEAM_WARN_THRESHOLD): SeamVerdict {
  return measurement.seamDiff > threshold ? "warn" : "pass";
}
