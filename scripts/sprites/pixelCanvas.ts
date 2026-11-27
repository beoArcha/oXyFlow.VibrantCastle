import { parseColor } from "./colors";
import { spriteError } from "./errors";

export const TRANSPARENT = -1;

type Point = [number, number];
type Box = [number, number, number, number];

/** One sprite cell. Pixels hold packed 0xRRGGBB or TRANSPARENT. */
export class PixelCanvas {
  readonly data: Int32Array;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      throw spriteError(`PixelCanvas size must be positive integers, got ${width}x${height}.`);
    }
    this.data = new Int32Array(width * height).fill(TRANSPARENT);
  }

  /** Packed colour at (x, y), or TRANSPARENT; used by the compiler. */
  pixelAt(x: number, y: number): number {
    return this.data[y * this.width + x];
  }

  px(x: number, y: number, color: string): void {
    this.assertInside(`px(${x}, ${y})`, [x, y, x, y]);
    this.data[y * this.width + x] = parseColor(color);
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    if (w <= 0 || h <= 0) return;
    this.assertInside(`rect(${x}, ${y}, ${w}, ${h})`, [x, y, x + w - 1, y + h - 1]);
    this.fillBox(x, y, x + w - 1, y + h - 1, parseColor(color));
  }

  line(x0: number, y0: number, x1: number, y1: number, color: string): void {
    this.assertInside(`line(${x0}, ${y0}, ${x1}, ${y1})`, [
      Math.min(x0, x1),
      Math.min(y0, y1),
      Math.max(x0, x1),
      Math.max(y0, y1),
    ]);
    this.rasterLine(x0, y0, x1, y1, parseColor(color));
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void {
    this.assertInside(`ellipse(${cx}, ${cy}, ${rx}, ${ry})`, [cx - rx, cy - ry, cx + rx, cy + ry]);
    const rgb = parseColor(color);
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const nx = (x - cx) / (rx + 0.5);
        const ny = (y - cy) / (ry + 0.5);
        if (nx * nx + ny * ny <= 1) this.data[y * this.width + x] = rgb;
      }
    }
  }

  polygon(points: Point[], color: string): void {
    const call = `polygon(${JSON.stringify(points)})`;
    if (points.length < 3) throw spriteError(`${call} needs at least 3 points.`);
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    this.assertInside(call, [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]);
    const rgb = parseColor(color);
    this.fillPolygon(points, rgb);
    points.forEach(([x, y], i) => {
      const [nx, ny] = points[(i + 1) % points.length];
      this.rasterLine(x, y, nx, ny, rgb);
    });
  }

  clear(x: number, y: number, w: number, h: number): void {
    if (w <= 0 || h <= 0) return;
    this.assertInside(`clear(${x}, ${y}, ${w}, ${h})`, [x, y, x + w - 1, y + h - 1]);
    this.fillBox(x, y, x + w - 1, y + h - 1, TRANSPARENT);
  }

  /** Paints transparent pixels that touch an opaque one (4-neighbourhood); never paints outside the cell. */
  outline(color: string): void {
    const rgb = parseColor(color);
    const targets: number[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.pixelAt(x, y) === TRANSPARENT && this.touchesOpaque(x, y)) targets.push(y * this.width + x);
      }
    }
    for (const index of targets) this.data[index] = rgb;
  }

  mirrorX(): void {
    for (let y = 0; y < this.height; y++) {
      this.data.subarray(y * this.width, (y + 1) * this.width).reverse();
    }
  }

  part(w: number, h: number): PixelCanvas {
    return new PixelCanvas(w, h);
  }

  stamp(part: PixelCanvas, dx: number, dy: number): void {
    if (!Number.isInteger(dx) || !Number.isInteger(dy)) {
      throw spriteError(`stamp(part, ${dx}, ${dy}) needs integer offsets.`);
    }
    for (let y = 0; y < part.height; y++) {
      for (let x = 0; x < part.width; x++) {
        const rgb = part.pixelAt(x, y);
        if (rgb !== TRANSPARENT) this.stampPixel(x + dx, y + dy, rgb, dx, dy);
      }
    }
  }

  private stampPixel(x: number, y: number, rgb: number, dx: number, dy: number): void {
    this.assertInside(`stamp(part, ${dx}, ${dy})`, [x, y, x, y]);
    this.data[y * this.width + x] = rgb;
  }

  private touchesOpaque(x: number, y: number): boolean {
    return (
      this.isOpaqueAt(x - 1, y) || this.isOpaqueAt(x + 1, y) || this.isOpaqueAt(x, y - 1) || this.isOpaqueAt(x, y + 1)
    );
  }

  private isOpaqueAt(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return this.pixelAt(x, y) !== TRANSPARENT;
  }

  private assertInside(call: string, [minX, minY, maxX, maxY]: Box): void {
    if (![minX, minY, maxX, maxY].every(Number.isInteger)) {
      throw spriteError(`${call}: coordinates must be integers.`, { call });
    }
    if (minX >= 0 && minY >= 0 && maxX < this.width && maxY < this.height) return;
    throw spriteError(
      `${call} reaches outside the ${this.width}x${this.height} cell (x ${minX}..${maxX}, y ${minY}..${maxY}); ` +
        `valid range is x 0..${this.width - 1}, y 0..${this.height - 1}.`,
      { call, minX, minY, maxX, maxY },
    );
  }

  private fillBox(x0: number, y0: number, x1: number, y1: number, rgb: number): void {
    for (let y = y0; y <= y1; y++) this.data.fill(rgb, y * this.width + x0, y * this.width + x1 + 1);
  }

  private rasterLine(x0: number, y0: number, x1: number, y1: number, rgb: number): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.data[y * this.width + x] = rgb;
      if (x === x1 && y === y1) return;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  private fillPolygon(points: Point[], rgb: number): void {
    const ys = points.map((p) => p[1]);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      for (const [from, to] of this.spansAt(points, y + 0.5)) this.fillBox(from, y, to, y, rgb);
    }
  }

  /** Even-odd scanline spans covering the pixel centres at height `sy`. */
  private spansAt(points: Point[], sy: number): Point[] {
    const crossings: number[] = [];
    points.forEach(([x0, y0], i) => {
      const [x1, y1] = points[(i + 1) % points.length];
      if (y0 <= sy === y1 <= sy) return;
      crossings.push(x0 + ((sy - y0) / (y1 - y0)) * (x1 - x0));
    });
    crossings.sort((a, b) => a - b);
    const spans: Point[] = [];
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const from = Math.ceil(crossings[i] - 0.5);
      const to = Math.floor(crossings[i + 1] - 0.5);
      if (to >= from) spans.push([from, to]);
    }
    return spans;
  }
}
