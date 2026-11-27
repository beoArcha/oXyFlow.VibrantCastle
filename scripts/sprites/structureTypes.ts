import type { PixelCanvas } from "./pixelCanvas";

export type StructureAnimationName = "idle" | "opening" | "on" | "off" | "closing";

export const STRUCTURE_ANIMATION_ORDER: readonly StructureAnimationName[] = [
  "idle",
  "opening",
  "on",
  "off",
  "closing",
];

export interface StructureAnimationSpec {
  frames: number;
  fps: number;
  loop: boolean;
}

export interface StructureCellSize {
  width: number;
  height: number;
}

export type StructurePixelDrawFn<A extends string = StructureAnimationName> = (
  c: PixelCanvas,
  anim: A,
  frame: number,
) => void;

/**
 * High-resolution RGBA buffer for painterly pixel-art frames with alpha dithering and glow.
 * Pixels are stored row-major as RGBA bytes (0..255).
 */
export class RgbaFrameBuffer {
  readonly data: Uint8Array;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.data = new Uint8Array(width * height * 4);
  }

  setRgba(x: number, y: number, r: number, g: number, b: number, a: number = 255): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
    this.data[i + 3] = a;
  }

  blendRgba(x: number, y: number, r: number, g: number, b: number, a: number): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height || a <= 0) return;
    const i = (y * this.width + x) * 4;
    const srcA = a / 255;
    const dstA = this.data[i + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA <= 0) return;
    this.data[i] = Math.round((r * srcA + this.data[i] * dstA * (1 - srcA)) / outA);
    this.data[i + 1] = Math.round((g * srcA + this.data[i + 1] * dstA * (1 - srcA)) / outA);
    this.data[i + 2] = Math.round((b * srcA + this.data[i + 2] * dstA * (1 - srcA)) / outA);
    this.data[i + 3] = Math.round(outA * 255);
  }

  getAlpha(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    return this.data[(y * this.width + x) * 4 + 3];
  }
}

export type StructureHighDrawFn<A extends string = StructureAnimationName> = (
  buf: RgbaFrameBuffer,
  anim: A,
  frame: number,
) => void;

export interface StructureSpriteDefinition<A extends string = StructureAnimationName> {
  id: string;
  description: string;
  hitbox: { width: number; height: number };
  /** Output asset folder category; defaults to "structures". */
  assetCategory?: "structures" | "enemies";
  /** When true, preserves the existing `_high.png` on disk instead of generating one. */
  pngBacked?: boolean;
  /** When true, allows a transparent margin below the sprite instead of requiring floor contact at y=height-1. */
  allowBottomMargin?: boolean;
  /** Optional explicit sheet column count when an existing meta has a fixed grid. */
  columns?: number;
  /** Optional row order for structures whose states differ from the default gate set. */
  animationOrder?: readonly A[];
  /** Optional existing meta document to preserve while updating variants/states/bodyBox. */
  baseMeta?: Record<string, unknown>;
  /** Optional state aliases merged onto baseMeta.states. */
  metaStates?: Record<string, { animation: string }>;
  cellSize: {
    hi8bit: StructureCellSize;
    hi16bit: StructureCellSize;
    high: StructureCellSize;
  };
  animations: Record<A, StructureAnimationSpec>;
  states: Record<string, { animation: string }>;
  infoFrames?: Record<string, number>;
  interaction?: Record<string, unknown>;
  render?: { layer: string; zIndex: number; blend: string };
  draw: {
    hi8bit(c: PixelCanvas, anim: A, frame: number): void;
    hi16bit(c: PixelCanvas, anim: A, frame: number): void;
    high?(buf: RgbaFrameBuffer, anim: A, frame: number): void;
  };
}
