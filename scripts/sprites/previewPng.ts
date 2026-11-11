import { deflateSync } from "node:zlib";
import { TRANSPARENT } from "./pixelCanvas";
import type { SheetImage } from "./render";

const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const TARGET_WIDTH = 1000;
const CHECKER_SIZE = 8;
const CHECKER_COLORS: [number, number] = [0x6e6e6e, 0x7c7c7c];
const GRID_COLOR = 0x2b2b2b;

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** Encodes tightly packed RGBA bytes as an 8-bit truecolour PNG. */
export function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 6, 0, 0, 0], 8);
  const raw = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (1 + width * 4) + 1);
  }
  const parts = [PNG_SIGNATURE, chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", new Uint8Array(0))];
  const png = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}

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
  const rgba = new Uint8Array(width * height * 4);
  for (let oy = 0; oy < height; oy++) {
    for (let ox = 0; ox < width; ox++) {
      const rgb = previewColor(sheet, scale, ox, oy);
      const i = (oy * width + ox) * 4;
      rgba.set([(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff, 0xff], i);
    }
  }
  return encodePng(width, height, rgba);
}
