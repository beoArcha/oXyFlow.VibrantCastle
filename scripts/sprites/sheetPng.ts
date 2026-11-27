import { encodePngBuffer } from "../lib/png";
import { TRANSPARENT } from "./pixelCanvas";
import type { SheetImage } from "./render";

/** Lossless RGBA PNG of a sheet at 1:1; deterministic bytes for identical pixels. */
export function sheetToPng(sheet: SheetImage): Uint8Array {
  const data = new Uint8Array(sheet.width * sheet.height * 4);
  sheet.pixels.forEach((rgb, index) => {
    if (rgb === TRANSPARENT) return;
    data.set([(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff, 0xff], index * 4);
  });
  return encodePngBuffer({ width: sheet.width, height: sheet.height, data });
}
