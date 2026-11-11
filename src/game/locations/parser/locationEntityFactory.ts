import { CollisionType, Entity, Enemy } from "../../types";
import { LocationJsonSchema } from "../schema/locationSchema";
import { DomainEnemyTemplate } from "@lib/codecs";
import { engineLogger } from "../../logger/gameLogger";

/**
 * Instantiates runtime Entity objects (solids, hazards, triggers, levers, portals)
 * from location schema layout and dictionary definitions.
 */
export function buildLocationEntities(
  layout: LocationJsonSchema["layout"],
  dictionaries: LocationJsonSchema["dictionaries"]
): Entity[] {
  const entities: Entity[] = [];

  // 1. Solids (Platforms, Walls, Steps, One-way balconies)
  if (layout.solids) {
    for (const s of layout.solids) {
      const prefab = s.prefabId ? dictionaries.entities[s.prefabId] : undefined;
      const collisionType = prefab?.type === "oneway" ? CollisionType.OneWay : CollisionType.Solid;
      entities.push({
        id: s.id,
        structureId:
          s.prefabId ||
          (s.id.includes("portcullis")
            ? "grand_portcullis"
            : s.id.includes("lift")
            ? "vertical_lift"
            : s.id.includes("platform")
            ? "moving_platform"
            : undefined),
        type: collisionType,
        x: s.x,
        y: s.y,
        width: s.width || prefab?.defaultWidth || 100,
        height: s.height || prefab?.defaultHeight || 25,
        color: s.color || prefab?.color || "#b35a38",
        borderColor: prefab?.borderColor,
        labelKey: s.labelKey || prefab?.labelKey,
        label: s.defaultLabel || s.label || prefab?.defaultLabel || prefab?.label,
        vx: s.vx,
        vy: s.vy,
        minX: s.minX,
        maxX: s.maxX,
        minY: s.minY,
        maxY: s.maxY,
      });
    }
  }

  // 2. Hazards (Spikes, Lava pits, Acid)
  if (layout.hazards) {
    for (const h of layout.hazards) {
      const prefab = h.prefabId ? dictionaries.entities[h.prefabId] : undefined;
      entities.push({
        id: h.id,
        structureId: h.prefabId || "hazard_thorns",
        type: CollisionType.Hazard,
        x: h.x,
        y: h.y,
        width: h.width || prefab?.defaultWidth || 100,
        height: h.height || prefab?.defaultHeight || 50,
        color: h.color || prefab?.color || "#e06c35",
        borderColor: prefab?.borderColor,
        labelKey: h.labelKey || prefab?.labelKey,
        label: h.defaultLabel || h.label || prefab?.defaultLabel || prefab?.label || "Hazard",
      });
    }
  }

  // 3. Triggers (Narration, Tutorial zones, Traps)
  if (layout.triggers) {
    for (const tr of layout.triggers) {
      entities.push({
        id: tr.id,
        type: CollisionType.Trigger,
        x: tr.x,
        y: tr.y,
        width: tr.width,
        height: tr.height,
        triggerId: tr.triggerId,
      });
    }
  }

  // 4. Levers & Interactive Mechanisms
  if (layout.levers) {
    for (const lev of layout.levers) {
      entities.push({
        id: lev.id,
        structureId: lev.id.includes("sluice") ? "sluice_lever" : "chrono_lever",
        type: CollisionType.Lever,
        x: lev.x,
        y: lev.y,
        width: lev.width || 25,
        height: lev.height || 45,
        triggerId: lev.triggerId,
        labelKey: lev.labelKey,
        label: lev.defaultLabel || lev.label || "Lever",
        isActivated: false,
      });
    }
  }

  // 5. Portals (multi-room interconnects)
  if (layout.portals) {
    for (const p of layout.portals) {
      const portalDef = p.portalKey ? dictionaries.portals[p.portalKey] : undefined;
      const targetLocationId = p.targetLocationId || portalDef?.targetLocationId || "courtyard";
      const targetSpawnPoint = p.targetSpawnPoint || portalDef?.targetSpawnPoint;
      const labelKey = p.labelKey || portalDef?.labelKey;
      const label = p.defaultLabel || p.label || portalDef?.defaultLabel || portalDef?.label || "Portal";
      const activation = p.activation || portalDef?.activation || "touch";
      const particleEffect = portalDef?.particleEffect || "magic";
      const portalColors = portalDef?.colors || {
        inner: "#ffffff",
        outer: "#06b6d4",
        border: "#d97706",
      };

      entities.push({
        id: p.id,
        structureId: "aether_gate",
        type: CollisionType.Goal,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        isActivated: false,
        labelKey,
        label,
        targetLocationId,
        targetSpawnPoint,
        portalActivation: activation,
        particleEffect,
        portalColors,
      });
    }
  }

  return entities;
}

/**
 * Instantiates runtime Enemy objects from location layout and enemy registries.
 */
export function buildLocationEnemies(
  layout: LocationJsonSchema["layout"],
  dictionaries: LocationJsonSchema["dictionaries"],
  locationId: string,
  isTwoPlayer: boolean,
  canonicalEnemyRegistry: Record<string, DomainEnemyTemplate>
): Enemy[] {
  const enemies: Enemy[] = [];
  if (!layout.enemies) return enemies;

  for (const ep of layout.enemies) {
    if (ep.twoPlayerOnly && !isTwoPlayer) {
      continue;
    }

    const canonicalTemplate = canonicalEnemyRegistry[ep.monsterKey];
    const localTemplate = dictionaries?.monsters?.[ep.monsterKey];
    if (!canonicalTemplate && !localTemplate) {
      engineLogger.warn(
        `Monster template '${ep.monsterKey}' not found in canonical registry or location '${locationId}' dictionaries!`,
        { monsterKey: ep.monsterKey, locationId }
      );
      continue;
    }

    const isFacingLeft = ep.facingLeft !== undefined ? ep.facingLeft : true;
    let speed = 0;
    let width = 40;
    let height = 40;
    let health = 50;
    let maxHealth = 50;
    let nameKey = "";
    let defaultName = "Monster";
    let isDummy = false;
    let isAerial = false;

    if (canonicalTemplate) {
      speed = canonicalTemplate.stats.speed;
      width = canonicalTemplate.dimensions.width;
      height = canonicalTemplate.dimensions.height;
      health = canonicalTemplate.stats.health;
      maxHealth = canonicalTemplate.stats.maxHealth;
      nameKey = canonicalTemplate.nameKey;
      defaultName = canonicalTemplate.defaultName;
      isDummy = canonicalTemplate.isDummy;
      isAerial = canonicalTemplate.isAerial;
    } else if (localTemplate) {
      speed = localTemplate.speed || 0;
      width = localTemplate.width;
      height = localTemplate.height;
      health = localTemplate.health;
      maxHealth = localTemplate.maxHealth;
      nameKey = localTemplate.nameKey || "";
      defaultName = localTemplate.defaultName || localTemplate.name || "Monster";
      isDummy = localTemplate.isDummy;
      isAerial = localTemplate.isAerial || false;
    }

    const vx = speed > 0 ? (isFacingLeft ? -speed : speed) : 0;

    enemies.push({
      id: ep.id,
      templateId: ep.monsterKey,
      nameKey,
      defaultName,
      x: ep.x,
      y: ep.y,
      vx,
      vy: 0,
      width,
      height,
      health: ep.healthOverride ?? health,
      maxHealth,
      isDead: false,
      patrolMinX: ep.patrolMinX ?? (speed > 0 ? ep.x - 120 : 0),
      patrolMaxX: ep.patrolMaxX ?? (speed > 0 ? ep.x + 120 : 0),
      facingLeft: isFacingLeft,
      isDummy,
      isAerial,
      damageTimer: 0,
    });
  }

  return enemies;
}
