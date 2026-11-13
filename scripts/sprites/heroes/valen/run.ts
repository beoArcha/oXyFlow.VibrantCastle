/**
 * Valen — run animation
 * painted reference: valen_level_1_high_packed.png row run
 * frames: 12, cell spans: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
 */

import { BODY_X8, Brush, drawPose, type Pose } from "./kit";

// ─── Run (12 frames, FPS 12, loop: true) ──────────────────────────────────
// Dynamic stride cycle: alternating legs, arm swing, flapping coat tails, slight stride compression
const POSES: Pose[] = [
  // 0: Right heel strike forward, left leg high rear
  {
    bob: 0, lean: 2,
    legL: { x: BODY_X8 - 10, lift: 8, kneeX: BODY_X8 - 7 },
    legR: { x: BODY_X8 + 7, lift: 0, kneeX: BODY_X8 + 5 },
    coat: "billow_back", coatShift: 3, armL: "pump_back",
    hiltOffset: [5, 17], tipPos: [BODY_X8 + 18, 30],
  },
  // 1: Right leg absorbs weight, left driving through
  {
    bob: 0.5, lean: 3,
    legL: { x: BODY_X8 - 6, lift: 5, kneeX: BODY_X8 - 3 },
    legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 6 },
    coat: "billow_back", coatShift: 2, armL: "pump_back",
    hiltOffset: [5, 18], tipPos: [BODY_X8 + 17, 33],
  },
  // 2: Right toe push-off, left knee driving forward
  {
    bob: 0, lean: 3,
    legL: { x: BODY_X8 - 2, lift: 7, kneeX: BODY_X8 + 2 },
    legR: { x: BODY_X8 + 1, lift: 0, kneeX: BODY_X8 + 2 },
    coat: "billow_back", coatShift: 4, armL: "rest",
    hiltOffset: [6, 17], tipPos: [BODY_X8 + 18, 31],
  },
  // 3: Flight transition: right toe trailing on floor y=63
  {
    bob: 0, lean: 4,
    legL: { x: BODY_X8 + 4, lift: 5, kneeX: BODY_X8 + 6 },
    legR: { x: BODY_X8 - 5, lift: 0, kneeX: BODY_X8 - 3 },
    coat: "billow_back", coatShift: 5, armL: "pump_forward",
    hiltOffset: [6, 17], tipPos: [BODY_X8 + 19, 29],
  },
  // 4: Left foot reaching to land, right leg trailing
  {
    bob: 0, lean: 3,
    legL: { x: BODY_X8 + 6, lift: 0, kneeX: BODY_X8 + 4 },
    legR: { x: BODY_X8 - 8, lift: 6, kneeX: BODY_X8 - 6 },
    coat: "billow_back", coatShift: 4, armL: "pump_forward",
    hiltOffset: [5, 17], tipPos: [BODY_X8 + 18, 30],
  },
  // 5: Left foot flat contact, right sweeping forward
  {
    bob: 0.5, lean: 3,
    legL: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 5 },
    legR: { x: BODY_X8 - 5, lift: 4, kneeX: BODY_X8 - 2 },
    coat: "billow_back", coatShift: 3, armL: "pump_forward",
    hiltOffset: [5, 18], tipPos: [BODY_X8 + 17, 32],
  },
  // 6: Left push-off initiate, right knee driving high
  {
    bob: 0, lean: 2,
    legL: { x: BODY_X8 + 7, lift: 0, kneeX: BODY_X8 + 5 },
    legR: { x: BODY_X8 - 10, lift: 8, kneeX: BODY_X8 - 7 },
    coat: "billow_back", coatShift: 2, armL: "pump_back",
    hiltOffset: [5, 17], tipPos: [BODY_X8 + 18, 30],
  },
  // 7: Left leg weight absorption, right passing stance
  {
    bob: 0.5, lean: 3,
    legL: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 6 },
    legR: { x: BODY_X8 - 6, lift: 5, kneeX: BODY_X8 - 3 },
    coat: "billow_back", coatShift: 3, armL: "pump_back",
    hiltOffset: [5, 18], tipPos: [BODY_X8 + 17, 33],
  },
  // 8: Left toe push-off, right driving forward
  {
    bob: 0, lean: 3,
    legL: { x: BODY_X8 + 1, lift: 0, kneeX: BODY_X8 + 2 },
    legR: { x: BODY_X8 - 2, lift: 7, kneeX: BODY_X8 + 2 },
    coat: "billow_back", coatShift: 4, armL: "rest",
    hiltOffset: [6, 17], tipPos: [BODY_X8 + 18, 31],
  },
  // 9: Second flight transition: left toe trailing on floor y=63
  {
    bob: 0, lean: 4,
    legL: { x: BODY_X8 - 5, lift: 0, kneeX: BODY_X8 - 3 },
    legR: { x: BODY_X8 + 4, lift: 5, kneeX: BODY_X8 + 6 },
    coat: "billow_back", coatShift: 5, armL: "pump_forward",
    hiltOffset: [6, 17], tipPos: [BODY_X8 + 19, 29],
  },
  // 10: Right foot reaching to land, left leg trailing
  {
    bob: 0, lean: 3,
    legL: { x: BODY_X8 - 8, lift: 6, kneeX: BODY_X8 - 6 },
    legR: { x: BODY_X8 + 6, lift: 0, kneeX: BODY_X8 + 4 },
    coat: "billow_back", coatShift: 4, armL: "pump_forward",
    hiltOffset: [5, 17], tipPos: [BODY_X8 + 18, 30],
  },
  // 11: Stride reset, weight rolling forward
  {
    bob: 0.5, lean: 2,
    legL: { x: BODY_X8 - 5, lift: 4, kneeX: BODY_X8 - 2 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 5 },
    coat: "billow_back", coatShift: 3, armL: "pump_forward",
    hiltOffset: [5, 18], tipPos: [BODY_X8 + 17, 32],
  },
];

export function drawRun(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
}
