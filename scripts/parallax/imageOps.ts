import type { RgbaImage } from "../lib/png";
import { snap12, snap565 } from "../sprites/colors";

export type ParallaxQuantTier = "hi8bit" | "hi16bit";

interface HistogramEntry {
  readonly key: number;
  readonly count: number;
  readonly rgba: [number, number, number, number];
}

const CHANNEL_WEIGHTS: readonly [number, number, number, number] = [2, 4, 3, 4];
const REFINE_ITERATIONS = 3;
const HI8BIT_ALPHA_STEP = 36;

function clampByte(value: number): number {
  if (value <= 0) return 0;
  if (value >= 255) return 255;
  return Math.round(value);
}

function packRgba(r: number, g: number, b: number, a: number): number {
  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

function unpackRgb(rgb: number): [number, number, number] {
  return [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff];
}

/**
 * Extends an image horizontally to `targetWidth` by repeating its rightmost column.
 */
export function widenToWidth(image: RgbaImage, targetWidth: number): RgbaImage {
  if (image.width >= targetWidth) return image;
  const { width, height, data } = image;
  const out = new Uint8Array(targetWidth * height * 4);

  for (let y = 0; y < height; y++) {
    const srcRow = y * width * 4;
    const dstRow = y * targetWidth * 4;
    out.set(data.subarray(srcRow, srcRow + width * 4), dstRow);
    const edgeOffset = srcRow + (width - 1) * 4;
    for (let x = width; x < targetWidth; x++) {
      const dst = dstRow + x * 4;
      out[dst] = data[edgeOffset];
      out[dst + 1] = data[edgeOffset + 1];
      out[dst + 2] = data[edgeOffset + 2];
      out[dst + 3] = data[edgeOffset + 3];
    }
  }

  return { width: targetWidth, height, data: out };
}

/**
 * Deterministic alpha-premultiplied area-average downscaler.
 */
export function downscaleArea(
  image: RgbaImage,
  targetWidth: number,
  targetHeight: number,
  opaque: boolean
): RgbaImage {
  const { width: srcW, height: srcH, data: src } = image;
  if (srcW === targetWidth && srcH === targetHeight && !opaque) {
    return { width: srcW, height: srcH, data: new Uint8Array(src) };
  }

  const out = new Uint8Array(targetWidth * targetHeight * 4);
  const scaleX = srcW / targetWidth;
  const scaleY = srcH / targetHeight;

  for (let dy = 0; dy < targetHeight; dy++) {
    const sy0 = dy * scaleY;
    const sy1 = (dy + 1) * scaleY;
    const iy0 = Math.floor(sy0);
    const iy1 = Math.min(srcH - 1, Math.floor(sy1 - 1e-9));

    for (let dx = 0; dx < targetWidth; dx++) {
      const sx0 = dx * scaleX;
      const sx1 = (dx + 1) * scaleX;
      const ix0 = Math.floor(sx0);
      const ix1 = Math.min(srcW - 1, Math.floor(sx1 - 1e-9));

      let areaSum = 0;
      let alphaSum = 0;
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;

      for (let sy = iy0; sy <= iy1; sy++) {
        const wy = Math.min(sy + 1, sy1) - Math.max(sy, sy0);
        const rowBase = sy * srcW;
        for (let sx = ix0; sx <= ix1; sx++) {
          const wx = Math.min(sx + 1, sx1) - Math.max(sx, sx0);
          const w = wx * wy;
          const idx = (rowBase + sx) * 4;
          const a = opaque ? 255 : src[idx + 3];
          areaSum += w;
          alphaSum += w * a;
          rSum += w * a * src[idx];
          gSum += w * a * src[idx + 1];
          bSum += w * a * src[idx + 2];
        }
      }

      const dst = (dy * targetWidth + dx) * 4;
      if (alphaSum > 0 && areaSum > 0) {
        out[dst] = clampByte(rSum / alphaSum);
        out[dst + 1] = clampByte(gSum / alphaSum);
        out[dst + 2] = clampByte(bSum / alphaSum);
        out[dst + 3] = opaque ? 255 : clampByte(alphaSum / areaSum);
      }
    }
  }

  return { width: targetWidth, height: targetHeight, data: out };
}

function quantizeBucketKey(r: number, g: number, b: number, a: number, tier: ParallaxQuantTier): number {
  if (tier === "hi8bit") {
    return packRgba(r & 0xf0, g & 0xf0, b & 0xf0, a & 0xf0);
  }
  return packRgba(r & 0xf8, g & 0xfc, b & 0xf8, a & 0xf8);
}

function snapChannelTuple(
  r: number,
  g: number,
  b: number,
  a: number,
  tier: ParallaxQuantTier,
  opaque: boolean
): [number, number, number, number] {
  const packed = ((clampByte(r) << 16) | (clampByte(g) << 8) | clampByte(b)) >>> 0;
  const snapped = tier === "hi8bit" ? snap12(packed) : snap565(packed);
  const [sr, sg, sb] = unpackRgb(snapped);
  if (opaque) return [sr, sg, sb, 255];

  const clampedA = clampByte(a);
  if (tier === "hi16bit") return [sr, sg, sb, clampedA];
  if (clampedA >= 240) return [sr, sg, sb, 255];
  if (clampedA <= 8) return [0, 0, 0, 0];
  return [sr, sg, sb, Math.min(255, Math.round(clampedA / HI8BIT_ALPHA_STEP) * HI8BIT_ALPHA_STEP)];
}

function weightedDist(a: readonly [number, number, number, number], b: readonly [number, number, number, number]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  const da = a[3] - b[3];
  return (
    CHANNEL_WEIGHTS[0] * dr * dr +
    CHANNEL_WEIGHTS[1] * dg * dg +
    CHANNEL_WEIGHTS[2] * db * db +
    CHANNEL_WEIGHTS[3] * da * da
  );
}

function boxCentroid(entries: readonly HistogramEntry[]): [number, number, number, number] {
  let total = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  for (const e of entries) {
    total += e.count;
    r += e.rgba[0] * e.count;
    g += e.rgba[1] * e.count;
    b += e.rgba[2] * e.count;
    a += e.rgba[3] * e.count;
  }
  return [r / total, g / total, b / total, a / total];
}

function boxSse(entries: readonly HistogramEntry[]): number {
  const mean = boxCentroid(entries);
  let sum = 0;
  for (const e of entries) {
    sum += e.count * weightedDist(e.rgba, mean);
  }
  return sum;
}

function splitBox(entries: readonly HistogramEntry[]): [HistogramEntry[], HistogramEntry[]] {
  let bestChannel = 0;
  let bestSpan = -1;
  for (let c = 0; c < 4; c++) {
    let min = 255;
    let max = 0;
    for (const e of entries) {
      if (e.rgba[c] < min) min = e.rgba[c];
      if (e.rgba[c] > max) max = e.rgba[c];
    }
    const span = (max - min) * CHANNEL_WEIGHTS[c];
    if (span > bestSpan) {
      bestSpan = span;
      bestChannel = c;
    }
  }

  const sorted = [...entries].sort((x, y) => x.rgba[bestChannel] - y.rgba[bestChannel] || x.key - y.key);
  let total = 0;
  for (const e of sorted) total += e.count;
  const half = total / 2;

  let running = 0;
  let cut = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    running += sorted[i].count;
    cut = i + 1;
    if (running >= half) break;
  }
  return [sorted.slice(0, cut), sorted.slice(cut)];
}

function nearestPaletteIndex(
  rgba: readonly [number, number, number, number],
  centres: readonly [number, number, number, number][]
): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < centres.length; i++) {
    const d = weightedDist(rgba, centres[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/**
 * Deterministic 4D weighted median-cut + Lloyd k-means color quantizer.
 * Preserves semi-transparent atmospheric layers and snaps colors to tier depth.
 */
export function quantizeRgba(
  image: RgbaImage,
  maxColors: number,
  tier: ParallaxQuantTier,
  opaque: boolean
): RgbaImage {
  const { width, height, data } = image;
  const alphaCutoff = opaque ? 0 : tier === "hi8bit" ? 8 : 2;
  const counts = new Map<number, number>();
  let hasTransparent = false;

  for (let i = 0; i < data.length; i += 4) {
    const a = opaque ? 255 : data[i + 3];
    if (a <= alphaCutoff) {
      hasTransparent = true;
      continue;
    }
    const key = quantizeBucketKey(data[i], data[i + 1], data[i + 2], a, tier);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const out = new Uint8Array(data.length);
  if (counts.size === 0) {
    return { width, height, data: out };
  }

  const entries: HistogramEntry[] = [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([key, count]) => ({
      key,
      count,
      rgba: [(key >>> 24) & 0xff, (key >>> 16) & 0xff, (key >>> 8) & 0xff, key & 0xff],
    }));

  const targetOpaqueColors = hasTransparent ? Math.max(2, maxColors - 1) : maxColors;
  const boxes: HistogramEntry[][] = [entries];

  while (boxes.length < targetOpaqueColors) {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].length <= 1) continue;
      const score = boxSse(boxes[i]);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestIdx < 0) break;
    const [left, right] = splitBox(boxes[bestIdx]);
    boxes.splice(bestIdx, 1, left, right);
  }

  let centres = boxes.map((box) => boxCentroid(box));
  for (let iter = 0; iter < REFINE_ITERATIONS; iter++) {
    const buckets: HistogramEntry[][] = centres.map(() => []);
    for (const entry of entries) {
      buckets[nearestPaletteIndex(entry.rgba, centres)].push(entry);
    }
    let changed = false;
    const next = centres.map((prev, i) => {
      if (buckets[i].length === 0) return prev;
      const c = boxCentroid(buckets[i]);
      if (c[0] !== prev[0] || c[1] !== prev[1] || c[2] !== prev[2] || c[3] !== prev[3]) changed = true;
      return c;
    });
    centres = next;
    if (!changed) break;
  }

  const uniqueMap = new Map<number, [number, number, number, number]>();
  for (const [r, g, b, a] of centres) {
    const snapped = snapChannelTuple(r, g, b, a, tier, opaque);
    if (!opaque && snapped[3] === 0) continue;
    uniqueMap.set(packRgba(snapped[0], snapped[1], snapped[2], snapped[3]), snapped);
  }
  const palette = [...uniqueMap.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]);
  if (palette.length === 0) {
    palette.push(snapChannelTuple(entries[0].rgba[0], entries[0].rgba[1], entries[0].rgba[2], entries[0].rgba[3], tier, opaque));
  }

  const bucketCache = new Map<number, [number, number, number, number]>();
  for (const entry of entries) {
    bucketCache.set(entry.key, palette[nearestPaletteIndex(entry.rgba, palette)]);
  }

  for (let i = 0; i < data.length; i += 4) {
    const a = opaque ? 255 : data[i + 3];
    if (a <= alphaCutoff) continue;
    const key = quantizeBucketKey(data[i], data[i + 1], data[i + 2], a, tier);
    const mapped = bucketCache.get(key) ?? palette[0];
    out[i] = mapped[0];
    out[i + 1] = mapped[1];
    out[i + 2] = mapped[2];
    out[i + 3] = mapped[3];
  }

  return { width, height, data: out };
}

/**
 * Boss zone variant grading: darker, desaturated, crimson-tinted, and stronger symmetric vignette.
 */
export function gradeBossVariant(image: RgbaImage): RgbaImage {
  const { width, height, data } = image;
  const out = new Uint8Array(data.length);
  const crimsonR = 148;
  const crimsonG = 20;
  const crimsonB = 30;

  for (let y = 0; y < height; y++) {
    const ny = Math.abs((y + 0.5) / height - 0.5) * 2;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a === 0) continue;

      // Horizontally symmetric vignette preserves mirror tiling along edges.
      const nx = Math.abs((x + 0.5) / width - 0.5) * 2;
      const vignette = 1 - 0.38 * (0.55 * nx * nx + 0.45 * ny * ny);
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      const sat = 0.62;
      const dr = (luma + (r - luma) * sat) * 0.86 * vignette;
      const dg = (luma + (g - luma) * sat) * 0.7 * vignette;
      const db = (luma + (b - luma) * sat) * 0.72 * vignette;

      const mix = 0.14 + 0.1 * (1 - vignette);
      out[idx] = clampByte(dr * (1 - mix) + crimsonR * mix);
      out[idx + 1] = clampByte(dg * (1 - mix) + crimsonG * mix);
      out[idx + 2] = clampByte(db * (1 - mix) + crimsonB * mix);
      out[idx + 3] = a;
    }
  }

  return { width, height, data: out };
}

/**
 * Rest zone variant grading: warmer, lighter, with a soft amber glow.
 */
export function gradeRestVariant(image: RgbaImage): RgbaImage {
  const { width, height, data } = image;
  const out = new Uint8Array(data.length);
  const amberR = 248;
  const amberG = 178;
  const amberB = 72;

  for (let y = 0; y < height; y++) {
    const ny = Math.abs((y + 0.5) / height - 0.5) * 2;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a === 0) continue;

      const nx = Math.abs((x + 0.5) / width - 0.5) * 2;
      const glow = Math.max(0, 1 - 0.6 * (0.6 * nx * nx + 0.4 * ny * ny));

      const lr = 255 * Math.pow(data[idx] / 255, 0.93) * 1.05 + 4;
      const lg = 255 * Math.pow(data[idx + 1] / 255, 0.95) * 1.0 + 2;
      const lb = 255 * Math.pow(data[idx + 2] / 255, 0.98) * 0.9;

      const mix = 0.1 + 0.1 * glow;
      out[idx] = clampByte(lr * (1 - mix) + amberR * mix + 14 * glow);
      out[idx + 1] = clampByte(lg * (1 - mix) + amberG * mix + 9 * glow);
      out[idx + 2] = clampByte(lb * (1 - mix) + amberB * mix + 2 * glow);
      out[idx + 3] = a;
    }
  }

  return { width, height, data: out };
}
