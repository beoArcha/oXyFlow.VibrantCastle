import { TRANSPARENT } from "./pixelCanvas";
import type { SheetImage } from "./render";
import { encodePngBuffer } from "../lib/png";

const TARGET_WIDTH = 1000;
const CHECKER_SIZE = 8;
const CHECKER_COLORS: [number, number] = [0x6e6e6e, 0x7c7c7c];
const GRID_COLOR = 0x2b2b2b;

export function previewScale(sheetWidth: number): number {
  return Math.max(1, Math.round(TARGET_WIDTH / sheetWidth));
}

function previewColor(sheet: SheetImage, scale: number, ox: number, oy: number): number {
  const stride = sheet.cell * scale;
  if (ox % stride === 0 || oy % stride === 0) return GRID_COLOR;
  const rgb = sheet.pixels[Math.floor(oy / scale) * sheet.width + Math.floor(ox / scale)];
  if (rgb !== TRANSPARENT) return rgb;
  return CHECKER_COLORS[(Math.floor(ox / CHECKER_SIZE) + Math.floor(oy / CHECKER_SIZE)) & 1];
}

/** Nearest-neighbour upscaled sheet on a grey checkerboard with cell grid lines. */
export function renderPreviewPng(sheet: SheetImage): Uint8Array {
  const scale = previewScale(sheet.width);
  const width = sheet.width * scale;
  const height = sheet.height * scale;
  const data = new Uint8Array(width * height * 4);
  for (let oy = 0; oy < height; oy++) {
    for (let ox = 0; ox < width; ox++) {
      const rgb = previewColor(sheet, scale, ox, oy);
      const i = (oy * width + ox) * 4;
      data.set([(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff, 0xff], i);
    }
  }
  return encodePngBuffer({ width, height, data });
}
