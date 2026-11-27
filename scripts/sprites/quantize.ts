import { snapTo } from "./colors";
import { spriteError } from "./errors";
import { TRANSPARENT } from "./pixelCanvas";
import type { Tier } from "./types";
import type { RgbaImage } from "../lib/png";

/** Alpha at or above this value (50 %) is opaque, everything below is dropped: pixel art has no semi-transparency. */
export const ALPHA_CUTOFF = 128;

const LUMA = [0.299, 0.587, 0.114] as const;
/** Channel weights of the colour distance; green counts most, like in the luma. */
const WEIGHT = [2, 4, 3] as const;
const REFINE_ITERATIONS = 8;

/** Recolours opaque source pixels inside a hue / saturation / value window, before the palette is built. */
export interface HueRemap {
  /** Source hue window in degrees, 0..360; `[from, to]` wraps around 360 when `from > to`. */
  hue: [number, number];
  /** Hue (degrees) the matching pixels get; their saturation and value are kept. */
  toHue: number;
  /** Pixels below this saturation (0..1) are left alone (greys). Default 0.25. */
  minSaturation?: number;
  /** Pixels below this value (0..1) are left alone (dark shades). Default 0.2. */
  minValue?: number;
  /** Multiplies the saturation of matching pixels, clamped to 1. Default 1. */
  saturation?: number;
}

/**
 * colour grading of one tier's painted pixels, applied after the downscale and before the palette is built. a missing
 * or default value leaves that step out, so `{}` changes nothing. applied in the order saturation, contrast, gamma.
 */
export interface ColorTune {
  /** power of each channel (0..1 scale): below 1 brightens the mid tones, above 1 darkens them. default 1. */
  gamma?: number;
  /** stretch around mid grey (128): above 1 adds contrast, 0 flattens to grey. default 1. */
  contrast?: number;
  /** distance from the luma: 0 is greyscale, 1 unchanged, above 1 more vivid. default 1. */
  saturation?: number;
}

export type Rgb = [number, number, number];

export const unpack = (rgb: number): Rgb => [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff];
export const pack = (r: number, g: number, b: number): number => (r << 16) | (g << 8) | b;
export const luma = (rgb: number): number => {
  const [r, g, b] = unpack(rgb);
  return LUMA[0] * r + LUMA[1] * g + LUMA[2] * b;
};

function distance(a: Rgb, b: Rgb): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return WEIGHT[0] * dr * dr + WEIGHT[1] * dg * dg + WEIGHT[2] * db * db;
}

/** Exact 2x area-average downscale; alpha is averaged and colours are averaged weighted by alpha. */
export function downscale2x(image: RgbaImage): RgbaImage {
  if (image.width % 2 !== 0 || image.height % 2 !== 0) {
    throw spriteError(`downscale2x needs even dimensions, got ${image.width}x${image.height}.`, { width: image.width, height: image.height });
  }
  const width = image.width / 2;
  const height = image.height / 2;
  const data = new Uint8Array(width * height * 4);
  const src = image.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let alpha = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const i = ((y * 2 + dy) * image.width + x * 2 + dx) * 4;
          const a = src[i + 3];
          alpha += a;
          r += src[i] * a;
          g += src[i + 1] * a;
          b += src[i + 2] * a;
        }
      }
      const o = (y * width + x) * 4;
      if (alpha > 0) {
        data[o] = Math.round(r / alpha);
        data[o + 1] = Math.round(g / alpha);
        data[o + 2] = Math.round(b / alpha);
      }
      data[o + 3] = Math.round(alpha / 4);
    }
  }
  return { width, height, data };
}

const clampByte = (value: number): number => Math.min(255, Math.max(0, Math.round(value)));

/** grades the rgb of an image with saturation, contrast and gamma; alpha is kept. returns the input itself when nothing is set. */
export function tuneColors(image: RgbaImage, tune: ColorTune): RgbaImage {
  const gamma = tune.gamma ?? 1;
  const contrast = tune.contrast ?? 1;
  const saturation = tune.saturation ?? 1;
  if (gamma === 1 && contrast === 1 && saturation === 1) return image;
  const data = new Uint8Array(image.data);
  for (let i = 0; i < data.length; i += 4) {
    const luma = LUMA[0] * data[i] + LUMA[1] * data[i + 1] + LUMA[2] * data[i + 2];
    for (let c = 0; c < 3; c++) {
      const saturated = luma + (data[i + c] - luma) * saturation;
      const contrasted = (saturated - 128) * contrast + 128;
      const unit = Math.min(1, Math.max(0, contrasted / 255));
      data[i + c] = clampByte(255 * unit ** gamma);
    }
  }
  return { width: image.width, height: image.height, data };
}

/** Packed 0xRRGGBB for opaque pixels (alpha >= 50 %), TRANSPARENT otherwise. */
export function thresholdAlpha(image: RgbaImage): Int32Array {
  const out = new Int32Array(image.width * image.height).fill(TRANSPARENT);
  for (let i = 0; i < out.length; i++) {
    const o = i * 4;
    if (image.data[o + 3] >= ALPHA_CUTOFF) out[i] = pack(image.data[o], image.data[o + 1], image.data[o + 2]);
  }
  return out;
}

function toHsv([r, g, b]: Rgb): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return [hue, max === 0 ? 0 : delta / max, max / 255];
}

function fromHsv(hue: number, saturation: number, value: number): number {
  const h = (((hue % 360) + 360) % 360) / 60;
  const c = value * saturation;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = value - c;
  const sector = Math.floor(h);
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][sector % 6];
  return pack(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
}

const inHueWindow = (hue: number, [from, to]: [number, number]): boolean =>
  from <= to ? hue >= from && hue <= to : hue >= from || hue <= to;

/** Applies the first matching remap to one opaque colour. */
export function remapColor(rgb: number, remaps: readonly HueRemap[]): number {
  if (remaps.length === 0) return rgb;
  const [hue, saturation, value] = toHsv(unpack(rgb));
  for (const remap of remaps) {
    if (saturation < (remap.minSaturation ?? 0.25) || value < (remap.minValue ?? 0.2)) continue;
    if (!inHueWindow(hue, remap.hue)) continue;
    return fromHsv(remap.toHue, Math.min(1, saturation * (remap.saturation ?? 1)), value);
  }
  return rgb;
}

/** Index of a colour among the colours of a tier (4,096 for 12-bit, 65,536 for RGB565); equal indices snap to the same colour. */
function colorIndex(rgb: number, tier: Tier): number {
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  return tier === "hi8bit" ? ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4) : ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
}

const tierColors = (tier: Tier): number => (tier === "hi8bit" ? 1 << 12 : 1 << 16);

/** Counts opaque pixels per colour, colours snapped to the tier first so that the palette already lives in tier depth. */
export function addToHistogram(histogram: Map<number, number>, pixels: Int32Array, tier: Tier): void {
  const counts = new Uint32Array(tierColors(tier));
  const sample = new Int32Array(tierColors(tier));
  for (const rgb of pixels) {
    if (rgb === TRANSPARENT) continue;
    const index = colorIndex(rgb, tier);
    counts[index]++;
    sample[index] = rgb;
  }
  counts.forEach((count, index) => {
    if (count === 0) return;
    const key = snapTo(sample[index], tier);
    histogram.set(key, (histogram.get(key) ?? 0) + count);
  });
}

interface Entry {
  rgb: number;
  count: number;
  color: Rgb;
}

function centroid(entries: readonly Entry[]): Rgb {
  let total = 0;
  const sum = [0, 0, 0];
  for (const entry of entries) {
    total += entry.count;
    for (let c = 0; c < 3; c++) sum[c] += entry.color[c] * entry.count;
  }
  return [sum[0] / total, sum[1] / total, sum[2] / total];
}

function sse(entries: readonly Entry[]): number {
  const mean = centroid(entries);
  return entries.reduce((total, entry) => total + entry.count * distance(entry.color, mean), 0);
}

function splitBox(entries: readonly Entry[]): [Entry[], Entry[]] {
  const ranges = [0, 1, 2].map((c) => {
    const values = entries.map((entry) => entry.color[c]);
    return (Math.max(...values) - Math.min(...values)) * WEIGHT[c];
  });
  const channel = ranges.indexOf(Math.max(...ranges));
  const sorted = [...entries].sort((a, b) => a.color[channel] - b.color[channel] || a.rgb - b.rgb);
  const half = sorted.reduce((total, entry) => total + entry.count, 0) / 2;
  let running = 0;
  let cut = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    running += sorted[i].count;
    cut = i + 1;
    if (running >= half) break;
  }
  return [sorted.slice(0, cut), sorted.slice(cut)];
}

function medianCut(entries: Entry[], size: number): Entry[][] {
  const boxes: Entry[][] = [entries];
  while (boxes.length < size) {
    let best = -1;
    let bestScore = 0;
    boxes.forEach((box, i) => {
      const score = box.length > 1 ? sse(box) : 0;
      if (score > bestScore) {
        best = i;
        bestScore = score;
      }
    });
    if (best < 0) break;
    const [low, high] = splitBox(boxes[best]);
    boxes.splice(best, 1, low, high);
  }
  return boxes;
}

function nearestCentre(color: Rgb, centres: readonly Rgb[]): number {
  let best = 0;
  let bestDistance = Infinity;
  centres.forEach((centre, i) => {
    const d = distance(color, centre);
    if (d < bestDistance) {
      best = i;
      bestDistance = d;
    }
  });
  return best;
}

/** Lloyd iterations over the weighted colour list, starting from the median-cut centres. */
function refine(entries: readonly Entry[], start: Rgb[]): Rgb[] {
  let centres = start;
  for (let round = 0; round < REFINE_ITERATIONS; round++) {
    const groups: Entry[][] = centres.map(() => []);
    for (const entry of entries) groups[nearestCentre(entry.color, centres)].push(entry);
    const next = centres.map((centre, i) => (groups[i].length > 0 ? centroid(groups[i]) : centre));
    if (next.every((centre, i) => centre.every((value, c) => value === centres[i][c]))) break;
    centres = next;
  }
  return centres;
}

/**
 * Builds the global palette of one tier: median cut, k-means refinement, snapped to the tier depth, de-duplicated and
 * sorted dark to light (ties by colour value), so the result only depends on the histogram, never on insertion order.
 * The darkest entry (index 0) is the outline colour.
 */
export function buildPalette(histogram: ReadonlyMap<number, number>, size: number, tier: Tier): number[] {
  if (!Number.isInteger(size) || size < 2) throw spriteError(`Palette size must be an integer of at least 2, got ${size}.`, { size });
  const entries: Entry[] = [...histogram]
    .map(([rgb, count]) => ({ rgb, count, color: unpack(rgb) }))
    .sort((a, b) => a.rgb - b.rgb);
  if (entries.length === 0) throw spriteError("Cannot build a palette from a hero without opaque pixels.");
  const boxes = medianCut(entries, size);
  const centres = refine(entries, boxes.map((box) => centroid(box)));
  const snapped = centres.map(([r, g, b]) => snapTo(pack(Math.round(r), Math.round(g), Math.round(b)), tier));
  return [...new Set(snapped)].sort((a, b) => luma(a) - luma(b) || a - b);
}

/** Maps every opaque pixel to its nearest palette entry; transparent pixels stay transparent. */
export function applyPalette(pixels: Int32Array, palette: readonly number[], tier: Tier): Int32Array {
  const centres = palette.map(unpack);
  const cache = new Int32Array(tierColors(tier)).fill(TRANSPARENT);
  return pixels.map((rgb) => {
    if (rgb === TRANSPARENT) return TRANSPARENT;
    const index = colorIndex(rgb, tier);
    if (cache[index] === TRANSPARENT) cache[index] = palette[nearestCentre(unpack(snapTo(rgb, tier)), centres)];
    return cache[index];
  });
}
