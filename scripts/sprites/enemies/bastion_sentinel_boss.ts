import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  dx: number;
  dy: number;
  headDy: number;
  legL: [number, number];
  legR: [number, number];
  shieldDx: number;
  shieldDy: number;
  macePose: "rest" | "windup" | "slam" | "impact" | "drop";
  collapse: number; // 0 = standing, 1 = staggered, 2 = kneeling, 3 = fallen
  glow: boolean;
  flash: boolean;
}

const REST: Pose = {
  dx: 0,
  dy: 0,
  headDy: 0,
  legL: [0, 0],
  legR: [0, 0],
  shieldDx: 0,
  shieldDy: 0,
  macePose: "rest",
  collapse: 0,
  glow: false,
  flash: false,
};

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [
    REST,
    { ...REST, dy: -1, glow: true },
    { ...REST, dy: -1, headDy: -1, shieldDy: -1, glow: true },
    { ...REST, dy: 0 },
  ],
  move: [
    { ...REST, dx: 1, legL: [-2, -2], legR: [2, 0], shieldDx: -1, glow: true },
    { ...REST, dx: 1, dy: -1, legL: [0, -1], legR: [0, 0], shieldDy: -1 },
    { ...REST, dx: 1, legL: [2, 0], legR: [-2, -2], shieldDx: 1, glow: true },
    { ...REST, dx: 1, dy: 0, legL: [0, 0], legR: [0, -1], shieldDy: 0 },
  ],
  hit: [
    { ...REST, dx: -3, dy: 1, headDy: 1, shieldDx: -2, shieldDy: -1, flash: true },
    { ...REST, dx: -1, headDy: 1, shieldDx: -1 },
  ],
  attack: [
    { ...REST, dx: 0, dy: -1, shieldDx: -1, macePose: "windup", glow: true },
    { ...REST, dx: 0, dy: 1, legL: [-1, 0], legR: [2, 0], shieldDx: -1, macePose: "slam", glow: true },
    { ...REST, dx: 0, dy: 2, legL: [-1, 0], legR: [2, 0], macePose: "impact", glow: true },
    { ...REST, dx: 0, dy: 1, macePose: "rest" },
  ],
  death: [
    { ...REST, dx: -2, dy: 3, headDy: 1, shieldDy: 0, macePose: "drop", collapse: 1, flash: true },
    { ...REST, dx: -1, dy: 8, headDy: 2, shieldDy: 0, macePose: "drop", collapse: 2 },
    { ...REST, dy: 22, macePose: "drop", collapse: 3 },
    { ...REST, dy: 28, macePose: "drop", collapse: 3 },
  ],
};

interface Palette {
  outline: string;
  ironDark: string;
  ironMid: string;
  ironLight: string;
  bronzeDark: string;
  bronzeMid: string;
  bronzeLight: string;
  amber: string;
  goldMid: string;
  goldHi: string;
  emberDark: string;
  emberMid: string;
  emberBright: string;
  coreGlow: string;
}

const HI8BIT_PALETTE: Palette = {
  outline: "#112",
  ironDark: "#223",
  ironMid: "#456",
  ironLight: "#456",
  bronzeDark: "#520",
  bronzeMid: "#841",
  bronzeLight: "#c61",
  amber: "#d70",
  goldMid: "#fc3",
  goldHi: "#fc3",
  emberDark: "#911",
  emberMid: "#e32",
  emberBright: "#f85",
  coreGlow: "#fe8",
};

const HI16BIT_PALETTE: Palette = {
  outline: "#100c18",
  ironDark: "#1c2230",
  ironMid: "#384458",
  ironLight: "#687890",
  bronzeDark: "#4c1c04",
  bronzeMid: "#844010",
  bronzeLight: "#c86c1c",
  amber: "#e88818",
  goldMid: "#fcc428",
  goldHi: "#fff498",
  emberDark: "#881410",
  emberMid: "#e8341c",
  emberBright: "#ff8844",
  coreGlow: "#fff098",
};

const FLASH_PALETTE: Palette = {
  outline: "#100c18",
  ironDark: "#748090",
  ironMid: "#b0bcc8",
  ironLight: "#ffffff",
  bronzeDark: "#b89c88",
  bronzeMid: "#e8ccb0",
  bronzeLight: "#ffffff",
  amber: "#ffe8c0",
  goldMid: "#fff8d0",
  goldHi: "#ffffff",
  emberDark: "#ffc0b0",
  emberMid: "#ffe8d8",
  emberBright: "#ffffff",
  coreGlow: "#ffffff",
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

  px(x: number, y: number, color: string): void {
    this.c.rect(x * this.s, y * this.s, this.s, this.s, color);
  }

  line(x0: number, y0: number, x1: number, y1: number, color: string): void {
    this.c.line(x0 * this.s, y0 * this.s, x1 * this.s, y1 * this.s, color);
  }
}

function drawLegs(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  if (p.collapse === 3) return;
  if (p.collapse === 2) {
    // Kneeling heavy armored greaves anchored on bottom row 71
    b.rect(20, 58, 10, 10, pal.bronzeDark);
    b.rect(38, 58, 10, 10, pal.bronzeDark);
    b.rect(19, 68, 12, 4, pal.ironDark);
    b.rect(37, 68, 12, 4, pal.ironDark);
    return;
  }

  const drawOne = (baseX: number, [ox, oy]: [number, number], front: boolean) => {
    const lx = baseX + p.dx + ox;
    const topY = 51 + p.dy + oy;
    const shinH = Math.max(8, 67 - topY);
    b.rect(lx, topY, 8, shinH, front ? pal.bronzeMid : pal.bronzeDark);
    b.rect(lx + 1, topY + 3, 6, 4, pal.ironMid);
    b.rect(lx + 2, topY + 4, 4, 2, pal.amber);
    if (detailed) {
      b.rect(lx + 6, topY, 2, shinH, front ? pal.bronzeLight : pal.bronzeMid);
      c.px((lx + 3) * s, (topY + 4) * s, pal.goldMid);
    }
    // Armored sabaton reaching row 71
    b.rect(lx - 1, 66, 10, 5, pal.ironDark);
    b.rect(lx - 1, 71, 10, 1, pal.ironDark);
    if (detailed) {
      b.rect(lx, 67, 7, 3, pal.ironMid);
      b.rect(lx + 6, 68, 3, 2, pal.bronzeLight);
    }
  };

  drawOne(21, p.legL, false);
  drawOne(39, p.legR, true);
}

function drawTorso(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  if (p.collapse === 3) {
    // Fallen armored hulk on floor
    const y0 = p.dy > 24 ? 58 : 54;
    b.rect(14, y0, 38, 70 - y0, pal.bronzeDark);
    b.rect(16, y0 + 2, 32, 7, pal.bronzeMid);
    b.rect(28, y0 + 4, 10, 5, pal.ironDark);
    b.rect(30, y0 + 5, 6, 3, p.dy > 24 ? pal.emberDark : pal.emberMid);
    b.rect(12, 70, 44, 2, pal.ironDark);
    return;
  }

  const tx = 18 + p.dx;
  const ty = 23 + p.dy;

  // Massive spiked pauldrons
  b.rect(tx - 5, ty, 11, 10, pal.bronzeMid);
  b.rect(tx + 26, ty, 11, 10, pal.bronzeMid);
  b.rect(tx - 4, ty - 2, 4, 3, pal.goldMid);
  b.rect(tx + 32, ty - 2, 4, 3, pal.goldMid);

  // Broad cuirass
  b.rect(tx, ty + 2, 32, 27, pal.bronzeDark);
  b.rect(tx + 2, ty + 3, 28, 24, pal.bronzeMid);
  b.rect(tx + 4, ty + 5, 24, 9, pal.amber);

  // Gorget & belt
  b.rect(tx + 6, ty, 20, 4, pal.ironMid);
  b.rect(tx + 2, ty + 24, 28, 4, pal.ironDark);
  b.rect(tx + 12, ty + 24, 8, 4, pal.goldMid);

  // Central furnace core
  b.rect(tx + 10, ty + 13, 12, 10, pal.ironDark);
  b.rect(tx + 12, ty + 15, 8, 6, p.glow ? pal.emberBright : pal.emberMid);
  b.rect(tx + 14, ty + 16, 4, 4, p.glow ? pal.coreGlow : pal.goldMid);

  if (detailed) {
    b.rect(tx + 24, ty + 5, 4, 18, pal.bronzeLight);
    b.rect(tx - 5, ty + 1, 10, 2, pal.goldMid);
    b.rect(tx + 27, ty + 1, 10, 2, pal.goldMid);
    c.px((tx + 15) * s + 1, (ty + 17) * s + 1, pal.coreGlow);
    c.px((tx + 5) * s, (ty + 7) * s, pal.goldHi);
    c.px((tx + 26) * s, (ty + 7) * s, pal.goldHi);
  }
}

function drawHelm(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  if (p.collapse === 3) {
    // Fallen crowned helm & shattered crown prong
    const hy = p.dy > 24 ? 54 : 50;
    b.rect(44, hy, 14, 10, pal.ironDark);
    b.rect(46, hy + 1, 10, 8, pal.bronzeMid);
    b.rect(47, hy - 3, 3, 4, pal.goldMid);
    b.rect(52, hy - 4, 3, 5, pal.goldMid);
    b.rect(51, hy + 4, 5, 2, pal.emberDark);
    return;
  }

  const hx = 24 + p.dx;
  const hy = 10 + p.dy + p.headDy;

  // Royal 3-prong crown
  b.rect(hx + 2, hy - 4, 3, 5, pal.goldMid);
  b.rect(hx + 8, hy - 5, 4, 6, pal.goldMid);
  b.rect(hx + 15, hy - 4, 3, 5, pal.goldMid);

  // Helm shell & face plate
  b.rect(hx, hy + 1, 20, 14, pal.ironDark);
  b.rect(hx + 2, hy + 2, 16, 12, pal.bronzeMid);
  b.rect(hx + 4, hy + 3, 12, 5, pal.ironMid);

  // Glowing ember visor
  const vCol = p.glow ? pal.coreGlow : pal.emberBright;
  b.rect(hx + 9, hy + 8, 9, 3, pal.ironDark);
  b.rect(hx + 10, hy + 9, 7, 2, vCol);

  if (detailed) {
    b.rect(hx + 9, hy - 5, 2, 4, pal.goldHi);
    b.rect(hx + 13, hy + 3, 4, 4, pal.ironLight);
    c.px((hx + 14) * s, (hy + 9) * s, pal.coreGlow);
    c.px((hx + 3) * s, (hy - 3) * s, pal.goldHi);
    c.px((hx + 16) * s, (hy - 3) * s, pal.goldHi);
  }
}

function drawShield(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  if (p.collapse === 3) {
    // Fallen kite shield propped at front-left
    b.rect(6, 60, 14, 11, pal.bronzeMid);
    b.rect(8, 62, 10, 7, pal.amber);
    b.rect(11, 64, 4, 4, pal.goldMid);
    b.rect(6, 70, 14, 2, pal.ironDark);
    return;
  }

  const sx = 7 + p.dx + p.shieldDx;
  const sy = Math.min(37, 27 + p.dy + p.shieldDy);
  b.rect(sx + 1, sy, 11, 2, pal.goldMid);
  b.rect(sx, sy + 2, 13, 19, pal.bronzeMid);
  b.rect(sx + 1, sy + 21, 11, 6, pal.bronzeMid);
  b.rect(sx + 2, sy + 27, 9, 4, pal.bronzeDark);
  b.rect(sx + 4, sy + 31, 5, 3, pal.ironDark);

  // Shield heraldic core
  b.rect(sx + 2, sy + 4, 9, 17, pal.amber);
  b.rect(sx + 5, sy + 7, 3, 12, pal.goldMid);
  b.rect(sx + 3, sy + 11, 7, 3, pal.goldMid);

  if (detailed) {
    b.rect(sx + 1, sy + 2, 1, 19, pal.ironLight);
    b.rect(sx + 11, sy + 2, 1, 19, pal.bronzeDark);
    c.px((sx + 6) * s, (sy + 12) * s, pal.goldHi);
    c.px((sx + 2) * s, (sy + 5) * s, pal.goldHi);
  }
}

function drawMace(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  if (p.macePose === "drop") {
    // Dropped war-mace on right side of floor
    const my = p.collapse >= 3 ? 61 : 59;
    b.rect(40, my + 2, 18, 3, pal.ironMid);
    b.rect(54, my - 1, 11, 10, pal.emberDark);
    b.rect(56, my + 1, 7, 6, pal.emberMid);
    return;
  }

  if (p.macePose === "windup") {
    const mx = 46 + p.dx;
    const my = 6 + p.dy;
    b.line(mx + 2, my + 12, mx - 4, my + 34, pal.ironMid);
    b.line(mx + 3, my + 12, mx - 3, my + 34, pal.ironLight);
    b.rect(mx - 3, my, 12, 13, pal.emberDark);
    b.rect(mx - 1, my + 2, 8, 9, pal.emberBright);
    b.rect(mx + 1, my + 4, 4, 5, pal.coreGlow);
    return;
  }

  if (p.macePose === "slam" || p.macePose === "impact") {
    // Swung forward & crashing down
    const mx = 54 + p.dx;
    const my = p.macePose === "slam" ? 36 + p.dy : 52 + p.dy;
    b.line(42 + p.dx, 32 + p.dy, mx + 2, my + 4, pal.ironMid);
    b.line(42 + p.dx, 33 + p.dy, mx + 2, my + 5, pal.ironLight);
    b.rect(mx - 3, my, 13, 13, pal.emberMid);
    b.rect(mx - 1, my + 2, 9, 9, pal.emberBright);
    b.rect(mx + 1, my + 4, 5, 5, pal.coreGlow);
    // Impact shockwave embers
    if (p.macePose === "impact") {
      b.rect(mx - 8, 67, 20, 3, pal.emberBright);
      b.rect(mx - 4, 64, 14, 3, pal.coreGlow);
      b.px(mx - 9, 62, pal.goldMid);
      b.px(mx + 11, 61, pal.goldMid);
    }
    return;
  }

  // Upright war-mace in right hand
  const mx = 53 + p.dx;
  const my = 14 + p.dy;
  b.rect(mx + 2, my + 10, 4, 42, pal.ironMid);
  b.rect(mx + 4, my + 10, 1, 42, pal.ironLight);
  b.rect(mx - 2, my, 12, 13, pal.emberDark);
  b.rect(mx, my + 2, 8, 9, p.glow ? pal.emberBright : pal.emberMid);
  b.rect(mx + 2, my + 4, 4, 5, p.glow ? pal.coreGlow : pal.goldMid);
  // Spikes on mace head
  b.rect(mx + 3, my - 3, 2, 3, pal.goldMid);
  b.rect(mx - 4, my + 5, 2, 3, pal.goldMid);
  b.rect(mx + 10, my + 5, 2, 3, pal.goldMid);
  if (detailed) {
    c.px((mx + 3) * s + 1, (my + 6) * s + 1, pal.coreGlow);
    c.px((mx + 4) * s, (my - 2) * s, pal.goldHi);
  }
}

function drawBoss(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = pose.flash ? FLASH_PALETTE : detailed ? HI16BIT_PALETTE : HI8BIT_PALETTE;
  const b = new Brush(c, s, detailed, pal);

  drawLegs(b, pose);
  drawTorso(b, pose);
  drawHelm(b, pose);
  drawShield(b, pose);
  drawMace(b, pose);

  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "bastion_sentinel_boss",
  kind: "ground",
  description: "Towering crowned bronze bastion commander with heavy kite shield, furnace core and blazing war-mace.",
  hitbox: { width: 62, height: 82 },
  cellScale: 1.5,
  animations: {
    idle: { frames: 4, fps: 5, loop: true },
    move: { frames: 4, fps: 7, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
    attack: { frames: 4, fps: 9, loop: false },
    death: { frames: 4, fps: 7, loop: false },
  },
  draw: {
    hi8bit: (c, anim, frame) => drawBoss(c, 1, false, anim, frame),
    hi16bit: (c, anim, frame) => drawBoss(c, 2, true, anim, frame),
  },
});
