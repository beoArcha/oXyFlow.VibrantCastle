/**
 * Location Schema Definition for Castlevania-style platformer.
 * 
 * Supports:
 * - Extensible Blueprint format
 * - Multi-layered Parallax backgrounds with oversized canvas boxes and dynamic scrolling
 * - Dictionaries: Monsters (templates), Entity Prefabs, Portals, Narrative triggers
 * - Multiple Portals in varied positions leading to diverse target locations
 * - Seamless player state retention across location transitions
 */

export type ParticleType = "leaf" | "dust" | "spark" | "magic" | "shield";

export interface ParallaxElementSchema {
  type: "rect" | "circle" | "castle_tower" | "pillar" | "tree";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
}

export type BackgroundLayerTier = "far" | "mid_far" | "mid" | "mid_close" | "close";

export interface ParallaxLayerSchema {
  id: string;
  name: string;
  tier?: BackgroundLayerTier;
  type:
    | "image"
    | "sky_gradient"
    | "celestial"
    | "castle_silhouettes"
    | "mountain_ridges"
    | "scenery_trees"
    | "fog_overlay"
    | "custom_shapes";
  depth: number; // 0.05 = furthest background, 0.9 = foreground
  scrollSpeedX: number; // Parallax coefficient for X movement (e.g. 0.1, 0.25, 0.4)
  scrollSpeedY: number; // Parallax coefficient for Y movement (e.g. 0.05, 0.15)
  autoDriftX?: number;  // Constant drifting speed (clouds, fog)
  autoDriftY?: number;
  color?: string;
  opacity?: number;
  imageUrl?: string;
  imageElement?: HTMLImageElement;
  elements?: ParallaxElementSchema[];
}

export interface ParallaxBackgroundSchema {
  /**
   * The logical bounding box of the background layers.
   * Significantly larger than the viewport so subtle camera movements shift the perspective.
   */
  boxWidth: number;
  boxHeight: number;
  layers: ParallaxLayerSchema[];
}

/**
 * Monster Template in the Monster Dictionary.
 * Uses nameKey for i18n localization, with defaultName (English) as fallback.
 */
export interface MonsterTemplateSchema {
  templateId: string;
  nameKey?: string;
  defaultName?: string;
  name?: string; // Backward compatibility fallback (English)
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  speed: number;
  attackPower: number;
  isDummy: boolean;
  isAerial?: boolean;
  colorScheme?: {
    body: string;
    accent: string;
    eyes?: string;
  };
  scoreReward?: number;
}

/**
 * Entity Prefab in the Prefabs Dictionary.
 * Uses labelKey for i18n localization, with defaultLabel (English) as fallback.
 */
export interface EntityPrefabSchema {
  prefabId: string;
  type: "solid" | "hazard" | "trigger" | "lever" | "goal" | "oneway";
  color?: string;
  borderColor?: string;
  labelKey?: string;
  defaultLabel?: string;
  label?: string; // Backward compatibility fallback (English)
  defaultWidth?: number;
  defaultHeight?: number;
}

/**
 * Portal Definition in the Portals Dictionary.
 * Portals can be located anywhere in the room, leading to different destinations.
 * Uses labelKey for i18n localization, with defaultLabel (English) as fallback.
 */
export interface PortalDefinitionSchema {
  id: string;
  labelKey?: string;
  defaultLabel?: string;
  label?: string; // Backward compatibility fallback (English)
  targetLocationId: string;
  targetSpawnPoint?: { x: number; y: number };
  targetEntryKey?: string; // Reference to spawnPoints.entries[targetEntryKey]
  activation: "touch" | "interact"; // touch: immediate on entry, interact: requires [W] / [Up]
  isLocked?: boolean;
  unlockTriggerId?: string;
  particleEffect?: ParticleType;
  colors?: {
    inner: string;
    outer: string;
    border: string;
  };
}

/**
 * Dictionaries bundled with the location or referenced globally.
 */
export interface LocationDictionariesSchema {
  monsters: Record<string, MonsterTemplateSchema>;
  entities: Record<string, EntityPrefabSchema>;
  portals: Record<string, PortalDefinitionSchema>;
}

/**
 * Placement entries in the layout.
 */
export interface SolidPlacementSchema {
  id: string;
  prefabId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  labelKey?: string;
  defaultLabel?: string;
  label?: string;
  vx?: number;
  vy?: number;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

export interface HazardPlacementSchema {
  id: string;
  prefabId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  labelKey?: string;
  defaultLabel?: string;
  label?: string;
}

export interface TriggerPlacementSchema {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  triggerId: string;
  oneShot?: boolean;
}

export interface LeverPlacementSchema {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  targetGateId?: string;
  triggerId?: string;
  labelKey?: string;
  defaultLabel?: string;
  label?: string;
}

export interface PortalPlacementSchema {
  id: string;
  portalKey?: string; // Reference to dictionaries.portals[portalKey]
  x: number;
  y: number;
  width: number;
  height: number;
  targetLocationId?: string;
  targetSpawnPoint?: { x: number; y: number };
  targetEntryKey?: string;
  labelKey?: string;
  defaultLabel?: string;
  label?: string;
  activation?: "touch" | "interact";
}

export interface EnemyPlacementSchema {
  id: string;
  monsterKey: string; // Reference to dictionaries.monsters[monsterKey]
  x: number;
  y: number;
  patrolMinX?: number;
  patrolMaxX?: number;
  facingLeft?: boolean;
  healthOverride?: number;
  twoPlayerOnly?: boolean;
}

export interface LocationLayoutSchema {
  solids: SolidPlacementSchema[];
  hazards?: HazardPlacementSchema[];
  triggers?: TriggerPlacementSchema[];
  levers?: LeverPlacementSchema[];
  portals?: PortalPlacementSchema[];
  enemies?: EnemyPlacementSchema[];
}

/**
 * Complete Location JSON Blueprint Schema.
 */
export interface LocationJsonSchema {
  schemaVersion: "1.0" | string;
  id: string;
  nameKey: string;
  descriptionKey: string;
  openingNarrationKey: string;
  nextLocationId?: string;
  dimensions: {
    width: number;
    height: number;
  };
  spawnPoints: {
    default: { x: number; y: number };
    p2Offset: { x: number; y: number };
    entries?: Record<string, { x: number; y: number }>;
  };
  theme: {
    bgGradientTop: string;
    bgGradientBottom: string;
    ambientParticle: ParticleType;
    fogColor: string;
    musicIntensity: number;
  };
  parallaxBackground: ParallaxBackgroundSchema;
  dictionaries: LocationDictionariesSchema;
  layout: LocationLayoutSchema;
}
