import { assetsLogger } from "../../logger/gameLogger";
import type { AtlasFileMap } from "../atlas/atlasTypes";
import { readAssetsFromDisk } from "../atlas/atlasFileDiscovery";

/**
 * Vite rewrites these calls into static eager imports at build time, so compiled tilesets light up
 * as soon as the files exist. Under Bun there is no such transform and the call throws, which selects
 * the filesystem fallback.
 */
function readViteGlobs(): AtlasFileMap | null {
  try {
    const images = import.meta.glob<string>("/src/assets/tiles/*/*_hi{8,16}bit.png", {
      eager: true,
      query: "?url",
      import: "default",
    });
    const metas = import.meta.glob<unknown>("/src/assets/tiles/*/*_tiles_meta.json", {
      eager: true,
      import: "default",
    });
    return { images, metas };
  } catch (err: unknown) {
    assetsLogger.debug("import.meta.glob unavailable, using filesystem discovery of tilesets", undefined, err);
    return null;
  }
}

/** Collects the compiled tile sheets (`*_hi8bit.png`, `*_hi16bit.png`) and metas (`*_tiles_meta.json`) of `src/assets/tiles`. */
export function discoverTilesetFiles(): AtlasFileMap {
  return readViteGlobs() ?? readAssetsFromDisk(["tiles"], /_hi(?:8|16)bit\.png$/, /_tiles_meta\.json$/);
}
