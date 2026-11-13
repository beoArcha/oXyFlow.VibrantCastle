/**
 * Valen — fall animation
 * painted reference: valen_level_1_high_packed.png row fall
 * frames: 1, cell spans: [1]
 */

import { BODY_X8, Brush, drawPose, type Pose } from "./kit";

// ─── Fall (1 frame, FPS 6, loop: true) ────────────────────────────────────
// Controlled descent: legs extended, coat streaming UP
const POSES: Pose[] = [
  {
    bob: 0, lean: 0,
    legL: { x: BODY_X8 - 5, lift: 0, kneeX: BODY_X8 - 5 },
    legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
    coat: "stream_up", armL: "rest",
    hiltOffset: [6, 18], tipPos: [BODY_X8 + 18, 43],
  },
];

export function drawFall(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
}
