import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import {
  PARALLAX_LAYER_CATALOG,
  resolveParallaxLayerAsset,
} from "@game/locations/parallaxLayerRegistry";

/**
 * ARCHITECTURAL TEST: Parallax layer image files exist on disk.
 *
 * The registry (src/game/locations/parallaxLayerRegistry.ts) maps layer keys to
 * static `@assets/...` imports. Resolving a key to an entry does not prove the
 * image behind it is present, so this test checks the files themselves:
 * 1. Every catalog entry's `url` identifier maps to a static import whose file exists under src/assets.
 * 2. Every layerKey / imageUrl used by src/data/locations/*.json resolves via the registry
 *    to an entry whose backing file exists.
 */
describe("Parallax Layer Image Files", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const assetsDir = path.join(rootDir, "src/assets");
  const dataDir = path.join(rootDir, "src/data/locations");
  const registryPath = path.join(rootDir, "src/game/locations/parallaxLayerRegistry.ts");
  const registrySource = fs.readFileSync(registryPath, "utf-8");

  // identifier -> asset path relative to src/assets, from static `import x from "@assets/..."`
  const importMap = new Map<string, string>();
  for (const m of registrySource.matchAll(/import\s+(\w+)\s+from\s+"@assets\/([^"]+)"/g)) {
    importMap.set(m[1], m[2]);
  }

  // catalog key -> url identifier, parsed from the source so each entry's file can be checked
  const keyToIdentifier = new Map<string, string>();
  for (const m of registrySource.matchAll(/key:\s*"([^"]+)"[\s\S]*?url:\s*(\w+)\s*,/g)) {
    keyToIdentifier.set(m[1], m[2]);
  }

  const assetExists = (rel: string) => fs.existsSync(path.join(assetsDir, rel));

  it("parses the registry source consistently with the runtime catalog", () => {
    expect(keyToIdentifier.size).toBe(PARALLAX_LAYER_CATALOG.length);
    for (const entry of PARALLAX_LAYER_CATALOG) {
      expect(keyToIdentifier.has(entry.key)).toBe(true);
    }
  });

  it("every registry entry points to an import whose file exists under src/assets", () => {
    const broken: { key: string; identifier: string; target: string }[] = [];
    for (const [key, identifier] of keyToIdentifier) {
      const rel = importMap.get(identifier);
      if (!rel || !assetExists(rel)) {
        broken.push({ key, identifier, target: rel ?? "<no static @assets import>" });
      }
    }
    expect(broken).toEqual([]);
  });

  it("every layerKey/imageUrl referenced by location blueprints resolves to an existing file", () => {
    const blueprintFiles = fs
      .readdirSync(dataDir)
      .filter((f) => f.endsWith(".json") && !f.endsWith(".schema.json"));

    const problems: { file: string; layerId: string; ref: string; reason: string }[] = [];
    let checked = 0;

    for (const filename of blueprintFiles) {
      const json = JSON.parse(fs.readFileSync(path.join(dataDir, filename), "utf-8"));
      const layers: any[] = json.parallaxBackground?.layers ?? [];
      for (const layer of layers) {
        for (const ref of [layer.layerKey, layer.imageUrl]) {
          if (!ref) continue;
          checked++;
          const entry = resolveParallaxLayerAsset(ref);
          if (!entry) {
            problems.push({ file: filename, layerId: layer.id, ref, reason: "not in registry" });
            continue;
          }
          const identifier = keyToIdentifier.get(entry.key);
          const rel = identifier ? importMap.get(identifier) : undefined;
          if (!rel) {
            problems.push({ file: filename, layerId: layer.id, ref, reason: "no static @assets import" });
          } else if (!assetExists(rel)) {
            problems.push({ file: filename, layerId: layer.id, ref, reason: `missing file ${rel}` });
          }
        }
      }
    }

    expect(checked).toBeGreaterThan(0);
    expect(problems).toEqual([]);
  });
});
