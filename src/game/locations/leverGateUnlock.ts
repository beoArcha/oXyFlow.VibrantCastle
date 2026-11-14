import { CollisionType, Entity, ParticleBurstType, SoundType } from "../types";
import { engineLogger } from "../logger/gameLogger";
import { statsManager } from "../logic/stats";
import { beginOpeningGate } from "../physics/gateState";

/** Subset of the lifecycle context the lever logic needs; declared here to avoid an import cycle. */
export interface LeverGateContext {
  getEntities(): Entity[];
  playSFX(type: SoundType): void;
  triggerNarration(key: string): void;
  spawnBurst(x: number, y: number, color: string, type: ParticleBurstType, count: number): void;
  notifyReact(): void;
}

/** The pulled lever wins; the triggerId scan only serves callers that cannot name the lever. */
function resolveTargetGateId(entities: Entity[], triggerId: string, lever?: Entity): string | undefined {
  if (lever) return lever.targetGateId;
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    if (e.type === CollisionType.Lever && e.triggerId === triggerId && e.targetGateId) {
      return e.targetGateId;
    }
  }
  return undefined;
}

function findSolidById(entities: Entity[], id: string): Entity | undefined {
  for (let i = 0; i < entities.length; i++) {
    if (entities[i].type === CollisionType.Solid && entities[i].id === id) return entities[i];
  }
  return undefined;
}

function openGate(context: LeverGateContext, gate: Entity): void {
  if (!beginOpeningGate(gate)) return;
  context.playSFX(SoundType.SFX_UNLOCK);
  context.triggerNarration("trainingLeverSuccess");
  context.spawnBurst(gate.x + gate.width / 2, 300, "#e2b653", "dust", 20);
}

export function unlockLeverGates(context: LeverGateContext, triggerId: string, lever?: Entity): void {
  statsManager.recordLeverPulled();
  const entities = context.getEntities();
  const targetGateId = resolveTargetGateId(entities, triggerId, lever);

  if (targetGateId) {
    const gate = findSolidById(entities, targetGateId);
    if (gate) {
      openGate(context, gate);
      context.notifyReact();
      return;
    }
    engineLogger.warn("Lever target gate not found, falling back to legacy gate unlock", {
      triggerId,
      targetGateId,
    });
  } else {
    engineLogger.warn("Lever declares no targetGateId, falling back to legacy gate unlock", { triggerId });
  }

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    // Legacy: any gate-like solid in this location
    if (
      entity.type === CollisionType.Solid &&
      (entity.id.includes("gate") || entity.id.includes("wall") || entity.id === "grand_gate")
    ) {
      openGate(context, entity);
    }
  }
  context.notifyReact();
}
