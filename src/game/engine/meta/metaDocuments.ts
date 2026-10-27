import type {
  IMetaInfo,
  IAtlasGrid,
  IVariantsConfig,
  IAnimationTracks,
  ISpatialLayout,
  IPortraitMatrix,
  IValidationConstraints,
  IAtlasSlicingConfig,
  IAtlasBackgroundConfig,
  IStateMapping,
  IInfoFrames,
  IInteractionConfig,
  IRenderDirectives,
} from "./metaSections";

/**
 * Character Metadata Document (e.g. Valen, Aurelia)
 * Includes grid, scaling variants, combat animations, spatial alignment, and portrait matrix.
 */
export interface ICharacterMetaDocument {
  info: IMetaInfo;
  atlas: IAtlasGrid;
  variants: IVariantsConfig;
  animations: IAnimationTracks;
  layout: ISpatialLayout;
  portraits?: IPortraitMatrix;
  constraints?: IValidationConstraints;
  slicing?: IAtlasSlicingConfig;
  backgroundConfig?: IAtlasBackgroundConfig;
}

/**
 * Creature / Monster Metadata Document (e.g. Clockwork Owl Gargoyle, Training Dummy)
 * Includes grid, scaling variants, combat animations, spatial alignment, and AI state machine.
 */
export interface ICreatureMetaDocument {
  info: IMetaInfo;
  atlas: IAtlasGrid;
  variants: IVariantsConfig;
  animations: IAnimationTracks;
  layout: ISpatialLayout;
  states?: IStateMapping;
  infoFrames?: IInfoFrames;
  constraints?: IValidationConstraints;
  slicing?: IAtlasSlicingConfig;
  backgroundConfig?: IAtlasBackgroundConfig;
}

/**
 * Structure / Interactive Object Metadata Document (e.g. Aether Gate, Chrono Lever)
 * Includes grid, animations, state machine, info frames, interactions, and render directives.
 */
export interface IStructureMetaDocument {
  info: IMetaInfo;
  atlas: IAtlasGrid;
  variants?: IVariantsConfig;
  animations: IAnimationTracks;
  layout: ISpatialLayout;
  states?: IStateMapping;
  infoFrames?: IInfoFrames;
  interaction?: IInteractionConfig;
  render?: IRenderDirectives;
  constraints?: IValidationConstraints;
  slicing?: IAtlasSlicingConfig;
  backgroundConfig?: IAtlasBackgroundConfig;
}

/**
 * Portrait Metadata Document (e.g. Valen Portraits, Aurelia Portraits)
 * Covers 5x5 dialogue & emotion matrices, expressive animations, and portrait slicing.
 */
export interface IPortraitMetaDocument {
  info: IMetaInfo;
  atlas: IAtlasGrid;
  portraits: IPortraitMatrix;
  animations?: IAnimationTracks;
  layout?: ISpatialLayout;
  constraints?: IValidationConstraints;
  slicing?: IAtlasSlicingConfig;
  backgroundConfig?: IAtlasBackgroundConfig;
}

/**
 * Universal Unified Document covering all optional domain sections.
 * Used by generic engines like AtlasSpriteRenderer or Developer Studio.
 */
export interface IUniversalMetaDocument {
  info: IMetaInfo;
  atlas: IAtlasGrid;
  variants?: IVariantsConfig;
  animations: IAnimationTracks;
  layout: ISpatialLayout;
  portraits?: IPortraitMatrix;
  states?: IStateMapping;
  infoFrames?: IInfoFrames;
  interaction?: IInteractionConfig;
  render?: IRenderDirectives;
  constraints?: IValidationConstraints;
  slicing?: IAtlasSlicingConfig;
  backgroundConfig?: IAtlasBackgroundConfig;
}

export type AtlasTrackType = "grid" | "freeform" | "indexed";

export interface AtlasAnimationTrackDefinition {
  name: string;
  type?: AtlasTrackType;
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
  wide?: boolean;
  slotSpan?: number[];
  cells?: number[];
  frameIndices?: number[];
  pingPong?: boolean;
  frameDelays?: number[];
}

export interface AtlasOriginDefinition {
  type?: string;
  normalized: {
    x: number;
    y: number;
  };
}

export interface AtlasGridConfig {
  columns: number;
  rows: number;
  spacing: number;
  safeMargin: number;
  cellWidth: number;
  cellHeight: number;
}

export interface AtlasAnimationTrackConfig {
  row?: number;
  frames?: number;
  fps?: number;
  loop?: boolean;
  wide?: boolean;
  slotSpan?: number[];
  cells?: number[];
  frameIndices?: number[];
  pingPong?: boolean;
  frameDelays?: number[];
  startCol?: number;
  widthCells?: number;
}

export interface AtlasMetaDoc {
  characterId?: string;
  entityId?: string;
  entityType?: string;
  version?: string;
  description?: string;
  slicing?: IAtlasSlicingConfig;
  backgroundConfig?: IAtlasBackgroundConfig;
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
  animations?: Record<string, AtlasAnimationTrackConfig>;
  layout?: {
    ordering?: string[];
    origin?: {
      type?: string;
      normalized: { x: number; y: number };
    };
    [animKey: string]: unknown;
  };
  anchor?: {
    x: number;
    y: number;
  };
  portraits?: {
    columns: number;
    rows: number;
    cellWidth: number;
    cellHeight: number;
    spacing?: number;
    map?: string[][];
  };
  [key: string]: unknown;
}
