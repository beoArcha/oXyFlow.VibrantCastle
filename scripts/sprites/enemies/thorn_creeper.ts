import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  vineSway: number;
  slitWide: boolean;
  thornBright: boolean;
  bulbSquash: number;
  bulbSwell: number;
  flash: boolean;
}

const REST: Pose = { vineSway: 0, slitWide: false, thornBright: false, bulbSquash: 0, bulbSwell: 0, flash: false };

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [REST, { ...REST, slitWide: true, vineSway: 1 }],
  move: [
    { ...REST, vineSway: -2, thornBright: false, slitWide: false, bulbSwell: 0 },
    { ...REST, vineSway: 0, thornBright: true, slitWide: true, bulbSwell: 1 },
    { ...REST, vineSway: 2, thornBright: false, slitWide: false, bulbSwell: 0 },
    { ...REST, vineSway: 0, thornBright: true, slitWide: false, bulbSwell: 0 },
  ],
  hit: [
    { ...REST, vineSway: -3, bulbSquash: 2, flash: true, slitWide: false },
    { ...REST, vineSway: -1, bulbSquash: 1, flash: false, slitWide: true },
  ],
};

interface Palette {
  outline: string;
  barkDark: string; barkMid: string; barkLight: string; barkHi: string;
  amberDark: string; amberMid: string; amberBright: string; amberCore: string; amberWhite: string;
  vineDark: string; vineMid: string; vineHi: string;
}

const HI8BIT_PALETTE: Palette = {
  outline: "#0c0c04",
  barkDark: "#2c2814", barkMid: "#4c4420", barkLight: "#4c4420", barkHi: "#4c4420",
  amberDark: "#804000", amberMid: "#c07808", amberBright: "#f8a820", amberCore: "#f8e868", amberWhite: "#f8e868",
  vineDark: "#283818", vineMid: "#486028", vineHi: "#486028",
};

const HI16BIT_PALETTE: Palette = {
  outline: "#0c0c04",
  barkDark: "#2c2814", barkMid: "#4c4420", barkLight: "#6c6030", barkHi: "#8c8048",
  amberDark: "#804000", amberMid: "#c07808", amberBright: "#f8a820", amberCore: "#f8e868", amberWhite: "#fff8d0",
  vineDark: "#283818", vineMid: "#486028", vineHi: "#6c9038",
};

const FLASH_PALETTE: Palette = {
  outline: "#0c0c04",
  barkDark: "#94907a", barkMid: "#dcd8c0", barkLight: "#f4f0e0", barkHi: "#ffffff",
  amberDark: "#f0d490", amberMid: "#ffe8a8", amberBright: "#fff8d0", amberCore: "#ffffff", amberWhite: "#ffffff",
  vineDark: "#b8cca4", vineMid: "#e8f8d8", vineHi: "#ffffff",
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

  line(x0: number, y0: number, x1: number, y1: number, color: string): void {
    this.c.line(x0 * this.s, y0 * this.s, x1 * this.s, y1 * this.s, color);
  }
}

function drawRoots(b: Brush): void {
  const { pal, c, s, detailed } = b;
  b.rect(16, 40, 16, 3, pal.barkMid);
  b.rect(18, 43, 12, 2, pal.barkMid);
  b.rect(17, 42, 14, 1, pal.barkDark);
  b.rect(14, 43, 4, 2, pal.barkMid);
  b.rect(12, 45, 4, 2, pal.barkMid);
  b.rect(11, 47, 4, 1, pal.barkDark);
  b.rect(16, 45, 3, 3, pal.barkDark);
  b.rect(22, 44, 4, 4, pal.barkDark);
  b.rect(29, 45, 3, 3, pal.barkDark);
  b.rect(30, 43, 4, 2, pal.barkMid);
  b.rect(32, 45, 4, 2, pal.barkMid);
  b.rect(33, 47, 5, 1, pal.barkDark);
  if (!detailed) return;
  c.ellipse(15 * s + 1, 44 * s, 3, 2, pal.barkDark);
  c.px(15 * s + 1, 44 * s, pal.barkLight);
  c.ellipse(32 * s + 1, 44 * s, 3, 2, pal.barkDark);
  c.px(32 * s + 1, 44 * s, pal.barkLight);
  c.ellipse(24 * s, 43 * s + 1, 3, 2, pal.barkDark);
  c.px(24 * s, 43 * s + 1, pal.barkHi);
  c.line(12 * s, 46 * s, 18 * s, 41 * s, pal.barkHi);
  c.line(30 * s, 41 * s, 36 * s, 46 * s, pal.barkHi);
}

function drawBulb(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const sq = p.bulbSquash, sw = p.bulbSwell;
  b.rect(15 - sw, 37, 18 + sw * 2, 4, pal.barkMid);
  b.rect(15 - sw, 39, 2, 2, pal.barkDark); b.rect(31 + sw, 39, 2, 2, pal.barkDark);
  b.rect(13 - sw, 31 + sq, 22 + sw * 2, 6 - sq, pal.barkMid);
  b.rect(13 - sw, 31 + sq, 2, 6 - sq, pal.barkDark); b.rect(33 + sw, 31 + sq, 2, 6 - sq, pal.barkDark);
  b.rect(14, 29 + sq, 20, 2, pal.barkMid);
  b.rect(14, 29 + sq, 2, 2, pal.barkDark); b.rect(32, 29 + sq, 2, 2, pal.barkDark);
  b.rect(16, 25 + sq, 16, 4, pal.barkMid);
  b.rect(16, 25 + sq, 2, 4, pal.barkDark); b.rect(30, 25 + sq, 2, 4, pal.barkDark);
  b.rect(18, 22 + sq, 12, 3, pal.barkMid);
  b.rect(18, 22 + sq, 1, 3, pal.barkDark); b.rect(29, 22 + sq, 1, 3, pal.barkDark);
  b.rect(21, 18 + sq, 6, 4, pal.barkMid);
  b.rect(21, 18 + sq, 1, 4, pal.barkDark); b.rect(26, 18 + sq, 1, 4, pal.barkDark);
  if (!detailed) return;
  c.line(17 * s, (27 + sq) * s, 16 * s, 38 * s, pal.barkDark);
  c.line(18 * s, (27 + sq) * s, 17 * s, 38 * s, pal.barkLight);
  c.line(20 * s, (21 + sq) * s, 19 * s, 40 * s, pal.barkHi);
  c.line(27 * s, (21 + sq) * s, 28 * s, 40 * s, pal.barkHi);
  c.line(30 * s, (27 + sq) * s, 31 * s, 38 * s, pal.barkLight);
  c.line(31 * s, (27 + sq) * s, 32 * s, 38 * s, pal.barkDark);
}

function drawSlit(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const sq = p.bulbSquash, y = 28 + sq;
  b.rect(21, y, 6, 9, pal.barkDark);
  b.rect(22, y - 1, 4, 1, pal.barkDark);
  b.rect(22, y + 9, 4, 1, pal.barkDark);
  if (p.slitWide) {
    b.rect(22, y + 1, 4, 7, pal.amberMid);
    b.rect(23, y + 2, 2, 5, pal.amberBright);
    b.rect(23, y + 3, 2, 3, pal.amberCore);
  } else {
    b.rect(23, y + 1, 2, 7, pal.amberDark);
    b.rect(23, y + 2, 2, 5, pal.amberMid);
    b.rect(23, y + 3, 2, 3, pal.amberBright);
  }
  if (!detailed) return;
  const cx = 24 * s, cy = (y + 4) * s;
  const rx = p.slitWide ? 7 : 5, ry = p.slitWide ? 10 : 8;
  c.ellipse(cx, cy, rx, ry, pal.amberDark);
  c.ellipse(cx, cy, rx - 2, ry - 3, pal.amberMid);
  c.ellipse(cx, cy, Math.max(1, rx - 4), Math.max(2, ry - 5), pal.amberBright);
  const coreH = p.slitWide ? 4 : 3;
  c.line(cx, cy - coreH, cx, cy + coreH, pal.amberCore);
  c.line(cx, cy - 1, cx, cy + 1, pal.amberWhite);
}

function drawThorns(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const sq = p.bulbSquash;
  const cBase = p.thornBright ? pal.amberBright : pal.amberMid;
  const cHi = p.thornBright ? pal.amberCore : pal.amberBright;
  const cDark = pal.amberDark;

  const thorn = (bx: number, by: number, tx: number, ty: number) => {
    b.line(bx, by, tx, ty, cBase);
    b.line(bx, by + 1, tx, ty, cDark);
    if (!detailed) return;
    c.line(bx * s, by * s, tx * s, ty * s, cHi);
    c.line(bx * s, (by + 1) * s, tx * s, ty * s + 1, cDark);
    c.px(tx * s, ty * s, pal.amberWhite);
  };

  thorn(18, 24 + sq, 11, 17 + sq);
  thorn(14, 30 + sq, 9, 25 + sq);
  thorn(14, 36, 10, 33);
  thorn(30, 24 + sq, 37, 17 + sq);
  thorn(34, 30 + sq, 38, 25 + sq);
  thorn(34, 36, 37, 33);
  thorn(18, 34 + sq, 16, 31 + sq);
  thorn(29, 34 + sq, 31, 31 + sq);
}

function drawVines(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const sq = p.bulbSquash, sw = p.vineSway;
  const leftVine: [number, number][] = [
    [22, 18 + sq], [21, 16 + sq], [22, 14],
    [23 + Math.round(sw * 0.4), 13], [24 + Math.round(sw * 0.7), 12], [26 + sw, 11], [27 + sw, 12],
  ];
  const rightVine: [number, number][] = [
    [24, 18 + sq], [25, 16 + sq], [26, 14],
    [27 + Math.round(sw * 0.4), 12], [28 + Math.round(sw * 0.7), 11], [30 + sw, 9], [31 + sw, 10],
  ];
  const renderVine = (pts: [number, number][]) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      b.line(x0, y0, x1, y1, pal.vineMid);
      if (detailed) {
        c.line(x0 * s, y0 * s, x1 * s, y1 * s, pal.vineHi);
        c.line(x0 * s + 1, y0 * s + 1, x1 * s + 1, y1 * s + 1, pal.vineDark);
      }
    }
  };
  renderVine(leftVine);
  renderVine(rightVine);
  if (!detailed) return;
  c.px((22 + Math.round(sw * 0.4)) * s - 1, 13 * s, pal.amberBright);
  c.px((24 + Math.round(sw * 0.7)) * s + 2, 12 * s, pal.amberBright);
  c.px((26 + Math.round(sw * 0.4)) * s - 1, 13 * s, pal.amberBright);
  c.px((28 + Math.round(sw * 0.7)) * s + 2, 11 * s, pal.amberBright);
  c.px((30 + sw) * s + 1, 9 * s + 1, pal.amberBright);
}

function drawCreeper(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = pose.flash ? FLASH_PALETTE : detailed ? HI16BIT_PALETTE : HI8BIT_PALETTE;
  const b = new Brush(c, s, detailed, pal);
  drawRoots(b);
  drawBulb(b, pose);
  drawSlit(b, pose);
  drawThorns(b, pose);
  drawVines(b, pose);
  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "thorn_creeper",
  kind: "static",
  description: "A rooted bark bulb bristling with amber crystal thorns and a glowing vertical slit.",
  hitbox: { width: 34, height: 44 },
  cellScale: 1,
  animations: {
    idle: { frames: 2, fps: 3, loop: true },
    move: { frames: 4, fps: 5, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
  },
  draw: {
    hi8bit: (c, anim, frame) => drawCreeper(c, 1, false, anim, frame),
    hi16bit: (c, anim, frame) => drawCreeper(c, 2, true, anim, frame),
  },
});
