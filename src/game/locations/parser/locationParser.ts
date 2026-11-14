import { LocationDefinition, LocationId } from "../types";
import { Entity, Enemy } from "../../types";
import { DecorPlacementSchema, LocationJsonSchema, PortalDefinitionSchema } from "../schema/locationSchema";
import { assetsLogger } from "../../logger/gameLogger";
import { ErrorCode, ParserError } from "@lib/errors";
import enemiesData from "@data/enemies/enemies.json";
import { enemyCodec, DomainEnemyTemplate } from "@lib/codecs";
import { buildLocationEntities, buildLocationEnemies } from "./locationEntityFactory";

const decodedEnemiesRes = enemyCodec.decodeDictionary(enemiesData);
export const CANONICAL_ENEMY_REGISTRY: Record<string, DomainEnemyTemplate> = decodedEnemiesRes.isOk()
  ? decodedEnemiesRes.value
  : {};

/**
 * Keeps the well-formed decor placements of a layout; malformed entries are warned about and skipped,
 * since decor is pure visuals and must never block a level from loading.
 */
export function parseDecorPlacements(raw: unknown, locationId: string): DecorPlacementSchema[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    assetsLogger.warn(`Location '${locationId}' layout.decor must be an array, ignoring`);
    return undefined;
  }
  const out: DecorPlacementSchema[] = [];
  for (const entry of raw as unknown[]) {
    const e = entry as Partial<DecorPlacementSchema> | null;
    const valid =
      typeof e === "object" &&
      e !== null &&
      typeof e.id === "string" &&
      typeof e.propId === "string" &&
      Number.isFinite(e.x) &&
      Number.isFinite(e.y) &&
      (e.layer === undefined || e.layer === "back" || e.layer === "front") &&
      (e.phase === undefined || Number.isFinite(e.phase));
    if (!valid) {
      assetsLogger.warn(`Location '${locationId}' has a malformed decor entry, skipping`, { entry });
      continue;
    }
    out.push({
      id: e.id as string,
      propId: e.propId as string,
      x: e.x as number,
      y: e.y as number,
      layer: e.layer ?? "back",
      flipX: e.flipX === true,
      phase: e.phase ?? 0,
    });
  }
  return out;
}

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
      decor: parseDecorPlacements(layout.decor, id),
      nextLocationId: primaryNextLocation,
      jsonBlueprint: blueprint,

      createEntities: (_isTwoPlayer: boolean): Entity[] => buildLocationEntities(layout, dictionaries),
      createEnemies: (isTwoPlayer: boolean): Enemy[] =>
        buildLocationEnemies(layout, dictionaries, id, isTwoPlayer, CANONICAL_ENEMY_REGISTRY),
    };
  }
}

