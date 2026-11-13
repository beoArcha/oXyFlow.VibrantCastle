/**
 * Aurelia — run animation
 * painted reference: aurelia_level_1_high_packed.png row run
 * frames: 10, cell spans: [1, 1, 1, 1, 2, 1, 2, 1, 1, 1]
 */

import { Brush, CX, drawPose, type Pose } from "./kit";

// ─── Run (10 frames: [1, 1, 1, 1, 2, 1, 2, 1, 1, 1] cells) ────────────────
// Stride cycle with flowing robe tails and streaming hair.
// Staff stays authentic length (~18 px), held naturally!
// Span-2 frames 4 & 6 have matching minX ~ 16 and maxX ~ 49 (drift = 0).
const POSES: Pose[] = [
  // 0 [1 cell]: Right heel strike; right boot on y=71, left driving back
  {
    bob: 0, lean: 2,
    legL: { x: -7, lift: 0, kneeX: -5 },
    legR: { x: 4,  lift: 0, kneeX: 3 },
    robeFlare: 3, hairWind: 3,
    staff: { grip: [CX + 4, 33], tip: [CX + 14, 24] },
  },
  // 1 [1 cell]: Weight absorption; knee flexes deeply
  {
    bob: 1, lean: 3,
    legL: { x: -6, lift: 0, kneeX: -4 },
    legR: { x: 5,  lift: 0, kneeX: 4 },
    robeFlare: 4, hairWind: 4,
    staff: { grip: [CX + 5, 34], tip: [CX + 14, 25] },
  },
  // 2 [1 cell]: Stride push-off; toe snaps off, left swinging through
  {
    bob: 1, lean: 4,
    legL: { x: -4, lift: 0, kneeX: -2 },
    legR: { x: 6,  lift: 0, kneeX: 5 },
    robeFlare: 4, hairWind: 5,
    staff: { grip: [CX + 6, 33], tip: [CX + 15, 23] },
  },
  // 3 [1 cell]: Flight phase 1; feline sprint elongation
  {
    bob: 0, lean: 5,
    legL: { x: -6, lift: 0, kneeX: -4 },
    legR: { x: 7,  lift: 0, kneeX: 6 },
    robeFlare: 5, hairWind: 6,
    staff: { grip: [CX + 6, 32], tip: [CX + 15, 22] },
  },
  // 4 [2 cells]: Left foot plant & wide flare; robe tails whip out to x:16..49
  {
    bob: 0, lean: 4,
    legL: { x: 8,  lift: 0, kneeX: 6 },
    legR: { x: -9, lift: 0, kneeX: -7 },
    robeFlare: 15, hairWind: 7,
    staff: { grip: [CX + 6, 33], tip: [CX + 17, 24] },
  },
  // 5 [1 cell]: Left knee absorption; weight rolls forward
  {
    bob: 1, lean: 3,
    legL: { x: 5,  lift: 0, kneeX: 4 },
    legR: { x: -6, lift: 0, kneeX: -5 },
    robeFlare: 4, hairWind: 5,
    staff: { grip: [CX + 6, 33], tip: [CX + 15, 24] },
  },
  // 6 [2 cells]: Left toe launch & extension; wine robes stream to x:16..49
  {
    bob: 1, lean: 5,
    legL: { x: 7,  lift: 0, kneeX: 6 },
    legR: { x: -8, lift: 0, kneeX: -6 },
    robeFlare: 14, hairWind: 7,
    staff: { grip: [CX + 6, 33], tip: [CX + 17, 23] },
  },
  // 7 [1 cell]: Flight phase 2; gliding posture
  {
    bob: 0, lean: 4,
    legL: { x: -5, lift: 0, kneeX: -3 },
    legR: { x: 6,  lift: 0, kneeX: 5 },
    robeFlare: 4, hairWind: 5,
    staff: { grip: [CX + 5, 32], tip: [CX + 14, 22] },
  },
  // 8 [1 cell]: Right foot descent; reaching toward floor
  {
    bob: 0, lean: 3,
    legL: { x: -6, lift: 0, kneeX: -4 },
    legR: { x: 5,  lift: 0, kneeX: 4 },
    robeFlare: 3, hairWind: 4,
    staff: { grip: [CX + 5, 33], tip: [CX + 14, 23] },
  },
  // 9 [1 cell]: Stride reset transition; ready to loop
  {
    bob: 0, lean: 2,
    legL: { x: -5, lift: 0, kneeX: -3 },
    legR: { x: 4,  lift: 0, kneeX: 3 },
    robeFlare: 2, hairWind: 3,
    staff: { grip: [CX + 5, 33], tip: [CX + 14, 24] },
  },
];

export function drawRun(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
}
