import type { RgbaImage } from "../lib/png";
import { drawText } from "./bitmapFont";
import type { HeroFrameReport } from "./heroFrameCheck";
import { downscale } from "./overlay";

type Color = readonly [number, number, number];

const BACKGROUND: Color = [90, 90, 98];
const PALETTE: Color[] = [
  [255, 96, 96],
  [96, 200, 255],
  [255, 200, 64],
  [120, 255, 120],
  [255, 120, 255],
  [255, 160, 96],
  [160, 160, 255],
  [96, 255, 220],
];
const FLAGGED: Color = [255, 255, 255];

function flatten(image: RgbaImage): RgbaImage {
  const out: RgbaImage = { width: image.width, height: image.height, data: new Uint8Array(image.data.length) };
  for (let i = 0; i < image.width * image.height; i++) {
    const a = image.data[i * 4 + 3] / 255;
    for (let c = 0; c < 3; c++) out.data[i * 4 + c] = Math.round(image.data[i * 4 + c] * a + BACKGROUND[c] * (1 - a));
    out.data[i * 4 + 3] = 255;
  }
  return out;
}

function outline(image: RgbaImage, frame: HeroFrameReport["rect"], color: Color): void {
  const x1 = Math.min(image.width - 1, frame.x + frame.w - 1);
  const y1 = Math.min(image.height - 1, frame.y + frame.h - 1);
  const put = (x: number, y: number): void => image.data.set([color[0], color[1], color[2], 255], (y * image.width + x) * 4);
  for (let x = frame.x; x <= x1; x++) {
    put(x, frame.y);
    put(x, y1);
  }
  for (let y = frame.y; y <= y1; y++) {
    put(frame.x, y);
    put(x1, y);
  }
}

/**
 * Draws the runtime-detected frame rectangles, each labelled `animation:index` (flagged frames in
 * white), then box-downscales to `maxWidth`. Labels use the sheet's pixel scale, so they shrink with it.
 */
export function renderHeroOverlay(image: RgbaImage, frames: readonly HeroFrameReport[], animationOrder: readonly string[], maxWidth = 1500): RgbaImage {
  const canvas = flatten(image);
  const labelScale = Math.max(1, Math.round((image.width / maxWidth) * 2));
  for (const frame of frames) {
    const color = frame.flags.length > 0 ? FLAGGED : PALETTE[animationOrder.indexOf(frame.animation) % PALETTE.length];
    outline(canvas, frame.rect, color);
    drawText(canvas, `${frame.animation}:${frame.frame}`, frame.rect.x + 2, Math.max(0, frame.rect.y - 6 * labelScale), labelScale, color);
  }
  return downscale(canvas, maxWidth);
}
