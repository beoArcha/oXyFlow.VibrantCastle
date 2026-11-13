/**
 * Valen — idle animation
 * painted reference: valen_level_1_high_packed.png row idle
 * frames: 12, cell spans: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
 */

import { BODY_X8, Brush, drawPose, type Pose } from "./kit";

// ─── Idle (12 frames, FPS 8, loop: true) ──────────────────────────────────
// Classical fencing rest with subtle breathing rhythm and blade tip bob
const POSES: Pose[] = [
  // 0: neutral rest, duelist breath out
  {
    bob: 0, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "rest",
    hiltOffset: [6, 18], tipPos: [BODY_X8 + 19, 28],
  },
  // 1: neutral hold
  {
    bob: 0, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "rest",
    hiltOffset: [6, 18], tipPos: [BODY_X8 + 19, 27],
  },
  // 2: inhale begins (chest & head rise smoothly)
  {
    bob: -0.5, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "rest",
    hiltOffset: [6, 17], tipPos: [BODY_X8 + 19, 26],
  },
  // 3: inhale expands (blade tip raises smoothly)
  {
    bob: -0.5, lean: 1,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", coatShift: 1, armL: "rest",
    hiltOffset: [6, 17], tipPos: [BODY_X8 + 20, 24],
  },
  // 4: inhale peak (spectacles glint in ambient light)
  {
    bob: -0.5, lean: 1,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", coatShift: 1, armL: "rest",
    hiltOffset: [6, 17], tipPos: [BODY_X8 + 20, 23],
    spectacleGlint: true,
  },
  // 5: breath hold at peak
  {
    bob: -0.5, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "rest",
    hiltOffset: [6, 17], tipPos: [BODY_X8 + 19, 24],
    spectacleGlint: true,
  },
  // 6: exhale starts (shoulders drop back to neutral)
  {
    bob: 0, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "rest",
    hiltOffset: [6, 18], tipPos: [BODY_X8 + 19, 26],
  },
  // 7: exhale continues
  {
    bob: 0, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "rest",
    hiltOffset: [6, 18], tipPos: [BODY_X8 + 19, 28],
  },
  // 8: duelist settle (subtle downward compression, tip dips)
  {
    bob: 0.5, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 4 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
    coat: "rest", coatShift: -1, armL: "rest",
    hiltOffset: [6, 19], tipPos: [BODY_X8 + 18, 30],
  },
  // 9: deep settle rest
  {
    bob: 0.5, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 4 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
    coat: "rest", armL: "rest",
    hiltOffset: [6, 19], tipPos: [BODY_X8 + 18, 30],
  },
  // 10: elastic recovery rising
  {
    bob: 0, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "rest",
    hiltOffset: [6, 18], tipPos: [BODY_X8 + 19, 29],
  },
  // 11: recovery to neutral guard
  {
    bob: 0, lean: 0,
    legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
    coat: "rest", armL: "rest",
    hiltOffset: [6, 18], tipPos: [BODY_X8 + 19, 28],
    spectacleGlint: true,
  },
];

export function drawIdle(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
}
