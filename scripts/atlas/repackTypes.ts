import type { Island, Rect } from "./islands";

export interface RowConfig {
  animation: string;
  /** Index of the visual row (top to bottom) detected in the source art. */
  detectedRow: number;
  /** Frame count verified against the art; the repack fails when detection disagrees. */
  frames: number;
  /** Source x coordinates splitting the row into frames; islands are assigned by bbox centre. */
  cutsX?: number[];
  /** Area ratio (of the largest island in the row) below which an island counts as FX debris. */
  bodyRatio?: number;
  /** Origin of islands (top-left of their bbox in source pixels) removed from the sheet. */
  drop?: [number, number][];
  /** `group` centres the union of all islands of a frame instead of its largest island. */
  centre?: "body" | "group";
  fps?: number;
  loop?: boolean;
}

export interface SheetConfig {
  /** Directory below src/assets holding `<id>_high.png` and `<id>_meta.json`. */
  directory: string;
  margin: number;
  defaultAnimation: string;
  rows: RowConfig[];
}

export interface RepackConfig {
  sheets: Record<string, SheetConfig>;
  heroes?: Record<string, HeroConfig>;
}

export interface FrameGroup {
  islands: Island[];
  body: Island;
  /** Union bbox of all islands in the group, source pixels. */
  extent: Rect;
}

export interface PlannedRow {
  config: RowConfig;
  frames: FrameGroup[];
}

export interface FramePlacement {
  group: FrameGroup;
  column: number;
  span: number;
  /** Destination x of the horizontal anchor (centre of first cell). */
  anchorX: number;
  /** Destination y of the vertical anchor (baseline or cell centre). */
  anchorY: number;
  /** Source coordinates mapped to the anchor. */
  sourceAnchorX: number;
  sourceAnchorY: number;
}

export interface PlannedLayout {
  cellWidth: number;
  cellHeight: number;
  columns: number;
  rows: number;
  margin: number;
  feetOrigin: boolean;
  placements: FramePlacement[][];
}

export interface HeroConfig {
  /** Directory below src/assets holding the source sheets and meta. */
  directory: string;
  /** Source sheets are `<stem>_high.png`; packed sheets are `<stem>_{low,mid,high}_packed.png`. */
  sourceStem: string;
  metaFile: string;
  packedMetaFile: string;
  /** Alpha above which a pixel counts as content; matches the runtime island scanner. */
  alphaThreshold: number;
  marginX: number;
  /** Transparent columns between neighbouring frames of a row, high tier pixels. */
  gapX: number;
  /** Minimum transparent rows between neighbouring rows, high tier pixels. */
  minGapY: number;
  rows: RowConfig[];
}
