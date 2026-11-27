import type { PixelCanvas } from "../pixelCanvas";
import { defineStructureSprite, type StructureAnimationName } from "../defineStructureSprite";
import { drawAetherGateHigh } from "./helpers/aether_gate_high";

interface GatePose {
  openAmount: number;
  energy: number;
  powered: boolean;
  phase: number;
  sparkBoost: number;
  nodesLit: number;
}

function poseFor(anim: StructureAnimationName, frame: number, stepped: boolean): GatePose {
  // hi8bit steps at half-rate for chunky retro cadence; hi16bit animates every single frame smoothly.
  const f = stepped ? (anim === "off" ? 0 : Math.floor(frame / 2) * 2) : frame;
  switch (anim) {
    case "off":
      return {
        openAmount: 0,
        energy: stepped ? 0.05 : frame === 0 ? 0.06 : 0.11,
        powered: false,
        phase: f * 0.5,
        sparkBoost: 0,
        nodesLit: 0,
      };
    case "idle":
      return {
        openAmount: 0,
        energy: 0.34 + 0.18 * Math.sin((f / 4) * Math.PI * 2),
        powered: true,
        phase: f / 4,
        sparkBoost: 0,
        nodesLit: 3,
      };
    case "opening": {
      const openAmount = f <= 1 ? 0 : Math.min(1, (f - 1) / 5);
      return {
        openAmount,
        energy: 0.45 + 0.55 * (f / 7),
        powered: true,
        phase: f / 8,
        sparkBoost: f <= 2 ? 0.85 : Math.max(0, 1 - Math.abs(f - 5) * 0.45),
        nodesLit: f === 0 ? 1 : f === 1 ? 2 : 3,
      };
    }
    case "on":
      return {
        openAmount: 1,
        energy: 0.9 + 0.1 * Math.sin((f / 6) * Math.PI * 2),
        powered: true,
        phase: f / 6,
        sparkBoost: 0.25,
        nodesLit: 3,
      };
    case "closing": {
      const openAmount = f >= 6 ? 0 : Math.max(0, 1 - f / 6);
      return {
        openAmount,
        energy: 0.25 + 0.7 * (1 - f / 7),
        powered: true,
        phase: f / 8,
        sparkBoost: f >= 6 ? 0.8 : 0.15,
        nodesLit: f >= 6 ? 1 : f >= 4 ? 2 : 3,
      };
    }
  }
}

// =============================================================================
// TIER 1: hi8bit (64x80 per cell, 12-bit #rgb limited palette, chunky retro)
// =============================================================================

const H8 = {
  outline: "#112",
  stoneDark: "#334",
  stoneMid: "#556",
  stoneLight: "#778",
  ironDark: "#223",
  ironMid: "#445",
  brassDark: "#852",
  brassMid: "#b83",
  brassLight: "#ec6",
  amber: "#e92",
  tubeOff: "#123",
  cyanDark: "#158",
  cyanMid: "#29d",
  cyanLight: "#7ef",
  cyanCore: "#eff",
  voidIndigo: "#214",
} as const;

function inArch8(x: number, y: number): boolean {
  if (y < 19 || y > 72) return false;
  if (y >= 28) return x >= 18 && x <= 45;
  const dy = (28 - y) / 9;
  const halfW = 13.5 * Math.sqrt(Math.max(0, 1 - dy * dy * 0.96));
  return Math.abs(x - 31.5) <= halfW;
}

function inOuter8(x: number, y: number): boolean {
  if (y >= 76 && y <= 79 && x >= 7 && x <= 56) return true;
  if (y >= 73 && y <= 75 && x >= 9 && x <= 54) return true;
  if (y >= 28 && y <= 72 && ((x >= 9 && x <= 17) || (x >= 46 && x <= 54))) return true;
  if (y >= 6 && y <= 27) {
    const t = (28 - y) / 22;
    const halfW = 23 * Math.pow(Math.max(0, 1 - t), 0.62);
    return Math.abs(x - 31.5) <= halfW;
  }
  return false;
}

function drawHi8bit(c: PixelCanvas, anim: StructureAnimationName, frame: number): void {
  const p = poseFor(anim, frame, true);

  // 1. Stone gothic-industrial arch and plinth
  for (let y = 5; y < 80; y++) {
    for (let x = 6; x < 58; x++) {
      if (!inOuter8(x, y) || inArch8(x, y)) continue;
      let col: string = x < 32 ? H8.stoneMid : H8.stoneDark;
      if (!inOuter8(x - 1, y) || !inOuter8(x, y - 1)) col = H8.stoneLight;
      if (y % 6 === 0 && (x < 17 || x > 46 || y < 19)) col = H8.stoneDark;
      c.px(x, y, col);
    }
  }

  // 2. Interior portal / blast doors
  const halfGap = Math.round(p.openAmount * 14);
  const leafW = Math.max(0, 14 - halfGap);

  for (let y = 19; y <= 72; y++) {
    for (let x = 18; x <= 45; x++) {
      if (!inArch8(x, y)) continue;
      const dx = Math.abs(x - 31.5);
      if (dx <= halfGap + 0.5 || p.openAmount > 0.85) {
        const nx = (x - 31.5) / Math.max(2, halfGap > 1 ? halfGap : 14);
        const ny = (y - 46) / 26;
        const r = Math.hypot(nx, ny);
        const swirl = Math.sin(Math.atan2(ny, nx) * 2 - r * 5 + p.phase * Math.PI * 2) * 0.12;
        const v = (1 - r * 0.85) * p.energy + swirl;
        let col: string = H8.voidIndigo;
        if (v > 0.82) col = H8.cyanCore;
        else if (v > 0.6) col = H8.cyanLight;
        else if (v > 0.38) col = H8.cyanMid;
        else if (v > 0.18) col = H8.cyanDark;
        c.px(x, y, col);
      }
    }
  }

  if (leafW > 0) {
    for (let y = 19; y <= 72; y++) {
      for (let x = 18; x <= 45; x++) {
        if (!inArch8(x, y)) continue;
        const isLeft = x < 32;
        const distFromJamb = isLeft ? x - 18 : 45 - x;
        if (distFromJamb >= leafW) continue;
        const seamDist = leafW - 1 - distFromJamb;
        const isRib = y === 31 || y === 46 || y === 61;
        const sigilX = isLeft ? 18 + leafW - 1 - seamDist : 45 - leafW + 1 + seamDist;
        const sigilD = Math.hypot(sigilX - 31.5, y - 46);
        const onSigil = sigilD >= 6.4 && sigilD <= 7.8;

        let col: string = isLeft ? H8.ironMid : H8.ironDark;
        if (isRib) col = H8.brassDark;
        if (onSigil) col = p.powered ? H8.brassLight : H8.brassDark;
        if (seamDist === 0) {
          col = p.powered && p.energy > 0.25 ? (p.sparkBoost > 0.4 ? H8.amber : H8.cyanLight) : H8.ironDark;
        }
        c.px(x, y, col);
      }
    }
  }

  // 3. Containment ring collar & iron pylon clamps
  for (let y = 9; y <= 43; y++) {
    for (let x = 14; x <= 49; x++) {
      if (inArch8(x, y)) continue;
      const d = Math.hypot(x - 31.5, y - 26);
      if (d >= 13.5 && d <= 17.5) {
        c.px(x, y, d < 14.5 || d > 16.5 ? H8.brassDark : H8.ironMid);
      }
    }
  }

  for (const by of [35, 47, 59, 71]) {
    c.rect(9, by, 9, 2, H8.brassDark);
    c.rect(46, by, 9, 2, H8.brassDark);
  }

  // 2034 hazard stripes on plinth flanks
  for (let x = 10; x <= 15; x++) {
    c.px(x, 74, (x & 1) === 0 ? H8.amber : H8.ironDark);
    c.px(x, 75, (x & 1) === 1 ? H8.amber : H8.ironDark);
    c.px(63 - x, 74, (x & 1) === 0 ? H8.amber : H8.ironDark);
    c.px(63 - x, 75, (x & 1) === 1 ? H8.amber : H8.ironDark);
  }
  c.rect(18, 73, 28, 2, H8.brassMid);

  // Side coolant tubes
  for (const tx of [12, 49]) {
    c.rect(tx, 31, 3, 38, H8.ironDark);
    for (let y = 32; y <= 67; y++) {
      const wave = 0.5 + 0.5 * Math.sin((68 - y) / 7 - p.phase * Math.PI * 2);
      const col = !p.powered
        ? H8.tubeOff
        : p.energy * (0.4 + 0.6 * wave) > 0.55
        ? H8.cyanLight
        : H8.cyanDark;
      c.px(tx + 1, y, col);
    }
  }

  // 6 Ring telemetry nodes
  const nodes: ReadonlyArray<[number, number]> = [
    [17, 24],
    [21, 15],
    [26, 10],
  ];
  nodes.forEach(([nx, ny], idx) => {
    const lit = p.powered && idx < p.nodesLit;
    for (const mx of [nx, 63 - nx]) {
      c.rect(mx - 1, ny - 1, 2, 2, lit ? (p.openAmount > 0.35 ? H8.cyanCore : H8.amber) : H8.ironDark);
    }
  });

  // Apex keystone eye
  c.rect(28, 8, 8, 6, H8.brassMid);
  c.rect(30, 9, 4, 4, !p.powered ? H8.ironDark : p.openAmount > 0.3 || p.sparkBoost > 0.4 ? H8.cyanCore : H8.amber);

  c.outline(H8.outline);
  c.line(7, 79, 56, 79, H8.outline);
}

// =============================================================================
// TIER 2: hi16bit (128x160 per cell, RGB565 16-bit rich shading)
// =============================================================================

const H16 = {
  outline: "#101018",
  stoneDeep: "#202030",
  stoneDark: "#343648",
  stoneMid: "#505468",
  stoneLight: "#707890",
  stoneHi: "#9098b0",
  ironDark: "#242834",
  ironMid: "#404858",
  ironLight: "#647084",
  brassDark: "#684014",
  brassMid: "#a87028",
  brassLight: "#dcac44",
  brassSpec: "#f8dc88",
  verdigris: "#3c786c",
  hazardAmber: "#d0841c",
  hazardDark: "#282428",
  tubeOff: "#182634",
  tubeDim: "#224e68",
  cyanDark: "#10507c",
  cyanMid: "#249cd8",
  cyanLight: "#70dcf8",
  cyanCore: "#e4faff",
  voidDeep: "#14122a",
  voidMid: "#443080",
  amberSpark: "#f8b438",
  emberDim: "#7c4420",
} as const;

function bayer2(x: number, y: number, t: number, a: string, b: string): string {
  const m = ((y & 1) * 2 + (x & 1)) & 3;
  const thresh = (m === 0 ? 0.125 : m === 1 ? 0.625 : m === 2 ? 0.875 : 0.375);
  return t > thresh ? b : a;
}

function inArch16(x: number, y: number): boolean {
  if (y < 38 || y > 145) return false;
  if (y >= 56) return x >= 36 && x <= 91;
  const dy = (56 - y) / 18;
  const halfW = 27.5 * Math.sqrt(Math.max(0, 1 - dy * dy * 0.96));
  return Math.abs(x - 63.5) <= halfW;
}

function inOuter16(x: number, y: number): boolean {
  if (y >= 152 && y <= 158 && x >= 13 && x <= 114) return true;
  if (y >= 146 && y <= 151 && x >= 18 && x <= 109) return true;
  if (y >= 56 && y <= 145 && ((x >= 17 && x <= 35) || (x >= 92 && x <= 110))) return true;
  if (y >= 11 && y <= 55) {
    const t = (56 - y) / 45;
    const halfW = 47 * Math.pow(Math.max(0, 1 - t), 0.62);
    return Math.abs(x - 63.5) <= halfW;
  }
  return false;
}

function drawHi16bit(c: PixelCanvas, anim: StructureAnimationName, frame: number): void {
  const p = poseFor(anim, frame, false);

  // 1. Bevelled ashlar masonry with 2x2 Bayer dithering & weathering
  for (let y = 10; y < 160; y++) {
    for (let x = 12; x < 116; x++) {
      if (!inOuter16(x, y) || inArch16(x, y)) continue;
      let shade = 0.44 + ((64 - x) / 110) * 0.22 + ((90 - y) / 140) * 0.14;
      const course = y < 146 && y % 12 === 0 && (x < 34 || x > 93 || y < 37);
      const stagger = (Math.floor(y / 12) & 1) * 9;
      const joint = y < 146 && (x + stagger) % 18 === 0 && (x < 34 || x > 93);
      if (course || joint) shade -= 0.28;
      if (!inOuter16(x - 1, y) || !inOuter16(x, y - 1)) shade += 0.18;
      if (!inOuter16(x + 1, y) || !inOuter16(x, y + 1)) shade -= 0.2;

      let col: string;
      if (shade < 0.25) col = bayer2(x, y, shade / 0.25, H16.stoneDeep, H16.stoneDark);
      else if (shade < 0.5) col = bayer2(x, y, (shade - 0.25) / 0.25, H16.stoneDark, H16.stoneMid);
      else if (shade < 0.75) col = bayer2(x, y, (shade - 0.5) / 0.25, H16.stoneMid, H16.stoneLight);
      else col = bayer2(x, y, Math.min(1, (shade - 0.75) / 0.25), H16.stoneLight, H16.stoneHi);

      if (y > 132 && y < 155 && Math.abs(x - 63.5) > 33 && ((x * 7 + y * 13) % 19 === 0)) {
        col = H16.verdigris;
      }
      c.px(x, y, col);
    }
  }

  // 2. Dimensional rift vortex inside aperture
  const halfGap = Math.round(p.openAmount * 28);
  const leafW = Math.max(0, 28 - halfGap);

  for (let y = 38; y <= 145; y++) {
    for (let x = 36; x <= 91; x++) {
      if (!inArch16(x, y)) continue;
      const dx = Math.abs(x - 63.5);
      if (dx <= halfGap + 1 || p.openAmount > 0.85) {
        const nx = (x - 63.5) / Math.max(4, halfGap > 2 ? halfGap : 28);
        const ny = (y - 93) / 53;
        const r = Math.hypot(nx, ny);
        const swirl = Math.sin(Math.atan2(ny, nx) * 3 - r * 7 + p.phase * Math.PI * 2) * 0.14;
        const v = Math.max(0, (1 - r * 0.88) * p.energy + swirl);
        let col: string;
        if (v < 0.24) col = bayer2(x, y, v / 0.24, H16.voidDeep, H16.voidMid);
        else if (v < 0.48) col = bayer2(x, y, (v - 0.24) / 0.24, H16.voidMid, H16.cyanDark);
        else if (v < 0.72) col = bayer2(x, y, (v - 0.48) / 0.24, H16.cyanDark, H16.cyanMid);
        else if (v < 0.9) col = bayer2(x, y, (v - 0.72) / 0.18, H16.cyanMid, H16.cyanLight);
        else col = H16.cyanCore;

        if (r > 0.68 && r < 0.95 && p.energy > 0.6 && ((x * 11 + y * 17 + frame * 7) % 37 === 0)) {
          col = H16.amberSpark;
        }
        c.px(x, y, col);
      }
    }
  }

  // 3. Interlocking blast-door leaves
  if (leafW > 0) {
    for (let y = 38; y <= 145; y++) {
      for (let x = 36; x <= 91; x++) {
        if (!inArch16(x, y)) continue;
        const isLeft = x < 64;
        const distFromJamb = isLeft ? x - 36 : 91 - x;
        if (distFromJamb >= leafW) continue;
        const seamDist = leafW - 1 - distFromJamb;

        const isRib = (y >= 61 && y <= 65) || (y >= 90 && y <= 96) || (y >= 121 && y <= 125);
        const chevron = Math.abs(((y - 93) + (isLeft ? seamDist : -seamDist) * 0.7) % 16) < 1;
        const sigilX = isLeft ? 36 + leafW - 1 - seamDist : 91 - leafW + 1 + seamDist;
        const sigilD = Math.hypot(sigilX - 63.5, y - 93);
        const onSigil = (sigilD >= 13 && sigilD <= 15) || (sigilD >= 6.5 && sigilD <= 8);

        let col: string = chevron
          ? H16.ironDark
          : bayer2(x, y, isLeft ? 0.6 : 0.35, H16.ironDark, H16.ironMid);
        if (isRib) col = bayer2(x, y, 0.5, H16.brassDark, H16.brassMid);
        if (onSigil) {
          col = p.powered ? (p.energy > 0.4 ? H16.cyanLight : H16.brassLight) : H16.brassDark;
        }
        if (seamDist <= 1) {
          col = p.powered && p.energy > 0.2
            ? seamDist === 0
              ? H16.cyanCore
              : p.sparkBoost > 0.4
              ? H16.amberSpark
              : H16.cyanMid
            : H16.ironDark;
        }
        c.px(x, y, col);
      }
    }
  }

  // 4. Containment ring collar, iron clamps, hazard plates, sill
  for (let y = 17; y <= 86; y++) {
    for (let x = 28; x <= 99; x++) {
      if (inArch16(x, y)) continue;
      const dist = Math.hypot(x - 63.5, y - 52);
      if (dist >= 27 && dist <= 35.5) {
        const angle = Math.atan2(y - 52, x - 63.5);
        const light = 0.5 + 0.35 * Math.cos(angle + 2.2);
        const rim = dist < 28.5 || dist > 34;
        let col = rim
          ? bayer2(x, y, light, H16.brassDark, H16.brassMid)
          : bayer2(x, y, light, H16.ironDark, H16.ironLight);
        const segAngle = ((angle + Math.PI) % (Math.PI / 6)) - Math.PI / 12;
        if (Math.abs(dist - 31.2) < 1.2 && Math.abs(segAngle) < 0.05) col = H16.brassSpec;
        c.px(x, y, col);
      }
    }
  }

  for (const bandY of [70, 94, 118, 142]) {
    for (const [x0, x1] of [[17, 35], [92, 110]] as const) {
      c.rect(x0, bandY, x1 - x0 + 1, 4, H16.ironMid);
      c.line(x0, bandY, x1, bandY, H16.brassLight);
      c.line(x0, bandY + 3, x1, bandY + 3, H16.brassDark);
    }
  }

  for (const [px0, px1] of [[20, 32], [95, 107]] as const) {
    c.rect(px0, 147, px1 - px0 + 1, 6, H16.brassDark);
    for (let y = 148; y <= 151; y++) {
      for (let x = px0 + 1; x <= px1 - 1; x++) {
        c.px(x, y, (((x + y) >> 2) & 1) === 0 ? H16.hazardAmber : H16.hazardDark);
      }
    }
  }

  c.rect(35, 146, 58, 5, H16.brassMid);
  c.line(35, 146, 92, 146, H16.brassLight);
  c.line(35, 150, 92, 150, H16.brassDark);

  // Coolant sight-tubes
  for (const tx of [24, 99]) {
    for (let y = 61; y <= 139; y++) {
      if (y <= 63 || y >= 137 || y === 87 || y === 113) {
        c.rect(tx, y, 5, 1, H16.brassLight);
        c.px(tx + 4, y, H16.brassDark);
        continue;
      }
      c.px(tx, y, H16.ironDark);
      c.px(tx + 4, y, H16.ironDark);
      const wave = 0.5 + 0.5 * Math.sin((139 - y) / 14 - p.phase * Math.PI * 2);
      const pulse = p.energy * (0.45 + 0.55 * wave);
      const col = !p.powered
        ? H16.tubeOff
        : pulse > 0.72
        ? H16.cyanLight
        : pulse > 0.35
        ? H16.cyanMid
        : H16.cyanDark;
      c.rect(tx + 1, y, 3, 1, col);
      if (p.powered && pulse > 0.35) c.px(tx + 1, y, H16.cyanCore);
    }
  }

  // 6 Ring telemetry nodes
  const nodes16: ReadonlyArray<[number, number]> = [
    [35, 48],
    [42, 31],
    [52, 21],
  ];
  nodes16.forEach(([nx, ny], idx) => {
    const lit = p.powered && idx < p.nodesLit;
    for (const mx of [nx, 127 - nx]) {
      c.ellipse(mx, ny, 3, 3, H16.brassDark);
      c.ellipse(
        mx,
        ny,
        2,
        2,
        !lit ? H16.ironDark : p.openAmount > 0.4 ? H16.cyanMid : H16.hazardAmber,
      );
      c.px(mx, ny, !lit ? H16.emberDim : p.openAmount > 0.4 ? H16.cyanCore : H16.brassSpec);
    }
  });

  // Apex keystone iris eye
  for (let dy = -8; dy <= 8; dy++) {
    for (let dx = -9; dx <= 9; dx++) {
      const m = Math.abs(dx) / 9 + Math.abs(dy) / 8;
      if (m > 1) continue;
      const px = Math.round(63.5 + dx);
      const py = 22 + dy;
      if (m > 0.7) {
        c.px(px, py, dx + dy < 0 ? H16.brassSpec : H16.brassDark);
      } else {
        const d = Math.hypot(dx / 5, dy / 4.5);
        const col = !p.powered
          ? d < 0.45
            ? H16.emberDim
            : H16.ironDark
          : d < 0.5
          ? p.openAmount > 0.3 || p.sparkBoost > 0.4
            ? H16.cyanCore
            : H16.brassSpec
          : p.openAmount > 0.3 || p.sparkBoost > 0.4
          ? H16.cyanMid
          : H16.hazardAmber;
        c.px(px, py, col);
      }
    }
  }

  c.outline(H16.outline);
  c.line(13, 159, 114, 159, H16.outline);
}

export default defineStructureSprite({
  id: "aether_gate",
  description:
    "2034 containment airlock reinterpreted as an occult gothic portal arch with animated iris doors and dimensional rift.",
  hitbox: { width: 84, height: 128 },
  cellSize: {
    hi8bit: { width: 64, height: 80 },
    hi16bit: { width: 128, height: 160 },
    high: { width: 256, height: 320 },
  },
  animations: {
    idle: { frames: 4, fps: 4, loop: true },
    opening: { frames: 8, fps: 10, loop: false },
    on: { frames: 6, fps: 8, loop: true },
    off: { frames: 2, fps: 2, loop: true },
    closing: { frames: 8, fps: 10, loop: false },
  },
  states: {
    idle: { animation: "idle" },
    closed: { animation: "idle" },
    inactive: { animation: "idle" },
    off: { animation: "off" },
    disabled: { animation: "off" },
    opening: { animation: "opening" },
    charging: { animation: "opening" },
    activating: { animation: "opening" },
    on: { animation: "on" },
    open: { animation: "on" },
    active: { animation: "on" },
    closing: { animation: "closing" },
  },
  infoFrames: {
    default: 0,
    idle: 0,
    opening: 1,
    on: 2,
    off: 3,
    closing: 4,
  },
  interaction: {
    type: "victory_gate",
    trigger: { onPlayerEnterRadius: true, radius: 150 },
    effects: { playFanfare: true, unlockNextStage: true, emitParticles: true },
  },
  render: {
    layer: "interactive",
    zIndex: 10,
    blend: "normal",
  },
  draw: {
    hi8bit: drawHi8bit,
    hi16bit: drawHi16bit,
    high: drawAetherGateHigh,
  },
});
