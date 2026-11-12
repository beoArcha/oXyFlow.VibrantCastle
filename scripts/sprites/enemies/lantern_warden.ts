import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  dx: number;
  dy: number;
  tilt: number;
  chainDx: [number, number, number];
  glow: "bright" | "dim";
  eyeShut: boolean;
  flash: boolean;
}

const REST: Pose = {
  dx: 0, dy: 0, tilt: 0, chainDx: [0, 0, 0], glow: "bright", eyeShut: false, flash: false,
};

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [REST, { ...REST, dy: -1, glow: "dim" }],
  move: [
    { ...REST, tilt: 1, chainDx: [-1, -1, -2], glow: "bright" },
    { ...REST, dy: -1, tilt: 0, chainDx: [0, 0, 0], glow: "dim" },
    { ...REST, tilt: -1, chainDx: [1, 2, 1], glow: "bright" },
    { ...REST, dy: 1, tilt: 0, chainDx: [0, 0, 0], glow: "dim" },
  ],
  hit: [
    { ...REST, dx: -2, dy: 1, tilt: -1, chainDx: [2, 2, 2], eyeShut: true, flash: true },
    { ...REST, dx: -1, dy: 0, tilt: 0, chainDx: [1, 1, 1], eyeShut: false, glow: "dim" },
  ],
};

interface Palette {
  outline: string;
  brassDark: string; brassMid: string; brassLight: string; brassHi: string;
  glassDark: string; glassLight: string; glassReflect: string;
  emberDark: string; emberMid: string; emberCore: string;
  pupil: string;
}

const HI8BIT_PALETTE: Palette = {
  outline: "#140c08",
  brassDark: "#a06c1c", brassMid: "#a06c1c", brassLight: "#d8a030", brassHi: "#d8a030",
  glassDark: "#10282c", glassLight: "#10282c", glassReflect: "#10282c",
  emberDark: "#f06010", emberMid: "#f06010", emberCore: "#fff0a0",
  pupil: "#140c08",
};

const HI16BIT_PALETTE: Palette = {
  outline: "#140c08",
  brassDark: "#5c3810", brassMid: "#a06c1c", brassLight: "#d8a030", brassHi: "#f8dc80",
  glassDark: "#10282c", glassLight: "#1c444c", glassReflect: "#2d6872",
  emberDark: "#a02808", emberMid: "#f06010", emberCore: "#fff0a0",
  pupil: "#1c0804",
};

const FLASH_PALETTE: Palette = {
  outline: "#140c08",
  brassDark: "#a8b8c8", brassMid: "#d8e4f0", brassLight: "#ffffff", brassHi: "#ffffff",
  glassDark: "#607484", glassLight: "#94a8b8", glassReflect: "#ffffff",
  emberDark: "#ffffff", emberMid: "#ffffff", emberCore: "#ffffff",
  pupil: "#24303c",
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

function drawHandle(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const tx = 24 + p.dx + p.tilt, ty = 6 + p.dy;
  b.rect(tx - 3, ty, 6, 1, pal.brassLight);
  b.rect(tx - 2, ty + 3, 4, 1, pal.brassDark);
  b.rect(tx - 3, ty + 1, 2, 2, pal.brassMid);
  b.rect(tx + 1, ty + 1, 2, 2, pal.brassLight);
  if (detailed) {
    c.px((tx + 1) * s, ty * s, pal.brassHi);
    c.px((tx + 2) * s, (ty + 1) * s, pal.brassHi);
    c.px((tx - 2) * s, (ty + 2) * s, pal.brassDark);
  }
}

function drawRoof(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const tx = 24 + p.dx + p.tilt, lx = 24 + p.dx, y = 10 + p.dy;
  b.rect(tx - 2, y, 4, 1, pal.brassMid);
  b.rect(tx - 4, y + 1, 8, 1, pal.brassMid);
  b.rect(lx - 7, y + 2, 14, 1, pal.brassMid);
  b.rect(lx - 10, y + 3, 20, 1, pal.brassMid);
  b.rect(lx - 13, y + 4, 26, 1, pal.brassLight);
  if (!detailed) return;
  b.rect(lx - 7, y + 2, 3, 1, pal.brassDark);
  b.rect(lx - 10, y + 3, 4, 1, pal.brassDark);
  b.rect(lx - 13, y + 4, 4, 1, pal.brassDark);
  b.rect(lx + 4, y + 2, 3, 1, pal.brassLight);
  b.rect(lx + 6, y + 3, 4, 1, pal.brassLight);
  b.rect(lx + 8, y + 4, 5, 1, pal.brassHi);
  c.line(tx * s, y * s, lx * s, (y + 4) * s, pal.brassHi);
  c.px((lx - 9) * s, (y + 4) * s, pal.brassHi); c.px((lx - 3) * s, (y + 4) * s, pal.brassHi);
  c.px((lx + 3) * s, (y + 4) * s, pal.brassHi); c.px((lx + 9) * s, (y + 4) * s, pal.brassHi);
}

function drawCageAndGlass(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const lx = 24 + p.dx, y = 15 + p.dy;
  b.rect(lx - 11, y, 22, 1, pal.brassDark);
  b.rect(lx - 9, y + 1, 3, 13, pal.glassDark);
  b.rect(lx - 4, y + 1, 9, 13, pal.glassDark);
  b.rect(lx + 7, y + 1, 2, 13, detailed ? pal.glassLight : pal.glassDark);

  if (detailed) {
    c.line((lx - 8) * s, (y + 3) * s, (lx - 7) * s, (y + 8) * s, pal.glassReflect);
    c.line((lx - 3) * s, (y + 2) * s, (lx + 3) * s, (y + 12) * s, pal.glassReflect);
    c.line((lx - 2) * s, (y + 2) * s, (lx + 4) * s, (y + 12) * s, pal.glassReflect);
    c.line((lx + 7) * s, (y + 4) * s, (lx + 8) * s, (y + 7) * s, pal.glassReflect);
  }

  b.rect(lx - 11, y + 1, 2, 13, pal.brassDark); b.rect(lx - 6, y + 1, 2, 13, pal.brassMid);
  b.rect(lx + 5, y + 1, 2, 13, pal.brassLight); b.rect(lx + 9, y + 1, 2, 13, pal.brassMid);
  if (detailed) {
    c.line((lx - 5) * s + 1, (y + 1) * s, (lx - 5) * s + 1, (y + 13) * s, pal.brassLight);
    c.line((lx + 6) * s + 1, (y + 1) * s, (lx + 6) * s + 1, (y + 13) * s, pal.brassHi);
  }
  b.rect(lx - 11, y + 14, 22, 1, pal.brassDark);
}

function drawEye(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const ex = 24 + p.dx + 1, ey = 22 + p.dy;

  if (p.eyeShut) {
    b.rect(ex - 3, ey, 6, 1, pal.pupil);
    b.rect(ex - 2, ey - 1, 4, 1, pal.emberDark);
    b.rect(ex - 2, ey + 1, 4, 1, pal.emberDark);
    return;
  }

  if (!detailed) {
    b.rect(ex - 2, ey - 3, 4, 7, pal.emberMid);
    b.rect(ex - 3, ey - 2, 6, 5, pal.emberMid);
    const coreW = p.glow === "bright" ? 4 : 2;
    b.rect(ex - 1, ey - 1, coreW, coreW > 2 ? 3 : 2, pal.emberCore);
    b.rect(ex + 1, ey - 2, 1, 5, pal.pupil);
    return;
  }

  const ecx = ex * s, ecy = ey * s;
  c.ellipse(ecx, ecy, 7, 6, pal.emberDark);
  c.ellipse(ecx, ecy, 5, 4, pal.emberMid);
  const coreR = p.glow === "bright" ? 3 : 2;
  c.ellipse(ecx + 1, ecy, coreR, coreR, pal.emberCore);
  c.line(ecx + 2, ecy - 4, ecx + 2, ecy + 4, pal.pupil);
  c.line(ecx + 3, ecy - 3, ecx + 3, ecy + 3, pal.pupil);
  c.px(ecx + 1, ecy - 2, "#ffffff");
}

function drawBase(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const lx = 24 + p.dx, y = 30 + p.dy;

  b.rect(lx - 11, y, 22, 1, pal.brassLight); b.rect(lx - 9, y + 1, 18, 1, pal.brassMid);
  b.rect(lx - 7, y + 2, 14, 1, pal.brassDark); b.rect(lx - 5, y + 3, 10, 1, pal.brassMid);
  b.rect(lx - 2, y + 3, 4, 1, pal.emberMid);

  if (detailed) {
    b.rect(lx - 11, y, 3, 1, pal.brassDark); b.rect(lx + 7, y, 4, 1, pal.brassHi);
    c.px((lx - 6) * s, (y + 1) * s, pal.brassHi); c.px((lx + 6) * s, (y + 1) * s, pal.brassHi);
    c.px(lx * s, (y + 3) * s, pal.emberCore); c.px(lx * s + 1, (y + 3) * s, pal.emberCore);
  }
}

function drawChains(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const lx = 24 + p.dx, y = 34 + p.dy, [cdxL, cdxM, cdxR] = p.chainDx;

  const lx1 = lx - 6 + Math.round(cdxL * 0.4), lx2 = lx - 6 + cdxL;
  b.rect(lx1, y, 1, 2, pal.brassDark); b.rect(lx2, y + 2, 1, 2, pal.brassDark); b.rect(lx2 - 1, y + 4, 2, 2, pal.brassMid);

  const rx1 = lx + 6 + Math.round(cdxR * 0.4), rx2 = lx + 6 + cdxR;
  b.rect(rx1, y, 1, 2, pal.brassDark); b.rect(rx2, y + 2, 1, 2, pal.brassDark); b.rect(rx2, y + 4, 2, 2, pal.brassMid);

  const mx1 = lx + Math.round(cdxM * 0.3), mx2 = lx + Math.round(cdxM * 0.7), mx3 = lx + cdxM;
  b.rect(mx1, y, 1, 2, pal.brassDark); b.rect(mx2, y + 2, 1, 2, pal.brassDark);
  b.rect(mx3, y + 4, 1, 2, pal.brassDark); b.rect(mx3 - 1, y + 6, 3, 2, pal.brassLight);

  if (detailed) {
    c.px(lx2 * s, (y + 4) * s, pal.brassHi); c.px((rx2 + 1) * s, (y + 4) * s, pal.brassHi);
    c.px(mx3 * s, (y + 6) * s, pal.brassHi); c.px((mx3 + 1) * s, (y + 6) * s, pal.brassHi);
    c.px((mx3 - 1) * s, (y + 7) * s, pal.brassDark);
  }
}

function drawLantern(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = pose.flash ? FLASH_PALETTE : detailed ? HI16BIT_PALETTE : HI8BIT_PALETTE;
  const b = new Brush(c, s, detailed, pal);
  drawHandle(b, pose);
  drawRoof(b, pose);
  drawCageAndGlass(b, pose);
  drawEye(b, pose);
  drawBase(b, pose);
  drawChains(b, pose);
  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "lantern_warden",
  kind: "aerial",
  description: "A floating gothic brass lantern with a glowing ember eye watching corridors.",
  hitbox: { width: 30, height: 40 },
  cellScale: 1,
  animations: {
    idle: { frames: 2, fps: 3, loop: true },
    move: { frames: 4, fps: 6, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
  },
  draw: {
    hi8bit: (c, anim, frame) => drawLantern(c, 1, false, anim, frame),
    hi16bit: (c, anim, frame) => drawLantern(c, 2, true, anim, frame),
  },
});
