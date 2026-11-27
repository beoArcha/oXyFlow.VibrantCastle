import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { defaultParallaxRegistry } from "@game/parallax/registry";
import type { LocationJsonSchema } from "@game/locations/schema/locationSchema";

/**
 * ARCHITECTURAL TEST: Parallax layer image files exist on disk.
 *
 * The registry (src/game/parallax/registry.ts) is built from per-world
 * *_parallax_meta.json files and asset globs. This test verifies:
 * 1. Every registered entry resolves to an image file that exists under src/assets/parallax.
 * 2. Legacy keys and aliases are not registered.
 * 3. Every layer and zone effect referenced by src/data/locations/*.json resolves to an existing file.
 */
describe("Parallax Layer Image Files", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const dataDir = path.join(rootDir, "src/data/locations");

  it("resolves every entry in defaultParallaxRegistry to an existing image file on disk", () => {
    const entries = defaultParallaxRegistry.entries();
    expect(entries.length).toBeGreaterThanOrEqual(33);

    const missing: { key: string; url: string }[] = [];
    for (const entry of entries) {
      if (!entry.url || !fs.existsSync(entry.url)) {
        missing.push({ key: entry.key, url: entry.url });
      }
    }
    expect(missing).toEqual([]);
  });

  it("exposes no legacy aliases or world/shared/boss prefixed keys", () => {
    const legacyKeys = [
      "bg_far",
      "courtyard_far_high",
      "world:courtyard:far",
      "shared:mid:courtyard_arches_a",
      "boss:stage:arcane_sigil_arena",
      "boss:world:eclipse_throne_colossus",
    ];
    for (const legacyKey of legacyKeys) {
      expect(defaultParallaxRegistry.resolve(legacyKey)).toBeUndefined();
    }
  });

  it("resolves every location blueprint parallax layer and zone image effect to an existing file", () => {
    const blueprintFiles = fs
      .readdirSync(dataDir)
      .filter((f) => f.endsWith(".json") && !f.endsWith(".schema.json"));

    const problems: { file: string; key: string; reason: string }[] = [];
    let checked = 0;

    for (const filename of blueprintFiles) {
      const json = JSON.parse(fs.readFileSync(path.join(dataDir, filename), "utf-8")) as LocationJsonSchema;
      const worldId = json.worldId || json.id;
      const meta = defaultParallaxRegistry.getWorldMeta(worldId);

      const layerKeys = [`${worldId}:far`, ...(json.parallax?.layers ?? []).map((slot) => `${worldId}:${slot}`)];
      for (const key of layerKeys) {
        checked++;
        const entry = defaultParallaxRegistry.resolve(key);
        if (!entry) {
          problems.push({ file: filename, key, reason: "not in registry" });
        } else if (!fs.existsSync(entry.url)) {
          problems.push({ file: filename, key, reason: `missing file ${entry.url}` });
        }
      }

      for (const zone of json.zones ?? []) {
        for (const effectId of zone.effects ?? []) {
          const source = meta?.effects?.[effectId]?.source;
          if (!source) continue;
          checked++;
          const entry = defaultParallaxRegistry.resolve(source);
          if (!entry) {
            problems.push({ file: filename, key: source, reason: "effect not in registry" });
          } else if (!fs.existsSync(entry.url)) {
            problems.push({ file: filename, key: source, reason: `missing file ${entry.url}` });
          }
        }
      }
    }

    expect(checked).toBeGreaterThan(0);
    expect(problems).toEqual([]);
  });
});
