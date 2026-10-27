import { LocationDefinition, LocationId } from "../types";
import { Entity, Enemy } from "../../types";
import { LocationJsonSchema, PortalDefinitionSchema } from "../schema/locationSchema";
import { ErrorCode, ParserError } from "@lib/errors";
import enemiesData from "@data/enemies/enemies.json";
import { enemyCodec, DomainEnemyTemplate } from "@lib/codecs";
import { buildLocationEntities, buildLocationEnemies } from "./locationEntityFactory";

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

    const rawDimensions = "dimensions" in blueprint ? (blueprint as { dimensions?: unknown }).dimensions : undefined;
    if (!blueprint.dimensions || !blueprint.dimensions.width || !blueprint.dimensions.height) {
      throw new ParserError(
        `Location '${blueprint.id}' missing valid dimensions.`,
        ErrorCode.PARSER_LOCATION_SCHEMA_INVALID,
        {
          details: { locationId: blueprint.id, dimensions: rawDimensions },
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

    // Canonical forward progression across location room network
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
      sceneType: blueprint.sceneType || "action_platformer",
      linkedSceneId: blueprint.linkedSceneId,
      width: dimensions.width,
      height: dimensions.height,
      spawnPoint: spawnPoints.default,
      p2SpawnOffset: spawnPoints.p2Offset || { x: 40, y: 0 },
      theme,
      parallaxBackground,
      portals: resolvedPortals,
      nextLocationId: primaryNextLocation,
      jsonBlueprint: blueprint,

      createEntities: (_isTwoPlayer: boolean): Entity[] => buildLocationEntities(layout, dictionaries),
      createEnemies: (isTwoPlayer: boolean): Enemy[] =>
        buildLocationEnemies(layout, dictionaries, id, isTwoPlayer, CANONICAL_ENEMY_REGISTRY),
    };
  }
}

