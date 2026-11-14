import { assetsLogger } from "../../logger/gameLogger";
import type { AtlasFileMap } from "../atlas/atlasTypes";
import { readAssetsFromDisk } from "../atlas/atlasFileDiscovery";

/**
 * Vite rewrites these calls into static eager imports at build time, so compiled props light up as
 * soon as the files exist. Under Bun there is no such transform and the call throws, which selects
 * the filesystem fallback.
 */
function readViteGlobs(): AtlasFileMap | null {
  try {
    const images = import.meta.glob<string>("/src/assets/props/*/*_hi{8,16}bit.png", {
      eager: true,
      query: "?url",
      import: "default",
    });
    const metas = import.meta.glob<unknown>("/src/assets/props/*/*_prop_meta.json", {
      eager: true,
      import: "default",
    });
    return { images, metas };
  } catch (err: unknown) {
    assetsLogger.debug("import.meta.glob unavailable, using filesystem discovery of props", undefined, err);
    return null;
  }
}

/** Collects the compiled prop sheets (`*_hi8bit.png`, `*_hi16bit.png`) and metas (`*_prop_meta.json`) of `src/assets/props`. */
export function discoverPropFiles(): AtlasFileMap {
  return readViteGlobs() ?? readAssetsFromDisk(["props"], /_hi(?:8|16)bit\.png$/, /_prop_meta\.json$/);
}
