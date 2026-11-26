import type { Entity, Enemy, Vector2D } from "../types";
import {
  ParallaxBackgroundSchema,
  PortalDefinitionSchema,
  LocationJsonSchema,
  DecorPlacementSchema,
  LocationSceneType,
  ParticleType,
  BossZoneSchema,
} from "./schema/locationSchema";

export type WorldId =
  | "courtyard"
  | "thorn_chasm"
  | "ashen_catacombs"
  | "clocktower"
  | "alchemist_library"
  | "aether_sanctuary"
  | "grand_bastion"
  | "eclipse_crown";

export type LocationId = WorldId | (string & {});

export interface LocationTheme {
  bgGradientTop: string;
  bgGradientBottom: string;
  ambientParticle: ParticleType;
  fogColor: string;
  musicIntensity: number;
}

export interface LocationDefinition {
  id: LocationId;
  worldId?: WorldId;
  stageNumber?: number;
  nameKey: string;
  descriptionKey: string;
  width: number;
  height: number;
  spawnPoint: Vector2D;
  p2SpawnOffset: Vector2D;
  theme: LocationTheme;
  openingNarrationKey: string;
  sceneType?: LocationSceneType;
  linkedSceneId?: string;
  nextLocationId?: LocationId;
  parallaxBackground?: ParallaxBackgroundSchema;
  bossZones?: BossZoneSchema[];
  portals?: PortalDefinitionSchema[];
  /** Validated decor placements: pure visuals, never entities, no collision. */
  decor?: DecorPlacementSchema[];
  jsonBlueprint?: LocationJsonSchema;
  createEntities: (isTwoPlayer: boolean) => Entity[];
  createEnemies: (isTwoPlayer: boolean) => Enemy[];
}

