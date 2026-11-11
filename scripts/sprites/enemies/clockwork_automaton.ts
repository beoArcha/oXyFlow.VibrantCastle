import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  dx: number; dy: number; headDy: number;
  legL: [number, number]; legR: [number, number];
  armDy: number; cogPhase: number; bladePhase: number;
  puff: boolean; eyeGlint: boolean; flash: boolean;
}

const REST: Pose = {
  dx: 0, dy: 0, headDy: 0, legL: [0, 0], legR: [0, 0],
  armDy: 0, cogPhase: 0, bladePhase: 0, puff: false, eyeGlint: false, flash: false,
};

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [REST, { ...REST, dy: -1, armDy: -1, cogPhase: 1, bladePhase: 1, puff: true, eyeGlint: true }],
  move: [
    { ...REST, legL: [1, -2], armDy: 1, cogPhase: 0, bladePhase: 0 },
    { ...REST, dy: 1, armDy: 0, cogPhase: 1, bladePhase: 1, puff: true },
    { ...REST, legR: [1, -2], armDy: -1, cogPhase: 2, bladePhase: 2 },
    { ...REST, dy: 1, armDy: 0, cogPhase: 3, bladePhase: 3, puff: true },
  ],
  hit: [
    { ...REST, dx: -2, headDy: 1, armDy: 1, legL: [-1, 0], legR: [-1, 0], flash: true },
    { ...REST, dx: -1, headDy: 0, armDy: 0, cogPhase: 1, bladePhase: 1 },
  ],
};

interface Palette {
  outline: string;
  brassDark: string; brassMid: string; brassLight: string; brassHi: string;
  steelDark: string; steelMid: string; steelLight: string; steelHi: string;
  lensDark: string; lensMid: string; lensHi: string;
  exhaust: string; steam: string;
}

const NES_PALETTE: Palette = {
  outline: "#141008",
  brassDark: "#604010", brassMid: "#a87020", brassLight: "#d8a030", brassHi: "#d8a030",
  steelDark: "#303438", steelMid: "#585c64", steelLight: "#9098a0", steelHi: "#9098a0",
  lensDark: "#186030", lensMid: "#40d868", lensHi: "#40d868",
  exhaust: "#686058", steam: "#9098a0",
};

const SNES_PALETTE: Palette = {
  outline: "#141008",
  brassDark: "#604010", brassMid: "#a87020", brassLight: "#d8a030", brassHi: "#f8d878",
  steelDark: "#303438", steelMid: "#585c64", steelLight: "#9098a0", steelHi: "#d0d8e0",
  lensDark: "#186030", lensMid: "#40d868", lensHi: "#d8ffe0",
  exhaust: "#686058", steam: "#d0d8e0",
};

const FLASH_PALETTE: Palette = {
  outline: "#141008",
  brassDark: "#a0a8b0", brassMid: "#d0d8e0", brassLight: "#f0f4f8", brassHi: "#ffffff",
  steelDark: "#808890", steelMid: "#b0b8c0", steelLight: "#e0e8f0", steelHi: "#ffffff",
  lensDark: "#a0e8b0", lensMid: "#d0ffd8", lensHi: "#ffffff",
  exhaust: "#b0b8c0", steam: "#ffffff",
};

class Brush {
  constructor(readonly c: PixelCanvas, readonly s: number, readonly detailed: boolean, readonly pal: Palette) {}
  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.c.rect(x * this.s, y * this.s, w * this.s, h * this.s, color);
  }
}

function drawExhaust(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const px = 10 + p.dx, py = 12 + p.dy;
  b.rect(px, py, 3, 6, pal.exhaust);
  b.rect(px - 1, py, 5, 2, pal.steelMid);
  b.rect(px, py, 3, 1, pal.steelDark);
  if (detailed) {
    b.rect(px + 1, py + 2, 1, 4, pal.steelLight);
    c.px((px + 3) * s, (py + 1) * s, pal.brassHi);
  }
  if (!p.puff) return;
  if (!detailed) return b.rect(px, py - 3, 3, 2, pal.steam);
  c.ellipse((px + 1) * s, (py - 3) * s, 4, 2, pal.steam);
  c.ellipse(px * s, (py - 5) * s, 3, 2, pal.steelHi);
}

function drawBackArm(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const ax = 12 + p.dx, ay = 21 + p.dy + p.armDy;
  b.rect(ax, ay, 3, 5, pal.steelDark);
  b.rect(ax - 1, ay + 4, 3, 4, pal.steelMid);
  b.rect(ax - 1, ay + 7, 4, 3, pal.brassDark);
  if (!detailed) return;
  c.px(ax * s, (ay + 1) * s, pal.steelLight);
  c.px(ax * s, (ay + 8) * s, pal.brassMid);
}

function drawLeg(b: Brush, x: number, [dx, dy]: [number, number], isFront: boolean): void {
  const { pal, c, s, detailed } = b;
  const lx = x + dx;
  const pCol = isFront ? pal.brassMid : pal.brassDark;
  b.rect(lx + 1, 30, 5, 5, pCol);
  b.rect(lx + 2, 35, 3, 7 + dy, pal.steelMid);
  b.rect(lx + 1, 40 + dy, 5, 4, pCol);
  b.rect(lx, 44 + dy, isFront ? 8 : 7, 4, isFront ? pal.brassDark : pal.steelDark);
  b.rect(lx, 46 + dy, isFront ? 8 : 7, 2, pal.steelDark);
  b.rect(lx + 1, 44 + dy, isFront ? 7 : 6, 2, isFront ? pal.brassMid : pal.brassDark);
  if (!detailed) return;
  b.rect(lx + 3, 35, 1, 7 + dy, pal.steelHi);
  b.rect(lx + 4, 30, 1, 5, pal.brassLight);
  c.px((lx + 2) * s, 32 * s, pal.brassHi);
  c.px((lx + 4) * s, (41 + dy) * s, pal.brassHi);
  c.px((lx + (isFront ? 6 : 5)) * s, (45 + dy) * s, pal.brassHi);
  b.rect(lx + 1, 46 + dy, isFront ? 6 : 5, 1, pal.steelMid);
}

function drawTorso(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const tx = 14 + p.dx, ty = 17 + p.dy;
  b.rect(tx + 2, ty - 1, 13, 2, pal.brassDark);
  b.rect(tx + 1, ty + 1, 15, 2, pal.brassMid);
  b.rect(tx, ty + 3, 17, 8, pal.brassMid);
  b.rect(tx, ty + 3, 3, 8, pal.brassDark);
  b.rect(tx + 13, ty + 3, 4, 8, pal.brassLight);
  b.rect(tx + 1, ty + 11, 15, 2, pal.brassMid);
  b.rect(tx + 1, ty + 13, 15, 2, pal.brassDark);
  b.rect(tx + 2, ty + 15, 13, 2, pal.steelDark);
  if (!detailed) return;
  for (const rdy of [3, 7, 10]) {
    c.px((tx + 1) * s + 1, (ty + rdy) * s, pal.brassHi);
    c.px((tx + 15) * s, (ty + rdy) * s, pal.brassHi);
  }
  b.rect(tx + 14, ty + 4, 1, 6, pal.brassHi);
  c.px((tx + 4) * s, (ty + 16) * s, pal.steelHi);
  c.px((tx + 8) * s, (ty + 16) * s, pal.brassHi);
  c.px((tx + 12) * s, (ty + 16) * s, pal.steelHi);
}

function drawChestCog(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const cx = 22 + p.dx, cy = 23 + p.dy;
  b.rect(cx - 3, cy - 4, 7, 9, pal.steelDark);
  b.rect(cx - 4, cy - 3, 9, 7, pal.steelDark);
  b.rect(cx - 3, cy - 3, 7, 7, pal.steelMid);
  b.rect(cx - 2, cy - 2, 5, 5, pal.brassMid);
  b.rect(cx - 1, cy - 1, 3, 3, pal.brassDark);
  const cogTeeth = (p.cogPhase % 2 === 0)
    ? [[-1, -5, 3, 2], [-1, 4, 3, 2], [-5, -1, 2, 3], [4, -1, 2, 3]]
    : [[-4, -4, 2, 2], [3, -4, 2, 2], [-4, 3, 2, 2], [3, 3, 2, 2]];
  for (const [dx, dy, w, h] of cogTeeth) b.rect(cx + dx, cy + dy, w, h, pal.steelLight);
  if (!detailed) return;
  c.px(cx * s, cy * s, pal.brassHi);
  for (const [ox, oy] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) c.px((cx + ox) * s, (cy + oy) * s, pal.steelDark);
  if (p.cogPhase % 2 === 0) {
    c.px(cx * s, (cy - 5) * s, pal.steelHi);
    c.px((cx + 4) * s, cy * s, pal.steelHi);
  } else {
    c.px((cx + 3) * s, (cy - 4) * s, pal.steelHi);
    c.px((cx + 4) * s, (cy - 3) * s, pal.steelHi);
  }
}

function drawHead(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const hx = 20 + p.dx, hy = 8 + p.dy + p.headDy;
  b.rect(hx + 2, hy, 5, 1, pal.brassDark);
  b.rect(hx + 1, hy + 1, 7, 2, pal.brassMid);
  b.rect(hx, hy + 3, 9, 5, pal.brassMid);
  b.rect(hx, hy + 3, 2, 5, pal.brassDark);
  b.rect(hx + 7, hy + 3, 2, 5, pal.brassLight);
  b.rect(hx + 1, hy + 8, 7, 1, pal.steelDark);
  b.rect(hx + 4, hy + 3, 4, 3, pal.steelDark);
  b.rect(hx + 5, hy + 3, 3, 2, pal.lensMid);
  if (!detailed) return;
  b.rect(hx + 2, hy + 1, 4, 1, pal.brassLight);
  c.px((hx + 5) * s, (hy + 1) * s, pal.brassHi);
  c.px((hx + 1) * s, (hy + 4) * s, pal.brassHi);
  c.px((hx + 6) * s, (hy + 3) * s, p.eyeGlint ? pal.lensHi : pal.lensMid);
  c.px((hx + 7) * s - 1, (hy + 3) * s, "#ffffff");
  c.px((hx + 5) * s, (hy + 4) * s, pal.lensDark);
}

const BLADE_TEETH: [number, number, number, number][][] = [
  [[-1, -5, 3, 2], [-1, 4, 3, 2], [-5, -1, 2, 3], [4, -1, 2, 3], [-3, -3, 1, 1], [3, -3, 1, 1], [-3, 3, 1, 1], [3, 3, 1, 1]],
  [[-4, -4, 2, 2], [3, -4, 2, 2], [-4, 3, 2, 2], [3, 3, 2, 2], [0, -4, 1, 1], [0, 4, 1, 1], [-4, 0, 1, 1], [4, 0, 1, 1]],
  [[0, -5, 2, 2], [-1, 4, 2, 2], [-5, 0, 2, 2], [4, -1, 2, 2], [2, -4, 2, 1], [-3, 4, 2, 1], [-4, -3, 1, 2], [4, 2, 1, 2]],
  [[-3, -5, 2, 2], [4, -3, 2, 2], [2, 4, 2, 2], [-5, 2, 2, 2], [-1, -4, 2, 1], [1, 4, 2, 1], [-4, 1, 1, 2], [4, -2, 1, 2]],
];

function drawArmAndBlade(b: Brush, p: Pose): void {
  const { pal, c, s, detailed } = b;
  const sx = 27 + p.dx, sy = 16 + p.dy + p.armDy;
  b.rect(sx + 1, sy, 5, 1, pal.brassLight);
  b.rect(sx, sy + 1, 7, 5, pal.brassMid);
  b.rect(sx + 5, sy + 1, 2, 5, pal.brassLight);
  b.rect(sx + 1, sy + 6, 5, 1, pal.brassDark);

  const ax = sx + 3, ay = sy + 5;
  b.rect(ax, ay, 4, 3, pal.steelDark);
  b.rect(ax + 2, ay + 1, 3, 2, pal.steelMid);

  const bx = ax + 5, by = ay + 2;
  b.rect(bx - 3, by - 2, 7, 5, pal.steelMid);
  b.rect(bx - 2, by - 3, 5, 7, pal.steelMid);
  b.rect(bx - 1, by - 1, 3, 3, pal.brassMid);

  for (const [dx, dy, w, h] of BLADE_TEETH[p.bladePhase % 4]) b.rect(bx + dx, by + dy, w, h, pal.steelLight);

  if (!detailed) return;
  b.rect(sx + 2, sy + 1, 3, 1, pal.brassHi);
  c.px((sx + 3) * s, (sy + 3) * s, pal.brassHi);
  c.ellipse(bx * s, by * s, 6, 6, pal.steelLight);
  c.px(bx * s, by * s, pal.brassHi);
  b.rect(bx + 2, by - 2, 1, 4, pal.steelHi);
  b.rect(bx - 2, by + 2, 3, 1, pal.steelDark);
}

function drawAutomaton(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? REST;
  const pal = pose.flash ? FLASH_PALETTE : detailed ? SNES_PALETTE : NES_PALETTE;
  const b = new Brush(c, s, detailed, pal);
  drawExhaust(b, pose);
  drawBackArm(b, pose);
  drawLeg(b, 14, pose.legL, false);
  drawLeg(b, 23, pose.legR, true);
  drawTorso(b, pose);
  drawChestCog(b, pose);
  drawHead(b, pose);
  drawArmAndBlade(b, pose);
  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "clockwork_automaton",
  kind: "ground",
  description: "A heavy brass automaton soldier with an exposed chest cog and spinning gear-blade arm.",
  hitbox: { width: 48, height: 65 },
  cellScale: 1,
  animations: {
    idle: { frames: 2, fps: 4, loop: true },
    move: { frames: 4, fps: 6, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
  },
  draw: {
    nes: (c, anim, frame) => drawAutomaton(c, 1, false, anim, frame),
    snes: (c, anim, frame) => drawAutomaton(c, 2, true, anim, frame),
  },
});
