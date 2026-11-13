import { assetsLogger } from "../../logger/gameLogger";
import type { AtlasFileMap } from "../atlas/atlasTypes";
import { readAssetsFromDisk } from "../atlas/atlasFileDiscovery";

/**
 * Vite rewrites these calls into static eager imports at build time, so compiled hero art lights up
 * as soon as the files exist. Under Bun there is no such transform and the call throws, which selects
 * the filesystem fallback.
 */
function readViteGlobs(): AtlasFileMap | null {
  try {
    const images = import.meta.glob<string>("/src/assets/characters/*/*.svg", {
      eager: true,
      query: "?url",
      import: "default",
    });
    const metas = import.meta.glob<unknown>("/src/assets/characters/*/*_pixel_meta.json", {
      eager: true,
      import: "default",
    });
    return { images, metas };
  } catch (err: unknown) {
    assetsLogger.debug("import.meta.glob unavailable, using filesystem discovery of hero pixel art", undefined, err);
    return null;
  }
}

/** Collects the compiled hero pixel sheets (`*.svg`) and metas (`*_pixel_meta.json`) of `src/assets/characters`. */
export function discoverHeroPixelFiles(): AtlasFileMap {
  return readViteGlobs() ?? readAssetsFromDisk(["characters"], /\.svg$/, /_pixel_meta\.json$/);
}
