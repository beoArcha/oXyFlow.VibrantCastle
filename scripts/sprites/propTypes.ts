import type { PixelCanvas } from "./pixelCanvas";
import type { Tier } from "./types";

export type PropAnchor = "bottom" | "top" | "center";

export const PROP_ANCHORS: readonly PropAnchor[] = ["bottom", "top", "center"];

/** draws one frame on a fresh transparent canvas of the tier's frame size. */
export type PropDrawFn = (c: PixelCanvas, frame: number) => void;

export interface PropGlow {
  /** light colour, "#rgb" or "#rrggbb". */
  color: string;
  /** glow radius in world units (hi-16bit pixels). */
  radius: number;
  /** glow centre in world units, relative to the sprite's top-left corner. */
  x: number;
  y: number;
  flicker?: boolean;
}

export interface PropSpriteDefinition {
  id: string;
  description: string;
  /** world units, equal to hi-16bit pixels; both sides even. The hi-8bit frame is half of it. */
  size: { width: number; height: number };
  anchor: PropAnchor;
  frames: number;
  fps: number;
  glow?: PropGlow;
  draw: { hi8bit: PropDrawFn; hi16bit: PropDrawFn };
}

export const MAX_PROP_FRAMES = 12;

/** frame canvas size of one tier: hi-16bit is the world size, hi-8bit half of it. */
export function propFrameSize(size: { width: number; height: number }, tier: Tier): { width: number; height: number } {
  const divisor = tier === "hi8bit" ? 2 : 1;
  return { width: size.width / divisor, height: size.height / divisor };
}
