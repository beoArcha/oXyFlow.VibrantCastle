import {
  IStructureRenderer,
  StructureRenderer,
  defaultStructureRenderer,
} from "./structureRenderer";

/**
 * Backward-compatibility aliases for level entity / structure rendering.
 * Refactored to eliminate redundant proxy layer (KISS / YAGNI):
 * Callers and dependencies route directly to StructureRenderer.
 */
export type ILevelEntityRenderer = IStructureRenderer;
export const LevelEntityRenderer = StructureRenderer;
export const defaultLevelEntityRenderer = defaultStructureRenderer;
