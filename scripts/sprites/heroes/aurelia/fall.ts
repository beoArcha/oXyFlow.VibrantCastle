/**
 * Aurelia — fall animation
 * painted reference: aurelia_level_1_high_packed.png row fall
 * frames: 3, cell spans: [1, 2, 1]
 */

import { Brush, CX, drawPose, type Pose } from "./kit";

// ─── Fall (3 frames: [1, 2, 1] cells) ──────────────────────────────────────
const POSES: Pose[] = [
  // 0 [1 cell]: Descent initiation; toes pointed down
  {
    bob: 0, lean: 1,
    legL: { x: -4, lift: 0, kneeX: -3 },
    legR: { x: 4,  lift: 0, kneeX: 3 },
    robeFlare: 3, hairWind: -3,
    staff: { grip: [CX + 6, 31], tip: [CX + 13, 10] },
  },
  // 1 [2 cells]: Aerodynamic terminal drop; wide arms and billowing robes
  {
    bob: -1, lean: 2,
    legL: { x: -6, lift: 0, kneeX: -4 },
    legR: { x: 7,  lift: 0, kneeX: 5 },
    robeFlare: 14, hairWind: -4,
    staff: { grip: [CX + 8, 30], tip: [CX + 20, 16] },
  },
  // 2 [1 cell]: Pre-landing flare; knees bending to absorb impact
  {
    bob: 2, lean: 1,
    legL: { x: -5, lift: 0, kneeX: -6 },
    legR: { x: 5,  lift: 0, kneeX: 6 },
    robeFlare: 3, hairWind: 0,
    staff: { grip: [CX + 6, 33], tip: [CX + 14, 20] },
  },
];

export function drawFall(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
}
