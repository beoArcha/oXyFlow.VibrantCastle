/**
 * Aurelia — idle animation
 * painted reference: aurelia_level_1_high_packed.png row idle
 * frames: 6, cell spans: [1, 1, 1, 1, 1, 1]
 */

import { Brush, CX, drawPose, REST_POSE, type Pose } from "./kit";

// ─── Idle (6 frames, 1 cell each) ──────────────────────────────────────────
const POSES: Pose[] = [
  // 0: Neutral standing rest
  {
    ...REST_POSE,
    bob: 0, lean: 0,
    staff: { grip: [CX + 6, 32], tip: [CX + 13, 14] },
  },
  // 1: Inhale start (chest rises, staff tip floats up 1px)
  {
    ...REST_POSE,
    bob: -1, lean: 0,
    hairWind: 1,
    staff: { grip: [CX + 6, 31], tip: [CX + 13, 13] },
  },
  // 2: Inhale peak (subtle alert head tilt, spark at crystal)
  {
    ...REST_POSE,
    bob: -1, lean: 1,
    hairWind: 1,
    staff: { grip: [CX + 7, 31], tip: [CX + 14, 13] },
    magic: { kind: "vortex", minX: CX + 13, maxX: CX + 16, y: 13, h: 3 },
  },
  // 3: Hold breath (steady posture)
  {
    ...REST_POSE,
    bob: -1, lean: 1,
    hairWind: 0,
    staff: { grip: [CX + 7, 31], tip: [CX + 14, 14] },
  },
  // 4: Exhale start (shoulders settle)
  {
    ...REST_POSE,
    bob: 0, lean: 1,
    hairWind: 0,
    staff: { grip: [CX + 6, 32], tip: [CX + 13, 14] },
  },
  // 5: Exhale trough (relaxed return)
  {
    ...REST_POSE,
    bob: 0, lean: 0,
    hairWind: -1,
    staff: { grip: [CX + 6, 32], tip: [CX + 13, 15] },
  },
];

export function drawIdle(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
}
