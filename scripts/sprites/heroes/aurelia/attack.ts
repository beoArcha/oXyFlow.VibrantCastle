/**
 * Aurelia — attack animation
 * painted reference: aurelia_level_1_high_packed.png row attack
 * frames: 7, cell spans: [2, 2, 2, 2, 2, 2, 3]
 */

import { Brush, CX, drawPose, type Pose } from "./kit";

// ─── Attack (7 frames: [2, 2, 2, 2, 2, 2, 3] cells) ───────────────────────
// CRITICAL: All span-2 frames (0..5) reach x ~ 95..96 to eliminate drift!
const POSES: Pose[] = [
  // 0 [2 cells]: Arc windup coil; swirling vortex gathering to x=95
  {
    bob: 1, lean: -2,
    legL: { x: -6, lift: 0, kneeX: -5 },
    legR: { x: 4,  lift: 0, kneeX: 3 },
    robeFlare: 2, hairWind: -1,
    staff: { grip: [CX + 2, 32], tip: [CX - 8, 14] },
    magic: { kind: "vortex", minX: 65, maxX: 95, y: 26, h: 14 },
  },
  // 1 [2 cells]: Step lunge & low crescent arc igniting forward to x=95
  {
    bob: 1, lean: 3,
    legL: { x: -8, lift: 0, kneeX: -6 },
    legR: { x: 7,  lift: 0, kneeX: 6 },
    robeFlare: 4, hairWind: 3,
    staff: { grip: [CX + 10, 33], tip: [68, 36] },
    magic: { kind: "arc", minX: 66, maxX: 95, y: 32, h: 8 },
  },
  // 2 [2 cells]: Crescent sweep slash; vibrant Aether blade manifests to x=96
  {
    bob: 1, lean: 5,
    legL: { x: -8, lift: 0, kneeX: -6 },
    legR: { x: 8,  lift: 0, kneeX: 7 },
    robeFlare: 6, hairWind: 5,
    staff: { grip: [CX + 12, 33], tip: [74, 30] },
    magic: { kind: "blade", minX: 70, maxX: 96, y: 24, h: 14 },
  },
  // 3 [2 cells]: Rising arc cleave; luminous cyan energy erupts to x=96
  {
    bob: 0, lean: 5,
    legL: { x: -8, lift: 0, kneeX: -6 },
    legR: { x: 8,  lift: 0, kneeX: 7 },
    robeFlare: 6, hairWind: 6,
    staff: { grip: [CX + 12, 31], tip: [72, 16] },
    magic: { kind: "wave", minX: 68, maxX: 96, y: 12, h: 22 },
  },
  // 4 [2 cells]: Overhead slash release; crescent cuts forward to x=96
  {
    bob: 1, lean: 4,
    legL: { x: -7, lift: 0, kneeX: -5 },
    legR: { x: 7,  lift: 0, kneeX: 6 },
    robeFlare: 5, hairWind: 4,
    staff: { grip: [CX + 11, 32], tip: [74, 26] },
    magic: { kind: "blade", minX: 70, maxX: 96, y: 22, h: 14 },
  },
  // 5 [2 cells]: Follow-through & energy rip; lingering ember motes to x=95
  {
    bob: 1, lean: 3,
    legL: { x: -6, lift: 0, kneeX: -5 },
    legR: { x: 6,  lift: 0, kneeX: 5 },
    robeFlare: 3, hairWind: 3,
    staff: { grip: [CX + 9, 33], tip: [68, 30] },
    magic: { kind: "motes", minX: 66, maxX: 95, y: 26, h: 10 },
  },
  // 6 [3 cells]: Master Aether wave; colossal shockwave surges to x=155
  {
    bob: 0, lean: 2,
    legL: { x: -6, lift: 0, kneeX: -5 },
    legR: { x: 5,  lift: 0, kneeX: 4 },
    robeFlare: 3, hairWind: 2,
    staff: { grip: [CX + 7, 32], tip: [CX + 14, 12] },
    magic: { kind: "wave", minX: CX + 16, maxX: 155, y: 16, h: 32 },
  },
];

export function drawAttack(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
}
