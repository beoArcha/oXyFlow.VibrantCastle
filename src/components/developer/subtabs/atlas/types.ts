import {
  IAtlasSlicingConfig,
  IAtlasBackgroundConfig,
  ResolvedFrameRect,
  SlicingMethod,
  AtlasMetaDoc,
  AtlasAnimationTrackDefinition,
  AtlasOriginDefinition,
  AtlasGridConfig,
} from "@game/engine/meta/types";

export type {
  IAtlasSlicingConfig,
  IAtlasBackgroundConfig,
  ResolvedFrameRect,
  SlicingMethod,
  AtlasMetaDoc,
  AtlasAnimationTrackDefinition,
  AtlasOriginDefinition,
  AtlasGridConfig,
};

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
