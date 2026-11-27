import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  dx: number;
  dy: number;
  headDy: number;
  legL: [number, number];
  legR: [number, number];
  armFront: [number, number];
  flash: boolean;
  glowFlicker: boolean;
}

const REST: Pose = { dx: 0, dy: 0, headDy: 0, legL: [0, 0], legR: [0, 0], armFront: [0, 0], flash: false, glowFlicker: false };

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [REST, { ...REST, dy: -1, armFront: [0, -1], glowFlicker: true }],
  move: [
    { ...REST, legR: [2, 0], legL: [-1, -2], armFront: [0, 0] },
    { ...REST, dy: -1, legR: [0, 0], legL: [0, -1], armFront: [1, -1] },
    { ...REST, legL: [2, 0], legR: [-1, -2], armFront: [0, 0] },
    { ...REST, dy: 1, legL: [0, 0], legR: [0, -1], armFront: [-1, 1] },
  ],
  hit: [
    { ...REST, dx: -2, dy: 1, headDy: 1, armFront: [-2, 1], flash: true },
    { ...REST, dx: -1, headDy: 1, armFront: [-1, 0] },
  ],
};

interface Palette {
  outline: string;
  ironDark: string; ironMid: string; ironLight: string;
  bronzeDark: string; bronzeMid: string; bronzeLight: string; bronzeHi: string;
  brass: string;
  furnaceDark: string; furnaceMid: string; furnaceCore: string;
  steelDark: string; steelMid: string; steelHi: string;
}

const HI8BIT_PALETTE: Palette = {
  outline: "#1a1008",
  ironDark: "#2a242c", ironMid: "#463d4d", ironLight: "#463d4d",
  bronzeDark: "#4a220e", bronzeMid: "#c46e29", bronzeLight: "#c46e29", bronzeHi: "#c46e29",
  brass: "#d8aa38",
  furnaceDark: "#d44204", furnaceMid: "#ff8410", furnaceCore: "#ff8410",
  steelDark: "#463d4d", steelMid: "#94b2c7", steelHi: "#94b2c7",
};

const HI16BIT_PALETTE: Palette = {
  outline: "#1a1008",
  ironDark: "#2a242c", ironMid: "#463d4d", ironLight: "#72657a",
  bronzeDark: "#4a220e", bronzeMid: "#85441a", bronzeLight: "#c46e29", bronzeHi: "#f09a40",
  brass: "#d8aa38",
  furnaceDark: "#d44204", furnaceMid: "#ff8410", furnaceCore: "#ffea70",
  steelDark: "#4a5a6a", steelMid: "#94b2c7", steelHi: "#e4f0fa",
};

const FLASH_PALETTE: Palette = {
  outline: "#1a1008",
  ironDark: "#778888", ironMid: "#bbcccc", ironLight: "#ffffff",
  bronzeDark: "#ccbbaa", bronzeMid: "#ffeedd", bronzeLight: "#ffffff", bronzeHi: "#ffffff",
  brass: "#ffffff",
  furnaceDark: "#ffeedd", furnaceMid: "#ffffff", furnaceCore: "#ffffff",
  steelDark: "#ccddde", steelMid: "#ffffff", steelHi: "#ffffff",
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

function drawLeg(b: Brush, x: number, [dx, dy]: [number, number], isFront: boolean): void {
  const { pal, c, s, detailed } = b;
  const lx = x + dx;
  const gh = 13 + dy;
  b.rect(lx + 1, 31, 4, gh, pal.ironMid);
  b.rect(lx + 1, 33, 4, 3, pal.bronzeMid);
  if (detailed) {
    b.rect(lx + 4, 31, 1, gh, pal.ironLight);
    b.rect(lx + 1, 31, 1, gh, pal.ironDark);
    b.rect(lx + 2, 34, 2, 1, pal.brass);
    c.px((lx + 3) * s, 34 * s, pal.bronzeHi);
  }
  const by = 44 + dy;
  const fw = isFront ? 6 : 5;
  b.rect(lx, by, fw, 3, pal.ironDark);
  b.rect(lx, by + 3, fw, 1, pal.ironDark);
  if (detailed) {
    b.rect(lx + 1, by + 1, fw - 2, 2, pal.ironMid);
    b.rect(lx + fw - 2, by + 1, 2, 2, pal.bronzeMid);
    c.px((lx + fw - 1) * s, (by + 1) * s, pal.bronzeLight);
  }
}

function drawKiteShield(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const sx = 11 + p.dx;
  const sy = 19 + p.dy;
  b.rect(sx + 2, sy, 5, 1, pal.ironMid);
  b.rect(sx + 1, sy + 1, 7, 1, pal.ironMid);
  b.rect(sx, sy + 2, 9, 6, pal.bronzeMid);
  b.rect(sx + 1, sy + 8, 7, 4, pal.bronzeMid);
  b.rect(sx + 2, sy + 12, 5, 1, pal.bronzeMid);
  b.rect(sx + 3, sy + 13, 3, 1, pal.bronzeMid);
  b.rect(sx + 4, sy + 14, 1, 1, pal.ironMid);
  b.rect(sx, sy + 2, 1, 6, pal.ironMid);
  b.rect(sx + 1, sy + 8, 1, 4, pal.ironMid);
  b.rect(sx + 2, sy + 12, 1, 1, pal.ironMid);
  if (!detailed) return;
  b.rect(sx + 7, sy + 2, 1, 6, pal.bronzeLight);
  b.rect(sx + 1, sy + 2, 1, 6, pal.bronzeDark);
  b.rect(sx + 4, sy + 4, 1, 5, pal.ironDark);
  b.rect(sx + 2, sy + 6, 5, 1, pal.ironDark);
  c.ellipse((sx + 4) * s + 1, (sy + 6) * s + 1, 2, 2, pal.ironLight);
  c.px((sx + 4) * s + 1, (sy + 6) * s + 1, pal.brass);
  c.px(sx * s + 1, (sy + 3) * s, pal.brass);
  c.px(sx * s + 1, (sy + 7) * s, pal.brass);
  c.px((sx + 2) * s, (sy + 1) * s, pal.brass);
}

function drawTorso(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const tx = 18 + p.dx;
  const ty = 18 + p.dy;
  b.rect(tx + 2, ty - 1, 7, 2, pal.ironMid);
  b.rect(tx, ty + 1, 10, 11, pal.bronzeMid);
  b.rect(tx, ty + 1, 2, 11, pal.bronzeDark);
  b.rect(tx + 8, ty + 1, 2, 11, pal.bronzeLight);
  b.rect(tx, ty + 12, 10, 2, pal.ironDark);
  b.rect(tx + 4, ty + 12, 2, 2, pal.brass);
  b.rect(tx, ty + 14, 10, 2, pal.bronzeMid);
  b.rect(tx + 3, ty + 4, 5, 5, pal.ironDark);
  const fColor = p.glowFlicker ? pal.furnaceCore : pal.furnaceMid;
  b.rect(tx + 4, ty + 5, 3, 1, fColor);
  b.rect(tx + 4, ty + 7, 3, 1, fColor);
  if (!detailed) return;
  b.rect(tx + 9, ty + 1, 1, 11, pal.bronzeHi);
  c.px((tx + 5) * s, (ty + 5) * s, pal.furnaceCore);
  c.px((tx + 5) * s, (ty + 7) * s, pal.furnaceCore);
  c.px((tx + 1) * s, (ty + 2) * s, pal.ironLight);
  c.px((tx + 8) * s, (ty + 2) * s, pal.ironLight);
  c.px((tx + 1) * s, (ty + 11) * s, pal.ironLight);
  c.px((tx + 8) * s, (ty + 11) * s, pal.ironLight);
}

function drawHead(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const hx = 20 + p.dx;
  const hy = 8 + p.dy + p.headDy;
  b.rect(hx + 2, hy - 1, 4, 2, pal.ironMid);
  b.rect(hx + 1, hy + 1, 6, 2, pal.ironMid);
  b.rect(hx, hy + 3, 8, 6, pal.ironMid);
  b.rect(hx, hy + 3, 2, 6, pal.ironDark);
  b.rect(hx + 2, hy + 7, 6, 2, pal.bronzeMid);
  b.rect(hx + 4, hy + 5, 4, 1, pal.furnaceMid);
  if (!detailed) return;
  b.rect(hx + 2, hy - 1, 4, 1, pal.ironLight);
  b.rect(hx + 3, hy + 1, 4, 1, pal.ironLight);
  c.px((hx + 6) * s, (hy + 5) * s, pal.furnaceCore);
  c.px((hx + 7) * s, (hy + 5) * s, pal.furnaceCore);
  c.px((hx + 2) * s, (hy + 4) * s, pal.brass);
  c.px((hx + 4) * s, (hy + 4) * s, pal.brass);
}

function drawArmAndHalberd(b: Brush, p: Pose): void {
  const { pal, s, detailed } = b;
  const ax = 26 + p.dx;
  const ay = 17 + p.dy;
  const [hx, hy] = p.armFront;
  b.rect(ax + 1, ay, 4, 4, pal.bronzeMid);
  b.rect(ax, ay + 1, 6, 3, pal.bronzeMid);
  b.rect(ax + 4, ay, 2, 4, pal.bronzeLight);
  b.rect(ax, ay + 4, 5, 1, pal.ironMid);
  b.rect(ax + 3, ay + 5, 3, 3, pal.ironMid);
  b.rect(ax + 4, ay + 8, 3, 2, pal.ironDark);

  const hxPos = 33 + p.dx + hx;
  const hyPos = p.dy + hy;
  b.rect(hxPos, 13 + hyPos, 1, 30, pal.ironDark);
  b.rect(hxPos, 6 + hyPos, 1, 2, pal.steelMid);
  b.rect(hxPos - 1, 8 + hyPos, 3, 3, pal.steelMid);
  b.rect(hxPos - 1, 11 + hyPos, 3, 2, pal.brass);
  b.rect(hxPos + 1, 9 + hyPos, 2, 1, pal.steelMid);
  b.rect(hxPos + 1, 10 + hyPos, 4, 2, pal.steelMid);
  b.rect(hxPos + 1, 12 + hyPos, 3, 2, pal.steelMid);
  b.rect(hxPos + 1, 14 + hyPos, 4, 2, pal.steelMid);
  b.rect(hxPos + 1, 16 + hyPos, 2, 1, pal.steelMid);
  b.rect(hxPos - 3, 11 + hyPos, 2, 2, pal.steelMid);
  b.rect(hxPos - 4, 12 + hyPos, 1, 1, pal.steelMid);
  if (!detailed) return;
  b.rect(hxPos + 4, 10 + hyPos, 1, 2, pal.steelHi);
  b.rect(hxPos + 3, 12 + hyPos, 1, 2, pal.steelHi);
  b.rect(hxPos + 4, 14 + hyPos, 1, 2, pal.steelHi);
  b.rect(hxPos, 6 + hyPos, 1, 5, pal.steelHi);
  b.c.px((ax + 2) * s, (ay + 2) * s, pal.brass);
}

function drawSentinel(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = pose.flash ? FLASH_PALETTE : detailed ? HI16BIT_PALETTE : HI8BIT_PALETTE;
  const b = new Brush(c, s, detailed, pal);

  drawKiteShield(b, pose);
  drawLeg(b, 17, pose.legL, false);
  drawLeg(b, 23, pose.legR, true);
  drawTorso(b, pose);
  drawHead(b, pose);
  drawArmAndHalberd(b, pose);

  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "court_sentinel",
  kind: "ground",
  description: "A sturdy clockwork sentinel armed with halberd and kite shield.",
  hitbox: { width: 42, height: 62 },
  cellScale: 1,
  animations: {
    idle: { frames: 2, fps: 4, loop: true },
    move: { frames: 4, fps: 8, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
  },
  draw: {
    hi8bit: (c, anim, frame) => drawSentinel(c, 1, false, anim, frame),
    hi16bit: (c, anim, frame) => drawSentinel(c, 2, true, anim, frame),
  },
});
