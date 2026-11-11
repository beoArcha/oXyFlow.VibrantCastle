/**
 * Movement constants mirrored from the engine. The originals are `private readonly`
 * class fields, so they cannot be imported; keep these in sync when tuning the feel.
 */
export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 48;

const kinematics = {
  /** src/game/physics/playerKinematics.ts:16 */
  baseGravity: 0.42,
  /** src/game/physics/playerKinematics.ts:17 */
  fallGravity: 0.62,
  /** src/game/physics/playerKinematics.ts:18 */
  lowJumpGravity: 0.85,
  /** src/game/physics/playerKinematics.ts:19 */
  apexGravityMultiplier: 0.45,
  /** src/game/physics/playerKinematics.ts:20 */
  maxFallSpeed: 11.5,
  /** src/game/physics/playerKinematics.ts:27 */
  maxRunSpeed: 4.8,
  /** src/game/physics/playerKinematics.ts:30 */
  initialJumpForce: -7.8,
  /** src/game/physics/playerKinematics.ts:31 */
  maxJumpHoldDuration: 12,
  /** src/game/physics/playerKinematics.ts:32 */
  jumpHoldAcceleration: -0.32,
  /** src/game/physics/playerKinematics.ts:37 */
  dashSpeed: 10.5,
  /** src/game/engine/playerController.ts:29 */
  dashDurationTicks: 13,
  /** Below this upward speed the apex float gravity applies (playerKinematics.ts applyGravity). */
  apexFloatSpeed: 1.8,
};

export const KINEMATICS: Readonly<Record<keyof typeof kinematics, number>> = kinematics;

/** src/game/engine/combatSystem.ts:62 */
export const SWORD_REACH = 40;

/** src/game/loop/enginePlayerUpdateStep.ts:191 (player dies below levelHeight + 100). */
export const PIT_DEATH_MARGIN = 100;

/** maxRisePx is the lowest apex across the 30/60/90/120 Hz tick rates (60 Hz alone gives ~112.8px). */
export const DESIGN_LIMITS = {
  maxRisePx: 109,
  comfortableRisePx: 96,
  maxFlatGapPx: 216,
  comfortableFlatGapPx: 170,
  dashDistancePx: 136,
};

export const SPAWN_MAX_DROP = 64;
export const ENEMY_FEET_EMBED_TOLERANCE = 8;
export const ENEMY_FEET_AIR_TOLERANCE = 4;
export const DEFAULT_ENEMY_PATROL_RADIUS = 120;
export const PORTAL_SPAWN_PAD = 15;

export type Tier = "C" | "M" | "D";
export const TIERS: readonly Tier[] = ["C", "M", "D"];

/**
 * C = comfortable (core path), M = maximum skill without dash, D = maximum skill with one air dash.
 */
export interface TierConfig {
  readonly maxSpeed: number;
  readonly minOverlap: number;
  readonly dash: boolean;
}

export const TIER_CONFIG: Readonly<Record<Tier, TierConfig>> = {
  C: { maxSpeed: 4.3, minOverlap: 16, dash: false },
  M: { maxSpeed: KINEMATICS.maxRunSpeed, minOverlap: 2, dash: false },
  D: { maxSpeed: KINEMATICS.maxRunSpeed, minOverlap: 2, dash: true },
};
