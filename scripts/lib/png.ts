import { deflateSync, inflateSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";
import { AssetError, ErrorCode } from "../../src/lib/errors";

export interface RgbaImage {
  width: number;
  height: number;
  /** Row-major RGBA8 pixels, length = width * height * 4. */
  data: Uint8Array;
}

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

const CHANNELS_BY_COLOR_TYPE: Readonly<Record<number, number>> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function unfilterScanline(filter: number, raw: Uint8Array, rawPos: number, cur: Uint8Array, prev: Uint8Array, bpp: number): void {
  for (let i = 0; i < cur.length; i++) {
    const x = raw[rawPos + i];
    const a = i >= bpp ? cur[i - bpp] : 0;
    const b = prev[i];
    const c = i >= bpp ? prev[i - bpp] : 0;
    switch (filter) {
      case 0: cur[i] = x; break;
      case 1: cur[i] = (x + a) & 255; break;
      case 2: cur[i] = (x + b) & 255; break;
      case 3: cur[i] = (x + ((a + b) >> 1)) & 255; break;
      case 4: cur[i] = (x + paeth(a, b, c)) & 255; break;
      default:
        throw new AssetError(`Unsupported PNG scanline filter ${filter}`, ErrorCode.ASSET_CORRUPTED, { details: { filter } });
    }
  }
}

interface PngHeader {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  interlace: number;
}

function toRgba(colorType: number, line: Uint8Array, width: number, bytesPerSample: number, palette: Uint8Array | null, trns: Uint8Array | null, out: Uint8Array, outRow: number): void {
  const bpp = CHANNELS_BY_COLOR_TYPE[colorType] * bytesPerSample;
  for (let x = 0; x < width; x++) {
    const o = (outRow * width + x) * 4;
    const s = x * bpp;
    const sample = (ch: number): number => line[s + ch * bytesPerSample];
    if (colorType === 6) {
      out[o] = sample(0); out[o + 1] = sample(1); out[o + 2] = sample(2); out[o + 3] = sample(3);
    } else if (colorType === 2) {
      out[o] = sample(0); out[o + 1] = sample(1); out[o + 2] = sample(2); out[o + 3] = 255;
    } else if (colorType === 0) {
      out[o] = out[o + 1] = out[o + 2] = sample(0); out[o + 3] = 255;
    } else if (colorType === 4) {
      out[o] = out[o + 1] = out[o + 2] = sample(0); out[o + 3] = sample(1);
    } else {
      const idx = line[s];
      out[o] = palette ? palette[idx * 3] : 0;
      out[o + 1] = palette ? palette[idx * 3 + 1] : 0;
      out[o + 2] = palette ? palette[idx * 3 + 2] : 0;
      out[o + 3] = trns && idx < trns.length ? trns[idx] : 255;
    }
  }
}

export function decodePngBuffer(buf: Uint8Array): RgbaImage {
  const view = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
  PNG_SIGNATURE.forEach((byte, i) => {
    if (view[i] !== byte) throw new AssetError("Input is not a PNG file", ErrorCode.ASSET_CORRUPTED);
  });

  let header: PngHeader = { width: 0, height: 0, bitDepth: 0, colorType: 0, interlace: 0 };
  let palette: Uint8Array | null = null;
  let trns: Uint8Array | null = null;
  const idat: Uint8Array[] = [];
  let pos = 8;
  while (pos < view.length) {
    const len = view.readUInt32BE(pos);
    const type = view.toString("ascii", pos + 4, pos + 8);
    const body = view.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      header = { width: body.readUInt32BE(0), height: body.readUInt32BE(4), bitDepth: body[8], colorType: body[9], interlace: body[12] };
    } else if (type === "PLTE") palette = new Uint8Array(body);
    else if (type === "tRNS") trns = new Uint8Array(body);
    else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    pos += 12 + len;
  }

  const { width, height, bitDepth, colorType, interlace } = header;
  if (interlace !== 0 || bitDepth < 8 || CHANNELS_BY_COLOR_TYPE[colorType] === undefined) {
    throw new AssetError("Unsupported PNG variant (interlaced, <8 bit or unknown colour type)", ErrorCode.ASSET_CORRUPTED, {
      details: { interlace, bitDepth, colorType },
    });
  }

  const raw = inflateSync(Buffer.concat(idat));
  const bytesPerSample = bitDepth === 16 ? 2 : 1;
  const bpp = CHANNELS_BY_COLOR_TYPE[colorType] * bytesPerSample;
  const stride = width * bpp;
  const data = new Uint8Array(width * height * 4);
  let prev = new Uint8Array(stride);
  let cur = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    unfilterScanline(raw[rowStart], raw, rowStart + 1, cur, prev, bpp);
    toRgba(colorType, cur, width, bytesPerSample, palette, trns, data, y);
    [prev, cur] = [cur, prev];
  }
  return { width, height, data };
}

export function decodePngFile(path: string): RgbaImage {
  return decodePngBuffer(readFileSync(path));
}

function makeChunk(type: string, body: Uint8Array): Buffer {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, "ascii");
  out.set(body, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

export function encodePngBuffer(image: RgbaImage): Buffer {
  const { width, height, data } = image;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw.set(data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from(PNG_SIGNATURE),
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", deflateSync(raw, { level: 9 })),
    makeChunk("IEND", new Uint8Array(0)),
  ]);
}

export function writePngFile(path: string, image: RgbaImage): void {
  writeFileSync(path, encodePngBuffer(image));
}
