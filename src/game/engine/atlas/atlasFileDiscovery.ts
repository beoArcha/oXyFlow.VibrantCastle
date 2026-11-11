import { assetsLogger } from "../../logger/gameLogger";
import type { AtlasFileMap } from "./atlasTypes";

/** Structure folders registered as atlases; the remaining structure sheets stay unregistered for now. */
export const REGISTERED_STRUCTURE_IDS: readonly string[] = ["aether_gate"];

/**
 * Only grid-clean sheets are bundled: repacked PNG (`*_packed_high.png`) and compiled SVG tiers.
 * Original AI sheets (`*_high.png`) stay on disk as repack inputs and are never shipped.
 */
const BUNDLED_IMAGE_PATTERN = /(_packed_high\.png|\.svg)$/;

interface FsLike {
  readdirSync(path: string): string[];
  existsSync(path: string): boolean;
  statSync(path: string): { isDirectory(): boolean };
  readFileSync(path: string, encoding: string): string;
}

/**
 * Vite rewrites these calls into static eager imports at build time. Under Bun there is no
 * such transform and the call throws, which selects the filesystem fallback.
 */
function readViteGlobs(): AtlasFileMap | null {
  try {
    const images = {
      ...import.meta.glob<string>("/src/assets/enemies/*/*{_packed_high.png,.svg}", {
        eager: true,
        query: "?url",
        import: "default",
      }),
      ...import.meta.glob<string>("/src/assets/structures/*/*{_packed_high.png,.svg}", {
        eager: true,
        query: "?url",
        import: "default",
      }),
    };
    const metas = {
      ...import.meta.glob<unknown>("/src/assets/enemies/*/*.json", { eager: true, import: "default" }),
      ...import.meta.glob<unknown>("/src/assets/structures/*/*.json", { eager: true, import: "default" }),
    };
    return { images, metas };
  } catch (err: unknown) {
    assetsLogger.debug("import.meta.glob unavailable, using filesystem discovery", undefined, err);
    return null;
  }
}

function getFs(): { fs: FsLike; cwd: string } | null {
  if (typeof process === "undefined") return null;
  const host = process as unknown as { getBuiltinModule?: (id: string) => unknown; cwd(): string };
  if (typeof host.getBuiltinModule !== "function") return null;
  const fs = host.getBuiltinModule("node:fs") as FsLike | undefined;
  return fs ? { fs, cwd: host.cwd() } : null;
}

function readFromDisk(): AtlasFileMap {
  const images: Record<string, string> = {};
  const metas: Record<string, unknown> = {};
  const host = getFs();
  if (!host) return { images, metas };

  const root = `${host.cwd.replace(/\\/g, "/")}/src/assets`;
  for (const group of ["enemies", "structures"]) {
    if (!host.fs.existsSync(`${root}/${group}`)) continue;
    for (const id of host.fs.readdirSync(`${root}/${group}`)) {
      const dir = `${root}/${group}/${id}`;
      if (!host.fs.statSync(dir).isDirectory()) continue;
      for (const file of host.fs.readdirSync(dir)) {
        const path = `${dir}/${file}`;
        if (/\.(png|svg)$/.test(file)) images[path] = path;
        else if (file.endsWith(".json")) metas[path] = JSON.parse(host.fs.readFileSync(path, "utf-8"));
      }
    }
  }
  return { images, metas };
}

/** Collects every atlas image and meta file of the enemy and structure asset folders. */
export function discoverAtlasFiles(): AtlasFileMap {
  return readViteGlobs() ?? readFromDisk();
}
