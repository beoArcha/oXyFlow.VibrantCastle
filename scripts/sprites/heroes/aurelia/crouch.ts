/**
 * Aurelia — crouch animation
 * painted reference: aurelia_level_1_high_packed.png row crouch
 * frames: 2, cell spans: [2, 2]
 */

import { Brush, CX, drawPose, type Pose } from "./kit";

// ─── Crouch (2 frames, 2 cells each) ───────────────────────────────────────
// Clearly lower (~70% standing height: 48 px / 96 px in hi-16bit).
// Staff rested across thighs, protective barrier to x=86.
const POSES: Pose[] = [
  // 0 [2 cells]: Low drop transition
  {
    bob: 8, lean: 2,
    legL: { x: -7, lift: 0, kneeX: -9 },
    legR: { x: 6,  lift: 0, kneeX: 8 },
    robeFlare: 5, hairWind: 1,
    staff: { grip: [CX + 4, 46], tip: [CX + 18, 46] },
    magic: { kind: "sigil", minX: CX + 18, maxX: 86, y: 40, h: 16 },
  },
  // 1 [2 cells]: Grounded predatory coil; compact feline squat
  {
    bob: 11, lean: 1,
    legL: { x: -8, lift: 0, kneeX: -10 },
    legR: { x: 7,  lift: 0, kneeX: 9 },
    robeFlare: 6, hairWind: 0,
    staff: { grip: [CX + 3, 49], tip: [CX + 17, 49] },
    magic: { kind: "sigil", minX: CX + 17, maxX: 86, y: 44, h: 14 },
  },
];

export function drawCrouch(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
}
