import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  dx: number;
  dy: number;
  headDy: number;
  slitPulse: boolean;
  gauntletL: [number, number];
  gauntletR: [number, number];
  ribbonWave: number;
  flash: boolean;
}

const REST: Pose = {
  dx: 0, dy: 0, headDy: 0, slitPulse: false,
  gauntletL: [0, 0], gauntletR: [0, 0], ribbonWave: 0, flash: false,
};

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [
    REST,
    { ...REST, dy: -1, slitPulse: true, gauntletL: [0, 1], gauntletR: [0, -1] },
  ],
  move: [
    { ...REST, dx: 1, dy: 0, ribbonWave: -2, gauntletL: [-2, 0], gauntletR: [2, 0] },
    { ...REST, dx: 1, dy: -1, ribbonWave: 0, gauntletL: [0, -1], gauntletR: [0, 1] },
    { ...REST, dx: 1, dy: 0, ribbonWave: 2, gauntletL: [2, 0], gauntletR: [-2, 0] },
    { ...REST, dx: 1, dy: 1, ribbonWave: 0, gauntletL: [0, 1], gauntletR: [0, -1] },
  ],
  hit: [
    { ...REST, dx: -2, dy: 1, headDy: 1, slitPulse: true, gauntletL: [-2, -1], gauntletR: [2, -1], ribbonWave: -1, flash: true },
    { ...REST, dx: -1, headDy: 1, gauntletL: [-1, 0], gauntletR: [1, 0] },
  ],
};

interface Palette {
  outline: string;
  marbleDark: string; marbleMid: string; marbleLight: string;
  goldDark: string; goldLight: string;
  cyanDark: string; cyanMid: string; cyanLight: string; cyanCore: string;
  crack: string;
}

const HI8BIT_PALETTE: Palette = {
  outline: "#101018",
  marbleDark: "#7880a0", marbleMid: "#b0b8cc", marbleLight: "#b0b8cc",
  goldDark: "#d0a028", goldLight: "#d0a028",
  cyanDark: "#1898c0", cyanMid: "#1898c0", cyanLight: "#d8ffff", cyanCore: "#d8ffff",
  crack: "#7880a0",
};

const HI16BIT_PALETTE: Palette = {
  outline: "#101018",
  marbleDark: "#7880a0", marbleMid: "#b0b8cc", marbleLight: "#e0e8f4",
  goldDark: "#806010", goldLight: "#d0a028",
  cyanDark: "#105878", cyanMid: "#1898c0", cyanLight: "#50d8f0", cyanCore: "#d8ffff",
  crack: "#485068",
};

const FLASH_PALETTE: Palette = {
  outline: "#101018",
  marbleDark: "#ccd4e4", marbleMid: "#e8effc", marbleLight: "#ffffff",
  goldDark: "#ffe8aa", goldLight: "#ffffff",
  cyanDark: "#a0e8ff", cyanMid: "#d8ffff", cyanLight: "#ffffff", cyanCore: "#ffffff",
  crack: "#b0b8cc",
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
    this.c.px(x * this.s, y * this.s, color);
  }
}

function drawHalo(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const hx = 24 + p.dx;
  const hy = 11 + p.dy + p.headDy;
  // Floating cracked halo ring framing head
  b.rect(hx - 2, hy - 6, 5, 1, detailed ? pal.marbleLight : pal.marbleMid);
  b.rect(hx - 4, hy - 5, 2, 1, detailed ? pal.marbleLight : pal.marbleMid);
  b.rect(hx + 3, hy - 5, 2, 1, pal.marbleMid);
  b.rect(hx - 6, hy - 4, 2, 2, pal.marbleMid);
  b.rect(hx + 5, hy - 4, 2, 2, pal.marbleMid);
  b.rect(hx - 7, hy - 2, 2, 6, pal.marbleMid);
  b.rect(hx + 6, hy - 2, 2, 6, pal.marbleMid);
  b.rect(hx - 6, hy + 4, 2, 2, pal.marbleDark);
  b.rect(hx + 5, hy + 4, 2, 2, pal.marbleDark);
  b.rect(hx - 4, hy + 6, 2, 1, pal.marbleDark);
  b.rect(hx + 3, hy + 6, 2, 1, pal.marbleDark);
  if (!detailed) return;
  c.line((hx - 5) * s, (hy - 4) * s, (hx - 4) * s, (hy - 2) * s, pal.crack);
  c.px((hx + 6) * s + 1, (hy + 1) * s, pal.crack);
}

function drawGauntlet(b: Brush, gx: number, gy: number, isFront: boolean): void {
  const { pal, c, s, detailed } = b;
  const w = isFront ? 6 : 5;
  // Flared cuff rim with gold trim
  b.rect(gx - (isFront ? 0 : 1), gy, w + 1, 1, isFront ? pal.goldLight : pal.goldDark);
  b.rect(gx, gy + 1, w, 2, pal.marbleMid);
  // Narrower wrist
  b.rect(gx + (isFront ? 0 : 1), gy + 2, w - 1, 1, pal.marbleDark);
  // Knuckle guard & fist
  b.rect(gx, gy + 3, w, 3, pal.marbleMid);
  b.rect(gx + (isFront ? 1 : 1), gy + 6, w - 2, 2, pal.marbleDark);
  if (isFront) {
    b.rect(gx + 1, gy + 3, w - 2, 1, pal.goldLight);
    b.rect(gx, gy + 4, 1, 2, pal.marbleDark); // thumb plate
  }
  if (!detailed) return;
  b.rect(gx + w - 2, gy + 1, 2, 4, pal.marbleLight);
  b.rect(gx, gy + 1, 1, 5, pal.marbleDark);
  c.line((gx + 1) * s, (gy + 4) * s, (gx + 3) * s, (gy + 5) * s, pal.crack);
  c.px((gx + 2) * s, (gy + 6) * s, pal.cyanCore);
  c.px((gx + 3) * s, (gy + 6) * s, pal.cyanLight);
}

function drawRibbon(
  b: Brush, topX: number, startY: number, midX: number, tipX: number, curlDx: number,
): void {
  const { pal, c, s, detailed } = b;
  for (let y = startY; y <= 46; y++) {
    const t = (y - startY) / (47 - startY);
    const oneMinusT = 1 - t;
    const bx = Math.round(oneMinusT * oneMinusT * topX + 2 * oneMinusT * t * midX + t * t * tipX);
    b.rect(bx, y, 2, 1, pal.cyanMid);
    if (detailed) {
      c.px(bx * s + 1, y * s, pal.cyanCore);
      c.px(bx * s + 1, y * s + 1, pal.cyanCore);
      c.px(bx * s, y * s, pal.cyanDark);
      c.px((bx + 1) * s + 1, y * s + 1, pal.cyanLight);
    }
  }
  const leftX = Math.min(tipX, tipX + curlDx);
  const w = Math.abs(curlDx) + 2;
  b.rect(leftX, 47, w, 1, pal.cyanMid);
  b.rect(leftX + (curlDx < 0 ? 0 : 1), 46, w - 1, 1, pal.cyanMid);
  if (!detailed) return;
  b.rect(leftX + 1, 47, Math.max(1, w - 2), 1, pal.cyanCore);
  c.px((tipX + curlDx) * s, 47 * s + 1, pal.cyanLight);
}

function drawRibbons(b: Brush, p: Pose): void {
  const sy = 28 + p.dy;
  drawRibbon(b, 21 + p.dx, sy, 16 + Math.round(p.ribbonWave * 1.5), 14, -2);
  drawRibbon(b, 23 + p.dx, sy, 20 - p.ribbonWave, 19, -1);
  drawRibbon(b, 24 + p.dx, sy, 27 + p.ribbonWave, 27, 1);
  drawRibbon(b, 26 + p.dx, sy, 31 - Math.round(p.ribbonWave * 1.5), 32, 2);
}

function drawTorso(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const tx = 19 + p.dx;
  const ty = 17 + p.dy;
  // Gorget
  b.rect(tx + 2, ty, 5, 2, pal.marbleMid);
  // Sculpted curved pauldrons
  b.rect(tx - 2, ty + 1, 4, 2, pal.marbleMid);
  b.rect(tx - 1, ty + 3, 3, 1, pal.marbleMid);
  b.rect(tx + 7, ty + 1, 4, 2, pal.marbleMid);
  b.rect(tx + 7, ty + 3, 3, 1, pal.marbleMid);
  b.rect(tx - 2, ty + 1, 4, 1, pal.goldDark);
  b.rect(tx + 7, ty + 1, 4, 1, pal.goldLight);
  // Cuirass
  b.rect(tx, ty + 2, 9, 6, pal.marbleMid);
  b.rect(tx, ty + 2, 2, 6, pal.marbleDark);
  b.rect(tx + 7, ty + 2, 2, 6, pal.marbleLight);
  // Gold Inlays
  b.rect(tx + 5, ty + 2, 1, 8, pal.goldLight);
  b.rect(tx + 3, ty + 1, 3, 1, pal.goldLight);
  b.rect(tx + 3, ty + 5, 4, 1, pal.goldLight);
  // Broken waist fracture
  b.rect(tx + 1, ty + 7, 7, 4, pal.marbleMid);
  b.rect(tx + 1, ty + 7, 1, 4, pal.marbleDark);
  b.rect(tx + 6, ty + 7, 2, 4, pal.marbleLight);
  // Jagged fracture teeth
  b.rect(tx + 1, ty + 11, 2, 2, pal.marbleDark);
  b.rect(tx + 3, ty + 11, 1, 1, pal.marbleMid);
  b.rect(tx + 4, ty + 11, 2, 2, pal.marbleDark);
  b.rect(tx + 6, ty + 11, 1, 1, pal.marbleLight);
  // Liquid Aether glowing in the fracture recess
  b.rect(tx + 3, ty + 10, 3, 1, pal.cyanLight);
  if (!detailed) return;
  b.rect(tx + 4, ty + 2, 1, 8, pal.goldDark);
  c.line((tx + 2) * s, (ty + 4) * s, (tx + 4) * s, (ty + 6) * s, pal.crack);
  c.line((tx + 5) * s, (ty + 8) * s, (tx + 7) * s, (ty + 10) * s, pal.crack);
  c.line((tx + 1) * s, (ty + 11) * s, (tx + 6) * s, (ty + 12) * s, pal.crack);
  c.px((tx + 4) * s, (ty + 10) * s, pal.cyanCore);
}

function drawHead(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const hx = 21 + p.dx;
  const hy = 8 + p.dy + p.headDy;
  // Faceless oval helm with smooth curve
  b.rect(hx + 2, hy, 4, 1, pal.marbleMid);
  b.rect(hx + 1, hy + 1, 6, 1, pal.marbleMid);
  b.rect(hx, hy + 2, 8, 6, pal.marbleMid);
  b.rect(hx + 1, hy + 8, 6, 1, pal.marbleMid);
  b.rect(hx + 2, hy + 9, 4, 1, pal.marbleMid);
  b.rect(hx, hy + 2, 2, 6, pal.marbleDark);
  b.rect(hx + 6, hy + 2, 2, 6, pal.marbleLight);
  // Glowing vertical slit facing right
  const slitColor = p.slitPulse ? pal.cyanCore : pal.cyanLight;
  b.rect(hx + 5, hy + 3, 1, 4, slitColor);
  if (!detailed) return;
  b.rect(hx + 4, hy + 1, 2, 1, pal.marbleLight);
  c.px((hx + 5) * s, (hy + 1) * s, "#ffffff");
  c.line((hx + 1) * s, (hy + 3) * s, (hx + 2) * s, (hy + 6) * s, pal.crack);
  c.px((hx + 5) * s, (hy + 4) * s, pal.cyanCore);
  c.px((hx + 5) * s, (hy + 5) * s, pal.cyanCore);
  c.px((hx + 5) * s - 1, (hy + 4) * s, pal.cyanMid);
  c.px((hx + 5) * s + 2, (hy + 4) * s, pal.cyanMid);
}

function drawAetherSentinel(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = pose.flash ? FLASH_PALETTE : detailed ? HI16BIT_PALETTE : HI8BIT_PALETTE;
  const b = new Brush(c, s, detailed, pal);

  drawHalo(b, pose);
  drawGauntlet(b, 12 + pose.dx + pose.gauntletL[0], 21 + pose.dy + pose.gauntletL[1], false);
  drawRibbons(b, pose);
  drawTorso(b, pose);
  drawHead(b, pose);
  drawGauntlet(b, 31 + pose.dx + pose.gauntletR[0], 22 + pose.dy + pose.gauntletR[1], true);

  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "aether_sentinel",
  kind: "ground",
  description: "A marble knight statue animated by wild Aether, hovering on flowing ribbons of light.",
  hitbox: { width: 45, height: 65 },
  cellScale: 1,
  animations: {
    idle: { frames: 2, fps: 4, loop: true },
    move: { frames: 4, fps: 8, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
  },
  draw: {
    hi8bit: (c, anim, frame) => drawAetherSentinel(c, 1, false, anim, frame),
    hi16bit: (c, anim, frame) => drawAetherSentinel(c, 2, true, anim, frame),
  },
});
