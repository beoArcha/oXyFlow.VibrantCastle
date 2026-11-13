/**
 * Valen — cast animation
 * painted reference: valen_level_1_high_packed.png row cast
 * frames: 8, cell spans: [1, 1, 2, 2, 2, 2, 2, 2]
 */

import { BODY_X8, Brush, drawPose, torsoTopY, type Pose } from "./kit";

// ─── Cast (8 frames: [1, 1, 2, 2, 2, 2, 2, 2] cells) ──────────────────────
// Hand raised, glow gathers (0-2), solar bolt from palm (3-5), fading sparks (6-7).
// All span-2 frames (2..7) reach x ~ 80..82 to eliminate body center drift!
const POSES: Pose[] = [
  // 0 [1 cell]: stance drop & hand raised; invocation spark at fingertips
  {
    bob: 0.5, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "cast_raise",
    hiltOffset: [5, 18], tipPos: [BODY_X8 + 17, 39],
    castEffect: { stage: "spark", reachX: BODY_X8 + 10 },
  },
  // 1 [1 cell]: hand raised higher; solar energy gathers into an orb
  {
    bob: 0, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "cast_raise",
    hiltOffset: [5, 18], tipPos: [BODY_X8 + 17, 39],
    castEffect: { stage: "gather", reachX: BODY_X8 + 14 },
    spectacleGlint: true,
  },
  // 2 [2 cells]: glow gathers at peak brilliance; radiance expands forward to reachX=80
  {
    bob: 0, lean: 1,
    legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 6 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "cast_raise",
    hiltOffset: [5, 18], tipPos: [BODY_X8 + 17, 40],
    castEffect: { stage: "glow_gather", reachX: 80 },
    spectacleGlint: true,
  },
  // 3 [2 cells]: palm thrusts forward; solar bolt erupts extending right to reachX=82
  {
    bob: 0, lean: 3,
    legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 7 },
    legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 4 },
    coat: "billow_back", coatShift: 2, armL: "cast_thrust",
    hiltOffset: [5, 18], tipPos: [BODY_X8 + 17, 40],
    castEffect: { stage: "bolt_fire", reachX: 82 },
    spectacleGlint: true,
  },
  // 4 [2 cells]: peak solar ray sustained from palm to reachX=82
  {
    bob: 0, lean: 3,
    legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 7 },
    legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 4 },
    coat: "billow_back", coatShift: 3, armL: "cast_thrust",
    hiltOffset: [5, 18], tipPos: [BODY_X8 + 17, 40],
    castEffect: { stage: "bolt_peak", reachX: 82 },
    spectacleGlint: true,
  },
  // 5 [2 cells]: bolt tail tapering right, still connected to palm, reaches x=81
  {
    bob: 0, lean: 2,
    legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 6 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "billow_back", coatShift: 1, armL: "cast_thrust",
    hiltOffset: [5, 18], tipPos: [BODY_X8 + 17, 40],
    castEffect: { stage: "bolt_fade", reachX: 81 },
  },
  // 6 [2 cells]: fading sparks along the bolt path out to reachX=80
  {
    bob: 0, lean: 1,
    legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 6 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "cast_thrust",
    hiltOffset: [5, 18], tipPos: [BODY_X8 + 17, 40],
    castEffect: { stage: "sparks_fade", reachX: 80 },
  },
  // 7 [2 cells]: final dissolving embers along bolt path to reachX=80 (nothing on floor)
  {
    bob: 0, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "cast_raise",
    hiltOffset: [6, 18], tipPos: [BODY_X8 + 18, 28],
    castEffect: { stage: "sparks_end", reachX: 80 },
  },
];

// Cast Spell Effects: Connected to Hand & Extending Right along Bolt Path
function drawCastEffects(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  if (!p.castEffect) return;

  const { stage, reachX } = p.castEffect;
  const tY = torsoTopY(p);
  const shX = BODY_X8 - 10 + p.lean;
  const shY = tY + 2;

  switch (stage) {
    case "spark": {
      // Small spark gathering at raised fingertips
      const hx = shX;
      const hy = shY - 11;
      b.px(hx + 1, hy - 1, pal.solarCore);
      b.px(hx, hy - 1, pal.solar);
      b.px(hx + 2, hy - 1, pal.solar);
      b.px(hx + 1, hy - 2, pal.solar);
      if (detailed) {
        b.px16(Math.round((hx + 1) * 2), Math.round((hy - 1) * 2), pal.solarCore);
      }
      break;
    }

    case "gather": {
      // Radiant solar glow gathers into an orb above raised palm
      const ox = shX + 1;
      const oy = shY - 14;
      b.rect(ox - 1, oy - 1, 3, 3, pal.solar);
      b.px(ox, oy, pal.solarCore);
      b.px(ox - 2, oy, pal.solar);
      b.px(ox + 2, oy, pal.solar);
      b.px(ox, oy - 2, pal.solar);
      b.px(ox, oy + 2, pal.solar);
      if (detailed) {
        b.line16(Math.round((ox - 1) * 2), Math.round(oy * 2), Math.round((ox + 1) * 2), Math.round(oy * 2), pal.solarCore);
        b.line16(Math.round(ox * 2), Math.round((oy - 1) * 2), Math.round(ox * 2), Math.round((oy + 1) * 2), pal.solarCore);
      }
      break;
    }

    case "glow_gather": {
      // Glow gathers at peak intensity, radiance expanding forward to reachX=80
      const ox = shX + 2;
      const oy = shY - 13;
      b.rect(ox - 2, oy - 2, 5, 5, pal.solar);
      b.rect(ox - 1, oy - 1, 3, 3, pal.solarCore);
      // Direct forward solar rays extending to reachX
      b.line(ox + 3, oy, reachX, oy, pal.solar);
      b.line(ox + 3, oy - 1, reachX - 2, oy - 1, pal.solar);
      b.line(ox + 3, oy + 1, reachX - 2, oy + 1, pal.solar);
      b.line(ox + 2, oy, reachX - 4, oy, pal.solarCore);
      b.px(reachX, oy, pal.solarCore);
      if (detailed) {
        b.px16(Math.round(reachX * 2), Math.round(oy * 2), pal.solarCore);
        b.line16(Math.round((ox - 1) * 2), Math.round(oy * 2), Math.round((ox + 1) * 2), Math.round(oy * 2), pal.solarCore);
      }
      break;
    }

    case "bolt_fire": {
      // Palm thrusts forward; solar bolt erupts from palm to reachX=82
      const palmX = shX + 11;
      const palmY = shY + 1;
      b.line(palmX, palmY, reachX, palmY, pal.solar);
      b.line(palmX, palmY - 1, reachX - 2, palmY - 1, pal.solar);
      b.line(palmX, palmY + 1, reachX - 2, palmY + 1, pal.solar);
      b.line(palmX + 1, palmY, reachX - 3, palmY, pal.solarCore);
      // Arrowhead bolt spear at tip
      b.line(reachX, palmY, reachX - 4, palmY - 3, pal.solar);
      b.line(reachX, palmY, reachX - 4, palmY + 3, pal.solar);
      b.px(reachX, palmY, pal.solarCore);
      if (detailed) {
        b.line16(Math.round((reachX - 3) * 2), Math.round((palmY - 2) * 2), Math.round(reachX * 2), Math.round(palmY * 2), pal.solarCore);
        b.line16(Math.round((reachX - 3) * 2), Math.round((palmY + 2) * 2), Math.round(reachX * 2), Math.round(palmY * 2), pal.solarCore);
      }
      break;
    }

    case "bolt_peak": {
      // Peak solar discharge beam from palm to reachX=82
      const palmX = shX + 11;
      const palmY = shY + 1;
      b.line(palmX, palmY, reachX, palmY, pal.solar);
      b.line(palmX, palmY - 1, reachX - 1, palmY - 1, pal.solar);
      b.line(palmX, palmY + 1, reachX - 1, palmY + 1, pal.solar);
      b.line(palmX + 2, palmY - 2, reachX - 3, palmY - 2, pal.solar);
      b.line(palmX + 2, palmY + 2, reachX - 3, palmY + 2, pal.solar);
      b.line(palmX + 1, palmY, reachX - 2, palmY, pal.solarCore);
      b.line(palmX + 3, palmY - 1, reachX - 4, palmY - 1, pal.solarCore);
      b.line(palmX + 3, palmY + 1, reachX - 4, palmY + 1, pal.solarCore);
      b.px(reachX, palmY, pal.solarCore);
      b.line(reachX, palmY, reachX - 4, palmY - 4, pal.solar);
      b.line(reachX, palmY, reachX - 4, palmY + 4, pal.solar);
      if (detailed) {
        b.px16(Math.round(reachX * 2), Math.round(palmY * 2), pal.solarCore);
        b.px16(Math.round((reachX - 1) * 2), Math.round((palmY - 1) * 2), pal.solarCore);
        b.px16(Math.round((reachX - 1) * 2), Math.round((palmY + 1) * 2), pal.solarCore);
      }
      break;
    }

    case "bolt_fade": {
      // Tapering beam connected to palm, extending right to reachX=81
      const palmX = shX + 11;
      const palmY = shY + 1;
      b.line(palmX, palmY, reachX, palmY, pal.solar);
      b.line(palmX, palmY - 1, palmX + 8, palmY - 1, pal.solar);
      b.line(palmX, palmY + 1, palmX + 8, palmY + 1, pal.solar);
      b.line(palmX + 2, palmY, reachX - 4, palmY, pal.solarCore);
      b.px(56, palmY - 2, pal.solar);
      b.px(65, palmY + 2, pal.solar);
      b.px(74, palmY - 1, pal.solarCore);
      b.px(reachX, palmY, pal.solarCore);
      if (detailed) {
        b.px16(Math.round(reachX * 2), Math.round(palmY * 2), pal.solarCore);
        b.px16(Math.round(65 * 2), Math.round((palmY + 2) * 2), pal.solarCore);
      }
      break;
    }

    case "sparks_fade": {
      // Fading sparks close to bolt path out to reachX=80
      const palmX = shX + 11;
      const palmY = shY + 1;
      b.line(palmX, palmY, palmX + 2, palmY, pal.solar);
      b.px(palmX + 6, palmY, pal.solar);
      b.px(52, palmY - 1, pal.solarCore);
      b.px(53, palmY, pal.solar);
      b.px(62, palmY + 1, pal.solar);
      b.px(70, palmY, pal.solarCore);
      b.px(76, palmY - 1, pal.solar);
      b.px(reachX, palmY, pal.solarCore);
      if (detailed) {
        b.px16(Math.round(reachX * 2), Math.round(palmY * 2), pal.solarCore);
        b.px16(Math.round(70 * 2), Math.round(palmY * 2), pal.solarCore);
      }
      break;
    }

    case "sparks_end": {
      // Final dissolving embers along bolt path to reachX=80 (nothing on floor)
      const palmY = shY + 1;
      b.px(42, palmY, pal.solar);
      b.px(54, palmY + 1, pal.solar);
      b.px(66, palmY - 1, pal.solar);
      b.px(74, palmY, pal.solar);
      b.px(reachX, palmY, pal.solarCore);
      if (detailed) {
        b.px16(Math.round(reachX * 2), Math.round(palmY * 2), pal.solarCore);
      }
      break;
    }
  }
}

export function drawCast(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
  drawCastEffects(b, p);
}
