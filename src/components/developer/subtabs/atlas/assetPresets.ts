import { AtlasPresetItem } from "./types";
import { defaultAtlasAssetRegistry } from "@game/engine/meta/registry";

export { defaultAtlasAssetRegistry };

/**
 * Global presets populated directly from the centralized AtlasAssetRegistry (SOLID & OCP).
 */
export const ATLAS_PRESETS: AtlasPresetItem[] = defaultAtlasAssetRegistry
  .getAllResolved()
  .map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    imageSrc: item.imageSrc,
    defaultMeta: item.defaultMeta,
  }));

