import { AssetQuality } from "../types";
export type {
  IMetaInfo,
  IAtlasGrid,
  IVariantTier,
  IVariantsConfig,
  IAnimationTrackMeta,
  IAnimationTracks,
  ISpatialOrigin,
  ISpatialLayout,
  IPortraitMatrix,
  IStateMapping,
  IInfoFrames,
  IInteractionTrigger,
  IInteractionEffects,
  IInteractionConfig,
  IRenderDirectives,
  IValidationConstraints,
  ICharacterMetaDocument,
  ICreatureMetaDocument,
  IStructureMetaDocument,
  IPortraitMetaDocument,
  IUniversalMetaDocument,
} from "./meta";

export type CharacterProgressionTier = 1 | 2 | 3;

export type AnimationName =
  | "idle"
  | "run"
  | "move"
  | "jump"
  | "fall"
  | "attack"
  | "dash"
  | "cast"
  | "crouch";

export interface SpriteInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * v3.0 Atlas Configuration
 */
export interface CharacterAtlasConfigV3 {
  spacing?: number;
  background?: string;
  safeMargin?: number;
  noOverflow?: boolean;
  noOverlap?: boolean;
}

/**
 * v3.0 Variant Dimension & Scaling
 */
export interface CharacterVariantConfigV3 {
  cellWidth: number;
  cellHeight: number;
  scale: number;
}

/**
 * v3.0 Animation Definition
 */
export interface CharacterAnimationMetaV3 {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
  cells: number[];
  supportsWide?: boolean;
  description?: string;
}

/**
 * Schema Interface enforcing mandatory Idle and Move / Run animations in v3.0 standard.
 * Every character definition must provide at least `idle` and either `move` or `run`.
 */
export interface CharacterBaseRequiredAnimationsV3 {
  /** Idle stance animation (mandatory) */
  idle: CharacterAnimationMetaV3;
  /** Primary locomotion animation (either `move` or `run` is mandatory) */
  run?: CharacterAnimationMetaV3;
  /** Primary locomotion animation alias (either `move` or `run` is mandatory) */
  move?: CharacterAnimationMetaV3;
}

export type CharacterAnimationsMapV3 = CharacterBaseRequiredAnimationsV3 & {
  idle: CharacterAnimationMetaV3;
  jump?: CharacterAnimationMetaV3;
  fall?: CharacterAnimationMetaV3;
  attack?: CharacterAnimationMetaV3;
  dash?: CharacterAnimationMetaV3;
  cast?: CharacterAnimationMetaV3;
  crouch?: CharacterAnimationMetaV3;
  [key: string]: CharacterAnimationMetaV3 | undefined;
};

/**
 * v3.0 Layout Configuration
 */
export interface CharacterLayoutConfigV3 {
  ordering: AnimationName[];
  origin: {
    type: string;
    normalized: { x: number; y: number };
  };
}

/**
 * v3.0 Portraits Grid Configuration (5x5 matrix = 25 moods)
 */
export interface CharacterPortraitsConfigV3 {
  cellWidth: number;
  cellHeight: number;
  spacing?: number;
  columns: number;
  rows: number;
  map: string[][];
}

/**
 * Full v3.0 Character Metadata Schema
 */
export interface CharacterMetaV3 {
  characterId: string;
  version: string;
  description: string;
  atlas: CharacterAtlasConfigV3;
  variants: {
    low: CharacterVariantConfigV3;
    mid: CharacterVariantConfigV3;
    high: CharacterVariantConfigV3;
  };
  /** Mandatory animations requiring at least `idle` and `move`/`run` */
  animations: CharacterAnimationsMapV3;
  layout: CharacterLayoutConfigV3;
  portraits: CharacterPortraitsConfigV3;
  generationConstraints?: {
    style?: string;
    noPainterly?: boolean;
    hair?: Record<string, any>;
    fx?: Record<string, any>;
    cloth?: Record<string, any>;
  };
  validation?: {
    strictGrid?: boolean;
    noOverlap?: boolean;
    noOverflow?: boolean;
    respectSpacing?: boolean;
    respectSafeMargin?: boolean;
  };
}

export interface SpriteFrame {
  /** X coordinate inside the spritesheet texture */
  x: number;
  /** Y coordinate inside the spritesheet texture */
  y: number;
  /** Width of the frame slice */
  w: number;
  /** Height of the frame slice */
  h: number;
  /** Anchor origin X relative to frame (typically center of feet) */
  originX: number;
  /** Anchor origin Y relative to frame (typically bottom of feet) */
  originY: number;
  /** Optional wide frame indicator */
  isWide?: boolean;
  /** Multiplier of base cell width (e.g. 1, 2, 3) */
  widthMultiplier?: number;
}

export interface SpriteAnimationTrack {
  name: AnimationName;
  frameCount: number;
  frameDuration: number;
  loop: boolean;
  row: number;
  fps: number;
  supportsWide?: boolean;
  frameWidths?: number[];
  description?: string;
  frames: SpriteFrame[];
}

export interface SpriteAtlasMeta {
  characterId: string;
  quality: AssetQuality;
  tier?: CharacterProgressionTier;
  imageUrl: string;
  sheetWidth: number;
  sheetHeight: number;
  cellWidth: number;
  cellHeight: number;
  inset?: SpriteInset;
  innerPadding?: number;
  characterSize?: number;
  scale: number;
  originX: number;
  originY: number;
  offsetX?: number;
  offsetY?: number;
}

export interface SpriteAtlasMap {
  meta: SpriteAtlasMeta;
  animations: Record<AnimationName, SpriteAnimationTrack>;
}

export type CharacterSpriteQuality = AssetQuality;

export interface CharacterPortraitMood {
  id: string;
  row: number;
  col: number;
  mood: string;
  description: string;
  name?: string;
  gridX?: number;
  gridY?: number;
  gridWidth?: number;
  gridHeight?: number;
}

export type CharacterAnimationFrame = SpriteFrame;
export type CharacterAnimationTrack = SpriteAnimationTrack;

export interface CharacterTierManifest {
  tier: CharacterProgressionTier;
  tierName: string;
  title: string;
  portraitUrl: string;
  portraitThumbUrl: string;
  portraitsGridUrl?: string;
  spriteMaps: Record<AssetQuality, SpriteAtlasMap>;
}

export interface CharacterAssetManifest {
  id: string;
  name: string;
  title: string;
  /** Main character portrait from *_main.png */
  portraitUrl: string;
  portraitThumbUrl: string;
  /** Moods & expressions grid from *_portraits.png */
  portraitsGridUrl: string;
  portraitsGridCellWidth: number;
  portraitsGridCellHeight: number;
  portraitsGridColumns: number;
  portraitsGridRows: number;
  portraitsGridSpacing?: number;
  portraits: CharacterPortraitMood[];
  spriteMaps: Record<AssetQuality, SpriteAtlasMap>;
  tiers?: Record<CharacterProgressionTier, CharacterTierManifest>;
  meta?: any;
}

/**
 * Universal Atlas Metadata schema for characters, creatures (enemies), and structures.
 */
export interface AtlasOriginDefinition {
  type?: string;
  normalized: {
    x: number;
    y: number;
  };
}

export interface AtlasMetaDoc {
  characterId?: string;
  entityId?: string;
  entityType?: string;
  version?: string;
  description?: string;
  atlas: {
    columns: number;
    rows: number;
    spacing?: number;
    safeMargin?: number;
    cellWidth?: number;
    cellHeight?: number;
    image?: string;
    background?: string;
    noOverflow?: boolean;
    noOverlap?: boolean;
  };
  variants?: Record<
    string,
    {
      cellWidth: number;
      cellHeight: number;
      scale?: number;
    }
  >;
  animations?: Record<string, any>;
  layout?: {
    ordering?: string[];
    origin?: AtlasOriginDefinition;
    [key: string]: any;
  };
  naturalFacing?: "left" | "right";
  defaultFacing?: "left" | "right";
  anchor?: {
    x: number;
    y: number;
  };
  states?: Record<
    string,
    {
      animation: string;
    }
  >;
  interaction?: any;
  render?: any;
}
