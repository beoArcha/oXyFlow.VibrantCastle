import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  dx: number; dy: number; headDy: number; tailDy: number;
  keyState: number; eyeBright: boolean; jawOpen: number; flash: boolean;
  hindFar: [number, number, number, number]; hindNear: [number, number, number, number];
  frontFar: [number, number, number, number]; frontNear: [number, number, number, number];
}

const REST: Pose = {
  dx: 0, dy: 0, headDy: 0, tailDy: 0, keyState: 0, eyeBright: false, jawOpen: 0, flash: false,
  hindFar: [12, 38, 13, 47], hindNear: [14, 38, 16, 47], frontFar: [28, 37, 29, 47], frontNear: [31, 37, 33, 47],
};

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [
    REST,
    { ...REST, tailDy: -1, keyState: 2, eyeBright: true },
  ],
  move: [
    { ...REST, dy: -1, keyState: 0, hindFar: [14, 38, 18, 46], hindNear: [16, 39, 20, 47], frontFar: [26, 36, 24, 43], frontNear: [28, 36, 26, 44] },
    { ...REST, dy: 0, keyState: 1, hindFar: [11, 37, 10, 44], hindNear: [13, 38, 12, 45], frontFar: [32, 37, 34, 45], frontNear: [34, 38, 36, 47] },
    { ...REST, dy: 1, keyState: 2, tailDy: -1, hindFar: [9, 37, 7, 44], hindNear: [11, 38, 8, 45], frontFar: [34, 38, 37, 46], frontNear: [36, 39, 39, 47] },
    { ...REST, dy: 0, keyState: 3, tailDy: 1, hindFar: [13, 37, 14, 42], hindNear: [15, 38, 17, 43], frontFar: [29, 38, 29, 47], frontNear: [31, 38, 31, 47] },
  ],
  hit: [
    { ...REST, dx: -2, dy: 2, headDy: 1, tailDy: 2, jawOpen: 1, flash: true, hindFar: [10, 39, 11, 47], hindNear: [12, 40, 14, 47], frontFar: [26, 39, 27, 47], frontNear: [29, 39, 31, 47] },
    { ...REST, dx: -1, dy: 1, headDy: 1, tailDy: 1, jawOpen: 0, flash: false, hindFar: [11, 38, 12, 47], hindNear: [13, 39, 15, 47], frontFar: [27, 38, 28, 47], frontNear: [30, 38, 32, 47] },
  ],
};

interface Palette {
  outline: string; steelDark: string; steelBase: string; steelMid: string; steelLight: string;
  brassDark: string; brassBase: string; brassLight: string; dialBase: string; dialDark: string;
  eyeDark: string; eyeBase: string; eyeLight: string;
}

const NES_PALETTE: Palette = {
  outline: "#080c14", steelDark: "#1c2838", steelBase: "#304460", steelMid: "#304460", steelLight: "#506c90",
  brassDark: "#70500c", brassBase: "#c09020", brassLight: "#c09020", dialBase: "#e8ecf0", dialDark: "#304460",
  eyeDark: "#2890e8", eyeBase: "#a0e0ff", eyeLight: "#ffffff",
};

const SNES_PALETTE: Palette = {
  outline: "#080c14", steelDark: "#1c2838", steelBase: "#304460", steelMid: "#506c90", steelLight: "#88a4c4",
  brassDark: "#70500c", brassBase: "#c09020", brassLight: "#f0d060", dialBase: "#e8ecf0", dialDark: "#a0a8b0",
  eyeDark: "#2890e8", eyeBase: "#a0e0ff", eyeLight: "#ffffff",
};

const FLASH_PALETTE: Palette = {
  outline: "#080c14", steelDark: "#b0b8c4", steelBase: "#d8e0ec", steelMid: "#eef4ff", steelLight: "#ffffff",
  brassDark: "#d0c0a0", brassBase: "#f0e8d0", brassLight: "#ffffff", dialBase: "#ffffff", dialDark: "#d8e0ec",
  eyeDark: "#ffffff", eyeBase: "#ffffff", eyeLight: "#ffffff",
};

class Brush {
  constructor(readonly c: PixelCanvas, readonly s: number, readonly detailed: boolean, readonly pal: Palette) {}
  rect(x: number, y: number, w: number, h: number, col: string): void { this.c.rect(x * this.s, y * this.s, w * this.s, h * this.s, col); }
  px(x: number, y: number, col: string): void { this.c.px(x * this.s, y * this.s, col); }
}

function drawLeg(b: Brush, hx: number, hy: number, kx: number, ky: number, px: number, py: number, isFore: boolean): void {
  const { c, s, pal, detailed } = b;
  const col = isFore ? pal.steelBase : pal.steelDark;
  const jointCol = isFore ? pal.brassBase : pal.brassDark;
  const jointHi = isFore ? pal.brassLight : pal.brassBase;

  if (!detailed) {
    c.line(hx, hy, kx, ky, col);
    c.line(kx, ky, px, py, col);
    c.px(kx, ky, jointCol); c.px(hx, hy, jointCol);
    b.rect(px, py === 47 ? 46 : py - 1, 2, 2, col);
    c.px(px, py, isFore ? pal.steelMid : pal.steelDark);
    return;
  }
  const shx = hx * s, shy = hy * s, skx = kx * s, sky = ky * s, spx = px * s, spy = py === 47 ? 95 : py * s;
  c.line(shx, shy, skx, sky, col);
  c.line(shx + 1, shy, skx + 1, sky, pal.steelDark);
  if (isFore) c.line(shx - 1, shy, skx - 1, sky, pal.steelMid);

  c.rect(shx - 1, shy - 1, 3, 3, jointCol);
  if (isFore) c.px(shx, shy, jointHi);

  c.rect(skx - 1, sky - 1, 3, 3, jointCol);
  c.px(skx, sky, jointHi); c.px(skx + 1, sky + 1, pal.brassDark);

  c.line(skx, sky, spx, spy, col);
  c.line(skx + 1, sky, spx + 1, spy, pal.steelDark);
  if (isFore) c.line(skx - 1, sky, spx - 1, spy, pal.steelMid);

  const pawTop = py === 47 ? 92 : spy - 3;
  c.rect(spx, pawTop, 4, 4, col);
  c.rect(spx, pawTop, 2, 4, pal.steelDark);
  if (isFore) {
    c.px(spx + 3, spy - 1, pal.steelLight);
    c.px(spx + 3, spy, pal.steelLight);
    c.px(spx + 1, pawTop, jointCol);
  }
}

function drawLegs(b: Brush, p: Pose, fore: boolean): void {
  const { dx, dy } = p;
  const [hkx, hky, hpx, hpy] = fore ? p.hindNear : p.hindFar;
  const [fkx, fky, fpx, fpy] = fore ? p.frontNear : p.frontFar;
  drawLeg(b, (fore ? 17 : 15) + dx, 31 + dy, hkx + dx, hky + dy, hpx + dx, hpy, fore);
  drawLeg(b, (fore ? 32 : 29) + dx, 31 + dy, fkx + dx, fky + dy, fpx + dx, fpy, fore);
}

function drawTail(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b, tx = p.dx, ty = p.dy + p.tailDy;
  b.rect(12 + tx, 28 + p.dy, 3, 2, pal.steelBase);
  b.rect(9 + tx, 28 + ty, 3, 2, pal.steelBase);
  b.rect(6 + tx, 28 + ty, 3, 2, pal.steelBase);
  b.rect(5 + tx, 28 + ty, 1, 1, pal.steelMid);
  if (!detailed) return;
  const sy = (28 + ty) * s;
  c.line((6 + tx) * s, sy, (14 + tx) * s, (28 + p.dy) * s, pal.steelLight);
  c.line((9 + tx) * s, sy, (9 + tx) * s, sy + 3, pal.steelDark);
  c.line((12 + tx) * s, sy, (12 + tx) * s, (28 + p.dy) * s + 3, pal.steelDark);
  c.px((10 + tx) * s + 1, sy + 1, pal.brassBase);
  c.px((5 + tx) * s, sy, pal.steelLight);
}

function drawKey(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const kx = 22 + p.dx, ky = 25 + p.dy, skx = kx * s, sky = ky * s;
  b.rect(kx, ky - 3, 2, 3, pal.brassDark);

  if (p.keyState === 0) {
    b.rect(kx - 1, ky - 6, 4, 3, pal.brassBase);
    b.px(kx, ky - 5, pal.brassDark);
    if (detailed) {
      c.ellipse(skx + 1, sky - 10, 4, 3, pal.brassLight);
      c.ellipse(skx + 1, sky - 10, 2, 1, pal.brassDark);
      c.px(skx + 1, sky - 13, pal.brassLight);
    }
  } else if (p.keyState === 2) {
    b.rect(kx - 3, ky - 5, 8, 2, pal.brassBase);
    b.px(kx - 2, ky - 5, pal.brassLight); b.px(kx + 3, ky - 5, pal.brassLight);
    if (detailed) {
      c.rect(skx - 6, sky - 10, 14, 3, pal.brassBase);
      c.line(skx - 6, sky - 11, skx + 7, sky - 11, pal.brassLight);
      c.px(skx - 5, sky - 9, pal.brassDark); c.px(skx + 6, sky - 9, pal.brassDark);
    }
  } else {
    const sgn = p.keyState === 1 ? 1 : -1;
    b.rect(kx - 1, ky - 5, 3, 2, pal.brassBase);
    b.px(kx - 2 * sgn, ky - 6, pal.brassLight);
    b.px(kx + 2 * sgn, ky - 4, pal.brassDark);
    if (detailed) {
      c.line(skx - 4 * sgn, sky - 12, skx + 5 * sgn, sky - 7, pal.brassLight);
      c.line(skx - 3 * sgn, sky - 11, skx + 6 * sgn, sky - 6, pal.brassBase);
      c.line(skx - 2 * sgn, sky - 10, skx + 7 * sgn, sky - 5, pal.brassDark);
    }
  }
}

function drawTorsoAndClock(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const { dx, dy } = p;
  b.rect(14 + dx, 27 + dy, 5, 6, pal.steelBase);
  b.rect(19 + dx, 26 + dy, 7, 5, pal.steelBase);
  b.rect(26 + dx, 25 + dy, 8, 9, pal.steelBase);
  b.rect(27 + dx, 34 + dy, 6, 2, pal.steelDark);
  b.rect(33 + dx, 26 + dy, 2, 7, pal.steelBase);
  b.rect(16 + dx, 25 + dy, 17, 1, pal.steelMid);

  const cx = 22 + dx, cy = 29 + dy;
  b.rect(cx - 2, cy - 2, 5, 5, pal.brassDark);
  b.rect(cx - 1, cy - 1, 3, 3, pal.dialBase);
  b.px(cx, cy, pal.steelDark);
  b.px(cx + 1, cy - 1, pal.steelDark);
  b.px(cx - 1, cy, pal.steelDark);

  if (!detailed) return;
  const scx = cx * s + 1, scy = cy * s + 1;
  c.line((19 + dx) * s, (26 + dy) * s, (19 + dx) * s, (31 + dy) * s, pal.steelDark);
  c.line((26 + dx) * s, (25 + dy) * s, (26 + dx) * s, (34 + dy) * s, pal.steelDark);
  c.line((16 + dx) * s, (25 + dy) * s, (33 + dx) * s, (25 + dy) * s, pal.steelLight);
  c.rect((19 + dx) * s + 1, (26 + dy) * s + 1, 6 * s - 2, 4 * s, pal.steelMid);

  c.ellipse(scx, scy, 7, 6, pal.brassDark);
  c.ellipse(scx, scy, 6, 5, pal.brassBase);
  c.ellipse(scx, scy, 5, 4, pal.dialBase);
  c.px(scx, scy - 3, pal.dialDark); c.px(scx + 4, scy, pal.dialDark);
  c.px(scx, scy + 3, pal.dialDark); c.px(scx - 4, scy, pal.dialDark);
  c.line(scx, scy, scx + 3, scy - 2, pal.steelDark);
  c.line(scx, scy, scx - 2, scy, pal.steelDark);
  c.px(scx, scy, pal.brassLight);
}

function drawHead(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const { dx, dy, headDy, eyeBright, jawOpen } = p;
  const hx = 35 + dx, hy = 21 + dy + headDy;

  b.rect(33 + dx, 24 + dy, 3, 4, pal.steelBase);
  b.rect(34 + dx, 23 + dy, 2, 1, pal.brassBase);
  b.rect(hx, hy, 4, 3, pal.steelBase);
  b.rect(hx - 2, hy - 2, 3, 2, pal.steelMid);
  b.px(hx - 2, hy - 3, pal.steelLight);
  b.rect(hx + 3, hy, 4, 2, pal.steelBase);
  b.px(hx + 7, hy + 1, pal.steelLight);
  b.rect(hx + 4, hy + 2, 2, 1, pal.steelDark);
  b.px(hx + 5, hy + 2, pal.steelLight);
  b.rect(hx + 3, hy + 3 + jawOpen, 3, 1, pal.steelBase);
  b.px(hx + 5, hy + 3 + jawOpen, pal.steelLight);
  b.px(hx + 2, hy, eyeBright ? pal.eyeLight : pal.eyeBase);

  if (!detailed) return;
  const shx = hx * s, shy = hy * s;
  c.line(shx, shy, shx + 13, shy, pal.steelLight);
  c.line(shx - 4, shy - 5, shx, shy, pal.steelLight);
  c.line(shx - 3, shy - 4, shx - 1, shy, pal.steelDark);
  c.px(shx + 9, shy + 4, pal.steelLight); c.px(shx + 11, shy + 4, pal.steelLight);
  c.px(shx + 10, shy + 5 + jawOpen * s, pal.steelLight);
  c.ellipse(shx + 4, shy + 1, 2, 1, pal.eyeDark);
  c.px(shx + 4, shy + 1, eyeBright ? pal.eyeLight : pal.eyeBase);
  c.px(shx + 5, shy + 1, pal.eyeLight);
}

function drawHound(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = pose.flash ? FLASH_PALETTE : detailed ? SNES_PALETTE : NES_PALETTE;
  const b = new Brush(c, s, detailed, pal);

  drawLegs(b, pose, false);
  drawTail(b, pose);
  drawKey(b, pose);
  drawTorsoAndClock(b, pose);
  drawHead(b, pose);
  drawLegs(b, pose, true);
  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "chrono_hound",
  kind: "ground",
  description: "A lean clockwork hunting dog of blued steel and brass with an exposed flank clock dial.",
  hitbox: { width: 48, height: 34 },
  cellScale: 1,
  animations: {
    idle: { frames: 2, fps: 4, loop: true },
    move: { frames: 4, fps: 12, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
  },
  draw: {
    nes: (c, anim, frame) => drawHound(c, 1, false, anim, frame),
    snes: (c, anim, frame) => drawHound(c, 2, true, anim, frame),
  },
});
