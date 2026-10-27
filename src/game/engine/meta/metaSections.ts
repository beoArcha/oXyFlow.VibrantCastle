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

/** Meta Information & Identity */
export interface IMetaInfo {
  id: string;
  entityType: EntityType;
  version: string;
  description: string;
  characterId?: string;
  entityId?: string;
}

/** Atlas Grid Geometry */
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

/** Atlas Background & Transparency Configuration (Chroma Keying) */
export type BackgroundMode = "transparent" | "color" | "solid";

export interface IAtlasBackgroundConfig {
  mode: BackgroundMode;
  colorHex?: string;
  tolerance?: number;
  removeAtRuntime?: boolean;
}

/** Slicing Configuration & Resolved Frame Geometry */
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
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pivot?: { x: number; y: number };
  trackName?: string;
  frameIndex?: number;
}

export interface ResolvedFrameRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  col?: number;
  row?: number;
  pivotX?: number;
  pivotY?: number;
  pivot?: { x: number; y: number };
  trackName?: string;
  frameIndex?: number;
}

export interface IAtlasSlicingConfig {
  method: SlicingMethod;
  cellSize?: ICellSizeSlicingParams;
  autoIslands?: IAutoIslandSlicingParams;
  frames?: IFreeformFrameRect[] | Record<string, IFreeformFrameRect>;
  freeformFrames?: IFreeformFrameRect[];
  grid?: {
    columns: number;
    rows: number;
    cellWidth?: number;
    cellHeight?: number;
    spacing?: number;
    safeMargin?: number;
  };
}

/** Variant Dimensions & Quality Tiers */
export interface IVariantTier {
  cellWidth: number;
  cellHeight: number;
  scale: number;
}

export interface IVariantsConfig {
  variants: Record<AssetQuality, IVariantTier>;
}

/** Animation Tracks & Frame Timing */
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
  pingPong?: boolean;
  frameDelays?: number[];
}

export interface IAnimationTracks {
  animations: Record<string, IAnimationTrackMeta>;
}

/** Spatial Layout & Alignment */
export interface ISpatialOrigin {
  type: AnchorOriginType;
  normalized: {
    x: number;
    y: number;
  };
}

export interface ISpatialLayout {
  origin: ISpatialOrigin;
  naturalFacing: FacingDirection;
  anchor: {
    x: number;
    y: number;
  };
  ordering?: string[];
  [animTrackKey: string]: unknown;
}

/** Dialogue Portrait Matrix */
export interface IPortraitMatrix {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  spacing: number;
  map: string[][];
  subRects?: Record<string, { x: number; y: number; width: number; height: number }>;
}

/** State Machine Mappings */
export interface IStateMapping {
  states: Record<string, { animation: string }>;
}

/** Showcase / Icon Info Frames */
export interface IInfoFrames {
  infoFrames: Record<string, number>;
  showcaseFrame?: { x: number; y: number; width: number; height: number };
  iconFrame?: { x: number; y: number; width: number; height: number };
}

/** Interaction & Triggers (Structures & Interactive Props) */
export interface IInteractionTrigger {
  onPlayerEnterRadius?: boolean;
  onPlayerInteract?: boolean;
  radius?: number;
}

export interface IInteractionEffects {
  playFanfare?: boolean;
  unlockNextStage?: boolean;
  emitParticles?: boolean;
  [key: string]: unknown;
}

export interface IInteractionConfig {
  type: string;
  trigger?: IInteractionTrigger;
  effects?: IInteractionEffects;
}

/** Render Directives */
export interface IRenderDirectives {
  layer: RenderLayerName;
  zIndex: number;
  blend: BlendMode;
}

/** Validation & AI Generation Constraints */
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
  [key: string]: unknown;
}
