import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  dx: number; dy: number; gearShift: number;
  leg1Dx: number; leg2Dx: number; leg3Dx: number;
  antennaTwitch: number; eyeBright: boolean; flash: boolean;
}

const REST: Pose = {
  dx: 0, dy: 0, gearShift: 0,
  leg1Dx: 0, leg2Dx: 0, leg3Dx: 0,
  antennaTwitch: 0, eyeBright: true, flash: false,
};

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [REST, { ...REST, antennaTwitch: 1, eyeBright: false }],
  move: [
    { ...REST, leg1Dx: 2, leg2Dx: -2, leg3Dx: 2, dy: 0, gearShift: 0 },
    { ...REST, leg1Dx: 0, leg2Dx: 0, leg3Dx: 0, dy: 1, gearShift: 1 },
    { ...REST, leg1Dx: -2, leg2Dx: 2, leg3Dx: -2, dy: 0, gearShift: 2 },
    { ...REST, leg1Dx: 0, leg2Dx: 0, leg3Dx: 0, dy: 1, gearShift: 3 },
  ],
  hit: [
    { ...REST, dx: -2, dy: 2, leg1Dx: -1, leg2Dx: -1, leg3Dx: -1, flash: true },
    { ...REST, dx: -1, dy: 1, leg1Dx: 0, leg2Dx: 0, leg3Dx: 0, flash: false },
  ],
};

interface Palette {
  outline: string; brassHi: string; brassMid: string; brassLow: string; brassDark: string;
  hubDark: string; hubMid: string; eyeDark: string; eyeBright: string; eyeGlint: string;
}

const HI8BIT_PALETTE: Palette = {
  outline: "#181008", brassHi: "#d8a838", brassMid: "#d8a838", brassLow: "#a87820", brassDark: "#5c3c10",
  hubDark: "#28241c", hubMid: "#28241c", eyeDark: "#08a0b8", eyeBright: "#58e8f8", eyeGlint: "#58e8f8",
};
const HI16BIT_PALETTE: Palette = {
  outline: "#181008", brassHi: "#f8e088", brassMid: "#d8a838", brassLow: "#a87820", brassDark: "#5c3c10",
  hubDark: "#28241c", hubMid: "#48402c", eyeDark: "#08a0b8", eyeBright: "#58e8f8", eyeGlint: "#f0ffff",
};
const FLASH_PALETTE: Palette = {
  outline: "#181008", brassHi: "#ffffff", brassMid: "#fdf8e8", brassLow: "#e0d8c0", brassDark: "#a09888",
  hubDark: "#585048", hubMid: "#787068", eyeDark: "#b8f0f8", eyeBright: "#ffffff", eyeGlint: "#ffffff",
};

class Brush {
  constructor(readonly c: PixelCanvas, readonly s: number, readonly detailed: boolean, readonly pal: Palette) {}
  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.c.rect(x * this.s, y * this.s, w * this.s, h * this.s, color);
  }
  px(x: number, y: number, color: string): void {
    this.c.px(x * this.s, y * this.s, color);
  }
}

function drawLeg(b: Brush, hx: number, hy: number, kx: number, ky: number, fx: number, isFore: boolean): void {
  const { c, s, pal, detailed } = b;
  const col = isFore ? pal.hubMid : pal.hubDark;
  const kneeCol = isFore ? pal.brassLow : pal.hubDark;
  if (!detailed) {
    c.line(hx, hy, kx, ky, col);
    c.line(kx, ky, fx, 47, col);
    c.px(kx, ky, kneeCol);
    c.px(fx, 47, pal.hubDark);
  } else {
    const shx = hx * s, shy = hy * s, skx = kx * s, sky = ky * s, sfx = fx * s, sfy = 95;
    c.line(shx, shy, skx, sky, col);
    c.line(skx, sky, sfx, sfy, col);
    if (isFore) {
      c.line(shx, shy - 1, skx, sky - 1, pal.brassHi);
      c.line(skx - 1, sky, sfx - 1, sfy, pal.brassLow);
    }
    c.rect(skx - 1, sky - 1, 3, 3, kneeCol);
    c.px(skx, sky, isFore ? pal.brassHi : pal.hubDark);
    c.px(sfx, sfy, pal.hubDark);
    if (isFore) c.px(sfx + 1, sfy, pal.outline);
  }
}

function drawLegs(b: Brush, p: Pose, fore: boolean): void {
  const { dx, dy } = p;
  if (!fore) {
    drawLeg(b, 16 + dx, 38 + dy, 13 + dx, 41 + dy, 12 + dx - p.leg3Dx, false);
    drawLeg(b, 23 + dx, 39 + dy, 23 + dx, 42 + dy, 23 + dx - p.leg2Dx, false);
    drawLeg(b, 29 + dx, 38 + dy, 33 + dx, 41 + dy, 36 + dx - p.leg1Dx, false);
  } else {
    drawLeg(b, 15 + dx, 39 + dy, 11 + dx, 42 + dy, 9 + dx + p.leg3Dx, true);
    drawLeg(b, 22 + dx, 40 + dy, 21 + dx, 43 + dy, 22 + dx + p.leg2Dx, true);
    drawLeg(b, 28 + dx, 39 + dy, 32 + dx, 42 + dy, 35 + dx + p.leg1Dx, true);
  }
}

function drawShell(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const { dx, dy, gearShift } = p;
  const cx = 22 + dx, cy = 36 + dy;

  b.rect(18 + dx, 29 + dy, 9, 2, pal.brassMid);
  b.rect(15 + dx, 31 + dy, 15, 2, pal.brassMid);
  b.rect(13 + dx, 33 + dy, 19, 2, pal.brassMid);
  b.rect(12 + dx, 35 + dy, 21, 4, pal.brassMid);
  b.rect(13 + dx, 39 + dy, 19, 2, pal.brassDark);

  for (let x = 13; x <= 31; x++) {
    const isTooth = ((x - 13 + gearShift) % 4 + 4) % 4 < 2;
    if (!isTooth) continue;
    let ty = 28;
    if (x >= 19 && x <= 25) ty = 26;
    else if ((x >= 16 && x <= 18) || (x >= 26 && x <= 28)) ty = 27;

    const h = (31 + dy) - (ty + dy);
    const isRightEdge = ((x - 13 + gearShift) % 4 + 4) % 4 === 1;
    b.rect(x + dx, ty + dy, 1, h, isRightEdge ? pal.brassLow : pal.brassMid);
  }

  b.rect(cx - 1, cy - 2, 3, 5, pal.hubDark);
  b.rect(cx - 2, cy - 1, 5, 3, pal.hubDark);
  b.px(cx, cy, pal.hubMid);

  if (detailed) {
    c.rect((16 + dx) * s, (30 + dy) * s, 8, 3, pal.brassHi);
    c.rect((14 + dx) * s, (32 + dy) * s, 6, 4, pal.brassHi);
    c.px((17 + dx) * s, (31 + dy) * s, "#ffffff");
    c.rect((27 + dx) * s, (34 + dy) * s, 8, 4, pal.brassLow);
    c.rect((28 + dx) * s, (36 + dy) * s, 6, 4, pal.brassDark);

    c.rect(cx * s - 3, cy * s - 2, 7, 5, pal.hubDark);
    c.rect(cx * s - 2, cy * s - 3, 5, 7, pal.hubDark);
    c.rect(cx * s - 2, cy * s - 2, 5, 5, pal.hubMid);
    c.rect(cx * s - 1, cy * s - 1, 3, 3, pal.brassMid);
    c.px(cx * s - 1, cy * s - 1, pal.brassHi);
    c.px(cx * s + 1, cy * s + 1, pal.brassDark);

    const rivets = [15, 19, 25, 29];
    for (const rx of rivets) {
      c.px((rx + dx) * s, (39 + dy) * s, pal.brassHi);
      c.px((rx + dx) * s, (40 + dy) * s, pal.brassDark);
    }

    for (let x = 13; x <= 31; x++) {
      const phase = ((x - 13 + gearShift) % 4 + 4) % 4;
      let ty = 28;
      if (x >= 19 && x <= 25) ty = 26;
      else if ((x >= 16 && x <= 18) || (x >= 26 && x <= 28)) ty = 27;
      const sx = (x + dx) * s, sy = (ty + dy) * s;
      if (phase === 0) {
        c.line(sx, sy, sx, sy + 5, pal.brassHi);
        c.line(sx, sy, sx + 1, sy, pal.brassHi);
      } else if (phase === 1) {
        c.line(sx + 1, sy, sx + 1, sy + 5, pal.brassDark);
      }
    }
  }
}

function drawHeadEyeAntennae(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const { dx, dy, antennaTwitch, eyeBright } = p;
  const hx = 31 + dx, hy = 34 + dy;

  b.rect(hx, hy + 1, 4, 4, pal.brassMid);
  b.rect(hx + 3, hy + 2, 2, 3, pal.brassDark);
  b.rect(hx + 1, hy + 4, 3, 2, pal.brassDark);

  const eyeCol = eyeBright ? pal.eyeBright : pal.eyeDark;
  b.rect(hx + 1, hy + 1, 2, 2, eyeCol);

  b.rect(hx + 1, hy - 1, 1, 2, pal.hubDark);
  b.rect(hx + 2, hy - 3, 1, 2, pal.hubDark);
  b.rect(hx + 3 + antennaTwitch, hy - 6, 2, 2, pal.brassHi);
  b.c.line((hx + 2) * s, (hy - 2) * s, (hx + 3 + antennaTwitch) * s, (hy - 5) * s, pal.hubDark);

  b.rect(hx, hy - 2, 1, 2, pal.hubDark);
  b.rect(hx + 1 + antennaTwitch, hy - 5, 2, 2, pal.brassMid);

  if (detailed) {
    const ex = (hx + 1) * s, ey = (hy + 1) * s;
    c.rect(ex - 1, ey - 1, 6, 6, pal.hubDark);
    c.rect(ex, ey, 4, 4, eyeBright ? pal.eyeBright : pal.eyeDark);
    if (eyeBright) {
      c.px(ex, ey, pal.eyeGlint);
      c.px(ex + 1, ey, "#ffffff");
    }
    c.line((hx + 3) * s, (hy + 2) * s, (hx + 5) * s, (hy + 2) * s, pal.brassHi);
    const ax = (hx + 3 + antennaTwitch) * s, ay = (hy - 6) * s;
    c.rect(ax, ay, 3, 3, pal.brassHi);
    c.px(ax, ay, "#ffffff");
    c.px(ax + 2, ay + 2, pal.brassDark);
  }
}

function drawGearMite(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = pose.flash ? FLASH_PALETTE : detailed ? HI16BIT_PALETTE : HI8BIT_PALETTE;
  const b = new Brush(c, s, detailed, pal);
  drawLegs(b, pose, false);
  drawShell(b, pose);
  drawHeadEyeAntennae(b, pose);
  drawLegs(b, pose, true);
  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "gear_mite",
  kind: "ground",
  description: "A tiny clockwork brass beetle with a rotating cog shell and glowing cyan eye.",
  hitbox: { width: 26, height: 18 },
  cellScale: 1,
  animations: {
    idle: { frames: 2, fps: 4, loop: true },
    move: { frames: 4, fps: 12, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
  },
  draw: {
    hi8bit: (c, anim, frame) => drawGearMite(c, 1, false, anim, frame),
    hi16bit: (c, anim, frame) => drawGearMite(c, 2, true, anim, frame),
  },
});
