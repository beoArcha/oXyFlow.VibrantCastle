import {
  CharacterAnimationTrack,
  CharacterAnimationFrame,
  CharacterPortraitMood,
  CharacterSpriteQuality,
} from "../spriteTypes";
import { IAtlasSlicingConfig, IAtlasBackgroundConfig } from "../meta/types";

/**
 * Common configuration for extracting sprites from an atlas sheet.
 */
export interface BaseExtractionMeta {
  characterId?: string;
  objectId?: string;
  entityType?: "humanoid" | "monster" | "animal" | "portrait" | "interactive_object" | "effect" | string;
  version?: string;
  slicing?: IAtlasSlicingConfig;
  backgroundConfig?: IAtlasBackgroundConfig;
  atlas?: {
    columns?: number;
    rows?: number;
    spacing?: number;
    safeMargin?: number;
  };
  variants?: Record<string, {
    cellWidth?: number;
    cellHeight?: number;
    scale?: number;
  }>;
  animations?: Record<string, {
    row: number;
    frames: number;
    fps?: number;
    loop?: boolean;
    slotSpan?: number[];
    cells?: number[];
    wide?: boolean;
    anchor?: "feet" | "center" | "bottom_center" | "top_left";
    frameIndices?: number[];
    frameOffset?: number;
  }>;
  layout?: {
    ordering?: string[];
    origin?: {
      type?: string;
      normalized?: { x: number; y: number };
    };
  };
  scale?: number;
  fps?: number;
  portraits?: {
    columns?: number;
    rows?: number;
    cellWidth?: number;
    cellHeight?: number;
    spacing?: number;
    map?: string[][];
  };
}

/**
 * Result of portrait extraction from mood grid.
 */
export interface ExtractedPortraitResult {
  characterId: string;
  gridUrl: string;
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  moods: CharacterPortraitMood[];
  moodMap: Record<string, { x: number; y: number; width: number; height: number }>;
}

/**
 * Result of interactive object animation extraction (e.g. lamps, portals, chests).
 */
export interface ExtractedObjectResult {
  objectId: string;
  textureUrl: string;
  animations: Record<string, CharacterAnimationTrack>;
  defaultAnimation: string;
  anchor: "center" | "bottom_center" | "top_left";
}

/**
 * Generic interface for sprite extractors.
 */
export interface ISpriteSheetExtractor<TMeta extends BaseExtractionMeta = BaseExtractionMeta, TResult = unknown> {
  readonly supportedEntityType: string;
  extract(
    meta: TMeta,
    quality: CharacterSpriteQuality,
    textureOrDimensions: { width: number; height: number }
  ): TResult;
}
