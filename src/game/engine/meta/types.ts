/**
 * Meta Document Domain Interfaces (Interface Segregation Principle - ISP).
 *
 * Granular, cohesive interfaces representing the distinct facets of sprite atlas
 * and entity metadata (meta.json) in Vibrant Castle:
 * - 1. IMetaInfo: Identity, entity classification, version, and lore description
 * - 2. IAtlasGrid: Physical texture sheet grid, cell dimensions, margins, and gutters
 * - 3. IVariantsConfig: Asset downsampling & quality tiers (low, mid, high)
 * - 4. IAnimationTracks: Sequence tracks, frame spans, FPS, and loops
 * - 5. ISpatialLayout: Origin registration point (feet/center), anchor, and natural facing
 * - 6. IPortraitMatrix: 5x5 dialogue portrait expression matrix
 * - 7. IStateMapping: State machine mapping from engine states to visual tracks
 * - 8. IInfoFrames: Static showcase / bestiary / status icon frame indices
 * - 9. IInteractionConfig: Gameplay triggers, radii, and interaction effects
 * - 10. IRenderDirectives: Layer sorting, z-index, and blend modes
 * - 11. IValidationConstraints: Asset generation, alignment, and strict grid rules
 */

import { AssetQuality } from "../../types";

export type EntityType =
  | "humanoid"
  | "creature"
  | "object"
  | "structure"
  | "interactive_object"
  | "projectile"
  | "effect"
  | string;

export type FacingDirection = "left" | "right";

export type AnchorOriginType = "feet" | "center" | "bottom_center" | "top_left" | string;

export type RenderLayerName = "background" | "interactive" | "actors" | "foreground" | string;

export type BlendMode = "normal" | "additive" | "screen" | "multiply";

// ============================================================================
// 1. Meta Information & Identity
// ============================================================================
export interface IMetaInfo {
  id: string;
  entityType: EntityType;
  version: string;
  description: string;
  characterId?: string;
  entityId?: string;
}

// ============================================================================
// 2. Atlas Grid Geometry
// ============================================================================
export interface IAtlasGrid {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  spacing: number;
  safeMargin: number;
  background: string;
  image?: string;
  noOverflow?: boolean;
  noOverlap?: boolean;
}

// ============================================================================
// 2b. Atlas Background & Transparency Configuration (Chroma Keying)
// ============================================================================
export type BackgroundMode = "transparent" | "color" | "solid";

export interface IAtlasBackgroundConfig {
  mode: BackgroundMode;
  colorHex?: string; // e.g. "#000000", "#ffffff", "#00ff00"
  tolerance?: number; // 0 - 100 threshold
  removeAtRuntime?: boolean;
}

// ============================================================================
// 2c. Slicing Configuration & Resolved Frame Geometry
// ============================================================================
export type SlicingMethod = "by_count" | "by_cell_size" | "freeform_rects" | "auto_islands";

export interface ICellSizeSlicingParams {
  cellWidth: number;
  cellHeight: number;
  offsetX?: number;
  offsetY?: number;
  startX?: number;
  startY?: number;
  spacingX?: number;
  spacingY?: number;
  spacing?: number;
  margin?: number;
}

export interface IAutoIslandSlicingParams {
  minIslandPixels?: number;
  clusterYTolerance?: number;
}

export interface IFreeformFrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
  pivot?: { x: number; y: number };
}

export interface IAtlasSlicingConfig {
  method: SlicingMethod;
  cellSize?: ICellSizeSlicingParams;
  grid?: {
    columns: number;
    rows: number;
    cellWidth?: number;
    cellHeight?: number;
    spacing?: number;
    safeMargin?: number;
  };
  autoIslands?: IAutoIslandSlicingParams;
  frames?: Record<string, IFreeformFrameRect>;
}

export interface ResolvedFrameRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  col?: number;
  row?: number;
  trackName?: string;
  frameIndex?: number;
  pivot?: { x: number; y: number };
}

// ============================================================================
// 3. Quality Variants & Resolution Scaling
// ============================================================================
export interface IVariantTier {
  cellWidth: number;
  cellHeight: number;
  scale: number;
}

export interface IVariantsConfig {
  variants: Record<AssetQuality, IVariantTier>;
}

// ============================================================================
// 4. Animation Tracks & Frame Timing
// ============================================================================
export interface IAnimationTrackMeta {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
  wide?: boolean;
  slotSpan?: number[];
  cells?: number[];
  frameIndices?: number[];
  startCol?: number;
  widthCells?: number;
  description?: string;
}

export interface IAnimationTracks {
  animations: Record<string, IAnimationTrackMeta>;
}

// ============================================================================
// 5. Spatial Layout, Origin & Facing
// ============================================================================
export interface ISpatialOrigin {
  type: AnchorOriginType;
  normalized: {
    x: number;
    y: number;
  };
}

export interface ISpatialLayout {
  ordering: string[];
  origin: ISpatialOrigin;
  naturalFacing: FacingDirection;
  defaultFacing?: FacingDirection;
  anchor?: {
    x: number;
    y: number;
  };
}

// ============================================================================
// 6. Portrait Mood Matrix (Characters)
// ============================================================================
export interface IPortraitMatrix {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  spacing: number;
  map: string[][];
  expressions?: Record<string, { row: number; col: number; emotion?: string }>;
}

// ============================================================================
// 7. State Machine Mapping (Creatures & Structures)
// ============================================================================
export interface IStateMapping {
  states: Record<string, { animation: string }>;
}

// ============================================================================
// 8. Info Frames & Bestiary Indices (Objects, Structures & Codices)
// ============================================================================
export interface IInfoFrames {
  infoFrames: Record<string, number>;
}

// ============================================================================
// 9. Interaction & Triggers (Structures & Interactive Props)
// ============================================================================
export interface IInteractionTrigger {
  onPlayerEnterRadius?: boolean;
  onPlayerInteract?: boolean;
  radius?: number;
}

export interface IInteractionEffects {
  playFanfare?: boolean;
  unlockNextStage?: boolean;
  emitParticles?: boolean;
  [key: string]: any;
}

export interface IInteractionConfig {
  type: string;
  trigger?: IInteractionTrigger;
  effects?: IInteractionEffects;
}

// ============================================================================
// 10. Render Directives
// ============================================================================
export interface IRenderDirectives {
  layer: RenderLayerName;
  zIndex: number;
  blend: BlendMode;
}

// ============================================================================
// 11. Validation & AI Generation Constraints
// ============================================================================
export interface IValidationConstraints {
  strictGrid?: boolean;
  noOverlap?: boolean;
  noOverflow?: boolean;
  respectSpacing?: boolean;
  respectSafeMargin?: boolean;
  fixedBaseline?: boolean;
  noFrameOffset?: boolean;
  allowOverflow?: boolean;
  style?: string;
  noPainterly?: boolean;
  [key: string]: any;
}

// ============================================================================
// Composite Documents (Role-Based Types - ISP)
// ============================================================================

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
