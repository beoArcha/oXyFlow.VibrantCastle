/**
 * Valen — jump animation
 * painted reference: valen_level_1_high_packed.png row jump
 * frames: 3, cell spans: [1, 1, 1]
 */

import { BODY_X8, Brush, drawPose, type Pose } from "./kit";

// ─── Jump (3 frames, FPS 6, loop: false) ──────────────────────────────────
// Launch compression -> tucked knees with coat flaring up -> apex reach
const POSES: Pose[] = [
  // 0: Launch compression, knees bent out, toes snapping off floor
  {
    bob: 0.5, lean: 2,
    legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 8 },
    legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 6 },
    coat: "rest", armL: "rest",
    hiltOffset: [5, 20], tipPos: [BODY_X8 + 17, 34],
  },
  // 1: Upward rise: knees tucked high, coat flaring UPWARDS, trailing toe touches floor
  {
    bob: 0, lean: 1,
    legL: { x: BODY_X8 - 5, lift: 0, kneeX: BODY_X8 - 6 },  // trailing toe touches y=63
    legR: { x: BODY_X8 + 4, lift: 10, kneeX: BODY_X8 + 5 }, // right knee tucked high
    coat: "flare_up", armL: "parry",
    hiltOffset: [6, 15], tipPos: [BODY_X8 + 19, 21],
  },
  // 2: Apex crest: legs extending downward, blade angled down-forward
  {
    bob: 0, lean: 0,
    legL: { x: BODY_X8 - 4, lift: 0, kneeX: BODY_X8 - 4 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
    coat: "flare_up", armL: "rest",
    hiltOffset: [6, 18], tipPos: [BODY_X8 + 18, 39],
  },
];

export function drawJump(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
}
