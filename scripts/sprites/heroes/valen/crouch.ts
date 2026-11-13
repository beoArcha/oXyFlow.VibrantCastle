/**
 * Valen — crouch animation
 * painted reference: valen_level_1_high_packed.png row crouch
 * frames: 2, cell spans: [1, 1]
 */

import {
  BODY_X8,
  FLOOR8,
  Brush,
  getHipY,
  drawLegs,
  drawTorso,
  drawLeftArm,
  drawHead,
  drawRapier,
  type Pose,
} from "./kit";

// ─── Crouch (2 frames, FPS 8, loop: true) ─────────────────────────────────
// Clearly lower (~70 % of standing height), knees bent outward, coat pooling
const POSES: Pose[] = [
  // 0: drop transition (torso dropped 17px, ~72% of standing height)
  {
    bob: 17, lean: 1,
    legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 12 },
    legR: { x: BODY_X8 + 7, lift: 0, kneeX: BODY_X8 + 12 },
    coat: "crouch_bunch", armL: "crouch",
    hiltOffset: [4, 15], tipPos: [BODY_X8 + 18, 52],
  },
  // 1: full grounded deep crouch (torso dropped 19px, ~70% of standing height)
  {
    bob: 19, lean: 0,
    legL: { x: BODY_X8 - 9, lift: 0, kneeX: BODY_X8 - 14 },
    legR: { x: BODY_X8 + 8, lift: 0, kneeX: BODY_X8 + 13 },
    coat: "crouch_bunch", armL: "crouch",
    hiltOffset: [4, 16], tipPos: [BODY_X8 + 19, 54],
    spectacleGlint: true,
  },
];

// Greatcoat pooling widely across the floor during crouch
function drawCrouchCoatPool(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const hipY = getHipY(p);
  const poolLeft = BODY_X8 - 15 + p.lean;
  const poolRight = BODY_X8 + 13 + p.lean;
  const poolW = poolRight - poolLeft + 1;
  const waistX = BODY_X8 - 8 + p.lean;
  const waistW = 16;

  // Waist and upper thigh drapery connecting smoothly to compressed hips
  b.rect(waistX, hipY - 2, waistW, 3, pal.coat);
  b.rect(waistX - 2, hipY + 1, waistW + 4, 3, pal.coat);

  // Deep pooled mass expanding across the ground
  b.rect(poolLeft + 2, hipY + 3, poolW - 4, FLOOR8 - (hipY + 3) + 1, pal.coat);
  b.rect(poolLeft, FLOOR8 - 3, poolW, 4, pal.coat);
  b.rect(poolLeft, FLOOR8 - 1, poolW, 2, pal.coatShade);

  // Gold trim on pooled lower edge and fold creases
  b.rect(poolLeft, FLOOR8, poolW, 1, pal.trim);
  b.rect(poolLeft + 2, FLOOR8 - 3, 5, 1, pal.trim);
  b.rect(poolRight - 7, FLOOR8 - 3, 5, 1, pal.trim);

  if (detailed) {
    b.rect(waistX - 1, hipY, 3, 4, pal.coatLight);
    b.line16(
      Math.round(poolLeft * 2),
      Math.round(FLOOR8 * 2),
      Math.round((poolLeft + 7) * 2),
      Math.round((FLOOR8 - 3) * 2),
      pal.coatLight,
    );
    b.line16(
      Math.round((poolRight - 7) * 2),
      Math.round((FLOOR8 - 3) * 2),
      Math.round(poolRight * 2),
      Math.round(FLOOR8 * 2),
      pal.coatLight,
    );
    b.rect(poolLeft, FLOOR8, poolW, 1, pal.trimShade);
  }
}

export function drawCrouch(b: Brush, frame: number, _span: number): void {
  const p = POSES[frame % POSES.length] ?? POSES[0]!;
  drawCrouchCoatPool(b, p);
  drawLegs(b, p);
  drawTorso(b, p);
  drawLeftArm(b, p);
  drawHead(b, p);
  drawRapier(b, p);
}
