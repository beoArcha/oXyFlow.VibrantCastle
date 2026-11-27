import { LocationDefinition } from "@game/locations/types";
import { CANONICAL_ENEMY_REGISTRY } from "@game/locations/parser/locationParser";
import type { DraftPortalTextEntry, DraftTriggerEntry } from "./mapTextPatch";

export type MapEntityCategory =
  | "solid"
  | "gate"
  | "lever"
  | "portal"
  | "trigger"
  | "spawn"
  | "enemy"
  | "hazard";

export interface MapEntityItem {
  readonly uid: string;
  readonly id: string;
  readonly category: MapEntityCategory;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly textKey?: string;
  readonly targetId?: string;
  readonly isOneWay?: boolean;
  readonly patrolTrack?: {
    readonly axis: "x" | "y";
    readonly min: number;
    readonly max: number;
  };
  readonly rawJson: unknown;
  readonly sourceIndex?: number;
  readonly portalKey?: string;
  readonly oneShot?: boolean;
  readonly isDraft?: boolean;
}

export interface LeverGateLink {
  readonly leverId: string;
  readonly gateId: string;
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
}

export interface ExtractedMapData {
  readonly entities: readonly MapEntityItem[];
  readonly leverGateLinks: readonly LeverGateLink[];
}

const HIT_PRIORITY: Record<MapEntityCategory, number> = {
  trigger: 0,
  portal: 1,
  lever: 2,
  spawn: 3,
  enemy: 4,
  hazard: 5,
  gate: 6,
  solid: 7,
};

export function extractMapEntities(
  location: LocationDefinition,
  draftTriggers: readonly DraftTriggerEntry[] = [],
  draftPortals: Readonly<Record<string, DraftPortalTextEntry>> = {}
): ExtractedMapData {
  const bp = location.jsonBlueprint;
  if (!bp) return { entities: [], leverGateLinks: [] };

  const entities: MapEntityItem[] = [];
  const gateTargetIds = new Set(
    (bp.layout.levers ?? []).map((l) => l.targetGateId).filter((v): v is string => Boolean(v))
  );

  for (const solid of bp.layout.solids) {
    const prefab = solid.prefabId ? bp.dictionaries.entities[solid.prefabId] : undefined;
    const isGate =
      gateTargetIds.has(solid.id) ||
      prefab?.structureId === "grand_portcullis" ||
      solid.id.includes("portcullis") ||
      solid.id.includes("gate");
    const isOneWay = prefab?.type === "oneway";

    let patrolTrack: MapEntityItem["patrolTrack"];
    if (solid.minX !== undefined && solid.maxX !== undefined) {
      patrolTrack = { axis: "x", min: solid.minX, max: solid.maxX + solid.width };
    } else if (solid.minY !== undefined && solid.maxY !== undefined) {
      patrolTrack = { axis: "y", min: solid.minY, max: solid.maxY + solid.height };
    }

    entities.push({
      uid: `${isGate ? "gate" : "solid"}:${solid.id}`,
      id: solid.id,
      category: isGate ? "gate" : "solid",
      x: solid.x,
      y: solid.y,
      width: solid.width,
      height: solid.height,
      label: solid.id,
      textKey: solid.labelKey ?? prefab?.labelKey,
      isOneWay,
      patrolTrack,
      rawJson: solid,
    });
  }

  for (const haz of bp.layout.hazards ?? []) {
    entities.push({
      uid: `hazard:${haz.id}`,
      id: haz.id,
      category: "hazard",
      x: haz.x,
      y: haz.y,
      width: haz.width,
      height: haz.height,
      label: haz.id,
      textKey: haz.labelKey,
      rawJson: haz,
    });
  }

  const leverGateLinks: LeverGateLink[] = [];
  for (const lever of bp.layout.levers ?? []) {
    const lw = lever.width ?? 25;
    const lh = lever.height ?? 45;
    entities.push({
      uid: `lever:${lever.id}`,
      id: lever.id,
      category: "lever",
      x: lever.x,
      y: lever.y,
      width: lw,
      height: lh,
      label: lever.targetGateId ? `${lever.id} -> ${lever.targetGateId}` : lever.id,
      textKey: lever.labelKey,
      targetId: lever.targetGateId,
      rawJson: lever,
    });

    if (!lever.targetGateId) continue;
    const gate = bp.layout.solids.find((s) => s.id === lever.targetGateId);
    if (!gate) continue;
    leverGateLinks.push({
      leverId: lever.id,
      gateId: gate.id,
      fromX: lever.x + lw / 2,
      fromY: lever.y + lh / 2,
      toX: gate.x + gate.width / 2,
      toY: gate.y + gate.height / 2,
    });
  }

  (bp.layout.portals ?? []).forEach((portal, index) => {
    const portalDef = portal.portalKey ? bp.dictionaries.portals[portal.portalKey] : undefined;
    const targetLocation = portal.targetLocationId || portalDef?.targetLocationId || "?";
    const draft = draftPortals[portal.id];
    const textKey = draft?.labelKey || portal.labelKey || portalDef?.labelKey;
    entities.push({
      uid: `portal:${portal.id}`,
      id: portal.id,
      category: "portal",
      x: portal.x,
      y: portal.y,
      width: portal.width,
      height: portal.height,
      label: `${portal.id} -> ${targetLocation}`,
      textKey,
      targetId: targetLocation,
      sourceIndex: index,
      portalKey: portal.portalKey,
      isDraft: Boolean(draft),
      rawJson: portalDef ? { placement: portal, dictionary: portalDef } : portal,
    });
  });

  const editedTriggersById = new Map<string, DraftTriggerEntry>();
  const createdTriggers: DraftTriggerEntry[] = [];
  for (const draft of draftTriggers) {
    if (draft.kind === "edit") editedTriggersById.set(draft.id, draft);
    else createdTriggers.push(draft);
  }
  (bp.layout.triggers ?? []).forEach((trig, index) => {
    const active = editedTriggersById.get(trig.id) ?? trig;
    entities.push({
      uid: `trigger:${trig.id}`,
      id: trig.id,
      category: "trigger",
      x: active.x,
      y: active.y,
      width: active.width,
      height: active.height,
      label: `${trig.id} [${active.triggerId}]`,
      textKey: active.triggerId,
      sourceIndex: index,
      oneShot: active.oneShot,
      isDraft: editedTriggersById.has(trig.id),
      rawJson: active,
    });
  });
  for (const created of createdTriggers) {
    entities.push({
      uid: `trigger:${created.id}`,
      id: created.id,
      category: "trigger",
      x: created.x,
      y: created.y,
      width: created.width,
      height: created.height,
      label: `${created.id} [${created.triggerId}]`,
      textKey: created.triggerId,
      oneShot: created.oneShot,
      isDraft: true,
      rawJson: created,
    });
  }

  const sp = bp.spawnPoints.default;
  entities.push({
    uid: "spawn:default",
    id: "spawn_default",
    category: "spawn",
    x: sp.x,
    y: sp.y,
    width: 32,
    height: 48,
    label: "spawn:default",
    rawJson: { default: sp, p2Offset: bp.spawnPoints.p2Offset },
  });
  for (const [entryKey, pt] of Object.entries(bp.spawnPoints.entries ?? {})) {
    entities.push({
      uid: `spawn:entry:${entryKey}`,
      id: `entry:${entryKey}`,
      category: "spawn",
      x: pt.x,
      y: pt.y,
      width: 28,
      height: 42,
      label: `entry:${entryKey}`,
      rawJson: { entryKey, ...pt },
    });
  }
  for (const enemy of bp.layout.enemies ?? []) {
    const canonical = CANONICAL_ENEMY_REGISTRY[enemy.monsterKey];
    const local = bp.dictionaries.monsters?.[enemy.monsterKey];
    entities.push({
      uid: `enemy:${enemy.id}`,
      id: enemy.id,
      category: "enemy",
      x: enemy.x,
      y: enemy.y,
      width: canonical?.dimensions.width ?? local?.width ?? 40,
      height: canonical?.dimensions.height ?? local?.height ?? 48,
      label: `${enemy.id} (${enemy.monsterKey})`,
      patrolTrack:
        enemy.patrolMinX !== undefined && enemy.patrolMaxX !== undefined
          ? { axis: "x", min: enemy.patrolMinX, max: enemy.patrolMaxX }
          : undefined,
      rawJson: enemy,
    });
  }
  return { entities, leverGateLinks };
}

export function hitTestMapEntity(
  entities: readonly MapEntityItem[],
  worldX: number,
  worldY: number,
  visibleCategories?: ReadonlySet<MapEntityCategory>
): MapEntityItem | null {
  let best: MapEntityItem | null = null;
  let bestPriority = Number.POSITIVE_INFINITY;
  let bestArea = Number.POSITIVE_INFINITY;

  for (const entity of entities) {
    if (visibleCategories && !visibleCategories.has(entity.category)) continue;
    const inside =
      worldX >= entity.x &&
      worldX <= entity.x + entity.width &&
      worldY >= entity.y &&
      worldY <= entity.y + entity.height;
    if (!inside) continue;

    const priority = HIT_PRIORITY[entity.category];
    const area = entity.width * entity.height;
    if (priority < bestPriority || (priority === bestPriority && area < bestArea)) {
      best = entity;
      bestPriority = priority;
      bestArea = area;
    }
  }

  return best;
}
