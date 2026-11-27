import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  dx: number;
  dy: number;
  headDy: number;
  legL: [number, number];
  legR: [number, number];
  capeWave: number;
  swordPose: "rest" | "windup" | "slash" | "follow" | "drop";
  collapse: number; // 0 = standing, 1 = kneeling, 2 = fallen, 3 = dissolved
  sigilPulse: boolean;
  flash: boolean;
}

const REST: Pose = {
  dx: 0,
  dy: 0,
  headDy: 0,
  legL: [0, 0],
  legR: [0, 0],
  capeWave: 0,
  swordPose: "rest",
  collapse: 0,
  sigilPulse: false,
  flash: false,
};

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [
    REST,
    { ...REST, dy: -1, capeWave: -1, sigilPulse: true },
    { ...REST, dy: -1, headDy: -1, capeWave: 1, sigilPulse: true },
    { ...REST, capeWave: 0 },
  ],
  move: [
    { ...REST, dx: 1, legL: [-2, -1], legR: [2, 0], capeWave: -2, sigilPulse: true },
    { ...REST, dx: 1, dy: -1, legL: [0, -1], legR: [0, 0], capeWave: -3 },
    { ...REST, dx: 1, legL: [2, 0], legR: [-2, -1], capeWave: -1, sigilPulse: true },
    { ...REST, dx: 1, dy: 0, legL: [0, 0], legR: [0, -1], capeWave: -2 },
  ],
  hit: [
    { ...REST, dx: -2, dy: 1, headDy: 1, capeWave: 2, flash: true },
    { ...REST, dx: -1, headDy: 1, capeWave: 1 },
  ],
  attack: [
    { ...REST, dx: 0, dy: 1, capeWave: 1, swordPose: "windup", sigilPulse: true },
    { ...REST, dx: -1, dy: 0, legL: [-1, 0], legR: [2, 0], capeWave: -4, swordPose: "slash", sigilPulse: true },
    { ...REST, dx: -1, dy: 1, legL: [-1, 0], legR: [2, 0], capeWave: -3, swordPose: "follow" },
    { ...REST, dx: 0, capeWave: -1, swordPose: "rest" },
  ],
  death: [
    { ...REST, dx: -1, dy: 2, headDy: 1, capeWave: 1, swordPose: "drop", collapse: 1, flash: true },
    { ...REST, dx: -1, dy: 6, headDy: 2, capeWave: 0, swordPose: "drop", collapse: 1 },
    { ...REST, dy: 14, capeWave: -1, swordPose: "drop", collapse: 2 },
    { ...REST, dy: 18, capeWave: -2, swordPose: "drop", collapse: 3 },
  ],
};

interface Palette {
  outline: string;
  armorDark: string;
  armorMid: string;
  armorLight: string;
  violetDark: string;
  violetMid: string;
  violetBright: string;
  capeDark: string;
  capeMid: string;
  hornMid: string;
  hornLight: string;
  visor: string;
  visorBright: string;
  bladeDark: string;
  bladeMid: string;
  bladeCore: string;
  goldDark: string;
  goldMid: string;
  goldHi: string;
}

const HI8BIT_PALETTE: Palette = {
  outline: "#102",
  armorDark: "#214",
  armorMid: "#327",
  armorLight: "#327",
  violetDark: "#417",
  violetMid: "#73d",
  violetBright: "#a6f",
  capeDark: "#213",
  capeMid: "#416",
  hornMid: "#a7e",
  hornLight: "#a7e",
  visor: "#e24",
  visorBright: "#f88",
  bladeDark: "#812",
  bladeMid: "#d24",
  bladeCore: "#fab",
  goldDark: "#a72",
  goldMid: "#eb3",
  goldHi: "#eb3",
};

const HI16BIT_PALETTE: Palette = {
  outline: "#0c081c",
  armorDark: "#1a1438",
  armorMid: "#2c2464",
  armorLight: "#4c3c94",
  violetDark: "#441878",
  violetMid: "#7c38dc",
  violetBright: "#c084fc",
  capeDark: "#200c34",
  capeMid: "#481c6c",
  hornMid: "#9c64e4",
  hornLight: "#e0c8ff",
  visor: "#e42048",
  visorBright: "#ff90a4",
  bladeDark: "#781028",
  bladeMid: "#d82448",
  bladeCore: "#ffc0cc",
  goldDark: "#986414",
  goldMid: "#e8ac2c",
  goldHi: "#fff098",
};

const FLASH_PALETTE: Palette = {
  outline: "#0c081c",
  armorDark: "#7c78a0",
  armorMid: "#b8b4dc",
  armorLight: "#ffffff",
  violetDark: "#b098dc",
  violetMid: "#e0ccff",
  violetBright: "#ffffff",
  capeDark: "#8874a8",
  capeMid: "#b8a0d8",
  hornMid: "#e8dcff",
  hornLight: "#ffffff",
  visor: "#ffd8e0",
  visorBright: "#ffffff",
  bladeDark: "#d890a0",
  bladeMid: "#ffd0dc",
  bladeCore: "#ffffff",
  goldDark: "#e8d898",
  goldMid: "#fff4c0",
  goldHi: "#ffffff",
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

function drawCape(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  if (p.collapse >= 2) {
    // Collapsed cloak spread on floor
    const y0 = p.collapse === 2 ? 38 : 42;
    b.rect(8, y0, 26, 47 - y0, pal.capeDark);
    b.rect(10, y0 + 1, 18, 46 - y0, pal.capeMid);
    b.rect(8, 47, 28, 1, pal.capeDark);
    return;
  }

  const cx = 13 + p.dx + p.capeWave;
  const cy = 18 + p.dy;
  for (let row = 0; row < 25; row++) {
    const y = cy + row;
    if (y > 46) break;
    const t = row / 24;
    const sway = Math.round(p.capeWave * t);
    const w = 5 + Math.round(t * 6);
    const x = Math.max(2, cx - Math.round(t * 4) + sway);
    // Tattered hem on lowest rows
    if (row >= 22 && (row + Math.abs(p.capeWave)) % 2 === 0) {
      b.rect(x, y, Math.max(3, w - 3), 1, pal.capeDark);
      b.rect(x + w - 2, y, 2, 1, pal.capeMid);
    } else {
      b.rect(x, y, w, 1, pal.capeMid);
      b.rect(x, y, 2, 1, pal.capeDark);
      if (detailed && row % 4 === 0 && w >= 6) {
        c.line((x + 3) * s, y * s, (x + 5) * s, y * s, pal.violetDark);
      }
    }
  }
}

function drawLeg(b: Brush, baseX: number, [ox, oy]: [number, number], isFront: boolean, collapse: number): void {
  const { pal, detailed, c, s } = b;
  if (collapse >= 2) return;
  const lx = baseX + ox;
  if (collapse === 1) {
    // Kneeling greaves anchored at row 47
    b.rect(lx, 39, 5, 6, isFront ? pal.armorMid : pal.armorDark);
    b.rect(lx - 1, 45, 6, 2, pal.armorDark);
    b.rect(lx - 1, 47, 6, 1, pal.armorDark);
    return;
  }

  const thighY = 33 + oy;
  const shinH = 11 - oy;
  b.rect(lx, thighY, 4, Math.max(4, shinH), isFront ? pal.armorMid : pal.armorDark);
  b.rect(lx, thighY + 3, 4, 2, pal.violetDark);
  if (detailed) {
    b.rect(lx + 3, thighY, 1, Math.max(4, shinH), pal.armorLight);
    c.px((lx + 2) * s, (thighY + 3) * s, pal.violetMid);
  }
  // Armored sabaton touching row 47
  const bootY = 44;
  const bw = isFront ? 6 : 5;
  b.rect(lx, bootY, bw, 3, pal.armorDark);
  b.rect(lx, 47, bw, 1, pal.armorDark);
  if (detailed) {
    b.rect(lx + 1, bootY, bw - 2, 2, pal.armorMid);
    b.px(lx + bw - 1, bootY + 1, pal.armorLight);
  }
}

function drawTorso(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  if (p.collapse >= 2) {
    const y0 = p.collapse === 2 ? 36 : 40;
    b.rect(14, y0, 18, 46 - y0, pal.armorDark);
    b.rect(16, y0 + 1, 12, 4, pal.armorMid);
    b.rect(20, y0 + 2, 4, 2, p.collapse === 2 ? pal.violetDark : pal.armorDark);
    b.rect(14, 47, 20, 1, pal.armorDark);
    return;
  }

  const tx = 16 + p.dx;
  const ty = 18 + p.dy;

  // Pauldrons
  b.rect(tx - 2, ty, 5, 5, pal.armorMid);
  b.rect(tx + 11, ty, 5, 5, pal.armorMid);
  b.rect(tx - 2, ty, 4, 1, pal.violetMid);
  b.rect(tx + 12, ty, 4, 1, pal.violetMid);

  // Cuirass
  b.rect(tx, ty + 1, 14, 14, pal.armorDark);
  b.rect(tx + 1, ty + 2, 12, 11, pal.armorMid);
  b.rect(tx + 3, ty + 3, 8, 3, pal.violetDark);
  const sigil = p.sigilPulse ? pal.violetBright : pal.violetMid;
  b.rect(tx + 5, ty + 4, 4, 5, sigil);
  b.rect(tx + 6, ty + 6, 2, 4, sigil);

  // Belt & tassets
  b.rect(tx, ty + 14, 14, 2, pal.goldDark);
  b.rect(tx + 5, ty + 14, 4, 2, pal.goldMid);

  if (detailed) {
    b.rect(tx + 10, ty + 2, 3, 10, pal.armorLight);
    c.px((tx + 6) * s + 1, (ty + 5) * s, pal.hornLight);
    c.px((tx - 1) * s, (ty + 1) * s, pal.armorLight);
    c.px((tx + 14) * s, (ty + 1) * s, pal.armorLight);
    c.px((tx + 6) * s + 1, (ty + 14) * s, pal.goldHi);
  }
}

function drawHelm(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  if (p.collapse === 3) {
    // Fallen horned helm resting on armor pile
    b.rect(28, 40, 10, 6, pal.armorMid);
    b.rect(27, 36, 2, 5, pal.hornMid);
    b.rect(37, 37, 2, 4, pal.hornMid);
    b.rect(33, 42, 4, 1, pal.visor);
    b.rect(28, 47, 11, 1, pal.armorDark);
    return;
  }

  const hx = (p.collapse === 2 ? 25 : 18) + p.dx;
  const hy = (p.collapse === 2 ? 32 : 10 + p.dy + p.headDy);

  // Swept horns
  b.rect(hx - 1, hy - 4, 2, 5, pal.hornMid);
  b.rect(hx - 2, hy - 5, 2, 2, pal.hornLight);
  b.rect(hx + 10, hy - 4, 2, 5, pal.hornMid);
  b.rect(hx + 11, hy - 5, 2, 2, pal.hornLight);

  // Helm dome & faceguard
  b.rect(hx + 1, hy - 1, 9, 2, pal.armorMid);
  b.rect(hx, hy + 1, 11, 8, pal.armorMid);
  b.rect(hx, hy + 1, 3, 8, pal.armorDark);
  b.rect(hx + 2, hy + 7, 8, 2, pal.armorDark);

  // Crimson visor slit
  const vCol = p.collapse >= 2 ? pal.bladeDark : p.sigilPulse ? pal.visorBright : pal.visor;
  b.rect(hx + 5, hy + 4, 6, 2, vCol);

  if (detailed) {
    b.rect(hx + 7, hy + 1, 3, 3, pal.armorLight);
    c.px((hx + 9) * s, (hy + 4) * s, pal.visorBright);
    c.px((hx - 1) * s, (hy - 5) * s, pal.hornLight);
    c.px((hx + 11) * s, (hy - 5) * s, pal.hornLight);
  }
}

function drawSword(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  if (p.swordPose === "drop") {
    // Fallen greatsword lying horizontally along the floor
    const sy = p.collapse === 3 ? 44 : 42;
    b.rect(22, sy, 18, 2, pal.bladeMid);
    b.rect(24, sy, 14, 1, pal.bladeCore);
    b.rect(20, sy - 2, 2, 6, pal.goldMid);
    b.rect(17, sy, 3, 2, pal.armorDark);
    return;
  }

  if (p.swordPose === "windup") {
    // Raised diagonally back behind shoulder
    const hx = 19 + p.dx;
    const hy = 15 + p.dy;
    b.line(hx, hy, hx - 7, hy - 9, pal.bladeDark);
    b.line(hx + 1, hy, hx - 6, hy - 9, pal.bladeMid);
    b.line(hx + 1, hy - 1, hx - 5, hy - 9, pal.bladeCore);
    b.rect(hx - 2, hy - 1, 5, 2, pal.goldMid);
    b.rect(hx + 1, hy + 1, 2, 4, pal.armorDark);
    return;
  }

  if (p.swordPose === "slash") {
    // Wide forward horizontal crimson greatsword + slash arc
    const gx = 28 + p.dx;
    const gy = 22 + p.dy;
    b.rect(gx, gy - 3, 2, 8, pal.goldMid);
    b.rect(gx - 3, gy, 3, 2, pal.armorDark);
    b.rect(gx + 2, gy - 1, 11, 4, pal.bladeDark);
    b.rect(gx + 2, gy, 10, 2, pal.bladeMid);
    b.rect(gx + 3, gy, 8, 1, pal.bladeCore);
    // Crimson slash crescent arc
    b.line(gx + 5, gy - 10, gx + 12, gy - 4, pal.bladeMid);
    b.line(gx + 12, gy - 3, gx + 12, gy + 5, pal.bladeCore);
    b.line(gx + 11, gy + 6, gx + 5, gy + 10, pal.bladeMid);
    if (detailed) {
      c.line((gx + 7) * s, (gy - 9) * s, (gx + 13) * s, (gy - 2) * s, pal.bladeCore);
      c.px((gx + 1) * s, (gy - 2) * s, pal.goldHi);
    }
    return;
  }

  if (p.swordPose === "follow") {
    // Low diagonal follow-through
    const gx = 29 + p.dx;
    const gy = 25 + p.dy;
    b.rect(gx - 1, gy - 2, 4, 2, pal.goldMid);
    b.line(gx + 1, gy, gx + 12, gy + 11, pal.bladeDark);
    b.line(gx + 2, gy, gx + 13, gy + 11, pal.bladeMid);
    b.line(gx + 2, gy + 1, gx + 12, gy + 10, pal.bladeCore);
    b.line(gx + 10, gy + 4, gx + 15, gy + 9, pal.visor);
    return;
  }

  // Default upright guard stance
  const sx = 32 + p.dx;
  const sy = 10 + p.dy;
  b.rect(sx, sy, 3, 22, pal.bladeDark);
  b.rect(sx + 1, sy + 1, 2, 20, pal.bladeMid);
  b.rect(sx + 1, sy + 2, 1, 18, pal.bladeCore);
  b.rect(sx - 2, sy + 21, 7, 2, pal.goldMid);
  b.rect(sx, sy + 23, 3, 4, pal.armorDark);
  if (detailed) {
    b.px(sx + 1, sy - 1, pal.bladeCore);
    c.px((sx + 1) * s, (sy + 21) * s, pal.goldHi);
    c.px((sx - 1) * s, (sy + 21) * s, pal.goldDark);
  }
}

function drawShadowKnight(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = pose.flash ? FLASH_PALETTE : detailed ? HI16BIT_PALETTE : HI8BIT_PALETTE;
  const b = new Brush(c, s, detailed, pal);

  drawCape(b, pose);
  drawLeg(b, 17 + pose.dx, pose.legL, false, pose.collapse);
  drawLeg(b, 24 + pose.dx, pose.legR, true, pose.collapse);
  drawTorso(b, pose);
  drawHelm(b, pose);
  drawSword(b, pose);

  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "shadow_knight",
  kind: "ground",
  description: "Elite horned void-armored duelist knight with tattered purple shadow cloak and crimson greatsword.",
  hitbox: { width: 46, height: 66 },
  cellScale: 1,
  animations: {
    idle: { frames: 4, fps: 5, loop: true },
    move: { frames: 4, fps: 8, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
    attack: { frames: 4, fps: 10, loop: false },
    death: { frames: 4, fps: 7, loop: false },
  },
  draw: {
    hi8bit: (c, anim, frame) => drawShadowKnight(c, 1, false, anim, frame),
    hi16bit: (c, anim, frame) => drawShadowKnight(c, 2, true, anim, frame),
  },
});
