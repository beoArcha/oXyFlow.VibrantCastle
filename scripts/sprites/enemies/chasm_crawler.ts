import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  dx: number; dy: number; tailSway: number; tailDy: number;
  leg1Dx: number; leg2Dx: number; leg3Dx: number;
  thornsBright: boolean; pincerSpread: number; flash: boolean;
}

const REST: Pose = {
  dx: 0, dy: 0, tailSway: 0, tailDy: 0,
  leg1Dx: 0, leg2Dx: 0, leg3Dx: 0,
  thornsBright: true, pincerSpread: 0, flash: false,
};

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [REST, { ...REST, tailSway: 1, tailDy: -1, thornsBright: false }],
  move: [
    { ...REST, leg1Dx: 2, leg2Dx: -2, leg3Dx: 2, dy: 0, tailSway: 0 },
    { ...REST, leg1Dx: 0, leg2Dx: 0, leg3Dx: 0, dy: 1, tailSway: -1, pincerSpread: 1 },
    { ...REST, leg1Dx: -2, leg2Dx: 2, leg3Dx: -2, dy: 0, tailSway: 0 },
    { ...REST, leg1Dx: 0, leg2Dx: 0, leg3Dx: 0, dy: 1, tailSway: 1, pincerSpread: 0 },
  ],
  hit: [
    { ...REST, dx: -2, dy: 0, tailDy: 4, tailSway: 0, leg1Dx: -2, leg2Dx: -2, leg3Dx: -2, flash: true },
    { ...REST, dx: -1, dy: 0, tailDy: 2, tailSway: 0, leg1Dx: -1, leg2Dx: -1, leg3Dx: -1, flash: false },
  ],
};

interface Palette {
  outline: string; shaleHi: string; shaleMid: string; shaleBase: string; shaleDark: string;
  amberGlow: string; amberBright: string; amberMid: string; amberDark: string; highlight: string;
}

const HI8BIT_PALETTE: Palette = {
  outline: "#080808", shaleHi: "#584038", shaleMid: "#403028", shaleBase: "#403028", shaleDark: "#282018",
  amberGlow: "#f8e830", amberBright: "#f8a820", amberMid: "#b87808", amberDark: "#804000", highlight: "#f8e830",
};
const HI16BIT_PALETTE: Palette = {
  outline: "#080808", shaleHi: "#706050", shaleMid: "#584038", shaleBase: "#403028", shaleDark: "#282018",
  amberGlow: "#f8e830", amberBright: "#f8a820", amberMid: "#b87808", amberDark: "#804000", highlight: "#f8f0e8",
};
const FLASH_PALETTE: Palette = {
  outline: "#080808", shaleHi: "#ffffff", shaleMid: "#f0ece8", shaleBase: "#d8d0c8", shaleDark: "#a8a098",
  amberGlow: "#ffffff", amberBright: "#fff4d0", amberMid: "#e0d090", amberDark: "#b0a068", highlight: "#ffffff",
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
  const col = isFore ? pal.shaleBase : pal.shaleDark;
  const kneeCol = isFore ? pal.shaleHi : pal.shaleDark;

  if (!detailed) {
    c.line(hx, hy, kx, ky, col);
    c.line(kx, ky, fx, 47, col);
    c.px(kx, ky, kneeCol);
    c.px(fx, 47, pal.shaleDark);
  } else {
    const shx = hx * s, shy = hy * s, skx = kx * s, sky = ky * s, sfx = fx * s, sfy = 95;
    c.line(shx, shy, skx, sky, col);
    c.line(shx, shy + 1, skx, sky + 1, pal.shaleDark);
    if (isFore) c.line(shx, shy - 1, skx, sky - 1, pal.shaleHi);

    c.rect(skx - 1, sky - 1, 3, 3, kneeCol);
    c.px(skx, sky, pal.shaleDark);

    c.line(skx, sky, sfx, sfy, col);
    c.line(skx + 1, sky, sfx + 1, sfy, pal.shaleDark);
    if (isFore) c.line(skx - 1, sky, sfx - 1, sfy, pal.shaleHi);

    c.px(sfx, sfy, pal.shaleDark);
    if (isFore) c.px(sfx + 1, sfy, pal.outline);
  }
}

function drawLegs(b: Brush, p: Pose, fore: boolean): void {
  const { dx, dy } = p;
  if (!fore) {
    drawLeg(b, 18 + dx, 37 + dy, 9 + dx, 32 + dy, 12 + dx + p.leg3Dx, false);
    drawLeg(b, 26 + dx, 37 + dy, 23 + dx, 32 + dy, 27 + dx + p.leg2Dx, false);
    drawLeg(b, 34 + dx, 37 + dy, 37 + dx, 33 + dy, 40 + dx + p.leg1Dx, false);
  } else {
    drawLeg(b, 16 + dx, 38 + dy, 8 + dx, 34 + dy, 9 + dx + p.leg3Dx, true);
    drawLeg(b, 24 + dx, 38 + dy, 22 + dx, 33 + dy, 24 + dx + p.leg2Dx, true);
    drawLeg(b, 32 + dx, 38 + dy, 36 + dx, 34 + dy, 37 + dx + p.leg1Dx, true);
  }
}

function drawTail(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const tx = p.dx, ty = p.dy + p.tailDy, sw = p.tailSway;

  b.rect(12 + tx, 36 + ty, 4, 3, pal.shaleBase);
  b.rect(12 + tx, 38 + ty, 4, 1, pal.shaleDark);

  b.rect(9 + tx, 33 + ty, 4, 4, pal.shaleBase);
  b.rect(9 + tx, 36 + ty, 4, 1, pal.shaleDark);

  b.rect(5 + tx + sw, 29 + ty, 4, 5, pal.shaleBase);
  b.rect(5 + tx + sw, 29 + ty, 1, 5, pal.shaleHi);
  b.rect(8 + tx + sw, 29 + ty, 1, 5, pal.shaleDark);

  b.rect(7 + tx + sw, 26 + ty, 6, 4, pal.shaleBase);
  b.rect(7 + tx + sw, 26 + ty, 6, 1, pal.shaleHi);

  b.rect(12 + tx + sw, 26 + ty, 4, 3, pal.shaleBase);
  b.rect(12 + tx + sw, 28 + ty, 4, 1, pal.shaleDark);

  b.rect(15 + tx + sw, 27 + ty, 3, 2, pal.amberBright);
  b.rect(16 + tx + sw, 28 + ty, 2, 2, pal.amberGlow);
  b.px(17 + tx + sw, 29 + ty, pal.amberDark);

  if (detailed) {
    const ox = (5 + tx + sw) * s, oy = (26 + ty) * s;
    c.line(ox + 4, oy + 8, ox + 8, oy + 8, pal.shaleDark);
    c.line(ox + 8, oy + 4, ox + 12, oy + 4, pal.shaleDark);
    c.px((17 + tx + sw) * s + 1, (29 + ty) * s + 1, pal.highlight);
  }
}

function drawThorns(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const { dx, dy, thornsBright } = p;
  const tipCol = thornsBright ? pal.amberGlow : pal.amberBright;

  b.rect(20 + dx, 30 + dy, 2, 4, pal.amberMid);
  b.px(20 + dx, 30 + dy, tipCol);

  b.rect(25 + dx, 27 + dy, 3, 7, pal.amberBright);
  b.rect(25 + dx, 26 + dy, 2, 2, tipCol);
  b.rect(27 + dx, 28 + dy, 1, 6, pal.amberDark);

  b.rect(30 + dx, 29 + dy, 3, 5, pal.amberBright);
  b.rect(30 + dx, 28 + dy, 2, 2, tipCol);
  b.rect(32 + dx, 30 + dy, 1, 4, pal.amberDark);

  if (detailed) {
    const rx = (26 + dx) * s, ry = (26 + dy) * s;
    c.polygon([[rx, ry], [rx - 2, ry + 12], [rx, ry + 12]], pal.amberGlow);
    c.polygon([[rx, ry], [rx, ry + 12], [rx + 3, ry + 12]], pal.amberDark);
    c.px(rx, ry, pal.highlight);
    c.px((31 + dx) * s, (28 + dy) * s, pal.highlight);
  }
}

function drawBodyAndHead(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const { dx, dy, pincerSpread } = p;

  b.rect(13 + dx, 36 + dy, 7, 5, pal.shaleBase);
  b.rect(13 + dx, 36 + dy, 7, 1, pal.shaleHi);
  b.rect(13 + dx, 40 + dy, 7, 1, pal.shaleDark);

  b.rect(19 + dx, 34 + dy, 8, 7, pal.shaleMid);
  b.rect(19 + dx, 34 + dy, 8, 1, pal.shaleHi);
  b.rect(19 + dx, 40 + dy, 8, 1, pal.shaleDark);

  b.rect(26 + dx, 34 + dy, 8, 7, pal.shaleBase);
  b.rect(26 + dx, 34 + dy, 8, 1, pal.shaleHi);
  b.rect(26 + dx, 40 + dy, 8, 1, pal.shaleDark);

  b.rect(15 + dx, 40 + dy, 19, 2, pal.shaleDark);

  b.rect(33 + dx, 35 + dy, 4, 5, pal.shaleBase);
  b.rect(33 + dx, 35 + dy, 4, 1, pal.shaleHi);
  b.px(35 + dx, 36 + dy, pal.amberGlow);
  b.px(36 + dx, 37 + dy, pal.amberGlow);

  b.rect(37 + dx, 37 + dy, 3, 2, pal.shaleBase);
  b.rect(40 + dx, 36 + dy, 2, 4, pal.shaleBase);

  b.rect(41 + dx, 35 + dy - pincerSpread, 2, 2, pal.shaleBase);
  b.rect(42 + dx, 36 + dy - pincerSpread, 2, 1, pal.amberBright);
  b.px(44 + dx, 37 + dy - pincerSpread, pal.amberGlow);

  b.rect(41 + dx, 40 + dy + pincerSpread, 2, 2, pal.shaleBase);
  b.rect(42 + dx, 40 + dy + pincerSpread, 2, 1, pal.amberBright);
  b.px(44 + dx, 40 + dy + pincerSpread, pal.amberGlow);

  if (detailed) {
    c.line((19 + dx) * s, (34 + dy) * s, (18 + dx) * s, (40 + dy) * s, pal.shaleDark);
    c.line((26 + dx) * s, (34 + dy) * s, (25 + dx) * s, (40 + dy) * s, pal.shaleDark);
    c.px((35 + dx) * s, (36 + dy) * s, pal.highlight);
    c.px((36 + dx) * s, (37 + dy) * s, pal.highlight);
    c.px((44 + dx) * s + 1, (37 + dy - pincerSpread) * s, pal.highlight);
    c.px((44 + dx) * s + 1, (40 + dy + pincerSpread) * s, pal.highlight);
  }
}

function drawCrawler(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = pose.flash ? FLASH_PALETTE : detailed ? HI16BIT_PALETTE : HI8BIT_PALETTE;
  const b = new Brush(c, s, detailed, pal);

  drawLegs(b, pose, false);
  drawTail(b, pose);
  drawThorns(b, pose);
  drawBodyAndHead(b, pose);
  drawLegs(b, pose, true);
  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "chasm_crawler",
  kind: "ground",
  description: "A low-slung, six-legged shale construct with glowing crystalline amber thorns and stinger.",
  hitbox: { width: 56, height: 30 },
  cellScale: 1,
  animations: {
    idle: { frames: 2, fps: 4, loop: true },
    move: { frames: 4, fps: 10, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
  },
  draw: {
    hi8bit: (c, anim, frame) => drawCrawler(c, 1, false, anim, frame),
    hi16bit: (c, anim, frame) => drawCrawler(c, 2, true, anim, frame),
  },
});
