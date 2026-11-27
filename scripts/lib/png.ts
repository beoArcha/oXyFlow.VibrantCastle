import { deflateSync, inflateSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";
import { AssetError, ErrorCode } from "../../src/lib/errors";

export interface RgbaImage {
  width: number;
  height: number;
  /** Row-major RGBA8 pixels, length = width * height * 4. */
  data: Uint8Array;
}

export interface PngEncodeOptions {
  /** PNG color type: 2 (RGB, no alpha), 3 (indexed palette, <= 256 RGBA), or 6 (RGBA, default). */
  colorType?: 2 | 3 | 6;
  /** Selects the best PNG scanline filter per row for smaller files (ignored for indexed PNGs). */
  adaptiveFilter?: boolean;
  /** Specific scanline filter strategy (defaults to adaptive when `adaptiveFilter` is true, else none). */
  filter?: "none" | "paeth" | "adaptive";
  /** zlib compression level 1..9 (default 9). */
  compressionLevel?: number;
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
  const length = cur.length;
  switch (filter) {
    case 0:
      for (let i = 0; i < length; i++) cur[i] = raw[rawPos + i];
      return;
    case 1:
      for (let i = 0; i < length; i++) cur[i] = (raw[rawPos + i] + (i >= bpp ? cur[i - bpp] : 0)) & 255;
      return;
    case 2:
      for (let i = 0; i < length; i++) cur[i] = (raw[rawPos + i] + prev[i]) & 255;
      return;
    case 3:
      for (let i = 0; i < length; i++) cur[i] = (raw[rawPos + i] + (((i >= bpp ? cur[i - bpp] : 0) + prev[i]) >> 1)) & 255;
      return;
    case 4:
      for (let i = 0; i < length; i++) {
        const a = i >= bpp ? cur[i - bpp] : 0;
        const c = i >= bpp ? prev[i - bpp] : 0;
        cur[i] = (raw[rawPos + i] + paeth(a, prev[i], c)) & 255;
      }
      return;
    default:
      throw new AssetError(`Unsupported PNG scanline filter ${filter}`, ErrorCode.ASSET_CORRUPTED, { details: { filter } });
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
  if (colorType === 6 && bytesPerSample === 1) {
    out.set(line.subarray(0, width * 4), outRow * width * 4);
    return;
  }
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

function buildRawRgbBytes(image: RgbaImage): Uint8Array {
  const { width, height, data } = image;
  const raw = new Uint8Array(width * height * 3);
  for (let i = 0, o = 0; i < data.length; i += 4, o += 3) {
    raw[o] = data[i];
    raw[o + 1] = data[i + 1];
    raw[o + 2] = data[i + 2];
  }
  return raw;
}

function buildIndexedPayload(image: RgbaImage): {
  pixels: Uint8Array;
  plte: Buffer;
  trns: Buffer | null;
} {
  const { width, height, data } = image;
  const rgbaSet = new Set<number>();
  for (let i = 0; i < data.length; i += 4) {
    const key = ((data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3]) >>> 0;
    rgbaSet.add(key);
    if (rgbaSet.size > 256) {
      throw new AssetError("Indexed PNG encoding supports at most 256 unique RGBA colors", ErrorCode.ASSET_CORRUPTED, {
        details: { colorCount: rgbaSet.size },
      });
    }
  }

  // Sort transparent/translucent entries first so tRNS can stop at the last non-opaque index.
  const entries = [...rgbaSet].sort((a, b) => (a & 0xff) - (b & 0xff) || a - b);
  const indexByKey = new Map<number, number>();
  const plte = Buffer.alloc(entries.length * 3);
  let lastAlphaIdx = -1;

  for (let idx = 0; idx < entries.length; idx++) {
    const key = entries[idx];
    indexByKey.set(key, idx);
    plte[idx * 3] = (key >>> 24) & 0xff;
    plte[idx * 3 + 1] = (key >>> 16) & 0xff;
    plte[idx * 3 + 2] = (key >>> 8) & 0xff;
    if ((key & 0xff) < 255) lastAlphaIdx = idx;
  }

  const trns = lastAlphaIdx >= 0 ? Buffer.alloc(lastAlphaIdx + 1) : null;
  if (trns) {
    for (let idx = 0; idx <= lastAlphaIdx; idx++) {
      trns[idx] = entries[idx] & 0xff;
    }
  }

  const pixels = new Uint8Array(width * height);
  for (let p = 0; p < pixels.length; p++) {
    const o = p * 4;
    const key = ((data[o] << 24) | (data[o + 1] << 16) | (data[o + 2] << 8) | data[o + 3]) >>> 0;
    pixels[p] = indexByKey.get(key) ?? 0;
  }

  return { pixels, plte, trns };
}

function filterScanlines(
  pixels: Uint8Array,
  width: number,
  height: number,
  bpp: number,
  filterMode: "none" | "paeth" | "adaptive"
): Buffer {
  const stride = width * bpp;
  const raw = Buffer.alloc(height * (stride + 1));
  if (filterMode === "none") {
    for (let y = 0; y < height; y++) {
      raw.set(pixels.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
    }
    return raw;
  }

  if (filterMode === "paeth") {
    for (let y = 0; y < height; y++) {
      const rowOffset = y * stride;
      const prevOffset = (y - 1) * stride;
      const outPos = y * (stride + 1);
      raw[outPos] = 4;
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? pixels[rowOffset + i - bpp] : 0;
        const b = y > 0 ? pixels[prevOffset + i] : 0;
        const c = y > 0 && i >= bpp ? pixels[prevOffset + i - bpp] : 0;
        raw[outPos + 1 + i] = (pixels[rowOffset + i] - paeth(a, b, c)) & 0xff;
      }
    }
    return raw;
  }

  const candidates = [new Uint8Array(stride), new Uint8Array(stride), new Uint8Array(stride), new Uint8Array(stride), new Uint8Array(stride)];
  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    const prevOffset = (y - 1) * stride;
    let bestFilter = 0;
    let bestScore = Infinity;

    for (let filter = 0; filter <= 4; filter++) {
      const buf = candidates[filter];
      let score = 0;
      for (let i = 0; i < stride; i++) {
        const cur = pixels[rowOffset + i];
        const a = i >= bpp ? pixels[rowOffset + i - bpp] : 0;
        const b = y > 0 ? pixels[prevOffset + i] : 0;
        const c = y > 0 && i >= bpp ? pixels[prevOffset + i - bpp] : 0;
        let pred = 0;
        if (filter === 1) pred = a;
        else if (filter === 2) pred = b;
        else if (filter === 3) pred = (a + b) >> 1;
        else if (filter === 4) pred = paeth(a, b, c);
        const val = (cur - pred) & 0xff;
        buf[i] = val;
        score += val < 128 ? val : 256 - val;
      }
      if (score < bestScore) {
        bestScore = score;
        bestFilter = filter;
      }
    }

    const outPos = y * (stride + 1);
    raw[outPos] = bestFilter;
    raw.set(candidates[bestFilter], outPos + 1);
  }
  return raw;
}

export function encodePngBuffer(image: RgbaImage, options: PngEncodeOptions = {}): Buffer {
  const { width, height, data } = image;
  const colorType = options.colorType ?? 6;
  const filterMode: "none" | "paeth" | "adaptive" =
    colorType === 3 ? "none" : (options.filter ?? (options.adaptiveFilter ? "adaptive" : "none"));
  const level = options.compressionLevel ?? 9;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;

  const chunks: Uint8Array[] = [Buffer.from(PNG_SIGNATURE), makeChunk("IHDR", ihdr)];
  let raw: Buffer;

  if (colorType === 3) {
    const indexed = buildIndexedPayload(image);
    chunks.push(makeChunk("PLTE", indexed.plte));
    if (indexed.trns) chunks.push(makeChunk("tRNS", indexed.trns));
    raw = filterScanlines(indexed.pixels, width, height, 1, "none");
  } else if (colorType === 2) {
    raw = filterScanlines(buildRawRgbBytes(image), width, height, 3, filterMode);
  } else {
    raw = filterScanlines(data, width, height, 4, filterMode);
  }

  chunks.push(makeChunk("IDAT", deflateSync(raw, { level })));
  chunks.push(makeChunk("IEND", new Uint8Array(0)));
  return Buffer.concat(chunks);
}

export function writePngFile(path: string, image: RgbaImage, options?: PngEncodeOptions): void {
  writeFileSync(path, encodePngBuffer(image, options));
}
