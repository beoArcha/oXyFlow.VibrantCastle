import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";

/**
 * ARCHITECTURAL TEST: Platform solids name a tileset that exists.
 *
 * A solid drawn from a prefab without a `tileset` falls back to the flat procedural grey platform, so
 * every non-gate solid (prefab type `solid` or `oneway`, no `structureId`) in src/data/locations/*.json
 * must carry a `tileset` whose compiled meta (`src/assets/tiles/<id>/<id>_tiles_meta.json`) is on disk.
 */
describe("Platform Tilesets", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const dataDir = path.join(rootDir, "src/data/locations");
  const tilesDir = path.join(rootDir, "src/assets/tiles");

  const tilesetExists = (id: string) => fs.existsSync(path.join(tilesDir, id, `${id}_tiles_meta.json`));

  const locationFiles = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ name: f, json: JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf-8")) }));

  it("discovers location files and tileset folders", () => {
    expect(locationFiles.length).toBeGreaterThan(0);
    expect(fs.existsSync(tilesDir)).toBe(true);
  });

  it("every non-gate solid/oneway prefab used by a solid has a tileset that exists in src/assets/tiles", () => {
    const problems: string[] = [];
    for (const { name, json } of locationFiles) {
      const prefabs: Record<string, { type?: string; structureId?: string; tileset?: string }> =
        json.dictionaries?.entities ?? {};
      for (const solid of json.layout?.solids ?? []) {
        const prefab = solid.prefabId ? prefabs[solid.prefabId] : undefined;
        if (!prefab || (prefab.type !== "solid" && prefab.type !== "oneway")) continue;
        if (prefab.structureId) continue; // gates and other structure-drawn solids
        if (!prefab.tileset) {
          problems.push(`${name}: solid '${solid.id}' (prefab '${solid.prefabId}') has no tileset`);
        } else if (!tilesetExists(prefab.tileset)) {
          problems.push(`${name}: solid '${solid.id}' names unknown tileset '${prefab.tileset}'`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("every tileset named by a prefab in src/data/locations exists in src/assets/tiles", () => {
    const missing: string[] = [];
    for (const { name, json } of locationFiles) {
      const prefabs: Record<string, { tileset?: string }> = json.dictionaries?.entities ?? {};
      for (const [key, prefab] of Object.entries(prefabs)) {
        if (prefab.tileset && !tilesetExists(prefab.tileset)) {
          missing.push(`${name}: prefab '${key}' names unknown tileset '${prefab.tileset}'`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
