import type { SlicingMethod } from "@game/engine/meta/types";
import type { AtlasPresetCategory } from "./assetPresets";

export type ToolMode = "select" | "pan" | "eyedropper" | "sequence";
export type InspectorTabId = "preview" | "slicing" | "chroma" | "json";
export type CategoryFilter = "all" | AtlasPresetCategory;

export interface CursorCoords {
  readonly x: number;
  readonly y: number;
  readonly col: number;
  readonly row: number;
}

export const CATEGORY_FILTERS: readonly { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Wszystkie" },
  { id: "character", label: "Postacie" },
  { id: "enemy", label: "Wrogowie" },
  { id: "structure", label: "Struktury" },
  { id: "portrait", label: "Portrety" },
];

export const SLICING_METHOD_OPTIONS: { value: SlicingMethod; label: string }[] = [
  { value: "by_count", label: "Siatka (Kolumny × Wiersze)" },
  { value: "by_cell_size", label: "Rozmiar komórki (px)" },
  { value: "freeform_rects", label: "Dowolne prostokąty (Freeform)" },
  { value: "auto_islands", label: "Auto-wyspy (Flood-Fill)" },
];

export const INSPECTOR_TABS: readonly { id: InspectorTabId; label: string }[] = [
  { id: "preview", label: "Podgląd" },
  { id: "slicing", label: "Cięcie i Ścieżki" },
  { id: "chroma", label: "Tło i Alpha" },
  { id: "json", label: "JSON" },
];
