/**
 * Aurelia — jump animation
 * painted reference: aurelia_level_1_high_packed.png row jump
 * frames: 3, cell spans: [1, 1, 1]
 */

import { Brush, CX, drawPose, type Pose } from "./kit";

// ─── Jump (3 frames, 1 cell each) ──────────────────────────────────────────
const POSES: Pose[] = [
  // 0: Compression launch coil
  {
    bob: 3, lean: 1,
    legL: { x: -6, lift: 0, kneeX: -7 },
    legR: { x: 5,  lift: 0, kneeX: 6 },
    robeFlare: 2, hairWind: 1,
    staff: { grip: [CX + 5, 33], tip: [CX + 12, 16] },
  },
  // 1: Upward ascension; legs tucked in mid-air coil, toe touches y=71
  {
    bob: -1, lean: 2,
    legL: { x: -3, lift: 0, kneeX: -5 },
    legR: { x: 4,  lift: 0, kneeX: 2 },
    robeFlare: 3, hairWind: -2,
    staff: { grip: [CX + 6, 30], tip: [CX + 13, 8] },
  },
  // 2: Aerial apex; graceful straighten, hair flaring up, staff 45 deg down
  {
    bob: 0, lean: 1,
    legL: { x: -4, lift: 0, kneeX: -3 },
    legR: { x: 4,  lift: 0, kneeX: 3 },
    robeFlare: 4, hairWind: -3,
    staff: { grip: [CX + 7, 31], tip: [CX + 15, 26] },
  },
];

export function drawJump(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
}
