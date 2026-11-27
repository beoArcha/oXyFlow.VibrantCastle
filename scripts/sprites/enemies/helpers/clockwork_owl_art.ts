import type { PixelCanvas } from "../../pixelCanvas";
import { drawShadedOrb, drawSparkle, drawThickLine, shadeRamp4 } from "../../helpers/pixelArt";

export interface OwlPose {
  dx: number;
  dy: number;
  wingAngle: number;
  wingSpan: number;
  headTilt: number;
  beakOpen: boolean;
  gearRot: number;
  talonDrop: number;
  diveArc: number;
  flash: boolean;
  shatter: number;
  facing: "right" | "front" | "back" | "portrait";
}

export const OWL_H8 = {
  outline: "#100c14",
  brassDark: "#643010",
  brassMid: "#a86820",
  brassLight: "#e8a838",
  slateDark: "#303844",
  slateMid: "#505c6c",
  wingDark: "#482818",
  wingMid: "#784420",
  cyanMid: "#28b8e8",
  cyanCore: "#d8ffff",
  flashMid: "#e8f4fc",
  flashHi: "#ffffff",
} as const;

export const OWL_H16 = {
  outline: "#100c14",
  brassDeep: "#3c1c0c",
  brassDark: "#6c3c14",
  brassMid: "#b07024",
  brassLight: "#e4aa40",
  brassSpec: "#fce088",
  copperShadow: "#542418",
  slateDeep: "#1e242e",
  slateDark: "#323c4a",
  slateMid: "#546276",
  slateLight: "#8494a8",
  wingDeep: "#2c160c",
  wingDark: "#583018",
  wingMid: "#8c5024",
  wingLight: "#c47c34",
  cyanDeep: "#0e4870",
  cyanDark: "#167cb4",
  cyanMid: "#30c4f4",
  cyanLight: "#98ecff",
  cyanCore: "#ecffff",
} as const;

const BRASS_RAMP = [OWL_H16.brassDark, OWL_H16.brassMid, OWL_H16.brassLight, OWL_H16.brassSpec] as const;
const WING_RAMP = [OWL_H16.wingDeep, OWL_H16.wingDark, OWL_H16.wingMid, OWL_H16.wingLight] as const;
const SLATE_RAMP = [OWL_H16.slateDeep, OWL_H16.slateDark, OWL_H16.slateMid, OWL_H16.slateLight] as const;
const FLASH_RAMP = [OWL_H16.slateLight, OWL_H16.cyanLight, OWL_H16.cyanCore, "#ffffff"] as const;

export function owlPoseFor(anim: string, frame: number): OwlPose {
  const base: OwlPose = {
    dx: 0,
    dy: 0,
    wingAngle: 0,
    wingSpan: 1,
    headTilt: 0,
    beakOpen: false,
    gearRot: frame % 4,
    talonDrop: 0,
    diveArc: 0,
    flash: false,
    shatter: 0,
    facing: "right",
  };

  if (anim === "fly") {
    const wave = [-0.7, -0.35, 0.2, 0.75, 0.45, -0.05, -0.5][frame % 7];
    const bob = [2, 1, -1, -2, -1, 1, 2][frame % 7];
    return { ...base, dy: bob, wingAngle: wave, talonDrop: Math.round(bob * 0.5) };
  }
  if (anim === "attack") {
    const angles = [-0.65, -0.72, -0.1, 0.5, 0.7, 0.3, -0.35][frame % 7];
    const dx = [-2, -3, 2, 4, 4, 2, 0][frame % 7];
    const dy = [-2, -3, 1, 3, 2, 0, -1][frame % 7];
    return {
      ...base,
      dx,
      dy,
      wingAngle: angles,
      headTilt: frame >= 2 && frame <= 5 ? 2 : -1,
      beakOpen: frame >= 2 && frame <= 5,
      talonDrop: frame >= 2 && frame <= 5 ? 3 : 0,
      diveArc: frame >= 2 && frame <= 5 ? frame - 1 : 0,
    };
  }
  if (anim === "hit") {
    const dx = [-6, -4, -2, 0][frame % 4];
    const dy = [-2, 2, 1, 0][frame % 4];
    return {
      ...base,
      dx,
      dy,
      wingAngle: [-0.7, 0.5, -0.2, 0.1][frame % 4],
      headTilt: -2,
      beakOpen: true,
      flash: frame === 0,
      shatter: frame === 1 || frame === 2 ? 1 : 0,
    };
  }
  if (anim === "death") {
    const shatter = [1, 2, 3, 4, 5, 6][frame % 6];
    const dy = [0, 3, 7, 13, 18, 22][frame % 6];
    return { ...base, dy, wingAngle: 0.6, shatter, flash: frame === 0 };
  }
  const modes: OwlPose["facing"][] = ["front", "right", "right", "front", "portrait", "right", "back"];
  return {
    ...base,
    facing: modes[frame % 7],
    wingAngle: [-0.25, -0.6, 0.1, -0.35, 0, -0.5, 0.2][frame % 7],
  };
}

function drawWing16(
  c: PixelCanvas,
  sx: number,
  sy: number,
  dirX: number,
  angle: number,
  span: number,
  isFar: boolean,
  flash: boolean,
): void {
  const ramp = flash ? FLASH_RAMP : WING_RAMP;
  const metal = flash ? FLASH_RAMP : BRASS_RAMP;
  const elbowX = Math.round(sx + dirX * Math.cos(angle - 0.55) * 15 * span);
  const elbowY = Math.round(sy + Math.sin(angle - 0.55) * 15 * span - 4);
  const tipX = Math.round(elbowX + dirX * Math.cos(angle - 0.2) * 17 * span);
  const tipY = Math.round(elbowY + Math.sin(angle - 0.2) * 15 * span);

  const feathers = 6;
  for (let i = feathers - 1; i >= 0; i--) {
    const t = i / (feathers - 1);
    const fx = Math.round(elbowX + (tipX - elbowX) * t);
    const fy = Math.round(elbowY + (tipY - elbowY) * t);
    const len = Math.round((11 + t * 7) * span);
    const fEndX = Math.round(fx - dirX * (3 + t * 4));
    const fEndY = Math.max(4, Math.min(90, Math.round(fy + len)));

    const fShade = isFar ? 0.22 + t * 0.25 : 0.45 + t * 0.42;
    const bodyCol = shadeRamp4(fx, fy, fShade, ramp);
    c.polygon(
      [
        [fx - dirX * 2, fy],
        [fx + dirX * 3, fy + 2],
        [fEndX + dirX * 2, fEndY - 2],
        [fEndX, fEndY],
      ],
      bodyCol,
    );
    if (!isFar) {
      c.line(fx, fy + 1, fEndX, fEndY - 1, flash ? OWL_H16.cyanCore : OWL_H16.brassLight);
      c.px(fEndX, fEndY, OWL_H16.brassSpec);
    }
  }

  // Articulated leading-edge spar & brass hinge joint
  drawThickLine(c, sx, sy, elbowX, elbowY, isFar ? 3 : 4, isFar ? OWL_H16.slateDark : OWL_H16.slateMid);
  drawThickLine(c, elbowX, elbowY, tipX, tipY, isFar ? 2 : 3, isFar ? OWL_H16.brassDark : OWL_H16.brassMid);
  c.line(sx, sy - 1, elbowX, elbowY - 1, metal[3]);
  drawShadedOrb(c, elbowX, elbowY, isFar ? 2 : 3, metal, OWL_H16.brassSpec);
}

function drawGear16(c: PixelCanvas, cx: number, cy: number, r: number, phase: number, flash: boolean): void {
  const metal = flash ? FLASH_RAMP : BRASS_RAMP;
  drawShadedOrb(c, cx, cy, r, metal, OWL_H16.brassSpec);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + phase * 0.5;
    const tx = Math.round(cx + Math.cos(a) * (r + 1));
    const ty = Math.round(cy + Math.sin(a) * (r + 1));
    c.px(tx, ty, metal[2]);
  }
  c.ellipse(cx, cy, Math.max(1, r - 2), Math.max(1, r - 2), OWL_H16.slateDeep);
  c.px(cx, cy, OWL_H16.cyanMid);
}

function drawHead16(c: PixelCanvas, cx: number, cy: number, p: OwlPose): void {
  const ramp = p.flash ? FLASH_RAMP : BRASS_RAMP;
  const slate = p.flash ? FLASH_RAMP : SLATE_RAMP;

  // Cranium dome with 4-tone radial shading
  for (let dy = -12; dy <= 11; dy++) {
    for (let dx = -12; dx <= 13; dx++) {
      const m = (dx * dx) / (12.5 * 12.5) + (dy * dy) / (11.5 * 11.5);
      if (m > 1) continue;
      const light = Math.max(0, Math.min(1, 0.52 - dx * 0.025 - dy * 0.032));
      c.px(cx + dx, cy + dy, shadeRamp4(cx + dx, cy + dy, light, ramp));
    }
  }

  // Swept mechanical ear tufts
  const tuftCol = p.flash ? OWL_H16.cyanCore : OWL_H16.brassLight;
  c.polygon([[cx - 10, cy - 6], [cx - 16, cy - 17], [cx - 5, cy - 10]], OWL_H16.brassDark);
  c.polygon([[cx - 9, cy - 7], [cx - 14, cy - 15], [cx - 6, cy - 10]], tuftCol);
  c.polygon([[cx + 6, cy - 7], [cx + 15, cy - 17], [cx + 11, cy - 5]], OWL_H16.brassDark);
  c.polygon([[cx + 7, cy - 8], [cx + 13, cy - 15], [cx + 10, cy - 6]], tuftCol);

  // Recessed slate facial mask plates
  c.ellipse(cx + 3, cy + 1, 9, 6, slate[0]);
  c.line(cx - 5, cy - 4, cx + 11, cy - 4, OWL_H16.brassSpec);

  // Glowing cyan optics (left & right lens)
  const eyePositions = p.facing === "front" || p.facing === "portrait" ? [cx - 5, cx + 5] : [cx + 1, cx + 8];
  for (const ex of eyePositions) {
    c.ellipse(ex, cy, 4, 4, OWL_H16.brassDark);
    c.ellipse(ex, cy, 3, 3, OWL_H16.cyanDark);
    c.ellipse(ex, cy, 2, 2, OWL_H16.cyanMid);
    c.px(ex, cy, OWL_H16.cyanCore);
    c.px(ex - 1, cy - 1, OWL_H16.cyanLight);
  }

  // Hooked steel beak
  const bx = p.facing === "front" || p.facing === "portrait" ? cx : cx + 5;
  c.polygon([[bx - 2, cy + 3], [bx + 3, cy + 3], [bx + 1, cy + 9]], slate[2]);
  c.line(bx, cy + 3, bx + 1, cy + 8, slate[3]);
  if (p.beakOpen) {
    c.polygon([[bx - 1, cy + 7], [bx + 2, cy + 7], [bx + 1, cy + 11]], slate[1]);
  }
}

function drawBody16(c: PixelCanvas, cx: number, cy: number, p: OwlPose): void {
  const ramp = p.flash ? FLASH_RAMP : BRASS_RAMP;
  const slate = p.flash ? FLASH_RAMP : SLATE_RAMP;

  // Tail feathers fanning behind/down
  c.polygon([[cx - 14, cy + 10], [cx - 24, cy + 20], [cx - 16, cy + 23], [cx - 6, cy + 15]], OWL_H16.wingDark);
  c.polygon([[cx - 12, cy + 12], [cx - 20, cy + 20], [cx - 15, cy + 21], [cx - 7, cy + 15]], OWL_H16.wingMid);
  c.line(cx - 12, cy + 14, cx - 21, cy + 20, OWL_H16.brassLight);

  // Armored clockwork torso
  for (let dy = -13; dy <= 15; dy++) {
    for (let dx = -12; dx <= 12; dx++) {
      const m = (dx * dx) / (12 * 12) + (dy * dy) / (15 * 15);
      if (m > 1) continue;
      const light = Math.max(0, Math.min(1, 0.48 - dx * 0.024 - dy * 0.02 + (Math.abs(dx) < 5 ? 0.12 : 0)));
      const col = dy > 2 && Math.abs(dx) < 7 && (dy % 5 === 0) ? OWL_H16.brassDeep : shadeRamp4(cx + dx, cy + dy, light, ramp);
      c.px(cx + dx, cy + dy, col);
    }
  }

  // Belly plate seams & chest gear window
  c.ellipse(cx + 2, cy + 2, 6, 6, slate[0]);
  drawGear16(c, cx + 2, cy + 2, 4, p.gearRot, p.flash);
  c.px(cx - 7, cy - 3, OWL_H16.brassSpec);
  c.px(cx - 6, cy + 5, OWL_H16.brassSpec);

  // Articulated talons
  for (const tx of [cx - 4, cx + 4]) {
    const ty = cy + 14 + p.talonDrop;
    c.rect(tx - 1, cy + 12, 3, 4 + p.talonDrop, slate[1]);
    c.polygon([[tx - 2, ty + 2], [tx + 4, ty + 2], [tx + 6, ty + 6], [tx + 3, ty + 5]], slate[2]);
    c.polygon([[tx - 2, ty + 2], [tx - 4, ty + 6], [tx - 1, ty + 5]], slate[2]);
    c.px(tx + 5, ty + 5, slate[3]);
  }
}

function drawShatter16(c: PixelCanvas, cx: number, cy: number, p: OwlPose): void {
  const s = p.shatter;
  if (s >= 5) {
    // Fallen wreckage resting low inside the cell (y <= 88)
    const groundY = 82;
    c.polygon([[cx - 24, groundY], [cx - 10, groundY - 8], [cx + 8, groundY - 6], [cx + 22, groundY]], OWL_H16.wingDark);
    drawGear16(c, cx - 12, groundY - 3, 4, s, false);
    drawGear16(c, cx + 10, groundY - 4, 3, s + 2, false);
    drawHead16(c, cx + 1, groundY - 12, { ...p, dy: 0 });
    return;
  }

  drawBody16(c, cx, cy, p);
  drawWing16(c, cx - 6 - s * 2, cy - 6 - s, -1, p.wingAngle * 0.6, 0.8, false, p.flash);
  drawWing16(c, cx + 6 + s * 2, cy - 6 - s, 1, p.wingAngle * 0.6, 0.8, false, p.flash);
  drawHead16(c, cx + 4, cy - 14 - s, p);

  // Flying gears, feathers, and cyan sparks
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6 + s * 0.7;
    const gx = Math.round(cx + Math.cos(a) * (14 + s * 4));
    const gy = Math.round(cy + Math.sin(a) * (10 + s * 3));
    if (gx > 4 && gx < 91 && gy > 4 && gy < 91) {
      if (i % 2 === 0) drawGear16(c, gx, gy, 2, s + i, false);
      else drawSparkle(c, gx, gy, 2, OWL_H16.cyanCore, OWL_H16.cyanMid);
    }
  }
}

function drawDiveArc16(c: PixelCanvas, cx: number, cy: number, step: number): void {
  const r = 24;
  for (let a = -0.6; a <= 1.25; a += 0.05) {
    const px = Math.round(cx + Math.cos(a) * (r + step));
    const py = Math.round(cy + Math.sin(a) * (r - 2));
    if (px < 3 || px > 92 || py < 3 || py > 92) continue;
    c.px(px, py, a > 0.3 ? OWL_H16.cyanCore : OWL_H16.cyanMid);
    c.px(px - 1, py, OWL_H16.cyanLight);
  }
}

export function drawOwlHi16bit(c: PixelCanvas, anim: string, frame: number): void {
  const p = owlPoseFor(anim, frame);
  const cx = 48 + p.dx;
  const cy = 50 + p.dy;

  if (p.shatter > 0) {
    drawShatter16(c, cx, cy, p);
    c.outline(OWL_H16.outline);
    return;
  }

  if (p.facing === "portrait") {
    drawHead16(c, 48, 52, p);
    drawSparkle(c, 26, 28, 2, OWL_H16.cyanCore, OWL_H16.cyanMid);
    drawSparkle(c, 70, 28, 2, OWL_H16.cyanCore, OWL_H16.cyanMid);
    c.outline(OWL_H16.outline);
    return;
  }

  if (p.facing === "front" || p.facing === "back") {
    drawWing16(c, cx - 10, cy - 6, -1, p.wingAngle, 1, false, p.flash);
    drawWing16(c, cx + 10, cy - 6, 1, p.wingAngle, 1, false, p.flash);
    drawBody16(c, cx, cy, p);
    drawHead16(c, cx, cy - 17, p);
    c.outline(OWL_H16.outline);
    return;
  }

  // Standard right-facing profile: far wing -> body -> head -> near wing -> dive arc
  drawWing16(c, cx + 2, cy - 7, -1, p.wingAngle + 0.15, 0.92, true, p.flash);
  drawBody16(c, cx, cy, p);
  drawHead16(c, cx + 5 + p.headTilt, cy - 16, p);
  drawWing16(c, cx - 4, cy - 6, -1, p.wingAngle, 1.05, false, p.flash);
  if (p.diveArc > 0) drawDiveArc16(c, cx + 8, cy - 2, p.diveArc);

  c.outline(OWL_H16.outline);
}

export function drawOwlHi8bit(c: PixelCanvas, anim: string, frame: number): void {
  const p = owlPoseFor(anim, frame);
  const cx = 24 + Math.round(p.dx / 2);
  const cy = 25 + Math.round(p.dy / 2);
  const body = p.flash ? OWL_H8.flashMid : OWL_H8.brassMid;
  const trim = p.flash ? OWL_H8.flashHi : OWL_H8.brassLight;
  const wing = p.flash ? OWL_H8.flashMid : OWL_H8.wingMid;
  const wingDk = p.flash ? OWL_H8.flashMid : OWL_H8.wingDark;

  if (p.shatter >= 5) {
    const settle = p.shatter >= 6 ? 1 : 0;
    c.rect(12, 36 + settle, 24, 6 - settle, wingDk);
    c.ellipse(24, 34 + settle, 6, 5, body);
    c.rect(20, 32 + settle, 2, 2, OWL_H8.cyanCore);
    c.rect(26, 32 + settle, 2, 2, OWL_H8.cyanCore);
    c.outline(OWL_H8.outline);
    return;
  }

  const wingTipY = cy - 4 + Math.round(Math.sin(p.wingAngle) * 10);
  c.polygon([[cx - 4, cy - 3], [cx - 18, wingTipY - 4], [cx - 15, wingTipY + 6], [cx - 3, cy + 3]], wingDk);
  c.polygon([[cx - 3, cy - 2], [cx - 17, wingTipY - 2], [cx - 14, wingTipY + 7], [cx - 2, cy + 4]], wing);
  if (p.facing === "front" || p.facing === "back") {
    c.polygon([[cx + 3, cy - 2], [cx + 17, wingTipY - 2], [cx + 14, wingTipY + 7], [cx + 2, cy + 4]], wing);
  }
  c.ellipse(cx, cy, 6, 7, body);
  c.rect(cx - 2, cy - 2, 4, 4, trim);
  c.ellipse(cx + (p.facing === "right" ? 2 : 0), cy - 9, 6, 5, body);
  c.rect(cx - 4, cy - 15, 2, 3, OWL_H8.brassDark);
  c.rect(cx + 4, cy - 15, 2, 3, OWL_H8.brassDark);
  c.rect(cx + 1, cy - 10, 2, 2, OWL_H8.cyanCore);
  c.rect(cx + 4, cy - 10, 2, 2, OWL_H8.cyanCore);
  c.rect(cx - 3, cy + 7, 2, 3, OWL_H8.slateDark);
  c.rect(cx + 2, cy + 7, 2, 3, OWL_H8.slateDark);
  if (p.diveArc > 0) c.line(cx + 10, cy - 8, cx + 12, cy + 6, OWL_H8.cyanCore);
  c.outline(OWL_H8.outline);
}
