import type { PixelCanvas } from "../../pixelCanvas";
import { drawSparkle, drawThickLine, shadeRamp4 } from "../../helpers/pixelArt";

export type DummyAnim = "idle" | "hit" | "broken" | "bestiary";

interface DummyPose {
  leanX: number;
  bobY: number;
  armTilt: number;
  plumeWave: number;
  flash: "none" | "hot" | "warm";
  strawBurst: number;
  breakStage: number;
  turn: "left" | "front" | "right" | "back" | "portrait";
}

const H8 = {
  outline: "#210",
  woodDark: "#521",
  woodMid: "#842",
  straw: "#d93",
  strawLight: "#fb5",
  leather: "#421",
  helmDark: "#456",
  helmLight: "#89a",
  plume: "#c22",
  flash: "#fed",
} as const;

const H16 = {
  outline: "#18100c",
  woodDeep: "#34180c",
  woodDark: "#5c2c14",
  woodMid: "#884820",
  woodLight: "#b06834",
  strawDeep: "#6c3c0c",
  strawDark: "#a46418",
  strawMid: "#d8982c",
  strawLight: "#f4c854",
  strawSpec: "#fcf098",
  leatherDark: "#2c140c",
  leatherMid: "#542818",
  brassMid: "#c08424",
  brassSpec: "#fae084",
  steelDeep: "#242834",
  steelDark: "#444c5c",
  steelMid: "#6c788c",
  steelLight: "#9ca8bc",
  steelSpec: "#d8e4f4",
  plumeDeep: "#540c10",
  plumeDark: "#941818",
  plumeMid: "#d42c24",
  plumeLight: "#f46444",
  hotDark: "#c83014",
  hotMid: "#f46c24",
  hotLight: "#ffc464",
  hotSpec: "#fff8d8",
} as const;

const WOOD_RAMP = [H16.woodDeep, H16.woodDark, H16.woodMid, H16.woodLight] as const;
const STRAW_RAMP = [H16.strawDark, H16.strawMid, H16.strawLight, H16.strawSpec] as const;
const STEEL_RAMP = [H16.steelDeep, H16.steelDark, H16.steelMid, H16.steelSpec] as const;
const PLUME_RAMP = [H16.plumeDeep, H16.plumeDark, H16.plumeMid, H16.plumeLight] as const;
const HOT_RAMP = [H16.hotDark, H16.hotMid, H16.hotLight, H16.hotSpec] as const;

export function dummyPoseFor(anim: DummyAnim, frame: number): DummyPose {
  const base: DummyPose = {
    leanX: 0,
    bobY: 0,
    armTilt: 0,
    plumeWave: 0,
    flash: "none",
    strawBurst: 0,
    breakStage: 0,
    turn: "left",
  };
  if (anim === "idle") {
    const leanX = [-1, 0, 2, 3, 1, -1][frame % 6];
    const bobY = [0, 0, 1, 1, 0, 0][frame % 6];
    const plumeWave = [-2, -1, 1, 2, 1, -1][frame % 6];
    return { ...base, leanX, bobY, armTilt: leanX, plumeWave };
  }
  if (anim === "hit") {
    const leanX = [2, 8, 6, 3, 1][frame % 5];
    const flash = frame === 1 ? "hot" : frame === 0 || frame === 2 ? "warm" : "none";
    return {
      ...base,
      leanX,
      bobY: frame === 1 ? 2 : 0,
      armTilt: leanX,
      plumeWave: frame * 2,
      flash,
      strawBurst: frame + 1,
    };
  }
  if (anim === "broken") {
    return { ...base, breakStage: frame + 1, strawBurst: frame + 1, leanX: frame === 0 ? 4 : 0 };
  }
  const turns: DummyPose["turn"][] = ["left", "front", "right", "back", "portrait", "left"];
  return { ...base, turn: turns[frame % 6], plumeWave: (frame % 3) - 1 };
}

function drawBase16(c: PixelCanvas, cx: number, groundY: number): void {
  // Perspective wooden X-cross base
  drawThickLine(c, cx - 26, groundY - 12, cx + 26, groundY - 2, 7, H16.woodDark);
  drawThickLine(c, cx - 26, groundY - 13, cx + 26, groundY - 3, 4, H16.woodMid);
  drawThickLine(c, cx - 26, groundY - 2, cx + 26, groundY - 12, 7, H16.woodDark);
  drawThickLine(c, cx - 26, groundY - 3, cx + 26, groundY - 13, 4, H16.woodMid);
  c.line(cx - 24, groundY - 14, cx + 24, groundY - 4, H16.woodLight);
  c.line(cx - 24, groundY - 4, cx + 24, groundY - 14, H16.woodLight);

  // Iron socket collar
  c.rect(cx - 7, groundY - 15, 14, 9, H16.steelDeep);
  c.rect(cx - 6, groundY - 14, 12, 6, H16.steelMid);
  c.px(cx - 4, groundY - 12, H16.steelSpec);
  c.px(cx + 3, groundY - 12, H16.steelSpec);
}

function drawHelmet16(c: PixelCanvas, hx: number, hy: number, p: DummyPose): void {
  const steel = p.flash === "hot" ? HOT_RAMP : STEEL_RAMP;
  const plume = p.flash === "hot" ? HOT_RAMP : PLUME_RAMP;

  // Sweeping crimson horsehair plume curving up and right
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const px = Math.round(hx + 2 + i * 1.15);
    const py = Math.round(hy - 15 - Math.sin(t * 2.2) * 11 + t * 10 + p.plumeWave * t);
    const rad = Math.max(1, Math.round(5 * (1 - t * 0.65)));
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        if (dx * dx + dy * dy > rad * rad) continue;
        const shade = 0.65 - (dy / Math.max(1, rad)) * 0.35 - t * 0.2;
        c.px(px + dx, py + dy, shadeRamp4(px + dx, py + dy, shade, plume));
      }
    }
  }

  // Bascinet steel dome & face guard
  for (let dy = -16; dy <= 14; dy++) {
    for (let dx = -12; dx <= 12; dx++) {
      const rx = dy < -4 ? 12 : 11;
      if ((dx * dx) / (rx * rx) + (dy * dy) / (16 * 16) > 1) continue;
      const light = 0.52 - dx * 0.032 - dy * 0.022;
      c.px(hx + dx, hy + dy, shadeRamp4(hx + dx, hy + dy, light, steel));
    }
  }

  // Visor slits (shifted left for naturalFacing: "left")
  const vx = p.turn === "front" || p.turn === "portrait" ? hx : p.turn === "right" ? hx + 3 : hx - 3;
  if (p.turn !== "back") {
    c.rect(vx - 6, hy - 3, 5, 2, H16.outline);
    c.rect(vx + 1, hy - 3, 5, 2, H16.outline);
    c.line(vx, hy - 6, vx, hy + 8, H16.steelSpec);
    for (let sy = 2; sy <= 8; sy += 3) {
      c.px(vx - 4, hy + sy, H16.outline);
      c.px(vx + 3, hy + sy, H16.outline);
    }
  }
}

function drawTorso16(c: PixelCanvas, tx: number, ty: number, p: DummyPose): void {
  const straw = p.flash === "hot" ? HOT_RAMP : p.flash === "warm" ? HOT_RAMP : STRAW_RAMP;

  // Crossbar timber arms
  drawThickLine(c, tx - 30, ty - 14 - p.armTilt, tx + 30, ty - 14 + p.armTilt, 6, H16.woodDark);
  drawThickLine(c, tx - 30, ty - 15 - p.armTilt, tx + 30, ty - 15 + p.armTilt, 3, H16.woodLight);

  // Straw-stuffed sleeve bundles
  for (const side of [-1, 1]) {
    const ax = tx + side * 20;
    const ay = ty - 14 + side * p.armTilt;
    for (let dy = -7; dy <= 7; dy++) {
      for (let dx = -10; dx <= 10; dx++) {
        if ((dx * dx) / 100 + (dy * dy) / 49 > 1) continue;
        const shade = 0.55 - dy * 0.05 - dx * 0.02;
        c.px(ax + dx, ay + dy, shadeRamp4(ax + dx, ay + dy, shade, straw));
      }
    }
    c.rect(ax - side * 7, ay - 6, 3, 12, H16.leatherMid);
  }

  // Main straw torso barrel
  for (let dy = -22; dy <= 16; dy++) {
    const halfW = Math.round(17 - Math.abs(dy) * 0.14);
    for (let dx = -halfW; dx <= halfW; dx++) {
      const tuft = ((tx + dx) * 5 + (ty + dy) * 7) % 13 === 0 ? -0.18 : 0;
      const shade = 0.52 - (dx / halfW) * 0.34 - (dy / 22) * 0.14 + tuft;
      c.px(tx + dx, ty + dy, shadeRamp4(tx + dx, ty + dy, shade, straw));
    }
  }

  // Straw collar fringe
  for (let dx = -15; dx <= 15; dx += 3) {
    c.line(tx + dx, ty - 24, tx + dx - 1, ty - 19, straw[2]);
  }

  // Diagonal leather harness & waist belt with brass buckle
  drawThickLine(c, tx - 14, ty - 18, tx + 14, ty + 6, 5, H16.leatherMid);
  drawThickLine(c, tx - 14, ty - 18, tx + 14, ty + 6, 2, H16.leatherDark);
  c.rect(tx - 16, ty + 6, 32, 6, H16.leatherDark);
  c.rect(tx - 16, ty + 7, 32, 3, H16.leatherMid);
  c.rect(tx - 5, ty + 5, 10, 8, H16.brassMid);
  c.rect(tx - 3, ty + 7, 6, 4, H16.leatherDark);
  c.px(tx - 4, ty + 6, H16.brassSpec);
}

function drawBroken16(c: PixelCanvas, cx: number, groundY: number, p: DummyPose): void {
  const s = p.breakStage;
  drawBase16(c, cx, groundY);

  if (s === 1) {
    drawThickLine(c, cx, groundY - 12, cx + 3, groundY - 56, 7, H16.woodMid);
    drawTorso16(c, cx + 3, groundY - 46, p);
    drawHelmet16(c, cx + 2, groundY - 82, p);
    drawSparkle(c, cx - 18, groundY - 52, 3, H16.hotSpec, H16.hotMid);
    return;
  }
  if (s <= 4) {
    // Splintering burst: helmet & timbers fly upward while straw scatters
    const lift = (s - 1) * 14;
    const hY = Math.max(32, groundY - 84 - (s === 2 ? 10 : s === 3 ? 16 : 6));
    const hX = cx + (s - 2) * 8;
    drawThickLine(c, cx, groundY - 12, cx - 14, groundY - 36, 6, H16.woodMid);
    drawThickLine(c, cx + 6, groundY - 18 - lift * 0.4, cx + 24, groundY - 34 - lift * 0.4, 5, H16.woodLight);
    c.ellipse(cx, groundY - 16, 24, 11, H16.strawMid);
    c.ellipse(cx - 4, groundY - 18, 16, 7, H16.strawLight);
    drawHelmet16(c, hX, hY, p);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + s;
      const sx = Math.round(cx + Math.cos(a) * (20 + s * 6));
      const sy = Math.round(groundY - 44 + Math.sin(a) * 18);
      if (sx > 4 && sx < 123 && sy > 4 && sy < 123) {
        c.line(sx, sy, sx + 4, sy + 2, H16.strawLight);
      }
    }
    return;
  }

  // Final collapsed heap (frames 4 & 5)
  const settle = s === 6 ? 1 : 0;
  c.ellipse(cx, groundY - 10, 30, 10, H16.strawDark);
  c.ellipse(cx - 3, groundY - 12, 24, 8, H16.strawMid);
  c.ellipse(cx - 5, groundY - 14, 15, 5, H16.strawLight);
  drawThickLine(c, cx - 24, groundY - 18 + settle * 4, cx + 12, groundY - 8, 6, H16.woodMid);
  drawThickLine(c, cx - 10, groundY - 8, cx + 26, groundY - 16 + settle * 3, 5, H16.woodDark);
  drawHelmet16(c, cx + 16, groundY - 18 + settle * 2, { ...p, plumeWave: 4 });
}

export function drawDummyHi16bit(c: PixelCanvas, anim: DummyAnim, frame: number): void {
  const p = dummyPoseFor(anim, frame);
  const cx = 64;
  const groundY = 123;

  if (p.breakStage > 0) {
    drawBroken16(c, cx, groundY, p);
    c.outline(H16.outline);
    return;
  }

  if (p.turn === "portrait") {
    c.ellipse(cx, 92, 24, 12, H16.strawMid);
    drawHelmet16(c, cx - 2, 62, p);
    c.outline(H16.outline);
    return;
  }

  drawBase16(c, cx, groundY);
  const tx = cx + p.leanX;
  const ty = 72 + p.bobY;
  drawThickLine(c, cx, groundY - 12, tx, ty + 14, 8, H16.woodDark);
  drawThickLine(c, cx - 1, groundY - 12, tx - 1, ty + 14, 4, H16.woodMid);
  drawTorso16(c, tx, ty, p);
  drawHelmet16(c, tx + Math.round(p.leanX * 0.3), ty - 34, p);

  if (p.strawBurst > 0) {
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1 + p.strawBurst * 0.6;
      const sx = Math.round(tx + Math.cos(a) * (24 + p.strawBurst * 3));
      const sy = Math.round(ty - 6 + Math.sin(a) * 18);
      if (sx > 4 && sx < 123 && sy > 4 && sy < 123) {
        c.line(sx, sy, sx + 3, sy + 2, H16.strawSpec);
      }
    }
  }
  c.outline(H16.outline);
}

export function drawDummyHi8bit(c: PixelCanvas, anim: DummyAnim, frame: number): void {
  const p = dummyPoseFor(anim, frame);
  const cx = 32;
  const groundY = 61;
  const straw = p.flash !== "none" ? H8.flash : H8.straw;
  const helm = p.flash !== "none" ? H8.flash : H8.helmLight;

  c.rect(18, groundY - 6, 28, 4, H8.woodDark);
  c.rect(30, groundY - 18, 4, 14, H8.woodMid);

  if (p.breakStage >= 4) {
    c.ellipse(cx, groundY - 6, 14, 5, straw);
    c.rect(36, groundY - 13, 10, 8, helm);
    c.rect(40, groundY - 16, 8, 4, H8.plume);
    c.outline(H8.outline);
    return;
  }

  const lx = cx + Math.round(p.leanX / 2);
  const ty = 36 + Math.round(p.bobY / 2);
  const hy = p.breakStage === 3 ? 16 : ty - 17;
  c.rect(lx - 15, ty - 7, 30, 5, H8.woodMid);
  c.rect(lx - 9, ty - 10, 18, 19, straw);
  c.rect(lx - 6, ty - 8, 12, 6, H8.strawLight);
  c.rect(lx - 9, ty + 2, 18, 4, H8.leather);
  c.rect(lx - 6, hy - 8, 12, 14, helm);
  c.rect(lx - 4, hy - 2, 3, 2, H8.outline);
  c.rect(lx, hy - 13, 12, 6, H8.plume);
  c.outline(H8.outline);
}
