import { LocationDefinition, LocationId } from "../types";
import { CollisionType, Entity, Enemy } from "../../types";
import {
  LocationJsonSchema,
  PortalDefinitionSchema,
  MonsterTemplateSchema,
} from "../schema/locationSchema";
import { engineLogger } from "../../logger/gameLogger";
import { ErrorCode, ParserError } from "@lib/errors";
import enemiesData from "@data/enemies/enemies.json";
import { enemyCodec, DomainEnemyTemplate } from "@lib/codecs";

const decodedEnemiesRes = enemyCodec.decodeDictionary(enemiesData);
export const CANONICAL_ENEMY_REGISTRY: Record<string, DomainEnemyTemplate> = decodedEnemiesRes.isOk()
  ? decodedEnemiesRes.value
  : {};

/**
 * Parser for Location JSON Blueprints.
 * Converts declarative schema files into active runtime LocationDefinitions.
 */
export class LocationParser {
  /**
   * Validates and parses a LocationJsonSchema object into a LocationDefinition.
   */
  public static parse(blueprint: LocationJsonSchema): LocationDefinition {
    if (!blueprint || typeof blueprint !== "object") {
      throw new ParserError(
        "Invalid location blueprint: Expected JSON object.",
        ErrorCode.PARSER_LOCATION_SCHEMA_INVALID,
        {
          details: { receivedType: typeof blueprint },
        }
      );
    }

    if (!blueprint.id) {
      throw new ParserError(
        "Invalid location blueprint: Missing 'id'.",
        ErrorCode.PARSER_LOCATION_SCHEMA_INVALID,
        {
          details: { missingField: "id" },
        }
      );
    }

    if (!blueprint.dimensions || !blueprint.dimensions.width || !blueprint.dimensions.height) {
      throw new ParserError(
        `Location '${blueprint.id}' missing valid dimensions.`,
        ErrorCode.PARSER_LOCATION_SCHEMA_INVALID,
        {
          details: { locationId: blueprint.id, dimensions: (blueprint as any).dimensions },
        }
      );
    }

    const {
      id,
      nameKey,
      descriptionKey,
      openingNarrationKey,
      dimensions,
      spawnPoints,
      theme,
      parallaxBackground,
      dictionaries,
      layout,
    } = blueprint;

    // Collect all resolved portal definitions for map routing
    const resolvedPortals: PortalDefinitionSchema[] = [];
    if (dictionaries.portals) {
      for (const p of Object.values(dictionaries.portals)) {
        resolvedPortals.push(p);
      }
    }

    // Canonical forward progression across Castlevania room network
    const CANONICAL_PROGRESSION: Record<LocationId, LocationId | undefined> = {
      courtyard: "thorn_chasm",
      thorn_chasm: "clocktower",
      clocktower: "aether_sanctuary",
      aether_sanctuary: "grand_bastion",
      grand_bastion: "courtyard",
    };

    const primaryNextLocation = (blueprint.nextLocationId ||
      CANONICAL_PROGRESSION[id as LocationId]) as LocationId | undefined;

    return {
      id: id as LocationId,
      nameKey,
      descriptionKey,
      openingNarrationKey: openingNarrationKey || "narrationOpening",
      width: dimensions.width,
      height: dimensions.height,
      spawnPoint: spawnPoints.default,
      p2SpawnOffset: spawnPoints.p2Offset || { x: 40, y: 0 },
      theme,
      parallaxBackground,
      portals: resolvedPortals,
      nextLocationId: primaryNextLocation,
      jsonBlueprint: blueprint,

      createEntities: (isTwoPlayer: boolean): Entity[] => {
        const entities: Entity[] = [];

        // 1. Solids (Platforms, Walls, Steps, One-way balconies)
        if (layout.solids) {
          for (const s of layout.solids) {
            const prefab = s.prefabId ? dictionaries.entities[s.prefabId] : undefined;
            const collisionType =
              prefab?.type === "oneway" ? CollisionType.OneWay : CollisionType.Solid;
            entities.push({
              id: s.id,
              structureId: s.prefabId || (s.id.includes("portcullis") ? "grand_portcullis" : s.id.includes("lift") ? "vertical_lift" : s.id.includes("platform") ? "moving_platform" : undefined),
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

        // 5. Portals (Castlevania-style multi-room interconnects)
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
      },

      createEnemies: (isTwoPlayer: boolean): Enemy[] => {
        const enemies: Enemy[] = [];

        if (layout.enemies) {
          for (const ep of layout.enemies) {
            if (ep.twoPlayerOnly && !isTwoPlayer) {
              continue;
            }

            const canonicalTemplate = CANONICAL_ENEMY_REGISTRY[ep.monsterKey];
            const localTemplate = dictionaries?.monsters?.[ep.monsterKey];
            if (!canonicalTemplate && !localTemplate) {
              engineLogger.warn(
                `Monster template '${ep.monsterKey}' not found in canonical registry or location '${id}' dictionaries!`,
                { monsterKey: ep.monsterKey, locationId: id }
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
        }

        return enemies;
      },
    };
  }
}
