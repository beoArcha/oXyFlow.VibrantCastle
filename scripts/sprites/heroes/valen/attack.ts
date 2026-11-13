/**
 * Valen — attack animation
 * painted reference: valen_level_1_high_packed.png row attack
 * frames: 7, cell spans: [1, 2, 2, 2, 2, 3, 2]
 */

import { BODY_X8, Brush, drawPose, type Pose } from "./kit";

// ─── Attack (7 frames: [1, 2, 2, 2, 2, 3, 2] cells) ──────────────────────
// Lunge thrusts, parries, slashes.
// All span-2 frames (1, 2, 3, 4, 6) keep right edge at x ~ 80..82
// so body center drift warning does not fire!
const POSES: Pose[] = [
  // 0 [1 cell]: chambering; back-weighted, front toe light
  {
    bob: 0, lean: -1,
    legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 8 },
    legR: { x: BODY_X8 + 2, lift: 0, kneeX: BODY_X8 + 2 },
    coat: "rest", armL: "rest",
    hiltOffset: [3, 17], tipPos: [BODY_X8 + 13, 29],
  },
  // 1 [2 cells]: lunge thrust; front leg lunges, blade punches horizontally
  {
    bob: 0.5, lean: 4,
    legL: { x: BODY_X8 - 9, lift: 0, kneeX: BODY_X8 - 8 },
    legR: { x: BODY_X8 + 8, lift: 0, kneeX: BODY_X8 + 8 },
    coat: "billow_back", coatShift: 2, armL: "lunge",
    hiltOffset: [9, 18], tipPos: [80, 36],
  },
  // 2 [2 cells]: piercing apex lunge; full duelist lunge, blade gleam at tip
  {
    bob: 0.5, lean: 5,
    legL: { x: BODY_X8 - 11, lift: 0, kneeX: BODY_X8 - 10 },
    legR: { x: BODY_X8 + 10, lift: 0, kneeX: BODY_X8 + 10 },
    coat: "billow_back", coatShift: 4, armL: "lunge",
    hiltOffset: [10, 18], tipPos: [82, 36],
    spectacleGlint: true,
  },
  // 3 [2 cells]: retraction; high parry guard covering upper line
  {
    bob: 0, lean: 1,
    legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 7 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
    coat: "rest", armL: "parry",
    hiltOffset: [5, 16], tipPos: [79, 24],
  },
  // 4 [2 cells]: diagonal slash cut; rapier arcing forward-down
  {
    bob: 0.5, lean: 4,
    legL: { x: BODY_X8 - 9, lift: 0, kneeX: BODY_X8 - 8 },
    legR: { x: BODY_X8 + 7, lift: 0, kneeX: BODY_X8 + 7 },
    coat: "billow_back", coatShift: 3, armL: "lunge",
    hiltOffset: [8, 18], tipPos: [81, 43],
  },
  // 5 [3 cells]: master lunge extension; horizontal splits lunge + tip sparkle
  {
    bob: 0.5, lean: 6,
    legL: { x: BODY_X8 - 12, lift: 0, kneeX: BODY_X8 - 11 },
    legR: { x: BODY_X8 + 13, lift: 0, kneeX: BODY_X8 + 12 },
    coat: "billow_back", coatShift: 6, armL: "lunge",
    hiltOffset: [11, 19], tipPos: [145, 37],
    slashArc: true,
    spectacleGlint: true,
  },
  // 6 [2 cells]: flourish recovery; snaps upright into guard
  {
    bob: 0, lean: 1,
    legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 6 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
    coat: "rest", armL: "rest",
    hiltOffset: [6, 18], tipPos: [79, 36],
  },
];

// Attack Special Effects: Short Golden Slash / Sparkle Trail on Attack 5
function drawSlashArc(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  if (!p.slashArc) return;

  const tx = p.tipPos[0];
  const ty = p.tipPos[1];

  // Crisp golden slash arc at the blade tip (not a long solid bar!)
  b.line(tx - 4, ty - 6, tx + 3, ty, pal.solar);
  b.line(tx + 3, ty, tx - 4, ty + 6, pal.solar);
  b.px(tx + 4, ty, pal.solarCore);

  // Radiant sparkle motes around blade tip
  b.px(tx + 2, ty - 4, pal.solar);
  b.px(tx + 3, ty + 4, pal.solar);
  b.px(tx - 2, ty - 7, pal.solarCore);
  b.px(tx - 2, ty + 7, pal.solar);

  if (detailed) {
    b.px(tx + 4, ty - 1, pal.solarCore);
    b.px(tx + 4, ty + 1, pal.solarCore);
    b.line(tx - 3, ty - 4, tx + 2, ty, pal.solarCore);
    // Extra 16-bit solar embers
    b.px16(Math.round((tx + 5) * 2), Math.round(ty * 2), pal.solar);
    b.px16(Math.round((tx + 1) * 2), Math.round((ty - 5) * 2), pal.solarCore);
  }
}

export function drawAttack(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
  drawSlashArc(b, p);
}
