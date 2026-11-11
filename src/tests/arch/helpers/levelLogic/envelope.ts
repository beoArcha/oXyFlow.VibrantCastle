import { KINEMATICS as K } from "./constants";

export interface JumpEnvelope {
  /** Highest rise above the take-off feet line, px. */
  apexPx: number;
  /** Horizontal distance covered when feet return to the take-off height, px. */
  flatGapPx: number;
  airTicks: number;
}

/**
 * Closed-form replay of one jump at the 60 Hz baseline: the numbers the level design limits derive from.
 * `holdTicks` is how long the jump button stays pressed; speed is a constant horizontal speed in px/tick.
 */
export function simulateJump(holdTicks: number, speed: number = K.maxRunSpeed): JumpEnvelope {
  let vy = K.initialJumpForce;
  let holdTimer = K.maxJumpHoldDuration;
  let y = 0;
  let apex = 0;
  for (let t = 0; t < 600; t++) {
    const held = t < holdTicks;
    if (held && holdTimer > 0 && vy < 0) {
      vy += K.jumpHoldAcceleration;
      holdTimer--;
    } else if (!held) {
      holdTimer = 0;
    }
    let g = K.fallGravity;
    if (vy < 0) g = -vy < K.apexFloatSpeed ? K.baseGravity * K.apexGravityMultiplier : held ? K.baseGravity : K.lowJumpGravity;
    vy = Math.min(K.maxFallSpeed, vy + g);
    y += vy;
    apex = Math.min(apex, y);
    if (vy > 0 && y >= 0) return { apexPx: -apex, flatGapPx: speed * (t + 1), airTicks: t + 1 };
  }
  return { apexPx: -apex, flatGapPx: Infinity, airTicks: 600 };
}

/** Flat gap reachable with one air dash at the jump apex (dash adds distance but no height). */
export const dashedFlatGap = (holdTicks: number): number =>
  simulateJump(holdTicks).flatGapPx + K.dashDurationTicks * K.dashSpeed;
