import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

// Both tiers share one drawing routine. Coordinates are written in hi-8bit pixels
// (48 px cell); `s` is 1 for hi-8bit and 2 for hi-16bit, so the hi-16bit version is the same
// character on a 96 px cell with extra shading, cracks, moss and a glowing rune.

interface Pose {
  dx: number; // whole upper body shift
  dy: number;
  headDy: number;
  legL: [number, number]; // [dx, dy]; negative dy shortens (lifts) the leg
  legR: [number, number];
  armL: number; // extra dy of each arm
  armR: number;
  flash: boolean;
}

const REST: Pose = { dx: 0, dy: 0, headDy: 0, legL: [0, 0], legR: [0, 0], armL: 0, armR: 0, flash: false };

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [REST, { ...REST, dy: -1, armL: 1, armR: 1 }],
  move: [
    { ...REST, legL: [2, -3], armL: -1, armR: 1 },
    { ...REST, dy: 1 },
    { ...REST, legR: [2, -3], armL: 1, armR: -1 },
    { ...REST, dy: 1 },
  ],
  hit: [
    { ...REST, dx: -2, headDy: 1, armL: -2, armR: 2, flash: true },
    { ...REST, dx: -1, headDy: 1 },
  ],
};

interface Palette {
  outline: string;
  light: string;
  stone: string;
  shade: string;
  dark: string;
  eye: string;
  glow: string;
  moss: string;
}

const HI8BIT_PALETTE: Palette = {
  outline: "#223", light: "#99a", stone: "#889", shade: "#667", dark: "#445", eye: "#4ef", glow: "#4ef", moss: "#586",
};
const HI16BIT_PALETTE: Palette = {
  outline: "#1a1b26", light: "#b4b6c8", stone: "#8d8fa3", shade: "#666982", dark: "#41435a",
  eye: "#9ffaff", glow: "#2b94ad", moss: "#62844f",
};
const FLASH_PALETTE: Palette = {
  outline: "#223", light: "#fff", stone: "#eef", shade: "#ccd", dark: "#99b", eye: "#fff", glow: "#fff", moss: "#eef",
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
}

function drawLeg(b: Brush, x: number, [dx, dy]: [number, number]): void {
  const h = 12 + dy;
  b.rect(x + dx, 36, 9, h, b.pal.stone);
  b.rect(x + dx, 36 + h - 3, 9, 3, b.pal.dark);
  if (b.detailed) b.rect(x + dx, 36, 2, h - 3, b.pal.light);
}

function drawArm(b: Brush, x: number, y: number): void {
  b.rect(x, y, 5, 15, b.pal.stone);
  b.rect(x, y + 10, 5, 5, b.pal.dark);
  if (!b.detailed) return;
  b.rect(x, y, 1, 10, b.pal.light);
  b.c.px((x + 1) * b.s, (y + 12) * b.s, b.pal.shade);
  b.c.px((x + 3) * b.s, (y + 12) * b.s, b.pal.shade);
}

function drawTorso(b: Brush, p: Pose): void {
  const { pal, c, s } = b;
  const x = 13 + p.dx;
  const y = 16 + p.dy;
  b.rect(x, y, 22, 21, pal.stone);
  b.rect(x + 18, y, 4, 18, pal.shade);
  b.rect(x, y + 18, 22, 3, pal.dark);
  if (!b.detailed) return b.rect(23 + p.dx, y + 6, 2, 2, pal.eye);
  b.rect(x, y, 2, 18, pal.light);
  const rx = (24 + p.dx) * s;
  const ry = (y + 7) * s;
  c.polygon([[rx, ry - 6], [rx + 5, ry], [rx, ry + 6], [rx - 5, ry]], pal.glow);
  c.polygon([[rx, ry - 3], [rx + 2, ry], [rx, ry + 3], [rx - 2, ry]], pal.eye);
  c.line((x + 4) * s, (y + 2) * s, (x + 7) * s, (y + 11) * s, pal.dark);
  c.ellipse((x + 4) * s, y * s + 1, 5, 2, pal.moss);
}

function drawHead(b: Brush, p: Pose): void {
  const { pal, c, s } = b;
  const x = 18 + p.dx;
  const y = 8 + p.dy + p.headDy;
  b.rect(x, y, 12, 9, pal.stone);
  b.rect(x, y, 12, 2, pal.dark);
  b.rect(x + 8, y + 2, 4, 7, pal.shade);
  if (b.detailed) {
    b.rect(x, y + 2, 1, 7, pal.light);
    c.ellipse((x + 8) * s, (y + 4) * s + 1, 6, 3, pal.glow);
  }
  b.rect(x + 6, y + 3, 5, 2, pal.eye);
}

function drawGolem(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = pose.flash ? FLASH_PALETTE : detailed ? HI16BIT_PALETTE : HI8BIT_PALETTE;
  const b = new Brush(c, s, detailed, pal);
  drawLeg(b, 12, pose.legL);
  drawLeg(b, 27, pose.legR);
  drawArm(b, 8 + pose.dx, 19 + pose.dy + pose.armL);
  drawTorso(b, pose);
  drawHead(b, pose);
  drawArm(b, 35 + pose.dx, 19 + pose.dy + pose.armR);
  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "sample_golem",
  kind: "ground",
  description: "Worked example: a moss-covered stone golem with a glowing cyan rune.",
  hitbox: { width: 42, height: 62 },
  cellScale: 1,
  animations: {
    idle: { frames: 2, fps: 4, loop: true },
    move: { frames: 4, fps: 8, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
  },
  draw: {
    hi8bit: (c, anim, frame) => drawGolem(c, 1, false, anim, frame),
    hi16bit: (c, anim, frame) => drawGolem(c, 2, true, anim, frame),
  },
});
