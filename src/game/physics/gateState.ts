import { CollisionType } from "../types/enums";
import type { Entity } from "../types/entities";

export const GATE_STATE_CLOSED = "closed";
export const GATE_STATE_OPENING = "opening";
export const GATE_STATE_OPEN = "open";

/** Opening duration in animation-clock units (60 per simulated second): 1.2 s. */
export const GATE_OPEN_TICKS = 72;

/** True for a gate that finished opening; it no longer collides, is drawn or is hit by projectiles. */
export function isGateOpen(entity: Entity): boolean {
  return entity.animationState === GATE_STATE_OPEN && entity.gateBaseHeight !== undefined;
}

/** Opening progress 0..1 of a gate (0 closed, 1 open); non-gates report 0. */
export function gateOpenProgress(entity: Entity): number {
  if (entity.gateBaseHeight === undefined) return 0;
  if (entity.animationState === GATE_STATE_OPEN) return 1;
  if (entity.animationState !== GATE_STATE_OPENING) return 0;
  return Math.min(1, Math.max(0, (entity.animationTicks ?? 0) / GATE_OPEN_TICKS));
}

/** Full (closed) height of a gate, or the plain height of any other entity. */
export function gateFullHeight(entity: Entity): number {
  return entity.gateBaseHeight ?? entity.height;
}

/**
 * Starts opening a solid gate. Idempotent: an already opening or open gate keeps its progress.
 * The collision rect keeps its top and shrinks from the bottom as the portcullis lifts.
 */
export function beginOpeningGate(gate: Entity): boolean {
  if (gate.type !== CollisionType.Solid) return false;
  if (gate.gateBaseHeight === undefined) gate.gateBaseHeight = gate.height;
  if (gate.animationState === GATE_STATE_OPENING || gate.animationState === GATE_STATE_OPEN) return false;
  gate.animationState = GATE_STATE_OPENING;
  gate.animationTicks = 0;
  return true;
}

/** Applies the opening progress to the collision height. Allocation-free; no-op for non-gates. */
export function updateGateCollision(gate: Entity): void {
  if (gate.gateBaseHeight === undefined || gate.animationState !== GATE_STATE_OPENING) return;
  const progress = gateOpenProgress(gate);
  if (progress >= 1) {
    gate.animationState = GATE_STATE_OPEN;
    gate.height = 0;
    return;
  }
  gate.height = Math.max(1, Math.round(gate.gateBaseHeight * (1 - progress)));
}
