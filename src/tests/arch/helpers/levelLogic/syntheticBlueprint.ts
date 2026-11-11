import type { LocationJsonSchema } from "@game/locations/schema/locationSchema";
import type { EnemyRegistry } from "./types";

type Layout = LocationJsonSchema["layout"];

export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 900;
export const GROUND_TOP = 800;
export const PLAYER_SPAWN = { x: 100, y: GROUND_TOP - 48 };

export interface BlueprintOptions {
  solids?: Layout["solids"];
  levers?: Layout["levers"];
  enemies?: Layout["enemies"];
  hazards?: Layout["hazards"];
  triggers?: Layout["triggers"];
  portals?: Layout["portals"];
  spawn?: { x: number; y: number };
}

export const aSolid = (id: string, x: number, y: number, width: number, height = 25): Layout["solids"][number] => ({
  id,
  x,
  y,
  width,
  height,
});

/** Ground slab whose top sits at GROUND_TOP and reaches the bottom of the world. */
export const aGround = (id: string, x: number, width: number): Layout["solids"][number] =>
  aSolid(id, x, GROUND_TOP, width, WORLD_HEIGHT - GROUND_TOP);

export function aBlueprint(options: BlueprintOptions = {}): LocationJsonSchema {
  const blueprint = {
    schemaVersion: "1.0",
    id: "synthetic",
    nameKey: "synthetic.name",
    descriptionKey: "synthetic.description",
    openingNarrationKey: "synthetic.narration",
    dimensions: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
    spawnPoints: { default: options.spawn ?? PLAYER_SPAWN, p2Offset: { x: 40, y: 0 } },
    dictionaries: { entities: {}, portals: {} },
    layout: {
      solids: options.solids ?? [aGround("ground", 0, WORLD_WIDTH)],
      levers: options.levers ?? [],
      enemies: options.enemies ?? [],
      hazards: options.hazards ?? [],
      triggers: options.triggers ?? [],
      portals: options.portals ?? [],
    },
  };
  return blueprint as unknown as LocationJsonSchema;
}

export const SYNTHETIC_ENEMIES: EnemyRegistry = {
  grunt: { isAerial: false, dimensions: { width: 32, height: 48 }, stats: { speed: 1 } },
};
