import { LocationDefinition, LocationId, WorldId } from "../types";
import { Entity, Enemy } from "../../types";
import {
  BossZoneSchema,
  DecorPlacementSchema,
  LocationJsonSchema,
  LocationParallaxSchema,
  LocationZoneSchema,
  ParallaxBackgroundSchema,
  ParallaxLayerSchema,
  PortalDefinitionSchema,
} from "../schema/locationSchema";
import { assetsLogger } from "../../logger/gameLogger";
import { ErrorCode, ParserError } from "@lib/errors";
import enemiesData from "@data/enemies/enemies.json";
import { enemyCodec, DomainEnemyTemplate } from "@lib/codecs";
import { resolveEffectWithDefaults, resolveLayerWithDefaults } from "../../parallax/meta";
import { defaultParallaxRegistry, type ParallaxRegistry } from "../../parallax/registry";
import { buildLocationEntities, buildLocationEnemies } from "./locationEntityFactory";

const decodedEnemiesRes = enemyCodec.decodeDictionary(enemiesData);
export const CANONICAL_ENEMY_REGISTRY: Record<string, DomainEnemyTemplate> = decodedEnemiesRes.isOk()
  ? decodedEnemiesRes.value
  : {};

const CANONICAL_PROGRESSION: Record<LocationId, LocationId | undefined> = {
  courtyard: "thorn_chasm",
  thorn_chasm: "ashen_catacombs",
  ashen_catacombs: "clocktower",
  clocktower: "alchemist_library",
  alchemist_library: "aether_sanctuary",
  aether_sanctuary: "grand_bastion",
  grand_bastion: "eclipse_crown",
  eclipse_crown: "courtyard",
};

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

function buildResolvedParallax(
  blueprintId: string,
  worldId: WorldId,
  dimensions: { width: number; height: number },
  parallax: LocationParallaxSchema,
  zones: readonly LocationZoneSchema[] | undefined,
  registry: ParallaxRegistry
): ParallaxBackgroundSchema {
  const meta = registry.getWorldMeta(worldId);
  if (!meta) {
    throw new ParserError(
      `Location '${blueprintId}' references unknown parallax world '${worldId}'.`,
      ErrorCode.PARSER_LOCATION_SCHEMA_INVALID,
      { details: { locationId: blueprintId, worldId } }
    );
  }

  const layers: ParallaxLayerSchema[] = [];
  const farKey = `${worldId}:far`;
  const farResolved = resolveLayerWithDefaults(meta.layers.far ?? { band: "far" });
  layers.push({
    id: farKey,
    name: farResolved.labelKey ?? "far",
    tier: "far",
    layerKey: farKey,
    type: "image",
    depth: farResolved.depth,
    scrollSpeedX: farResolved.speed[0],
    scrollSpeedY: farResolved.speed[1],
    opaque: true,
    ...(farResolved.opacity !== 1 ? { opacity: farResolved.opacity } : {}),
  });

  for (const slot of parallax.layers) {
    const rawLayer = slot !== "far" ? meta.layers[slot] : undefined;
    if (!rawLayer) {
      throw new ParserError(
        `Location '${blueprintId}' references unknown parallax layer '${slot}' in world '${worldId}'.`,
        ErrorCode.PARSER_LOCATION_SCHEMA_INVALID,
        { details: { locationId: blueprintId, worldId, layerKey: slot } }
      );
    }

    const resolved = resolveLayerWithDefaults(rawLayer);
    const override = parallax.overrides?.[slot];
    const layerKey = `${worldId}:${slot}`;
    const opacity = override?.opacity ?? resolved.opacity;
    const depth = override?.depth ?? resolved.depth;
    const speedX = override?.speed?.[0] ?? resolved.speed[0];
    const speedY = override?.speed?.[1] ?? resolved.speed[1];

    layers.push({
      id: layerKey,
      name: resolved.labelKey ?? slot,
      tier: resolved.band,
      layerKey,
      type: "image",
      depth,
      scrollSpeedX: speedX,
      scrollSpeedY: speedY,
      ...(opacity !== 1 ? { opacity } : {}),
      ...(resolved.blend === "screen" ? { blendMode: "screen" } : {}),
      ...(resolved.tiling === "mirror" ? { mirrorTile: true } : {}),
    });
  }

  const seenFx = new Set<string>();
  const appendEffect = (effectId: string, scope?: "stage" | "world") => {
    const rawEffect = meta.effects?.[effectId];
    if (!rawEffect || rawEffect.kind !== "image" || !rawEffect.source) return;
    const dedupeKey = `${rawEffect.source}:${scope ?? "map"}`;
    if (seenFx.has(dedupeKey)) return;
    seenFx.add(dedupeKey);

    const fx = resolveEffectWithDefaults(rawEffect);
    const tier = scope === "world" ? "boss_world" : scope === "stage" ? "boss_stage" : fx.band;
    layers.push({
      id: fx.source!,
      name: effectId,
      tier,
      ...(scope ? { bossScope: scope } : {}),
      layerKey: fx.source,
      type: "image",
      depth: fx.depth,
      scrollSpeedX: fx.speed[0],
      scrollSpeedY: fx.speed[1],
      opacity: fx.opacity,
      blendMode: fx.blend,
    });
  };

  for (const effectId of parallax.effects ?? []) {
    appendEffect(effectId);
  }
  for (const zone of zones ?? []) {
    const scope = zone.scope ?? (zone.kind === "boss" ? "stage" : undefined);
    for (const effectId of zone.effects ?? []) {
      appendEffect(effectId, scope);
    }
  }

  return {
    boxWidth: parallax.box?.width ?? dimensions.width + 400,
    boxHeight: parallax.box?.height ?? dimensions.height + 200,
    layers,
  };
}

function deriveBossZones(
  zones: readonly LocationZoneSchema[] | undefined,
  legacyBossZones: readonly BossZoneSchema[] | undefined
): BossZoneSchema[] | undefined {
  if (zones && zones.length > 0) {
    const bossOnly = zones.filter((z) => z.kind === "boss");
    if (bossOnly.length === 0) return undefined;
    return bossOnly.map((z) => ({
      id: z.id,
      scope: z.scope ?? "stage",
      x: z.x,
      y: z.y,
      width: z.width,
      height: z.height,
      bossEnemyId: z.bossEnemyId,
      ambientColor: z.ambientColor,
      labelKey: z.labelKey,
      defaultLabel: z.defaultLabel,
    }));
  }
  return legacyBossZones ? [...legacyBossZones] : undefined;
}

/**
 * Parser for Location JSON Blueprints.
 * Converts declarative schema files into active runtime LocationDefinitions without mutating input blueprints.
 */
export class LocationParser {
  /**
   * Validates and parses a LocationJsonSchema object into a LocationDefinition.
   */
  public static parse(
    blueprint: LocationJsonSchema,
    registry: ParallaxRegistry = defaultParallaxRegistry
  ): LocationDefinition {
    if (!blueprint || typeof blueprint !== "object") {
      throw new ParserError(
        "Invalid location blueprint: Expected JSON object.",
        ErrorCode.PARSER_LOCATION_SCHEMA_INVALID,
        { details: { receivedType: typeof blueprint } }
      );
    }

    if (!blueprint.id) {
      throw new ParserError(
        "Invalid location blueprint: Missing 'id'.",
        ErrorCode.PARSER_LOCATION_SCHEMA_INVALID,
        { details: { missingField: "id" } }
      );
    }

    const rawDimensions = "dimensions" in blueprint ? (blueprint as { dimensions?: unknown }).dimensions : undefined;
    if (!blueprint.dimensions || !blueprint.dimensions.width || !blueprint.dimensions.height) {
      throw new ParserError(
        `Location '${blueprint.id}' missing valid dimensions.`,
        ErrorCode.PARSER_LOCATION_SCHEMA_INVALID,
        { details: { locationId: blueprint.id, dimensions: rawDimensions } }
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
      dictionaries,
      layout,
    } = blueprint;
    const worldId = (blueprint.worldId || id) as WorldId;
    const zones = blueprint.zones ?? blueprint.parallax?.zones;

    const resolvedPortals: PortalDefinitionSchema[] = dictionaries.portals
      ? Object.values(dictionaries.portals)
      : [];

    const parallaxBackground = blueprint.parallax
      ? buildResolvedParallax(id, worldId, dimensions, blueprint.parallax, zones, registry)
      : blueprint.parallaxBackground;

    const primaryNextLocation = (blueprint.nextLocationId ||
      CANONICAL_PROGRESSION[id as LocationId]) as LocationId | undefined;

    return {
      id: id as LocationId,
      worldId,
      stageNumber: blueprint.stageNumber ?? 1,
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
      parallax: blueprint.parallax,
      zones,
      parallaxBackground,
      bossZones: deriveBossZones(zones, blueprint.bossZones),
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
