/**
 * Valen — dash animation
 * painted reference: valen_level_1_high_packed.png row dash
 * frames: 9, cell spans: [1, 2, 2, 1, 1, 1, 1, 1, 1]
 */

import { BODY_X8, Brush, drawPose, torsoTopY, type Pose } from "./kit";

// ─── Dash (9 frames: [1, 2, 2, 1, 1, 1, 1, 1, 1] cells) ───────────────────
// Replaced solid black block with thin afterimage streaks in coat colors.
// Distinct pose per frame (no identical frames).
const POSES: Pose[] = [
  // 0 [1 cell]: compression charge
  {
    bob: 0.5, lean: 3,
    legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 9 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 5 },
    coat: "billow_back", coatShift: 1, armL: "rest",
    hiltOffset: [5, 20], tipPos: [BODY_X8 + 19, 39],
  },
  // 1 [2 cells]: temporal launch; streaks behind
  {
    bob: 0.5, lean: 5,
    legL: { x: BODY_X8 - 9, lift: 0, kneeX: BODY_X8 - 8 },
    legR: { x: BODY_X8 + 7, lift: 0, kneeX: BODY_X8 + 7 },
    coat: "billow_back", coatShift: 4, armL: "lunge",
    hiltOffset: [9, 18], tipPos: [76, 37],
    dashStreak: 1,
  },
  // 2 [2 cells]: warp transit apex; different streak alignment
  {
    bob: 0.5, lean: 6,
    legL: { x: BODY_X8 - 10, lift: 0, kneeX: BODY_X8 - 9 },
    legR: { x: BODY_X8 + 8, lift: 0, kneeX: BODY_X8 + 8 },
    coat: "billow_back", coatShift: 5, armL: "lunge",
    hiltOffset: [10, 18], tipPos: [78, 37],
    dashStreak: 2,
  },
  // 3 [1 cell]: sustained glide 1
  {
    bob: 0.5, lean: 4,
    legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 7 },
    legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 5 },
    coat: "billow_back", coatShift: 3, armL: "rest",
    hiltOffset: [6, 18], tipPos: [BODY_X8 + 20, 36],
  },
  // 4 [1 cell]: sustained glide 2 (different flutter)
  {
    bob: 0.5, lean: 3,
    legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 6 },
    legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 5 },
    coat: "billow_back", coatShift: 4, armL: "rest",
    hiltOffset: [6, 18], tipPos: [BODY_X8 + 19, 36],
  },
  // 5 [1 cell]: sustained glide 3
  {
    bob: 0, lean: 3,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 6, lift: 0, kneeX: BODY_X8 + 6 },
    coat: "billow_back", coatShift: 2, armL: "rest",
    hiltOffset: [6, 17], tipPos: [BODY_X8 + 19, 35],
  },
  // 6 [1 cell]: deceleration, front heel drops
  {
    bob: 0, lean: 1,
    legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 6 },
    legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 5 },
    coat: "billow_back", coatShift: 1, armL: "rest",
    hiltOffset: [5, 18], tipPos: [BODY_X8 + 18, 35],
  },
  // 7 [1 cell]: braking plant
  {
    bob: 0.5, lean: 0,
    legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 7 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
    coat: "rest", armL: "rest",
    hiltOffset: [5, 19], tipPos: [BODY_X8 + 17, 36],
  },
  // 8 [1 cell]: slide to upright
  {
    bob: 0, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "rest",
    hiltOffset: [6, 18], tipPos: [BODY_X8 + 18, 28],
  },
];

// Dash Afterimage Trails (2-3 thin streaks in coat colors)
function drawDashAfterimages(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  if (!p.dashStreak) return;

  const tY = torsoTopY(p);
  const offsets = p.dashStreak === 1 ? [8, 14] : [6, 11, 16];

  for (let i = 0; i < offsets.length; i++) {
    const off = offsets[i]!;
    const streakCol = i === 0 ? pal.coatShade : (detailed ? pal.coatLight : pal.coatShade);

    // Sleek horizontal trailing speedlines behind torso and waist (staying within x >= 2)
    b.line(BODY_X8 - off - 5, tY + 4, BODY_X8 - off, tY + 4, streakCol);
    b.line(BODY_X8 - off - 8, tY + 10, BODY_X8 - off - 1, tY + 10, streakCol);
    b.line(BODY_X8 - off - 6, tY + 16, BODY_X8 - off, tY + 16, streakCol);

    // Subtle gold trim afterimage glint
    b.line(BODY_X8 - off - 4, tY + 18, BODY_X8 - off, tY + 18, pal.trimShade);
  }
}

export function drawDash(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawDashAfterimages(b, p);
  drawPose(b, p);
}
