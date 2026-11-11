import { defineEnemySprite, type AnimationName, type PixelCanvas } from "../defineEnemySprite";

interface Pose {
  dx: number;
  dy: number;
  tailDy: number;
  wing: "half" | "up" | "level" | "down" | "folded";
  flash: boolean;
  glowFlicker: boolean;
}

const POSES: Partial<Record<AnimationName, Pose[]>> = {
  idle: [
    { dx: 0, dy: 0, tailDy: 0, wing: "half", flash: false, glowFlicker: false },
    { dx: 0, dy: -1, tailDy: 1, wing: "half", flash: false, glowFlicker: true },
  ],
  move: [
    { dx: 0, dy: 1, tailDy: 1, wing: "up", flash: false, glowFlicker: false },
    { dx: 0, dy: 0, tailDy: 0, wing: "level", flash: false, glowFlicker: false },
    { dx: 0, dy: -1, tailDy: -1, wing: "down", flash: false, glowFlicker: true },
    { dx: 0, dy: 0, tailDy: 1, wing: "level", flash: false, glowFlicker: false },
  ],
  hit: [
    { dx: -2, dy: 0, tailDy: -1, wing: "folded", flash: true, glowFlicker: false },
    { dx: -1, dy: 0, tailDy: 0, wing: "half", flash: false, glowFlicker: false },
  ],
};

interface Palette {
  outline: string;
  ironDark: string;
  ironMid: string;
  ironLight: string;
  ironHi: string;
  wingDark: string;
  wingLight: string;
  crimsonDark: string;
  crimsonMid: string;
  crimsonCore: string;
  crimsonFlare: string;
}

const NES_PALETTE: Palette = {
  outline: "#0c0a10",
  ironDark: "#24222c",
  ironMid: "#3c3a48",
  ironLight: "#3c3a48",
  ironHi: "#3c3a48",
  wingDark: "#24222c",
  wingLight: "#2c1c24",
  crimsonDark: "#24222c",
  crimsonMid: "#c81c24",
  crimsonCore: "#ff5038",
  crimsonFlare: "#ff5038",
};

const SNES_PALETTE: Palette = {
  outline: "#0c0a10",
  ironDark: "#24222c",
  ironMid: "#3c3a48",
  ironLight: "#5c5a6c",
  ironHi: "#84829c",
  wingDark: "#2c1c24",
  wingLight: "#44283c",
  crimsonDark: "#700c14",
  crimsonMid: "#c81c24",
  crimsonCore: "#ff5038",
  crimsonFlare: "#ffc890",
};

const FLASH_PALETTE: Palette = {
  outline: "#0c0a10",
  ironDark: "#7c7a88",
  ironMid: "#b8b6c8",
  ironLight: "#e0deec",
  ironHi: "#ffffff",
  wingDark: "#9c8e98",
  wingLight: "#c8bcc4",
  crimsonDark: "#ffa0a0",
  crimsonMid: "#ffd0d0",
  crimsonCore: "#ffffff",
  crimsonFlare: "#ffffff",
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

  line(x0: number, y0: number, x1: number, y1: number, color: string): void {
    this.c.line(x0 * this.s, y0 * this.s, x1 * this.s, y1 * this.s, color);
  }

  poly(pts: [number, number][], color: string): void {
    this.c.polygon(pts.map(([x, y]) => [x * this.s, y * this.s]), color);
  }
}

function drawFarWing(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const sx = 17 + p.dx, sy = 16 + p.dy;
  let kx = 18 + p.dx, ky = 6 + p.dy;
  let t1x = 36 + p.dx, t1y = 8 + p.dy;
  let t2x = 10 + p.dx, t2y = 7 + p.dy;
  let t3x = 7 + p.dx, t3y = 15 + p.dy;

  if (p.wing === "up") {
    kx = 19 + p.dx; ky = 2 + p.dy;
    t1x = 34 + p.dx; t1y = 3 + p.dy;
    t2x = 11 + p.dx; t2y = 2 + p.dy;
    t3x = 6 + p.dx; t3y = 9 + p.dy;
  } else if (p.wing === "level") {
    kx = 19 + p.dx; ky = 9 + p.dy;
    t1x = 37 + p.dx; t1y = 11 + p.dy;
    t2x = 10 + p.dx; t2y = 9 + p.dy;
    t3x = 7 + p.dx; t3y = 17 + p.dy;
  } else if (p.wing === "down") {
    kx = 19 + p.dx; ky = 15 + p.dy;
    t1x = 34 + p.dx; t1y = 20 + p.dy;
    t2x = 13 + p.dx; t2y = 20 + p.dy;
    t3x = 8 + p.dx; t3y = 25 + p.dy;
  } else if (p.wing === "folded") {
    kx = 16 + p.dx; ky = 15 + p.dy;
    t1x = 21 + p.dx; t1y = 16 + p.dy;
    t2x = 14 + p.dx; t2y = 16 + p.dy;
    t3x = 12 + p.dx; t3y = 21 + p.dy;
  }

  b.poly([[sx, sy], [kx, ky], [t1x, t1y]], pal.wingDark);
  b.poly([[sx, sy], [kx, ky], [t2x, t2y]], pal.wingDark);
  b.poly([[sx, sy], [t2x, t2y], [t3x, t3y]], pal.wingDark);
  b.line(sx, sy, kx, ky, pal.ironDark);
  b.line(kx, ky, t1x, t1y, pal.ironDark);
  b.line(kx, ky, t2x, t2y, pal.ironDark);
  b.line(kx, ky, t3x, t3y, pal.ironDark);
  if (detailed) b.line(sx, sy, t2x, t2y, pal.wingLight);
}

function drawNearWing(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const sx = 22 + p.dx, sy = 16 + p.dy;
  let kx = 22 + p.dx, ky = 7 + p.dy;
  let t1x = 42 + p.dx, t1y = 9 + p.dy;
  let t2x = 13 + p.dx, t2y = 8 + p.dy;
  let t3x = 8 + p.dx, t3y = 16 + p.dy;
  let t4x = 15 + p.dx, t4y = 21 + p.dy;

  if (p.wing === "up") {
    kx = 23 + p.dx; ky = 3 + p.dy;
    t1x = 38 + p.dx; t1y = 4 + p.dy;
    t2x = 14 + p.dx; t2y = 3 + p.dy;
    t3x = 8 + p.dx; t3y = 10 + p.dy;
    t4x = 14 + p.dx; t4y = 18 + p.dy;
  } else if (p.wing === "level") {
    kx = 24 + p.dx; ky = 10 + p.dy;
    t1x = 42 + p.dx; t1y = 12 + p.dy;
    t2x = 13 + p.dx; t2y = 10 + p.dy;
    t3x = 8 + p.dx; t3y = 17 + p.dy;
    t4x = 15 + p.dx; t4y = 22 + p.dy;
  } else if (p.wing === "down") {
    kx = 24 + p.dx; ky = 16 + p.dy;
    t1x = 38 + p.dx; t1y = 21 + p.dy;
    t2x = 17 + p.dx; t2y = 21 + p.dy;
    t3x = 10 + p.dx; t3y = 25 + p.dy;
    t4x = 17 + p.dx; t4y = 26 + p.dy;
  } else if (p.wing === "folded") {
    kx = 19 + p.dx; ky = 15 + p.dy;
    t1x = 24 + p.dx; t1y = 17 + p.dy;
    t2x = 16 + p.dx; t2y = 17 + p.dy;
    t3x = 13 + p.dx; t3y = 21 + p.dy;
    t4x = 16 + p.dx; t4y = 22 + p.dy;
  }

  b.poly([[sx, sy], [kx, ky], [t1x, t1y]], pal.wingLight);
  b.poly([[sx, sy], [kx, ky], [t2x, t2y]], pal.wingDark);
  b.poly([[sx, sy], [t2x, t2y], [t3x, t3y]], pal.wingLight);
  b.poly([[sx, sy], [t3x, t3y], [t4x, t4y]], pal.wingDark);

  b.line(sx, sy, kx, ky, pal.ironMid);
  b.line(kx, ky, t1x, t1y, pal.ironMid);
  b.line(kx, ky, t2x, t2y, pal.ironMid);
  b.line(kx, ky, t3x, t3y, pal.ironMid);
  b.line(kx, ky, t4x, t4y, pal.ironMid);
  b.px(kx, ky, pal.ironLight);

  if (detailed) {
    b.line(sx, sy - 1, kx, ky - 1, pal.ironLight);
    b.px(kx, ky, pal.ironHi);
    b.line(kx, ky + 1, t2x + 1, t2y + 1, pal.wingDark);
    b.line(sx, sy + 1, t3x + 1, t3y - 1, pal.wingDark);
  }
}

function drawTail(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tx = 16 + p.dx, ty = 25 + p.dy, dy = p.tailDy;

  b.rect(tx - 2, ty, 3, 2, pal.ironDark);
  b.rect(tx - 5, ty + 1 + dy, 3, 2, pal.ironMid);
  b.rect(tx - 8, ty + dy, 3, 2, pal.ironMid);
  b.rect(tx - 10, ty - 1 + dy, 3, 3, pal.ironMid);
  b.px(tx - 9, ty - 2 + dy, pal.ironLight);
  b.px(tx - 9, ty + 2 + dy, pal.ironDark);
  b.px(tx - 11, ty - 1 + dy, pal.ironLight);

  if (detailed) {
    b.px(tx - 9, ty - 1 + dy, pal.ironHi);
    b.px(tx - 4, ty + 1 + dy, pal.ironLight);
  }
}

function drawTorso(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  const bx = 17 + p.dx, by = 18 + p.dy;

  b.rect(bx + 1, by, 7, 3, pal.ironMid);
  b.rect(bx, by + 3, 9, 8, pal.ironMid);
  b.rect(bx, by + 2, 2, 8, pal.ironDark);
  b.rect(bx + 2, by + 10, 6, 2, pal.ironDark);

  const rx = bx + 6, ry = by + 1;
  b.rect(rx, ry, 5, 8, pal.ironDark);
  const glowCol = p.glowFlicker ? pal.crimsonCore : pal.crimsonMid;
  b.rect(rx + 1, ry + 1, 3, 6, glowCol);
  b.rect(rx, ry + 1, 5, 1, pal.ironMid);
  b.rect(rx, ry + 3, 5, 1, pal.ironMid);
  b.rect(rx, ry + 5, 5, 1, pal.ironMid);
  b.rect(rx, ry + 7, 5, 1, pal.ironDark);

  if (!detailed) return;
  b.px(rx + 2, ry + 2, pal.crimsonFlare);
  b.px(rx + 2, ry + 4, pal.crimsonFlare);
  b.px(rx + 2, ry + 6, pal.crimsonFlare);
  b.px(bx + 3, by + 1, pal.ironHi);
  b.px(bx + 5, by + 1, pal.ironHi);
  b.line(bx + 1, by + 3, bx + 1, by + 8, pal.ironLight);
  c.px((rx + 2) * s, (ry + 3) * s, pal.crimsonFlare);
}

function drawHead(b: Brush, p: Pose): void {
  const { pal, detailed, c, s } = b;
  const hx = 26 + p.dx, hy = 15 + p.dy;

  b.rect(hx - 2, hy + 2, 4, 4, pal.ironDark);
  b.rect(hx + 1, hy + 1, 5, 4, pal.ironMid);
  b.rect(hx + 2, hy, 4, 2, pal.ironLight);

  b.rect(hx + 6, hy + 2, 3, 2, pal.ironMid);
  b.rect(hx + 8, hy + 3, 2, 2, pal.ironDark);
  b.rect(hx + 6, hy + 4, 3, 1, pal.outline);
  b.rect(hx + 6, hy + 5, 4, 2, pal.ironDark);
  b.px(hx + 7, hy + 4, pal.ironLight);
  b.px(hx + 9, hy + 4, pal.ironLight);

  b.rect(hx - 1, hy - 1, 4, 2, pal.ironMid);
  b.rect(hx - 3, hy - 3, 3, 2, pal.ironMid);
  b.rect(hx - 5, hy - 5, 2, 2, pal.ironLight);
  b.px(hx - 6, hy - 6, pal.ironLight);

  b.rect(hx + 4, hy + 2, 2, 1, pal.crimsonCore);

  if (!detailed) return;
  b.line(hx, hy - 1, hx - 6, hy - 6, pal.ironHi);
  b.px(hx + 2, hy, pal.ironHi);
  c.px((hx + 5) * s, (hy + 2) * s, pal.crimsonFlare);
  c.px((hx + 3) * s, (hy + 3) * s, pal.crimsonDark);
}

function drawTalons(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const lx = 19 + p.dx, ly = 29 + p.dy;

  b.rect(lx, ly, 3, 4, pal.ironDark);
  b.rect(lx - 1, ly + 4, 3, 4, pal.ironDark);
  b.px(lx - 2, ly + 8, pal.ironMid);
  b.px(lx + 1, ly + 8, pal.ironMid);

  b.rect(lx + 2, ly, 3, 3, pal.ironMid);
  b.rect(lx + 3, ly + 2, 3, 3, pal.ironMid);
  b.rect(lx + 4, ly + 5, 2, 4, pal.ironMid);
  b.rect(lx + 3, ly + 9, 4, 2, pal.ironMid);
  b.px(lx + 2, ly + 11, pal.ironLight);
  b.rect(lx + 5, ly + 11, 2, 2, pal.ironLight);
  b.px(lx + 8, ly + 10, pal.ironLight);

  if (!detailed) return;
  b.px(lx + 4, ly + 2, pal.ironHi);
  b.line(lx + 5, ly + 5, lx + 5, ly + 8, pal.ironLight);
  b.px(lx + 5, ly + 12, pal.ironDark);
}

function drawGargoyle(c: PixelCanvas, s: number, detailed: boolean, anim: AnimationName, frame: number): void {
  const pose = POSES[anim]?.[frame] ?? POSES.idle![0];
  const pal = pose.flash ? FLASH_PALETTE : detailed ? SNES_PALETTE : NES_PALETTE;
  const b = new Brush(c, s, detailed, pal);

  drawFarWing(b, pose);
  drawTail(b, pose);
  drawTorso(b, pose);
  drawTalons(b, pose);
  drawNearWing(b, pose);
  drawHead(b, pose);

  c.outline(pal.outline);
}

export default defineEnemySprite({
  id: "chasm_gargoyle",
  kind: "aerial",
  description: "An aggressive flying predator of dark weathered iron with bat-like wings and glowing crimson crystals.",
  hitbox: { width: 46, height: 42 },
  cellScale: 1,
  animations: {
    idle: { frames: 2, fps: 4, loop: true },
    move: { frames: 4, fps: 10, loop: true },
    hit: { frames: 2, fps: 10, loop: false },
  },
  draw: {
    nes: (c, anim, frame) => drawGargoyle(c, 1, false, anim, frame),
    snes: (c, anim, frame) => drawGargoyle(c, 2, true, anim, frame),
  },
});
