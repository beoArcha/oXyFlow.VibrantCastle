/**
 * Aurelia — cast animation
 * painted reference: aurelia_level_1_high_packed.png row cast
 * frames: 7, cell spans: [2, 1, 2, 2, 2, 2, 2]
 */

import { Brush, CX, drawPose, FLOOR8, type Pose } from "./kit";

// ─── Cast (7 frames: [2, 1, 2, 2, 2, 2, 2] cells) ──────────────────────────
const POSES: Pose[] = [
  // 0 [2 cells]: Incantation drop & focus; summoning circle hovering to x=94
  {
    bob: 1, lean: 0,
    legL: { x: -6, lift: 0, kneeX: -5 },
    legR: { x: 5,  lift: 0, kneeX: 4 },
    robeFlare: 2, hairWind: 0,
    staff: { grip: [CX + 7, 33], tip: [CX + 7, FLOOR8 - 2] },
    magic: { kind: "sigil", minX: 68, maxX: 94, y: 24, h: 14 },
  },
  // 1 [1 cell]: Harmonic resonance; both hands channel energy
  {
    bob: 0, lean: 1,
    legL: { x: -5, lift: 0, kneeX: -4 },
    legR: { x: 4,  lift: 0, kneeX: 3 },
    robeFlare: 1, hairWind: 1,
    staff: { grip: [CX + 6, 32], tip: [CX + 12, 12] },
    magic: { kind: "vortex", minX: CX + 8, maxX: CX + 16, y: 22, h: 10 },
  },
  // 2 [2 cells]: Sigil manifestation; circular Aether glyph to x=95
  {
    bob: 0, lean: 2,
    legL: { x: -6, lift: 0, kneeX: -5 },
    legR: { x: 5,  lift: 0, kneeX: 4 },
    robeFlare: 3, hairWind: 2,
    staff: { grip: [CX + 8, 32], tip: [66, 26] },
    magic: { kind: "sigil", minX: 62, maxX: 95, y: 18, h: 22 },
  },
  // 3 [2 cells]: Arcane barrier ignition; rotating shield disc to x=96
  {
    bob: 1, lean: 3,
    legL: { x: -7, lift: 0, kneeX: -6 },
    legR: { x: 6,  lift: 0, kneeX: 5 },
    robeFlare: 4, hairWind: 3,
    staff: { grip: [CX + 9, 32], tip: [68, 26] },
    magic: { kind: "shield", minX: 64, maxX: 96, y: 14, h: 26 },
  },
  // 4 [2 cells]: Spell detonation pulse; celestial disc shockwave rays to x=96
  {
    bob: 1, lean: 3,
    legL: { x: -7, lift: 0, kneeX: -6 },
    legR: { x: 6,  lift: 0, kneeX: 5 },
    robeFlare: 5, hairWind: 4,
    staff: { grip: [CX + 10, 32], tip: [70, 26] },
    magic: { kind: "blast", minX: 62, maxX: 96, y: 12, h: 30 },
  },
  // 5 [2 cells]: Energy sustain & discharge; pulsing concentric rings to x=95
  {
    bob: 0, lean: 2,
    legL: { x: -6, lift: 0, kneeX: -5 },
    legR: { x: 5,  lift: 0, kneeX: 4 },
    robeFlare: 3, hairWind: 2,
    staff: { grip: [CX + 8, 32], tip: [68, 26] },
    magic: { kind: "sigil", minX: 64, maxX: 95, y: 16, h: 24 },
  },
  // 6 [2 cells]: Arcane dissipation & rest; barrier shatters into motes to x=94
  {
    bob: 0, lean: 1,
    legL: { x: -5, lift: 0, kneeX: -4 },
    legR: { x: 4,  lift: 0, kneeX: 3 },
    robeFlare: 2, hairWind: 1,
    staff: { grip: [CX + 6, 33], tip: [CX + 13, 16] },
    magic: { kind: "motes", minX: 58, maxX: 94, y: 20, h: 18 },
  },
];

export function drawCast(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawPose(b, p);
}
