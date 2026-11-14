import { CollisionType } from "../types/enums";
import type { Entity } from "../types/entities";
import { updateGateCollision } from "../physics/gateState";

export const STRUCTURE_STATE_INACTIVE = "inactive";
export const STRUCTURE_STATE_ACTIVE = "active";
export const STRUCTURE_STATE_ACTIVATING = "activating";

/** Lever pull animation length: 6 frames at 12 fps (see chrono_lever meta) = 0.5 s. */
export const LEVER_ACTIVATING_TICKS = 30;

function desiredLeverState(entity: Entity): string {
  if (!entity.isActivated) return STRUCTURE_STATE_INACTIVE;
  if (entity.animationState === STRUCTURE_STATE_ACTIVE) return STRUCTURE_STATE_ACTIVE;
  if (entity.animationState === STRUCTURE_STATE_ACTIVATING && (entity.animationTicks ?? 0) >= LEVER_ACTIVATING_TICKS) {
    return STRUCTURE_STATE_ACTIVE;
  }
  return STRUCTURE_STATE_ACTIVATING;
}

/**
 * Sets a structure animation state and restarts its clock at frame zero.
 * No-op for the clock when the state is unchanged.
 */
export function setStructureAnimationState(entity: Entity, state: string): void {
  if (entity.animationState === state && entity.animationTicks !== undefined) return;
  entity.animationState = state;
  entity.animationTicks = 0;
}

/**
 * Advances per-entity structure animation clocks in simulation time.
 *
 * `dt` is the fixed-step multiplier (1.0 == one 60 Hz tick), so `animationTicks`
 * accumulates 60 units per simulated second regardless of the engine tick rate.
 * Portals derive their state from `isActivated`; levers play `activating` once after being pulled, then `active`; the clock resets to 0
 * on every state change. Other structures only advance an already-started clock; opening gates also shrink their collision height.
 * Allocation-free.
 */
export function advanceStructureAnimations(entities: Entity[], dt: number): void {
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    if (entity.type === CollisionType.Lever || entity.type === CollisionType.Goal) {
      const desired =
        entity.type === CollisionType.Lever
          ? desiredLeverState(entity)
          : entity.isActivated
            ? STRUCTURE_STATE_ACTIVE
            : STRUCTURE_STATE_INACTIVE;
      if (entity.animationState !== desired || entity.animationTicks === undefined) {
        entity.animationState = desired;
        entity.animationTicks = 0;
        continue;
      }
      entity.animationTicks += dt;
    } else if (entity.animationTicks !== undefined) {
      entity.animationTicks += dt;
      if (entity.gateBaseHeight !== undefined) updateGateCollision(entity);
    }
  }
}
