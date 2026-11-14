import type { AnimationName, SpriteAtlasMap } from "./spriteTypes";

export interface PlayerAnimationInput {
  vx: number;
  vy: number;
  isAttacking: boolean;
  attackTime: number;
  isDashing: boolean;
  dashTime?: number;
  isCasting?: boolean;
  castTime?: number;
  isCrouching: boolean;
  isGrounded: boolean;
}

export interface PlayerAnimationSelection {
  state: AnimationName;
  /** undefined lets looping tracks advance on the game tick instead of the action timer. */
  frameIndex: number | undefined;
}

/** Action timers start at these values in `PlayerController`; frames follow the remaining time. */
export const ATTACK_DURATION_TICKS = 14;
export const DASH_DURATION_TICKS = 13;
export const CAST_DURATION_TICKS = 16;

function timedFrame(remaining: number, duration: number, frameCount: number): number {
  const progress = Math.max(0, Math.min(0.99, 1 - remaining / duration));
  return Math.min(Math.floor(progress * frameCount), frameCount - 1);
}

function trackLength(spriteMap: SpriteAtlasMap | null | undefined, name: AnimationName, fallback: number): number {
  return spriteMap?.animations[name]?.frameCount || fallback;
}

/** Picks the hero animation and, for timed actions, the frame of the current tick. */
export function resolvePlayerAnimation(
  player: PlayerAnimationInput,
  spriteMap: SpriteAtlasMap | null | undefined
): PlayerAnimationSelection {
  if (player.isAttacking) {
    const frames = trackLength(spriteMap, "attack", 6);
    return { state: "attack", frameIndex: timedFrame(player.attackTime, ATTACK_DURATION_TICKS, frames) };
  }
  if (player.isDashing) {
    const frames = trackLength(spriteMap, "dash", 4);
    return { state: "dash", frameIndex: timedFrame(player.dashTime ?? 0, DASH_DURATION_TICKS, frames) };
  }
  if (player.isCasting) {
    const frames = trackLength(spriteMap, "cast", 6);
    return { state: "cast", frameIndex: timedFrame(player.castTime ?? 0, CAST_DURATION_TICKS, frames) };
  }
  if (player.isCrouching) return { state: "crouch", frameIndex: undefined };
  if (!player.isGrounded) {
    if (player.vy < -0.5) return { state: "jump", frameIndex: Math.min(2, Math.floor(Math.abs(player.vy) / 4)) };
    return { state: "fall", frameIndex: undefined };
  }
  if (Math.abs(player.vx) > 0.5) return { state: "run", frameIndex: undefined };
  return { state: "idle", frameIndex: undefined };
}
