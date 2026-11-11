import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  dx: number; dy: number; tailWave: number; shardAngle: number;
  shardDist: number; corePulse: number; squashX: number; squashY: number; flash: boolean;
}

const BASE_ANGLE = Math.PI / 6;
const REST: Pose = {
  dx: 0, dy: 0, tailWave: 0, shardAngle: BASE_ANGLE,
  shardDist: 0, corePulse: 0, squashX: 0, squashY: 0, flash: false,
};

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [REST, { ...REST, dy: -1, corePulse: 1 }],
  move: [
    { ...REST, tailWave: 0, shardAngle: BASE_ANGLE },
    { ...REST, dy: -1, tailWave: -1, shardAngle: BASE_ANGLE + Math.PI / 8 },
    { ...REST, dy: 0, tailWave: 0, shardAngle: BASE_ANGLE + (2 * Math.PI) / 8 },
    { ...REST, dy: 1, tailWave: 1, shardAngle: BASE_ANGLE + (3 * Math.PI) / 8 },
  ],
  hit: [
    { ...REST, dx: -2, shardDist: 2, squashX: 1, squashY: -2, tailWave: 1, flash: true },
    { ...REST, dx: -1, shardDist: 1, squashX: 0, squashY: -1, tailWave: 0 },
  ],
};

interface Palette {
  outline: string; rimDark: string; rimMid: string; glowDark: string; glowMid: string;
  glowLight: string; core: string; shardDark: string; shardBase: string; shardLight: string;
  eye: string; sparkle: string;
}

const NES_PALETTE: Palette = {
  outline: "#100820", rimDark: "#302068", rimMid: "#302068", glowDark: "#4878e0", glowMid: "#68c8f8",
  glowLight: "#68c8f8", core: "#f8ffff", shardDark: "#78e0d0", shardBase: "#78e0d0", shardLight: "#d0fff0",
  eye: "#201040", sparkle: "#f8ffff",
};

const SNES_PALETTE: Palette = {
  outline: "#100820", rimDark: "#302068", rimMid: "#5038a8", glowDark: "#4878e0", glowMid: "#68c8f8",
  glowLight: "#b8f0ff", core: "#f8ffff", shardDark: "#389898", shardBase: "#78e0d0", shardLight: "#d0fff0",
  eye: "#201040", sparkle: "#ffffff",
};

const FLASH_PALETTE: Palette = {
  outline: "#100820", rimDark: "#7080b0", rimMid: "#98a8d8", glowDark: "#b8d0f8", glowMid: "#e0f0ff",
  glowLight: "#f0f8ff", core: "#ffffff", shardDark: "#d0f8f0", shardBase: "#e8ffff", shardLight: "#ffffff",
  eye: "#403060", sparkle: "#ffffff",
};

class Brush {
  constructor(
    readonly c: PixelCanvas,
    readonly s: number,
    readonly detailed: boolean,
    readonly pal: Palette,
  ) {}
}

function drawTail(b: Brush, p: Pose, cx: number, cy: number): void {
  const { c, s, pal, detailed } = b;
  const wy = p.tailWave;

  if (!detailed) {
    const tx = cx - 16;
    const ty = cy + wy;
    c.polygon([[tx, ty], [cx - 11, cy - 4 + wy], [cx - 6, cy - 6], [cx - 4, cy], [cx - 6, cy + 6], [cx - 11, cy + 3 + wy]], pal.glowDark);
    c.polygon([[tx + 4, ty], [cx - 10, cy - 2 + wy], [cx - 5, cy - 2], [cx - 4, cy], [cx - 5, cy + 2], [cx - 10, cy + 1 + wy]], pal.glowMid);
    c.line(tx + 7, ty, cx - 4, cy, pal.core);
  } else {
    const scx = cx * s;
    const scy = cy * s;
    const swy = wy * s;
    const stx = scx - 32;
    const sty = scy + swy;

    c.polygon([[stx, sty], [scx - 22, scy - 8 + swy], [scx - 12, scy - 12], [scx - 8, scy], [scx - 12, scy + 12], [scx - 22, scy + 7 + swy]], pal.rimMid);
    c.polygon([[stx + 4, sty], [scx - 20, scy - 5 + swy], [scx - 10, scy - 8], [scx - 7, scy], [scx - 10, scy + 8], [scx - 20, scy + 5 + swy]], pal.glowDark);
    c.polygon([[stx + 8, sty], [scx - 18, scy - 3 + swy], [scx - 8, scy - 4], [scx - 6, scy], [scx - 8, scy + 4], [scx - 18, scy + 3 + swy]], pal.glowMid);
    c.polygon([[stx + 14, sty], [scx - 14, scy - 1 + swy], [scx - 6, scy - 1], [scx - 6, scy + 1], [scx - 14, scy + 1 + swy]], pal.glowLight);
    c.line(stx + 18, sty, scx - 6, scy, pal.core);

    c.line(stx, sty, stx - 3, sty - 1, pal.glowDark);
    c.line(stx + 3, sty + 2, stx - 1, sty + 3, pal.glowMid);
    c.px(stx + 6, sty - 4, pal.sparkle);
    c.px(stx + 12, sty + 5, pal.sparkle);
    c.px(stx + 18, sty - 3, pal.sparkle);
  }
}

function drawOrb(b: Brush, p: Pose, cx: number, cy: number): void {
  const { c, s, pal, detailed } = b;
  const pulse = p.corePulse;
  const sx = p.squashX;
  const sy = p.squashY;

  if (!detailed) {
    c.ellipse(cx, cy, 8 + sx, 8 + sy, pal.rimDark);
    c.ellipse(cx, cy, 6 + sx, 6 + sy, pal.glowDark);
    c.ellipse(cx, cy, 4 + pulse, 4 + pulse, pal.glowMid);
    c.ellipse(cx, cy, 2 + pulse, 2 + pulse, pal.core);
  } else {
    const scx = cx * s;
    const scy = cy * s;
    c.ellipse(scx, scy, 16 + sx * 2, 16 + sy * 2, pal.rimDark);
    c.ellipse(scx, scy, 14 + sx * 2, 14 + sy * 2, pal.rimMid);
    c.ellipse(scx, scy, 11 + sx * 2, 11 + sy * 2, pal.glowDark);
    c.ellipse(scx, scy, 8 + pulse * 2, 8 + pulse * 2, pal.glowMid);
    c.ellipse(scx, scy, 5 + pulse * 2, 5 + pulse * 2, pal.glowLight);
    c.ellipse(scx, scy, 3 + pulse, 3 + pulse, pal.core);
    c.px(scx, scy, pal.sparkle);
    c.px(scx + 1, scy, pal.sparkle);
    c.px(scx - 4, scy - 4, pal.sparkle);
    c.px(scx - 5, scy + 3, pal.sparkle);
  }
}

function drawEyes(b: Brush, p: Pose, cx: number, cy: number): void {
  const { c, s, pal, detailed } = b;
  if (!detailed) {
    c.px(cx + 1, cy - 2, pal.eye);
    c.px(cx + 2, cy - 1, pal.eye);
    c.px(cx + 4, cy - 2, pal.eye);
    c.px(cx + 5, cy - 1, pal.eye);
  } else {
    const scx = cx * s;
    const scy = cy * s;
    c.line(scx + 2, scy - 4, scx + 5, scy - 1, pal.eye);
    c.line(scx + 3, scy - 4, scx + 6, scy - 1, pal.eye);
    c.line(scx + 8, scy - 4, scx + 11, scy - 1, pal.eye);
    c.line(scx + 9, scy - 4, scx + 12, scy - 1, pal.eye);
  }
}

function drawShards(b: Brush, p: Pose, cx: number, cy: number): void {
  const { c, s, pal, detailed } = b;
  const count = 4;
  const dist = p.shardDist;

  for (let i = 0; i < count; i++) {
    const theta = p.shardAngle + (i * Math.PI) / 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const tx = -sin;
    const ty = cos;
    const nx = cos;
    const ny = sin;

    if (!detailed) {
      const rOrbit = 16 + dist;
      const sx = cx + Math.round(rOrbit * cos);
      const sy = cy + Math.round(rOrbit * sin);
      const tip: [number, number] = [Math.round(sx + tx * 4), Math.round(sy + ty * 4)];
      const base: [number, number] = [Math.round(sx - tx * 4), Math.round(sy - ty * 4)];
      const outer: [number, number] = [Math.round(sx + nx * 1.5), Math.round(sy + ny * 1.5)];
      const inner: [number, number] = [Math.round(sx - nx * 1.5), Math.round(sy - ny * 1.5)];

      c.polygon([tip, outer, base, inner], pal.shardBase);
      c.line(tip[0], tip[1], inner[0], inner[1], pal.shardLight);
    } else {
      const rOrbit = 32 + dist * 2;
      const sx = cx * s + Math.round(rOrbit * cos);
      const sy = cy * s + Math.round(rOrbit * sin);
      const tip: [number, number] = [Math.round(sx + tx * 7), Math.round(sy + ty * 7)];
      const base: [number, number] = [Math.round(sx - tx * 7), Math.round(sy - ty * 7)];
      const outer: [number, number] = [Math.round(sx + nx * 2.5), Math.round(sy + ny * 2.5)];
      const inner: [number, number] = [Math.round(sx - nx * 2.5), Math.round(sy - ny * 2.5)];

      c.polygon([tip, inner, base], pal.shardLight);
      c.polygon([tip, outer, base], pal.shardDark);
      c.line(tip[0], tip[1], base[0], base[1], pal.shardBase);
      c.px(tip[0], tip[1], pal.sparkle);
    }
  }
}

function drawWisp(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = pose.flash ? FLASH_PALETTE : detailed ? SNES_PALETTE : NES_PALETTE;
  const b = new Brush(c, s, detailed, pal);
  const cx = 24 + pose.dx;
  const cy = 24 + pose.dy;

  drawTail(b, pose, cx, cy);
  drawOrb(b, pose, cx, cy);
  drawEyes(b, pose, cx, cy);
  drawShards(b, pose, cx, cy);

  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "aether_wisp",
  kind: "aerial",
  description: "A floating spirit of unstable starlight encircled by orbiting crystal shards.",
  hitbox: { width: 36, height: 36 },
  cellScale: 1,
  animations: {
    idle: { frames: 2, fps: 4, loop: true },
    move: { frames: 4, fps: 8, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
  },
  draw: {
    nes: (c, anim, frame) => drawWisp(c, 1, false, anim, frame),
    snes: (c, anim, frame) => drawWisp(c, 2, true, anim, frame),
  },
});
