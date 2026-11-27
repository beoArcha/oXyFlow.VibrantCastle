import type { RgbaFrameBuffer, StructureAnimationName } from "../../structureTypes";

type Rgb = readonly [number, number, number];

const OUTLINE: Rgb = [14, 13, 22];
const STONE_DEEP: Rgb = [32, 33, 46];
const STONE_DARK: Rgb = [50, 52, 70];
const STONE_MID: Rgb = [76, 80, 102];
const STONE_LIGHT: Rgb = [108, 114, 138];
const STONE_HI: Rgb = [138, 144, 168];

const IRON_DARK: Rgb = [36, 40, 52];
const IRON_MID: Rgb = [60, 68, 84];
const IRON_LIGHT: Rgb = [94, 106, 126];
const IRON_SPEC: Rgb = [134, 148, 170];

const BRASS_DARK: Rgb = [102, 64, 22];
const BRASS_MID: Rgb = [164, 112, 38];
const BRASS_LIGHT: Rgb = [218, 166, 66];
const BRASS_SPEC: Rgb = [250, 222, 136];
const VERDIGRIS: Rgb = [58, 118, 108];

const HAZARD_AMBER: Rgb = [208, 132, 28];
const HAZARD_DARK: Rgb = [38, 34, 40];

const TUBE_OFF: Rgb = [24, 38, 50];
const TUBE_DIM: Rgb = [34, 78, 102];
const CYAN_DARK: Rgb = [16, 78, 124];
const CYAN_MID: Rgb = [36, 154, 214];
const CYAN_LIGHT: Rgb = [110, 218, 250];
const CYAN_CORE: Rgb = [228, 250, 255];
const VIOLET_VOID: Rgb = [20, 18, 42];
const VIOLET_MID: Rgb = [68, 48, 128];
const AMBER_SPARK: Rgb = [248, 180, 54];
const EMBER_DIM: Rgb = [126, 70, 32];

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

function hash2d(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function bayerMix(x: number, y: number, t: number, a: Rgb, b: Rgb): Rgb {
  const threshold = (BAYER_4X4[y & 3][x & 3] + 0.5) / 16;
  return t > threshold ? b : a;
}

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

interface GateFrameState {
  openAmount: number; // 0 = closed, 1 = open
  energy: number;     // 0..1 intensity
  powered: boolean;
  phase: number;      // 0..1 loop phase
  sparkBoost: number; // 0..1 transition flash
  nodesLit: number;   // 0..3 pairs of ring nodes lit
}

function computeState(anim: StructureAnimationName, frame: number): GateFrameState {
  switch (anim) {
    case "off":
      return {
        openAmount: 0,
        energy: frame === 0 ? 0.06 : 0.1,
        powered: false,
        phase: frame * 0.5,
        sparkBoost: 0,
        nodesLit: 0,
      };
    case "idle":
      return {
        openAmount: 0,
        energy: 0.34 + 0.16 * Math.sin((frame / 4) * Math.PI * 2),
        powered: true,
        phase: frame / 4,
        sparkBoost: 0,
        nodesLit: 3,
      };
    case "opening": {
      const t = frame / 7;
      const openAmount = frame <= 1 ? 0 : Math.min(1, (frame - 1) / 5);
      return {
        openAmount,
        energy: 0.45 + 0.55 * t,
        powered: true,
        phase: frame / 8,
        sparkBoost: frame <= 2 ? 0.8 : Math.max(0, 1 - Math.abs(frame - 5.5) * 0.4),
        nodesLit: frame === 0 ? 1 : frame === 1 ? 2 : 3,
      };
    }
    case "on":
      return {
        openAmount: 1,
        energy: 0.92 + 0.08 * Math.sin((frame / 6) * Math.PI * 2),
        powered: true,
        phase: frame / 6,
        sparkBoost: 0.2,
        nodesLit: 3,
      };
    case "closing": {
      const t = 1 - frame / 7;
      const openAmount = frame >= 6 ? 0 : Math.max(0, 1 - frame / 6);
      return {
        openAmount,
        energy: 0.25 + 0.7 * t,
        powered: true,
        phase: frame / 8,
        sparkBoost: frame === 6 || frame === 7 ? 0.75 : 0.15,
        nodesLit: frame >= 6 ? 1 : frame >= 4 ? 2 : 3,
      };
    }
  }
}

/** Checks if (x, y) lies inside the inner gothic doorway cavity (in 256x320 coordinates). */
function inArchAperture(x: number, y: number): boolean {
  if (y < 76 || y > 291) return false;
  if (y >= 112) {
    return x >= 72 && x <= 183;
  }
  // Pointed gothic arch from y=112 (x=72..183, halfW=55.5) to apex y=76 (x=127.5)
  const dy = (112 - y) / 36;
  const halfW = 55.5 * Math.sqrt(Math.max(0, 1 - dy * dy * 0.96));
  const dx = Math.abs(x - 127.5);
  return dx <= halfW;
}

/** Checks if (x, y) lies on the outer gothic arch + pillar stone silhouette (in 256x320 coords). */
function inOuterArchStone(x: number, y: number): boolean {
  // Stepped plinth
  if (y >= 304 && y <= 318 && x >= 26 && x <= 229) return true;
  if (y >= 292 && y <= 303 && x >= 36 && x <= 219) return true;
  // Twin vertical pylons
  if (y >= 112 && y <= 291 && ((x >= 34 && x <= 71) || (x >= 184 && x <= 221))) return true;
  // Upper pointed gothic hood
  if (y >= 22 && y <= 111) {
    const t = (112 - y) / 90;
    const halfW = 94 * Math.pow(Math.max(0, 1 - t), 0.62);
    return Math.abs(x - 127.5) <= halfW;
  }
  return false;
}

function drawStoneTexture(buf: RgbaFrameBuffer): void {
  for (let y = 18; y < 320; y++) {
    for (let x = 24; x < 232; x++) {
      if (!inOuterArchStone(x, y) || inArchAperture(x, y)) continue;
      const dx = x - 127.5;
      const n = hash2d(x >> 1, y >> 1);
      // Base bevel shading: lit from top-left, shadowed toward bottom-right & inner jamb
      const leftBias = (128 - x) / 220;
      const topBias = (180 - y) / 260;
      let shade = 0.42 + leftBias * 0.22 + topBias * 0.16 + (n - 0.5) * 0.14;

      // Horizontal ashlar masonry seams every 24 px
      const course = y < 292 && y % 24 === 0 && (x < 68 || x > 187 || y < 74);
      const stagger = ((Math.floor(y / 24) & 1) * 18);
      const verticalJoint = y < 292 && ((x + stagger) % 36 === 0) && (x < 68 || x > 187);
      if (course || verticalJoint) {
        shade -= 0.26;
      }

      // Outer edge bevel highlight / shadow
      if (!inOuterArchStone(x - 1, y) || !inOuterArchStone(x, y - 1)) shade += 0.18;
      if (!inOuterArchStone(x + 1, y) || !inOuterArchStone(x, y + 1)) shade -= 0.2;

      let color: Rgb;
      if (shade < 0.25) color = bayerMix(x, y, shade / 0.25, STONE_DEEP, STONE_DARK);
      else if (shade < 0.5) color = bayerMix(x, y, (shade - 0.25) / 0.25, STONE_DARK, STONE_MID);
      else if (shade < 0.75) color = bayerMix(x, y, (shade - 0.5) / 0.25, STONE_MID, STONE_LIGHT);
      else color = bayerMix(x, y, Math.min(1, (shade - 0.75) / 0.25), STONE_LIGHT, STONE_HI);

      // Subtle autumn moss / verdigris weathering near plinth & crevices
      if (y > 265 && y < 312 && Math.abs(dx) > 65 && hash2d(x + 7, y + 13) > 0.78) {
        color = lerpRgb(color, VERDIGRIS, 0.45);
      }

      buf.setRgba(x, y, color[0], color[1], color[2], 255);
    }
  }
}

function drawContainmentRingAndBrass(buf: RgbaFrameBuffer, state: GateFrameState): void {
  const cx = 127.5;
  const cy = 104;
  // Circular 2034 containment ring collar embedded into the gothic arch
  for (let y = 34; y <= 172; y++) {
    for (let x = 56; x <= 199; x++) {
      if (inArchAperture(x, y)) continue;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist >= 54 && dist <= 71) {
        const ringBand = dist - 54;
        const rim = ringBand < 3 || ringBand > 14;
        const angle = Math.atan2(y - cy, x - cx);
        const light = 0.5 + 0.35 * Math.cos(angle + 2.2) + (hash2d(x, y) - 0.5) * 0.1;
        let col: Rgb;
        if (rim) {
          col = bayerMix(x, y, light, BRASS_DARK, BRASS_MID);
        } else {
          col = light < 0.45
            ? bayerMix(x, y, light / 0.45, IRON_DARK, IRON_MID)
            : bayerMix(x, y, (light - 0.45) / 0.55, IRON_MID, IRON_LIGHT);
        }
        // Bolt rivets around ring every 30 deg
        const segAngle = ((angle + Math.PI) % (Math.PI / 6)) - Math.PI / 12;
        if (Math.abs(dist - 62.5) < 2.2 && Math.abs(segAngle) < 0.04) {
          col = BRASS_SPEC;
        }
        buf.setRgba(x, y, col[0], col[1], col[2], 255);
      }
    }
  }

  // Twin side iron clamp bands & brass trim along pylons
  for (const bandY of [140, 188, 236, 284]) {
    for (const [x0, x1] of [[33, 71], [184, 222]] as const) {
      for (let y = bandY; y < bandY + 8; y++) {
        for (let x = x0; x <= x1; x++) {
          const isTop = y === bandY;
          const isBot = y === bandY + 7;
          const col = isTop ? BRASS_LIGHT : isBot ? BRASS_DARK : bayerMix(x, y, (x - x0) / 38, IRON_DARK, IRON_LIGHT);
          buf.setRgba(x, y, col[0], col[1], col[2], 255);
        }
      }
    }
  }

  // 2034 lab hazard stripe plates on plinth flanks
  const hazardPlates: ReadonlyArray<readonly [number, number]> = [[40, 65], [190, 215]];
  for (const [px0, px1] of hazardPlates) {
    for (let y = 295; y <= 306; y++) {
      for (let x = px0; x <= px1; x++) {
        if (x === px0 || x === px1 || y === 295 || y === 306) {
          buf.setRgba(x, y, BRASS_DARK[0], BRASS_DARK[1], BRASS_DARK[2], 255);
        } else {
          const stripe = ((x + y) >> 3) & 1;
          const col = stripe === 0 ? HAZARD_AMBER : HAZARD_DARK;
          buf.setRgba(x, y, col[0], col[1], col[2], 255);
        }
      }
    }
  }

  // Threshold brass sill plate
  for (let y = 292; y <= 301; y++) {
    for (let x = 70; x <= 185; x++) {
      const t = 1 - (y - 292) / 9;
      const col = t > 0.7 ? BRASS_LIGHT : bayerMix(x, y, t, BRASS_DARK, BRASS_MID);
      buf.setRgba(x, y, col[0], col[1], col[2], 255);
    }
  }

  // Glass coolant / Aether sight-tubes in left & right pylons
  for (const tubeX of [48, 198]) {
    for (let y = 122; y <= 278; y++) {
      // Brass end caps & collars
      if (y <= 127 || y >= 273 || y === 174 || y === 226) {
        for (let x = tubeX - 1; x <= tubeX + 10; x++) {
          const col = x < tubeX + 3 ? BRASS_LIGHT : BRASS_MID;
          buf.setRgba(x, y, col[0], col[1], col[2], 255);
        }
        continue;
      }
      for (let x = tubeX; x <= tubeX + 9; x++) {
        if (x === tubeX || x === tubeX + 9) {
          buf.setRgba(x, y, IRON_DARK[0], IRON_DARK[1], IRON_DARK[2], 255);
          continue;
        }
        const wave = 0.5 + 0.5 * Math.sin(((278 - y) / 28) - state.phase * Math.PI * 2);
        let col: Rgb;
        if (!state.powered) {
          col = TUBE_OFF;
        } else {
          const pulse = state.energy * (0.45 + 0.55 * wave);
          col = pulse < 0.35
            ? lerpRgb(TUBE_DIM, CYAN_DARK, pulse / 0.35)
            : pulse < 0.72
            ? lerpRgb(CYAN_DARK, CYAN_MID, (pulse - 0.35) / 0.37)
            : lerpRgb(CYAN_MID, CYAN_LIGHT, (pulse - 0.72) / 0.28);
          if (x === tubeX + 2 && pulse > 0.3) {
            col = lerpRgb(col, CYAN_CORE, 0.55); // glass specular highlight
          }
        }
        buf.setRgba(x, y, col[0], col[1], col[2], 255);
      }
    }
  }

  // 6 Occult Telemetry Nodes around the ring
  const nodePairs: ReadonlyArray<[number, number]> = [
    [70, 96],
    [84, 62],
    [104, 42],
  ];
  nodePairs.forEach(([nx, ny], idx) => {
    const lit = state.powered && idx < state.nodesLit;
    for (const mirrorX of [nx, 255 - nx]) {
      for (let dy = -6; dy <= 6; dy++) {
        for (let dx = -6; dx <= 6; dx++) {
          const d = Math.hypot(dx, dy);
          if (d > 6.2) continue;
          const px = mirrorX + dx;
          const py = ny + dy;
          if (d > 4.2) {
            buf.setRgba(px, py, BRASS_DARK[0], BRASS_DARK[1], BRASS_DARK[2], 255);
          } else if (!lit) {
            const c = d < 2 ? EMBER_DIM : IRON_DARK;
            buf.setRgba(px, py, c[0], c[1], c[2], 255);
          } else {
            const coreCol = state.openAmount > 0.4 ? CYAN_CORE : AMBER_SPARK;
            const midCol = state.openAmount > 0.4 ? CYAN_MID : BRASS_LIGHT;
            const c = lerpRgb(coreCol, midCol, d / 4.2);
            buf.setRgba(px, py, c[0], c[1], c[2], 255);
          }
        }
      }
    }
  });

  // Apex Keystone Iris Eye (centered at 127.5, 44)
  for (let dy = -16; dy <= 16; dy++) {
    for (let dx = -18; dx <= 18; dx++) {
      const manhattan = Math.abs(dx) / 18 + Math.abs(dy) / 16;
      if (manhattan > 1) continue;
      const px = Math.round(127.5 + dx);
      const py = 44 + dy;
      if (manhattan > 0.72) {
        const col = dx + dy < 0 ? BRASS_SPEC : BRASS_DARK;
        buf.setRgba(px, py, col[0], col[1], col[2], 255);
      } else {
        const d = Math.hypot(dx / 10, dy / 9);
        if (!state.powered) {
          const c = d < 0.45 ? EMBER_DIM : IRON_DARK;
          buf.setRgba(px, py, c[0], c[1], c[2], 255);
        } else {
          const pulse = Math.min(1, state.energy + state.sparkBoost * 0.4);
          const rimCol = state.openAmount > 0.3 || state.sparkBoost > 0.4 ? CYAN_MID : HAZARD_AMBER;
          const coreCol = state.openAmount > 0.3 || state.sparkBoost > 0.4 ? CYAN_CORE : BRASS_SPEC;
          const c = d < 0.48 ? lerpRgb(rimCol, coreCol, pulse) : lerpRgb(IRON_DARK, rimCol, pulse * 0.7);
          buf.setRgba(px, py, c[0], c[1], c[2], 255);
        }
      }
    }
  }
}

function drawPortalInterior(buf: RgbaFrameBuffer, state: GateFrameState): void {
  const cx = 127.5;
  const cy = 186;
  const maxHalfGap = 56;
  const halfGap = Math.round(state.openAmount * maxHalfGap);

  // 1. Background rift / vortex inside the open gap
  for (let y = 76; y <= 291; y++) {
    for (let x = 72; x <= 183; x++) {
      if (!inArchAperture(x, y)) continue;
      const dx = Math.abs(x - cx);

      if (dx <= halfGap + 1 || state.openAmount > 0.85) {
        const nx = (x - cx) / Math.max(8, halfGap > 4 ? halfGap : 56);
        const ny = (y - cy) / 106;
        const r = Math.hypot(nx, ny);
        const angle = Math.atan2(ny, nx);
        const swirl = Math.sin(angle * 3 - r * 7 + state.phase * Math.PI * 2);
        const ripple = Math.cos(r * 10 - state.phase * Math.PI * 2);
        const intensity = Math.max(0, (1 - r * 0.88) * state.energy + swirl * 0.14 + ripple * 0.08);

        let col: Rgb;
        if (intensity < 0.25) {
          col = bayerMix(x, y, intensity / 0.25, VIOLET_VOID, VIOLET_MID);
        } else if (intensity < 0.5) {
          col = bayerMix(x, y, (intensity - 0.25) / 0.25, VIOLET_MID, CYAN_DARK);
        } else if (intensity < 0.75) {
          col = bayerMix(x, y, (intensity - 0.5) / 0.25, CYAN_DARK, CYAN_MID);
        } else if (intensity < 0.92) {
          col = bayerMix(x, y, (intensity - 0.75) / 0.17, CYAN_MID, CYAN_LIGHT);
        } else {
          col = CYAN_CORE;
        }

        // Warm amber rim sparks on active vortex
        if (r > 0.65 && r < 0.96 && state.energy > 0.6 && hash2d(x + Math.round(state.phase * 12), y) > 0.94) {
          col = AMBER_SPARK;
        }

        buf.setRgba(x, y, col[0], col[1], col[2], 255);
      }
    }
  }

  // 2. Interlocking armored blast-door leaves (slide outward as openAmount increases)
  const leafWidth = Math.max(0, 56 - halfGap);
  if (leafWidth > 0) {
    for (let y = 76; y <= 291; y++) {
      for (let x = 72; x <= 183; x++) {
        if (!inArchAperture(x, y)) continue;
        const isLeft = x < cx;
        const distFromJamb = isLeft ? x - 72 : 183 - x;
        if (distFromJamb >= leafWidth) continue;

        // Leaf local coordinate relative to its inner seam edge
        const seamDist = leafWidth - 1 - distFromJamb;
        const grain = (hash2d(x >> 1, y >> 1) - 0.5) * 0.1;
        let shade = 0.45 + (isLeft ? 0.08 : -0.05) + grain;

        // Horizontal brass rib bands across blast doors
        const isRib = (y >= 122 && y <= 130) || (y >= 180 && y <= 192) || (y >= 242 && y <= 250);
        // Diagonal chevron armor grooves
        const diag = Math.abs(((y - 186) + (isLeft ? seamDist : -seamDist) * 0.7) % 32);
        if (diag < 2) shade -= 0.25;

        // Etched circular occult sigil on the closed doors (radius 30 around center)
        const sigilX = isLeft ? 72 + leafWidth - 1 - seamDist : 183 - leafWidth + 1 + seamDist;
        const sigilDist = Math.hypot(sigilX - cx, y - 186);
        const onSigil =
          (sigilDist >= 26 && sigilDist <= 30) ||
          (sigilDist >= 13 && sigilDist <= 16) ||
          (Math.abs(y - 186) <= 1 && sigilDist <= 30);

        let col: Rgb;
        if (onSigil) {
          col = state.powered
            ? lerpRgb(BRASS_MID, CYAN_LIGHT, state.energy * 0.65)
            : BRASS_DARK;
        } else if (isRib) {
          col = bayerMix(x, y, 0.5 + grain, BRASS_DARK, BRASS_MID);
        } else {
          col = shade < 0.42
            ? bayerMix(x, y, shade / 0.42, IRON_DARK, IRON_MID)
            : bayerMix(x, y, Math.min(1, (shade - 0.42) / 0.45), IRON_MID, IRON_LIGHT);
        }

        // Inner bevel / glowing rift seam on the closing edge
        if (seamDist <= 2) {
          if (state.powered && state.energy > 0.2) {
            col = seamDist === 0 ? CYAN_CORE : lerpRgb(CYAN_MID, AMBER_SPARK, state.sparkBoost);
          } else {
            col = IRON_DARK;
          }
        }

        buf.setRgba(x, y, col[0], col[1], col[2], 255);
      }
    }
  }
}

function drawOutlineAndGlow(buf: RgbaFrameBuffer, state: GateFrameState): void {
  // Crisp 2px dark obsidian outline around the solid structure
  const toOutline: number[] = [];
  for (let y = 1; y < buf.height - 1; y++) {
    for (let x = 1; x < buf.width - 1; x++) {
      if (buf.getAlpha(x, y) !== 0) continue;
      if (
        buf.getAlpha(x - 1, y) === 255 ||
        buf.getAlpha(x + 1, y) === 255 ||
        buf.getAlpha(x, y - 1) === 255 ||
        buf.getAlpha(x, y + 1) === 255
      ) {
        toOutline.push(y * buf.width + x);
      }
    }
  }
  for (const idx of toOutline) {
    const x = idx % buf.width;
    const y = Math.floor(idx / buf.width);
    buf.setRgba(x, y, OUTLINE[0], OUTLINE[1], OUTLINE[2], 255);
  }

  // Subtle dithered alpha glow around active doorway & keystone
  if (state.powered && state.energy > 0.35) {
    const glowStrength = (state.energy - 0.25) * (state.openAmount > 0.2 ? 75 : 35);
    const cy = 186;
    for (let y = 26; y <= 296; y++) {
      for (let x = 32; x <= 223; x++) {
        const dKey = Math.hypot(x - 127.5, y - 44);
        const dPortal = Math.hypot((x - 127.5) / 1.1, (y - cy) / 1.6);
        let alpha = 0;
        if (dKey < 26) {
          alpha = Math.max(alpha, (1 - dKey / 26) * glowStrength * 0.7);
        }
        if (state.openAmount > 0.2 && dPortal < 82) {
          alpha = Math.max(alpha, (1 - dPortal / 82) * glowStrength * state.openAmount);
        }
        if (alpha > 4) {
          const threshold = (BAYER_4X4[y & 3][x & 3] + 0.5) / 16;
          if (alpha / 90 > threshold * 0.65) {
            const col = dKey < 26 && state.openAmount < 0.3 ? AMBER_SPARK : CYAN_LIGHT;
            buf.blendRgba(x, y, col[0], col[1], col[2], Math.min(96, Math.round(alpha)));
          }
        }
      }
    }
  }

  // Ensure bottom row y = 319 is grounded across plinth
  for (let x = 26; x <= 229; x++) {
    buf.setRgba(x, 319, OUTLINE[0], OUTLINE[1], OUTLINE[2], 255);
  }
}

export function drawAetherGateHigh(
  buf: RgbaFrameBuffer,
  anim: StructureAnimationName,
  frame: number,
): void {
  const state = computeState(anim, frame);
  drawStoneTexture(buf);
  drawPortalInterior(buf, state);
  drawContainmentRingAndBrass(buf, state);
  drawOutlineAndGlow(buf, state);
}
