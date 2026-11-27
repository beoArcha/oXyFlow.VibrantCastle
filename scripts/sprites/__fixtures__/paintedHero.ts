import { defineHeroSprite } from "../defineHeroSprite";
import type { RgbaImage } from "../../lib/png";
import type { HeroGrid, HeroSpriteDefinition, PaintedFrameRect, PaintedSource } from "../heroTypes";

/** Painted cell 24x32: smaller than the tall idle frame, so the compiler has to grow the cell. */
export const PAINTED_GRID: HeroGrid = {
  ordering: ["idle", "attack"],
  columns: 2,
  packedCell: { width: 24, height: 32 },
  animations: {
    idle: { row: 0, frames: 2, fps: 4, loop: true, cells: [1, 1] },
    attack: { row: 1, frames: 1, fps: 8, loop: false, cells: [2] },
  },
};

export const PAINTED_RECTS: Record<string, PaintedFrameRect> = {
  idle_0: { x: 2, y: 2, width: 11, height: 30 },
  idle_1: { x: 20, y: 2, width: 11, height: 40 },
  attack_0: { x: 40, y: 2, width: 40, height: 16 },
};

/** Interior pixels of idle_0 (local coordinates): half transparent (dropped) and mostly opaque (kept). */
export const HALF_ALPHA_AT: [number, number] = [5, 5];
export const MOSTLY_OPAQUE_AT: [number, number] = [6, 5];
/** idle_1 starts with this many rows of vivid blue (hue ~220), the rest is a warm gradient. */
export const BLUE_ROWS = 6;

function put(image: RgbaImage, x: number, y: number, rgba: readonly [number, number, number, number]): void {
  image.data.set(rgba, (y * image.width + x) * 4);
}

/** A varied gradient so that quantization has more colours than any test palette. */
const gradient = (x: number, y: number): [number, number, number, number] => [
  60 + ((y * 5) % 160),
  40 + ((x * 17) % 120),
  50 + ((x * y * 3) % 60),
  255,
];

/** Hand-made painted sheet: tall idle frames and a wide attack frame whose sword reaches far to the right of the body. */
export function paintedSheet(): RgbaImage {
  const image: RgbaImage = { width: 100, height: 60, data: new Uint8Array(100 * 60 * 4) };
  const { idle_0: a, idle_1: b, attack_0: c } = PAINTED_RECTS;
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) put(image, a.x + x, a.y + y, gradient(x, y));
  put(image, a.x + HALF_ALPHA_AT[0], a.y + HALF_ALPHA_AT[1], [200, 90, 60, 60]);
  put(image, a.x + MOSTLY_OPAQUE_AT[0], a.y + MOSTLY_OPAQUE_AT[1], [200, 90, 60, 200]);
  for (let y = 0; y < b.height; y++) {
    for (let x = 0; x < b.width; x++) put(image, b.x + x, b.y + y, y < BLUE_ROWS ? [20, 90, 255, 255] : gradient(x, y));
  }
  for (let y = 0; y < c.height; y++) for (let x = 0; x < 9; x++) put(image, c.x + x, c.y + y, gradient(x, y));
  for (let y = 2; y < 4; y++) for (let x = 9; x < c.width; x++) put(image, c.x + x, c.y + y, [230, 220, 200, 255]);
  return image;
}

/** Painted hero over the synthetic sheet; override the source to try other palettes or remaps. */
export function aPaintedHero(source: Partial<PaintedSource> = {}, draw?: HeroSpriteDefinition["draw"]): HeroSpriteDefinition {
  return defineHeroSprite({
    id: "test_painted",
    description: "Synthetic painted hero used by quantizer tests.",
    grid: PAINTED_GRID,
    source: {
      kind: "painted",
      colors: { hi16bit: 12, hi8bit: 6 },
      image: paintedSheet(),
      frameRects: PAINTED_RECTS,
      ...source,
    },
    draw,
  });
}
