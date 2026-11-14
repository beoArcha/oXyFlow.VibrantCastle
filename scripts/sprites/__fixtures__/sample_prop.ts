import { defineProp, type PixelCanvas } from "../defineProp";

// Both tiers share one drawing routine. Coordinates are in hi-8bit pixels (a 12 x 24 frame); `s` is 1
// for hi-8bit and 2 for hi-16bit. The hi-16bit tier adds a highlight, a rim glint and a flame core.

const IRON = "#4a4a55";
const IRON_LIGHT = "#7a7a86";
const WOOD = "#7a4a2a";
const WOOD_LIGHT = "#a06a3c";
const OUTLINE = "#1c1716";
const FLAME_OUTER = "#e0602a";
const FLAME_MID = "#ffb347";
const FLAME_CORE = "#fff0a8";

// Flame radii per frame in hi-8bit pixels: the flame swells and shrinks across the three frames.
const FLAME: { rx: number; ry: number }[] = [
  { rx: 2, ry: 3 },
  { rx: 3, ry: 2 },
  { rx: 2, ry: 2 },
];

function drawTorch(c: PixelCanvas, frame: number, s: number, detailed: boolean): void {
  c.rect(4 * s, 22 * s, 4 * s, 2 * s, IRON); // stone foot, on the floor row
  c.rect(5 * s, 9 * s, 2 * s, 13 * s, WOOD); // handle
  c.rect(3 * s, 7 * s, 6 * s, 2 * s, IRON); // iron cup
  if (detailed) {
    c.rect(5 * s, 9 * s, s, 13 * s, WOOD_LIGHT); // lit side of the handle
    c.rect(3 * s, 7 * s, 6 * s, s, IRON_LIGHT); // glint on the cup rim
  }
  c.outline(OUTLINE); // the dark edge covers the iron and wood only; the flame stays unoutlined

  const { rx, ry } = FLAME[frame];
  c.ellipse(6 * s, 4 * s, rx * s, ry * s, FLAME_OUTER);
  c.ellipse(6 * s, 5 * s, Math.max(1, rx - 1) * s, Math.max(1, ry - 1) * s, FLAME_MID);
  if (detailed) c.rect(6 * s - 1, 5 * s - 1, 2, 2, FLAME_CORE);
}

export default defineProp({
  id: "sample_prop",
  description: "Worked example: a standing iron torch with a flickering warm glow.",
  size: { width: 24, height: 48 },
  anchor: "bottom",
  frames: 3,
  fps: 8,
  glow: { color: "#ffb347", radius: 72, x: 12, y: 8, flicker: true },
  draw: {
    hi8bit: (c, frame) => drawTorch(c, frame, 1, false),
    hi16bit: (c, frame) => drawTorch(c, frame, 2, true),
  },
});
