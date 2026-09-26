import {
  IAtlasSlicingConfig,
  IAtlasBackgroundConfig,
  ResolvedFrameRect,
  SlicingMethod,
} from "../../../../game/engine/meta/types";

export type { IAtlasSlicingConfig, IAtlasBackgroundConfig, ResolvedFrameRect, SlicingMethod };

export interface AtlasAnimationTrackDefinition {
  name: string;
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
  wide?: boolean;
  slotSpan?: number[];
  cells?: number[];
  frameIndices?: number[];
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
  animations?: Record<string, any>;
  layout?: {
    ordering?: string[];
    origin?: {
      type?: string;
      normalized: { x: number; y: number };
    };
    [animKey: string]: any;
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
  [key: string]: any;
}

export type AtlasInspectorTabId = "preview" | "slicing" | "background" | "json";

export type SlicerViewerTool = "select" | "pan" | "eyedropper";

export interface AtlasPresetItem {
  id: string;
  name: string;
  category: "character" | "enemy" | "structure" | "portrait" | "custom";
  imageSrc: string;
  defaultMeta: AtlasMetaDoc;
}

export interface SelectedCellInfo {
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  trackName?: string;
  frameIndex?: number;
}
