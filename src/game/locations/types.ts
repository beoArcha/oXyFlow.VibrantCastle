import { Entity, Enemy, Vector2D } from "../types";
import {
  ParallaxBackgroundSchema,
  PortalDefinitionSchema,
  LocationJsonSchema,
  ParticleType,
} from "./schema/locationSchema";

export type LocationId =
  | "courtyard"
  | "thorn_chasm"
  | "clocktower"
  | "aether_sanctuary"
  | "grand_bastion"
  | (string & {});

export interface LocationTheme {
  bgGradientTop: string;
  bgGradientBottom: string;
  ambientParticle: ParticleType;
  fogColor: string;
  musicIntensity: number;
}

export interface LocationDefinition {
  id: LocationId;
  nameKey: string;
  descriptionKey: string;
  width: number;
  height: number;
  spawnPoint: Vector2D;
  p2SpawnOffset: Vector2D;
  theme: LocationTheme;
  openingNarrationKey: string;
  nextLocationId?: LocationId;
  parallaxBackground?: ParallaxBackgroundSchema;
  portals?: PortalDefinitionSchema[];
  jsonBlueprint?: LocationJsonSchema;
  createEntities: (isTwoPlayer: boolean) => Entity[];
  createEnemies: (isTwoPlayer: boolean) => Enemy[];
}

