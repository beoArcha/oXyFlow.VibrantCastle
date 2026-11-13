/**
 * Aurelia — dash animation
 * painted reference: aurelia_level_1_high_packed.png row dash
 * frames: 5, cell spans: [2, 2, 2, 2, 2]
 */

import { Brush, CX, drawPose, headY, torsoY, type Pose } from "./kit";

// ─── Dash (5 frames, 2 cells each) ─────────────────────────────────────────
// Spectral afterimages + horizontal phase streaks to x=95..96.
const POSES: Pose[] = [
  // 0 [2 cells]: Phase charge crouch; cyan glyphs shimmer to x=95
  {
    bob: 5, lean: 4,
    legL: { x: -7, lift: 0, kneeX: -8 },
    legR: { x: 7,  lift: 0, kneeX: 8 },
    robeFlare: 4, hairWind: 4,
    staff: { grip: [CX + 8, 42], tip: [72, 44] },
    dashAfterimages: true,
    magic: { kind: "dash_trail", minX: 16, maxX: 95, y: 44, h: 14 },
  },
  // 1 [2 cells]: Phase shift launch; spectral afterimages stretch back to x=16
  {
    bob: 4, lean: 6,
    legL: { x: -9, lift: 0, kneeX: -9 },
    legR: { x: 9,  lift: 0, kneeX: 9 },
    robeFlare: 8, hairWind: 7,
    staff: { grip: [CX + 10, 40], tip: [78, 38] },
    dashAfterimages: true,
    magic: { kind: "dash_trail", minX: 16, maxX: 96, y: 40, h: 16 },
  },
  // 2 [2 cells]: Spectral transit apex; arrow glide
  {
    bob: 3, lean: 6,
    legL: { x: -9, lift: 0, kneeX: -9 },
    legR: { x: 9,  lift: 0, kneeX: 9 },
    robeFlare: 8, hairWind: 8,
    staff: { grip: [CX + 11, 39], tip: [80, 36] },
    dashAfterimages: true,
    magic: { kind: "dash_trail", minX: 16, maxX: 96, y: 38, h: 16 },
  },
  // 3 [2 cells]: Phase deceleration; staff brakes outward
  {
    bob: 4, lean: 4,
    legL: { x: -8, lift: 0, kneeX: -8 },
    legR: { x: 8,  lift: 0, kneeX: 8 },
    robeFlare: 6, hairWind: 5,
    staff: { grip: [CX + 9, 40], tip: [76, 40] },
    dashAfterimages: true,
    magic: { kind: "dash_trail", minX: 16, maxX: 95, y: 42, h: 14 },
  },
  // 4 [2 cells]: Ground skid & upright transition; friction embers
  {
    bob: 3, lean: 2,
    legL: { x: -6, lift: 0, kneeX: -6 },
    legR: { x: 6,  lift: 0, kneeX: 5 },
    robeFlare: 4, hairWind: 3,
    staff: { grip: [CX + 8, 38], tip: [70, 34] },
    dashAfterimages: true,
    magic: { kind: "dash_trail", minX: 16, maxX: 95, y: 48, h: 12 },
  },
];

// Draw Dash Afterimage Ghosts
function drawDashGhosts(b: Brush, p: Pose): void {
  const { pal } = b;
  const tY = torsoY(p);
  const hY = headY(p);

  // Ghost 1 (shifted -8px)
  b.rect(CX - 14 + p.lean, tY + 2, 10, 10, pal.robeShade);
  b.rect(CX - 12 + p.lean, hY + 2, 7, 6, pal.hairShade);

  // Ghost 2 (shifted -16px)
  b.rect(CX - 22 + p.lean, tY + 3, 8, 8, pal.robeShade);
  b.rect(CX - 20 + p.lean, hY + 3, 6, 5, pal.hairShade);
}

export function drawDash(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  if (p.dashAfterimages) {
    drawDashGhosts(b, p);
  }
  drawPose(b, p);
}
