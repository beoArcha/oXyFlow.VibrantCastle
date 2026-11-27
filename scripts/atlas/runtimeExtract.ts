import type { RgbaImage } from "../lib/png";
import type { CharacterAnimationTrack } from "../../src/game/engine/spriteTypes";
import { HumanoidSpriteExtractor } from "../../src/game/engine/extractors/HumanoidSpriteExtractor";
import type { BaseExtractionMeta } from "../../src/game/engine/extractors/ISpriteSheetExtractor";
import { resetScanCanvasContext } from "../../src/game/engine/extractors/scanContext";

/** Stand-in for HTMLImageElement exposing only what the extractors read. */
class HeadlessImage {
  public readonly complete = true;
  public readonly naturalWidth: number;
  public readonly naturalHeight: number;
  public readonly width: number;
  public readonly height: number;

  constructor(public readonly pixels: RgbaImage) {
    this.naturalWidth = pixels.width;
    this.naturalHeight = pixels.height;
    this.width = pixels.width;
    this.height = pixels.height;
  }
}

class HeadlessContext {
  private buffer = new Uint8ClampedArray(0);

  constructor(private readonly canvas: HeadlessCanvas) {}

  public resize(width: number, height: number): void {
    this.buffer = new Uint8ClampedArray(width * height * 4);
  }

  public clearRect(): void {
    this.buffer.fill(0);
  }

  /**
   * Supports the 5-argument form `(image, dx, dy, dw, dh)` and the 9-argument form
   * `(image, sx, sy, sw, sh, dx, dy, dw, dh)`, both 1:1. Source areas outside the image stay
   * transparent like a clipped canvas draw.
   */
  public drawImage(image: HeadlessImage, ...args: number[]): void {
    const [sx, sy, sw, sh, dx, dy] = args.length >= 8 ? args : [0, 0, args[2], args[3], args[0], args[1]];
    const { pixels } = image;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const srcX = sx + x;
        const srcY = sy + y;
        if (srcX < 0 || srcY < 0 || srcX >= pixels.width || srcY >= pixels.height) continue;
        const from = (srcY * pixels.width + srcX) * 4;
        const to = ((dy + y) * this.canvas.width + dx + x) * 4;
        this.buffer.set(pixels.data.subarray(from, from + 4), to);
      }
    }
  }

  public getImageData(x: number, y: number, width: number, height: number): { data: Uint8ClampedArray } {
    if (x !== 0 || y !== 0 || width !== this.canvas.width || height !== this.canvas.height) {
      return { data: new Uint8ClampedArray(0) };
    }
    return { data: this.buffer };
  }
}

class HeadlessCanvas {
  private widthPx = 0;
  private heightPx = 0;
  private readonly context = new HeadlessContext(this);

  get width(): number {
    return this.widthPx;
  }

  set width(value: number) {
    this.widthPx = value;
    this.context.resize(this.widthPx, this.heightPx);
  }

  get height(): number {
    return this.heightPx;
  }

  set height(value: number) {
    this.heightPx = value;
    this.context.resize(this.widthPx, this.heightPx);
  }

  public getContext(): HeadlessContext {
    return this.context;
  }
}

type GlobalSlot = "document" | "HTMLImageElement";

function installGlobals(): () => void {
  const replacements: Record<GlobalSlot, unknown> = {
    document: { createElement: () => new HeadlessCanvas() },
    HTMLImageElement: HeadlessImage,
  };
  const saved = new Map<GlobalSlot, PropertyDescriptor | undefined>();
  for (const slot of Object.keys(replacements) as GlobalSlot[]) {
    saved.set(slot, Object.getOwnPropertyDescriptor(globalThis, slot));
    Object.defineProperty(globalThis, slot, { value: replacements[slot], configurable: true, writable: true });
  }
  resetScanCanvasContext();
  return () => {
    for (const [slot, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, slot, descriptor);
      else delete (globalThis as Record<string, unknown>)[slot];
    }
    resetScanCanvasContext();
  };
}

/**
 * Runs the production `HumanoidSpriteExtractor` (row bands, island scan, frame selection, origins)
 * on an RGBA buffer by giving it a headless canvas; no part of the detection is re-implemented here.
 */
export function runRuntimeExtraction(
  image: RgbaImage,
  meta: BaseExtractionMeta,
  quality: "low" | "mid" | "high"
): Record<string, CharacterAnimationTrack> {
  const restore = installGlobals();
  try {
    const headless = new HeadlessImage(image) as unknown as HTMLImageElement;
    return new HumanoidSpriteExtractor().extract(meta, quality, headless);
  } finally {
    restore();
  }
}
