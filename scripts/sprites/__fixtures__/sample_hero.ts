import { defineHeroSprite, type HeroGrid, type PixelCanvas } from "../defineHeroSprite";

// Both tiers share one drawing routine. Coordinates are written in hi-8bit pixels (24x32 cell,
// feet on y = 31); `s` is 1 for hi-8bit and 2 for hi-16bit, so the hi-16bit version is the same
// figure on a 48x64 cell with shading. The body stays at x = BODY_X in every slot so that the
// sword can reach into the wide attack slots on the right.

const GRID: HeroGrid = {
  ordering: ["idle", "run", "jump", "fall", "attack"],
  columns: 5,
  packedCell: { width: 48, height: 64 },
  animations: {
    idle: { row: 0, frames: 2, fps: 4, loop: true, cells: [1, 1] },
    run: { row: 1, frames: 2, fps: 8, loop: true, cells: [1, 1] },
    jump: { row: 2, frames: 1, fps: 6, loop: false, cells: [1] },
    fall: { row: 3, frames: 1, fps: 6, loop: true, cells: [1] },
    attack: { row: 4, frames: 3, fps: 8, loop: false, cells: [1, 2, 2] },
  },
};

const BODY_X = 11;
const FLOOR_Y = 31;

interface Pose {
  /** Whole figure raised above the floor (airborne frames). */
  lift: number;
  /** Upper body lowered by this many pixels; the legs shorten to keep the feet planted. */
  bob: number;
  legL: number;
  legR: number;
  /** Sword grip and tip as offsets from the front shoulder. */
  grip: [number, number];
  tip: [number, number];
}

const REST: Pose = { lift: 0, bob: 0, legL: 0, legR: 0, grip: [3, 2], tip: [3, -9] };

const POSES: Record<string, Pose[]> = {
  idle: [REST, { ...REST, bob: 1 }],
  run: [
    { ...REST, legL: 3, grip: [2, 3], tip: [-9, 7] },
    { ...REST, bob: 1, legR: 3, grip: [2, 3], tip: [-9, 7] },
  ],
  jump: [{ ...REST, lift: 4, legL: 3, legR: 1, grip: [3, 1], tip: [7, -6] }],
  fall: [{ ...REST, lift: 3, legL: 0, legR: 2, grip: [3, 0], tip: [7, -5] }],
  attack: [
    { ...REST, grip: [2, -1], tip: [-7, -6] },
    { ...REST, grip: [5, 1], tip: [19, 1] },
    { ...REST, bob: 1, grip: [5, 3], tip: [16, 11] },
  ],
};

interface Palette {
  outline: string;
  skin: string;
  hair: string;
  cloth: string;
  clothLight: string;
  clothShade: string;
  boot: string;
  blade: string;
  bladeLight: string;
  hilt: string;
}

const HI8BIT_PALETTE: Palette = {
  outline: "#211", skin: "#fb8", hair: "#a52", cloth: "#c63", clothLight: "#c63", clothShade: "#c63",
  boot: "#432", blade: "#ccd", bladeLight: "#ccd", hilt: "#eb4",
};
const HI16BIT_PALETTE: Palette = {
  outline: "#1f1410", skin: "#f2b48a", hair: "#9a4a1f", cloth: "#c2612b", clothLight: "#e2894a", clothShade: "#8a3f1d",
  boot: "#4a2f20", blade: "#b9bfd0", bladeLight: "#eef0fa", hilt: "#e6b84a",
};

class Brush {
  constructor(
    readonly c: PixelCanvas,
    readonly s: number,
    readonly detailed: boolean,
    readonly pal: Palette,
  ) {}

  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.c.rect(x * this.s, y * this.s, w * this.s, h * this.s, color);
  }

  /** Line that is `s` pixels thick, offset along the minor axis. */
  line(x0: number, y0: number, x1: number, y1: number, color: string): void {
    const shallow = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
    for (let i = 0; i < this.s; i++) {
      const [ox, oy] = shallow ? [0, i] : [i, 0];
      this.c.line(x0 * this.s + ox, y0 * this.s + oy, x1 * this.s + ox, y1 * this.s + oy, color);
    }
  }
}

function drawLegs(b: Brush, pose: Pose): void {
  const top = 23 + pose.bob - pose.lift;
  const legs: [number, number][] = [[BODY_X - 4, pose.legL], [BODY_X + 1, pose.legR]];
  for (const [x, raise] of legs) {
    const bottom = FLOOR_Y - pose.lift - raise;
    b.rect(x, top, 3, bottom - top + 1, b.pal.clothShade);
    b.rect(x, bottom, 4, 1, b.pal.boot);
    if (b.detailed) b.rect(x, top, 1, bottom - top, b.pal.cloth);
  }
}

function drawTorso(b: Brush, upper: number): void {
  const { pal } = b;
  b.rect(BODY_X - 4, 14 + upper, 8, 9, pal.cloth);
  if (!b.detailed) return;
  b.rect(BODY_X - 4, 14 + upper, 2, 9, pal.clothLight);
  b.rect(BODY_X + 2, 14 + upper, 2, 9, pal.clothShade);
  b.rect(BODY_X - 4, 21 + upper, 8, 1, pal.boot);
  b.rect(BODY_X - 1, 21 + upper, 2, 1, pal.hilt);
}

function drawHead(b: Brush, upper: number): void {
  const { pal } = b;
  b.rect(BODY_X - 3, 7 + upper, 6, 7, pal.skin);
  b.rect(BODY_X - 3, 7 + upper, 6, 2, pal.hair);
  b.rect(BODY_X - 3, 9 + upper, 2, 3, pal.hair);
  b.rect(BODY_X + 1, 10 + upper, 1, 1, pal.outline);
  if (b.detailed) b.rect(BODY_X - 3, 7 + upper, 3, 1, pal.clothLight);
}

function drawSword(b: Brush, shoulder: [number, number], pose: Pose): void {
  const [gx, gy] = [shoulder[0] + pose.grip[0], shoulder[1] + pose.grip[1]];
  const [tx, ty] = [shoulder[0] + pose.tip[0], shoulder[1] + pose.tip[1]];
  b.line(shoulder[0], shoulder[1], gx, gy, b.pal.cloth);
  b.line(gx, gy, tx, ty, b.pal.blade);
  if (b.detailed) b.c.line(gx * b.s, gy * b.s, tx * b.s, ty * b.s, b.pal.bladeLight);
  const horizontal = Math.abs(tx - gx) >= Math.abs(ty - gy);
  if (horizontal) b.rect(gx, gy - 2, 1, 5, b.pal.hilt);
  else b.rect(gx - 2, gy, 5, 1, b.pal.hilt);
}

function drawHero(c: PixelCanvas, s: number, detailed: boolean, anim: string, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = detailed ? HI16BIT_PALETTE : HI8BIT_PALETTE;
  const b = new Brush(c, s, detailed, pal);
  const upper = pose.bob - pose.lift;
  b.rect(BODY_X - 6, 15 + upper, 2, 6, pal.clothShade);
  drawLegs(b, pose);
  drawTorso(b, upper);
  drawHead(b, upper);
  drawSword(b, [BODY_X + 3, 15 + upper], pose);
  c.outline(pal.outline);
}

export default defineHeroSprite({
  id: "sample_hero",
  description: "Worked example: a small swordsman whose blade reaches into the wide attack slots.",
  grid: GRID,
  draw: {
    hi8bit: (c, anim, frame) => drawHero(c, 1, false, anim, frame),
    hi16bit: (c, anim, frame) => drawHero(c, 2, true, anim, frame),
  },
});
