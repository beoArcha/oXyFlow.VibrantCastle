import { AnimationName } from "@game/engine/spriteTypes";
import { ImageDimensions } from "../types";

/**
 * Supported atlas category views.
 */
export type AtlasSheetType = "spritesheet" | "portraits";

/**
 * Grid partition and dimension metrics for texture atlas sheets.
 */
export interface AtlasGridMetrics extends ImageDimensions {
  readonly columns: number;
  readonly rows: number;
  readonly cellWidth: number;
  readonly cellHeight: number;
}

/**
 * Zoom interaction controls for atlas sheet viewport.
 */
export interface AtlasZoomControlsProps {
  readonly zoom: number;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onResetZoom: () => void;
}

/**
 * Visual toggle switches for atlas overlays and guides.
 */
export interface AtlasOverlayTogglesProps {
  readonly showGrid: boolean;
  readonly onToggleGrid: () => void;
  readonly showLabels: boolean;
  readonly onToggleLabels: () => void;
}

/**
 * Animation track association for individual sprite sheet rows.
 */
export interface RowAnimationKey {
  readonly row: number;
  readonly name: AnimationName;
  readonly labelKey: string;
}
