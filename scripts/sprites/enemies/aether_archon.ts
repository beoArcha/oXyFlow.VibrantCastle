import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  dx: number;
  dy: number;
  stonePhase: number;
  stoneOutward: number;
  robeWave: number;
  spearTilt: number;
  diamondPulse: boolean;
  flash: boolean;
}

const R: Pose = { dx: 0, dy: 0, stonePhase: 0, stoneOutward: 0, robeWave: 0, spearTilt: 0, diamondPulse: false, flash: false };
const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [R, { ...R, dy: -1, robeWave: 1, diamondPulse: true }],
  move: [
    { ...R, robeWave: -1 },
    { ...R, dy: -1, stonePhase: 1, spearTilt: 1, diamondPulse: true },
    { ...R, stonePhase: 2, robeWave: 1 },
    { ...R, dy: 1, stonePhase: 3, spearTilt: -1 },
  ],
  hit: [
    { ...R, dx: -3, stoneOutward: 3, robeWave: -2, spearTilt: -1, diamondPulse: true, flash: true },
    { ...R, dx: -1, stoneOutward: 1, robeWave: -1 },
  ],
};

interface Palette {
  outline: string;
  marbleDark: string; marbleMid: string; marbleLight: string;
  goldDark: string; goldMid: string; goldLight: string;
  cyanDark: string; cyanMid: string; cyanLight: string; cyanCore: string;
  slateDark: string; slateMid: string; slateLight: string;
}

const NES_PALETTE: Palette = {
  outline: "#101018", marbleDark: "#b8c0d0", marbleMid: "#b8c0d0", marbleLight: "#b8c0d0",
  goldDark: "#d09820", goldMid: "#d09820", goldLight: "#d09820",
  cyanDark: "#20b0d0", cyanMid: "#20b0d0", cyanLight: "#20b0d0", cyanCore: "#e0ffff",
  slateDark: "#384050", slateMid: "#384050", slateLight: "#384050",
};

const SNES_PALETTE: Palette = {
  outline: "#101018", marbleDark: "#8088a0", marbleMid: "#b8c0d0", marbleLight: "#e8f0f8",
  goldDark: "#805810", goldMid: "#d09820", goldLight: "#f8e070",
  cyanDark: "#106888", cyanMid: "#20b0d0", cyanLight: "#70e8f8", cyanCore: "#e0ffff",
  slateDark: "#282c3c", slateMid: "#40485c", slateLight: "#68748c",
};

const FLASH_PALETTE: Palette = {
  outline: "#101018", marbleDark: "#c8d0e0", marbleMid: "#e8f0f8", marbleLight: "#ffffff",
  goldDark: "#d0b860", goldMid: "#f8e890", goldLight: "#ffffff",
  cyanDark: "#70d0e8", cyanMid: "#b0f0ff", cyanLight: "#e0ffff", cyanCore: "#ffffff",
  slateDark: "#707890", slateMid: "#a0a8c0", slateLight: "#e0e8f8",
};

class Brush {
  constructor(readonly c: PixelCanvas, readonly s: number, readonly detailed: boolean, readonly pal: Palette) {}
  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.c.rect(x * this.s, y * this.s, w * this.s, h * this.s, color);
  }
  pixel(x: number, y: number, color: string): void {
    this.c.rect(x * this.s, y * this.s, this.s, this.s, color);
  }
  line(x0: number, y0: number, x1: number, y1: number, color: string): void {
    this.c.line(x0 * this.s, y0 * this.s, x1 * this.s, y1 * this.s, color);
  }
}

function drawStones(b: Brush, p: Pose, inFront: boolean): void {
  const { pal, detailed, c, s } = b;
  const cx = 36 + p.dx, cy = 28 + p.dy;
  const rx = 22 + p.stoneOutward, ry = 7 + p.stoneOutward * 0.4;
  const baseAngle = p.stonePhase * (Math.PI / 10);

  for (let i = 0; i < 5; i++) {
    const angle = baseAngle + i * ((Math.PI * 2) / 5);
    const sinA = Math.sin(angle);
    if (inFront ? sinA < -0.05 : sinA >= -0.05) continue;

    const sx = Math.round(cx + rx * Math.cos(angle));
    const sy = Math.round(cy + ry * sinA);

    b.rect(sx - 1, sy - 2, 3, 5, pal.slateDark);
    b.rect(sx - 2, sy - 1, 5, 3, pal.slateDark);
    b.rect(sx - 1, sy - 1, 3, 3, pal.slateMid);
    b.pixel(sx, sy, pal.cyanCore);

    if (detailed) {
      b.pixel(sx - 1, sy - 2, pal.slateLight);
      b.pixel(sx - 2, sy - 1, pal.slateLight);
      b.pixel(sx + 1, sy + 2, pal.slateDark);
      b.pixel(sx + 2, sy + 1, pal.slateDark);
      // Detailed rune glyph
      const kx = sx * s, ky = sy * s;
      c.polygon([[kx, ky - 3], [kx + 3, ky], [kx, ky + 3], [kx - 3, ky]], pal.cyanMid);
      c.rect(kx - 1, ky - 1, 2, 2, pal.cyanCore);
    }
  }
}

function drawRobe(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const cx = 36 + p.dx;

  for (let y = 27; y <= 65; y++) {
    const t = (y - 27) / 38;
    const w = Math.max(1, Math.round(9 * (1 - t * 0.9)));
    const sway = Math.round(p.robeWave * (t * t * 4));
    const rx = cx + sway - Math.floor(w / 2);

    let bodyCol = pal.cyanMid;
    if (detailed) {
      bodyCol = y < 38 ? pal.cyanMid : y < 50 ? pal.cyanLight : pal.cyanCore;
    }
    b.rect(rx, y, w, 1, bodyCol);

    if (detailed) {
      if (y < 38 && w >= 4) {
        b.pixel(rx, y, pal.cyanDark);
        b.pixel(rx + w - 1, y, pal.cyanDark);
      }
      const coreX = rx + Math.floor(w / 2);
      if (y < 50) {
        if (w >= 5) {
          b.pixel(coreX - 1, y, pal.cyanLight);
          b.pixel(coreX + 1, y, pal.cyanLight);
        }
        b.pixel(coreX, y, pal.cyanCore);
      }
    } else if (y >= 30 && y <= 55) {
      b.pixel(rx + Math.floor(w / 2), y, pal.cyanCore);
    }
  }

  if (detailed) {
    const wy = 40 + p.dy;
    b.line(cx - 5 + p.robeWave, wy, cx - 8 + p.robeWave * 2, wy + 3, pal.cyanMid);
    b.pixel(cx - 9 + p.robeWave * 2, wy + 4, pal.cyanDark);
  }
}

function drawTorso(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  const cx = 36 + p.dx, cy = 16 + p.dy;

  // Rear broad pauldron
  b.rect(cx - 8, cy, 6, 4, pal.marbleMid);
  b.rect(cx - 8, cy, 6, 1, pal.goldMid);
  b.rect(cx - 8, cy + 1, 2, 3, pal.marbleDark);

  // Cuirass & gold trim
  b.rect(cx - 4, cy + 1, 8, 8, pal.marbleMid);
  b.rect(cx - 4, cy + 2, 2, 6, pal.marbleDark);
  b.rect(cx + 2, cy + 2, 2, 6, pal.marbleLight);
  b.rect(cx - 2, cy + 1, 5, 1, pal.goldMid);
  b.rect(cx - 3, cy + 7, 6, 1, pal.goldMid);
  b.rect(cx - 3, cy + 9, 6, 2, pal.goldMid);
  b.pixel(cx - 1, cy + 9, pal.goldLight);

  // Front broad pauldron
  b.rect(cx + 2, cy - 1, 6, 4, pal.marbleMid);
  b.rect(cx + 2, cy - 1, 6, 1, pal.marbleLight);
  b.rect(cx + 3, cy + 2, 6, 2, pal.goldMid);
  b.rect(cx + 4, cy + 3, 5, 1, pal.goldDark);
  if (detailed) {
    b.pixel(cx + 3, cy, pal.marbleLight);
    b.pixel(cx + 4, cy + 2, pal.goldLight);
    b.pixel(cx + 7, cy + 2, pal.goldLight);
  }

  // Chest diamond
  const gx = cx - 1, gy = cy + 4;
  b.pixel(gx, gy - 1, pal.cyanMid);
  b.pixel(gx - 1, gy, pal.cyanMid);
  b.pixel(gx, gy, pal.cyanCore);
  b.pixel(gx + 1, gy, pal.cyanMid);
  b.pixel(gx, gy + 1, pal.cyanMid);

  if (detailed) {
    const sx = gx * s, sy = gy * s, r = p.diamondPulse ? 6 : 4;
    c.polygon([[sx, sy - r], [sx + r, sy], [sx, sy + r], [sx - r, sy]], pal.cyanDark);
    c.polygon([[sx, sy - (r - 2)], [sx + (r - 2), sy], [sx, sy + (r - 2)], [sx - (r - 2), sy]], pal.cyanLight);
    c.rect(sx - 1, sy - 1, 2, 2, pal.cyanCore);
  }
}

function drawHead(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  const hx = 36 + p.dx, hy = 7 + p.dy;

  // Crown crest atop helm
  b.rect(hx - 3, hy + 2, 6, 1, pal.goldMid);
  b.pixel(hx - 2, hy + 1, pal.goldMid);
  b.rect(hx, hy, 1, 2, pal.goldLight);
  b.pixel(hx + 2, hy + 1, pal.goldLight);

  // Helm & narrow visor facing right
  b.rect(hx - 3, hy + 3, 6, 5, pal.marbleMid);
  b.rect(hx - 3, hy + 3, 3, 5, pal.marbleDark);
  b.rect(hx, hy + 3, 3, 2, pal.marbleLight);
  b.rect(hx + 1, hy + 5, 3, 1, pal.cyanCore);

  if (detailed) {
    b.line(hx - 2, hy + 2, hx + 2, hy + 2, pal.goldLight);
    b.line(hx, hy + 3, hx + 3, hy + 3, pal.marbleLight);
    c.line((hx + 1) * s, (hy + 5) * s - 1, (hx + 3) * s + 1, (hy + 5) * s - 1, pal.cyanDark);
    c.line((hx + 1) * s, (hy + 5) * s + 2, (hx + 3) * s + 1, (hy + 5) * s + 2, pal.cyanDark);
  }
}

function drawArmsAndSpear(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  const cx = 36 + p.dx, cy = 16 + p.dy;

  // Rear arm
  b.rect(cx - 7, cy + 3, 2, 4, pal.marbleDark);
  b.rect(cx - 7, cy + 7, 2, 2, pal.goldDark);

  // Forward arm holding spear
  b.rect(cx + 4, cy + 3, 3, 3, pal.marbleMid);
  b.rect(cx + 6, cy + 5, 3, 3, pal.marbleMid);
  b.rect(cx + 8, cy + 6, 2, 2, pal.goldMid);
  b.rect(cx + 9, cy + 7, 2, 2, pal.marbleLight);

  // Long golden spear upright
  const spX = cx + 10, tipX = spX + p.spearTilt, tipY = 5 + p.dy;
  const buttX = spX - p.spearTilt, buttY = 52 + p.dy;

  b.line(tipX, tipY + 8, buttX, buttY, pal.goldMid);
  b.rect(tipX, tipY, 1, 2, pal.goldLight);
  b.rect(tipX - 1, tipY + 2, 3, 3, pal.goldMid);
  b.rect(tipX - 2, tipY + 5, 5, 2, pal.goldMid);
  b.rect(tipX - 1, tipY + 7, 3, 1, pal.goldDark);
  b.pixel(tipX, tipY + 7, pal.cyanCore);

  if (detailed) {
    b.line(tipX + 1, tipY + 8, buttX + 1, buttY, pal.goldDark);
    c.line(tipX * s, (tipY + 1) * s, tipX * s, (tipY + 5) * s, pal.marbleLight);
    b.pixel(tipX - 2, tipY + 5, pal.goldLight);
    b.pixel(tipX + 2, tipY + 5, pal.goldLight);
  }
}

function drawAetherArchon(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? POSES.idle![0];
  const pal = pose.flash ? FLASH_PALETTE : detailed ? SNES_PALETTE : NES_PALETTE;
  const b = new Brush(c, s, detailed, pal);

  drawStones(b, pose, false);
  drawArmsAndSpear(b, pose);
  drawRobe(b, pose);
  drawTorso(b, pose);
  drawHead(b, pose);
  drawStones(b, pose, true);

  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "aether_archon",
  kind: "aerial",
  description: "A majestic aerial guardian of white marble and gold with orbiting rune-stones and a robe of pale cyan light.",
  hitbox: { width: 56, height: 76 },
  cellScale: 1.5,
  animations: {
    idle: { frames: 2, fps: 3, loop: true },
    move: { frames: 4, fps: 6, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
  },
  draw: {
    nes: (c, anim, frame) => drawAetherArchon(c, 1, false, anim, frame),
    snes: (c, anim, frame) => drawAetherArchon(c, 2, true, anim, frame),
  },
});
