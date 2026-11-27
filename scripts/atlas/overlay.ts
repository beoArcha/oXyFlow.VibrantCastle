import type { RgbaImage } from "../lib/png";
import { computeFrameRect, listAnimationNames } from "./frameCheck";
import type { IAtlasMetaLike } from "../../src/game/renderer/atlasMetadataResolver";
import { resolveAnimationTrack } from "../../src/game/renderer/atlasMetadataResolver";
import type { Rect } from "./islands";

type Color = readonly [number, number, number];

const BACKGROUND: Color = [90, 90, 98];
const FRAME_COLOR: Color = [255, 64, 64];
const BODY_COLOR: Color = [64, 255, 96];

function flatten(image: RgbaImage): RgbaImage {
  const out: RgbaImage = { width: image.width, height: image.height, data: new Uint8Array(image.data.length) };
  for (let i = 0; i < image.width * image.height; i++) {
    const a = image.data[i * 4 + 3] / 255;
    for (let c = 0; c < 3; c++) out.data[i * 4 + c] = Math.round(image.data[i * 4 + c] * a + BACKGROUND[c] * (1 - a));
    out.data[i * 4 + 3] = 255;
  }
  return out;
}

function outline(image: RgbaImage, rect: Rect, color: Color): void {
  const x0 = Math.max(0, Math.floor(rect.x));
  const y0 = Math.max(0, Math.floor(rect.y));
  const x1 = Math.min(image.width - 1, Math.ceil(rect.x + rect.w) - 1);
  const y1 = Math.min(image.height - 1, Math.ceil(rect.y + rect.h) - 1);
  const put = (x: number, y: number): void => image.data.set([color[0], color[1], color[2], 255], (y * image.width + x) * 4);
  for (let x = x0; x <= x1; x++) {
    put(x, y0);
    put(x, y1);
  }
  for (let y = y0; y <= y1; y++) {
    put(x0, y);
    put(x1, y);
  }
}

/** Box-filter downscale so overlays stay readable under a width limit. */
export function downscale(image: RgbaImage, maxWidth: number): RgbaImage {
  const factor = Math.max(1, Math.ceil(image.width / maxWidth));
  if (factor === 1) return image;
  const width = Math.floor(image.width / factor);
  const height = Math.floor(image.height / factor);
  const out: RgbaImage = { width, height, data: new Uint8Array(width * height * 4) };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 4; c++) {
        let sum = 0;
        for (let dy = 0; dy < factor; dy++) {
          for (let dx = 0; dx < factor; dx++) sum += image.data[((y * factor + dy) * image.width + x * factor + dx) * 4 + c];
        }
        out.data[(y * width + x) * 4 + c] = Math.round(sum / (factor * factor));
      }
    }
  }
  return out;
}

export function renderOverlay(image: RgbaImage, meta: IAtlasMetaLike, bodyBox: Rect | undefined, maxWidth = 1500): RgbaImage {
  const canvas = flatten(image);
  for (const animation of listAnimationNames(meta)) {
    const frames = resolveAnimationTrack(meta, animation)?.frames ?? 1;
    for (let frame = 0; frame < frames; frame++) {
      const rect = computeFrameRect(meta, image.width, image.height, animation, frame);
      if (bodyBox) {
        const cellW = image.width / (meta.atlas?.columns || 1);
        outline(canvas, { x: rect.x + bodyBox.x * cellW, y: rect.y + bodyBox.y * rect.h, w: bodyBox.w * cellW, h: bodyBox.h * rect.h }, BODY_COLOR);
      }
      outline(canvas, rect, FRAME_COLOR);
    }
  }
  return downscale(canvas, maxWidth);
}
