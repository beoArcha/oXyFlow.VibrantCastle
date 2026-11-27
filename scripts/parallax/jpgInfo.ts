import { readFileSync } from "node:fs";
import { AssetError, ErrorCode } from "../../src/lib/errors";

export interface JpgInfo {
  readonly width: number;
  readonly height: number;
  readonly avgHex: string;
}

interface HuffmanTable {
  readonly codes: ReadonlyMap<number, number>;
  readonly minLen: number;
  readonly maxLen: number;
}

interface FrameComponent {
  readonly id: number;
  readonly h: number;
  readonly v: number;
  readonly tq: number;
}

interface ScanComponent {
  readonly index: number;
  readonly td: number;
  readonly ta: number;
}

const ZIGZAG_ORDER_0 = 0;

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

function toHexByte(v: number): string {
  return clampByte(v).toString(16).padStart(2, "0");
}

function buildHuffmanTable(bits: Uint8Array, vals: Uint8Array): HuffmanTable {
  const codes = new Map<number, number>();
  let code = 0;
  let valIdx = 0;
  let minLen = 16;
  let maxLen = 0;

  for (let len = 1; len <= 16; len++) {
    const count = bits[len - 1];
    for (let i = 0; i < count; i++) {
      // Key packs (len << 16) | code so lookup only checks bit lengths present in the table.
      codes.set((len << 16) | code, vals[valIdx++]);
      code++;
      if (len < minLen) minLen = len;
      if (len > maxLen) maxLen = len;
    }
    code <<= 1;
  }

  return { codes, minLen, maxLen };
}

class BitReader {
  private pos: number;
  private bitBuf = 0;
  private bitCount = 0;

  constructor(private readonly data: Uint8Array, startPos: number) {
    this.pos = startPos;
  }

  private nextByte(): number {
    if (this.pos >= this.data.length) return 0;
    const b = this.data[this.pos++];
    if (b === 0xff && this.pos < this.data.length) {
      const next = this.data[this.pos];
      if (next === 0x00) {
        this.pos++;
      } else if (next >= 0xd0 && next <= 0xd7) {
        // Restart marker resets decoder outside; skip marker byte here.
        this.pos++;
        return this.nextByte();
      }
    }
    return b;
  }

  readBits(n: number): number {
    while (this.bitCount < n) {
      this.bitBuf = (this.bitBuf << 8) | this.nextByte();
      this.bitCount += 8;
    }
    this.bitCount -= n;
    return (this.bitBuf >> this.bitCount) & ((1 << n) - 1);
  }

  readHuffman(table: HuffmanTable): number {
    let code = 0;
    for (let len = 1; len <= table.maxLen; len++) {
      code = (code << 1) | this.readBits(1);
      if (len >= table.minLen) {
        const sym = table.codes.get((len << 16) | code);
        if (sym !== undefined) return sym;
      }
    }
    return 0;
  }

  receiveExtend(s: number): number {
    if (s === 0) return 0;
    const v = this.readBits(s);
    const threshold = 1 << (s - 1);
    return v < threshold ? v - (1 << s) + 1 : v;
  }

  resetBitBuffer(): void {
    this.bitBuf = 0;
    this.bitCount = 0;
  }
}

function parseDht(buf: Uint8Array, start: number, end: number, dcTables: HuffmanTable[], acTables: HuffmanTable[]): void {
  let p = start;
  while (p < end) {
    const info = buf[p++];
    const cls = info >> 4;
    const id = info & 0x0f;
    const bits = buf.subarray(p, p + 16);
    p += 16;
    let total = 0;
    for (let i = 0; i < 16; i++) total += bits[i];
    const vals = buf.subarray(p, p + total);
    p += total;
    const table = buildHuffmanTable(bits, vals);
    if (cls === 0) dcTables[id] = table;
    else acTables[id] = table;
  }
}

function parseDqt(buf: Uint8Array, start: number, end: number, qTables: number[]): void {
  let p = start;
  while (p < end) {
    const info = buf[p++];
    const precision = info >> 4;
    const id = info & 0x0f;
    qTables[id] = precision === 0 ? buf[p + ZIGZAG_ORDER_0] : (buf[p] << 8) | buf[p + 1];
    p += precision === 0 ? 64 : 128;
  }
}

function decodeBaselineAverageHex(
  buf: Uint8Array,
  scanStart: number,
  width: number,
  height: number,
  components: readonly FrameComponent[],
  scanComponents: readonly ScanComponent[],
  dcTables: readonly HuffmanTable[],
  acTables: readonly HuffmanTable[],
  qTables: readonly number[],
  restartInterval: number
): string {
  const maxH = Math.max(...components.map((c) => c.h));
  const maxV = Math.max(...components.map((c) => c.v));
  const mcuW = maxH * 8;
  const mcuH = maxV * 8;
  const mcusX = Math.ceil(width / mcuW);
  const mcusY = Math.ceil(height / mcuH);
  const totalMcus = mcusX * mcusY;

  const reader = new BitReader(buf, scanStart);
  const dcPrev = new Int32Array(components.length);
  const sums = new Float64Array(components.length);
  const counts = new Float64Array(components.length);

  for (let mcu = 0; mcu < totalMcus; mcu++) {
    if (restartInterval > 0 && mcu > 0 && mcu % restartInterval === 0) {
      dcPrev.fill(0);
      reader.resetBitBuffer();
    }
    for (const sc of scanComponents) {
      const comp = components[sc.index];
      const dcTable = dcTables[sc.td];
      const acTable = acTables[sc.ta];
      const q0 = qTables[comp.tq] ?? 1;
      const blocks = comp.h * comp.v;

      for (let b = 0; b < blocks; b++) {
        const s = reader.readHuffman(dcTable);
        dcPrev[sc.index] += reader.receiveExtend(s);
        // Baseline 8x8 IDCT DC term is (dc * q0) / 8 + 128.
        sums[sc.index] += (dcPrev[sc.index] * q0) / 8 + 128;
        counts[sc.index]++;

        let k = 1;
        while (k < 64) {
          const rs = reader.readHuffman(acTable);
          if (rs === 0x00) break;
          const r = rs >> 4;
          const acSize = rs & 0x0f;
          k += r;
          if (acSize > 0) reader.readBits(acSize);
          k++;
        }
      }
    }
  }

  const y = counts[0] > 0 ? sums[0] / counts[0] : 0;
  const cb = components.length >= 3 && counts[1] > 0 ? sums[1] / counts[1] : 128;
  const cr = components.length >= 3 && counts[2] > 0 ? sums[2] / counts[2] : 128;

  const r = y + 1.402 * (cr - 128);
  const g = y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128);
  const bl = y + 1.772 * (cb - 128);
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(bl)}`;
}

/**
 * Reads baseline JPEG dimensions and computes the average RGB hex colour from DC terms.
 */
export function readJpgInfo(filePath: string): JpgInfo {
  const buf = readFileSync(filePath);
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) {
    throw new AssetError(`Invalid JPEG file: ${filePath}`, ErrorCode.ASSET_CORRUPTED, {
      details: { filePath },
    });
  }

  const dcTables: HuffmanTable[] = [];
  const acTables: HuffmanTable[] = [];
  const qTables: number[] = [];
  let components: FrameComponent[] = [];
  let width = 0;
  let height = 0;
  let restartInterval = 0;
  let pos = 2;

  while (pos + 1 < buf.length) {
    if (buf[pos] !== 0xff) {
      pos++;
      continue;
    }
    const marker = buf[pos + 1];
    if (marker === 0xd9) break;
    if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) {
      pos += 2;
      continue;
    }

    const segLen = buf.readUInt16BE(pos + 2);
    const segStart = pos + 4;
    const segEnd = pos + 2 + segLen;

    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      height = buf.readUInt16BE(segStart + 1);
      width = buf.readUInt16BE(segStart + 3);
      const count = buf[segStart + 5];
      components = [];
      for (let i = 0; i < count; i++) {
        const p = segStart + 6 + i * 3;
        components.push({
          id: buf[p],
          h: buf[p + 1] >> 4,
          v: buf[p + 1] & 0x0f,
          tq: buf[p + 2],
        });
      }
    } else if (marker === 0xc4) {
      parseDht(buf, segStart, segEnd, dcTables, acTables);
    } else if (marker === 0xdb) {
      parseDqt(buf, segStart, segEnd, qTables);
    } else if (marker === 0xdd) {
      restartInterval = buf.readUInt16BE(segStart);
    } else if (marker === 0xda) {
      const scanCount = buf[segStart];
      const scanComponents: ScanComponent[] = [];
      for (let i = 0; i < scanCount; i++) {
        const p = segStart + 1 + i * 2;
        const cid = buf[p];
        const idx = components.findIndex((c) => c.id === cid);
        scanComponents.push({
          index: idx >= 0 ? idx : i,
          td: buf[p + 1] >> 4,
          ta: buf[p + 1] & 0x0f,
        });
      }
      const avgHex = decodeBaselineAverageHex(
        buf,
        segEnd,
        width,
        height,
        components,
        scanComponents,
        dcTables,
        acTables,
        qTables,
        restartInterval
      );
      return { width, height, avgHex };
    }

    pos = segEnd;
  }

  throw new AssetError(`Missing SOF/SOS marker in JPEG: ${filePath}`, ErrorCode.ASSET_CORRUPTED, {
    details: { filePath },
  });
}
