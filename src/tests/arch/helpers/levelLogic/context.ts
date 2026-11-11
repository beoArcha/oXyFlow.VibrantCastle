import type { LocationJsonSchema } from "@game/locations/schema/locationSchema";
import { LevelAnalysis } from "./analysis";
import { dropSpawn } from "./spawnDrop";
import type { EnemyRegistry, LocationCatalog, Violation } from "./types";
import { buildWorld, type World } from "./world";

export interface LevelContext {
  blueprint: LocationJsonSchema;
  world: World;
  registry: EnemyRegistry;
  /** Other locations, needed by cross-map rules (portal targets, entry usage). */
  catalog: LocationCatalog | undefined;
  analysis: LevelAnalysis;
}

export type Rule = (ctx: LevelContext) => Violation[];

export function createContext(
  blueprint: LocationJsonSchema,
  registry: EnemyRegistry,
  catalog: LocationCatalog | undefined
): LevelContext {
  const world = buildWorld(blueprint);
  const analysis = new LevelAnalysis(world, (terrain) => dropSpawn(terrain, blueprint.spawnPoints.default).start);
  return { blueprint, world, registry, catalog, analysis };
}
