import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import {
  LocationParser,
  CANONICAL_ENEMY_REGISTRY,
} from "@game/locations/parser/locationParser";
import {
  LocationJsonSchema,
  LOCATION_SCENE_TYPES,
} from "@game/locations/schema/locationSchema";
import { translations } from "@i18n";
import { defaultParallaxRegistry } from "@game/parallax/registry";

/**
 * ARCHITECTURAL TEST SUITE: Location Blueprint Schema Contracts
 *
 * Rationale & Invariants:
 * Levels and rooms are defined as declarative JSON blueprints.
 * Runtime crashes or broken game progression can occur if:
 * 1. Portals reference non-existent rooms (broken navigation graph).
 * 2. Placed enemies reference missing monster templates in the dictionary.
 * 3. Parallax layers reference missing background assets in the hybrid registry.
 * 4. Blueprint translation keys are missing from i18n dictionaries (showing raw fallback keys to players).
 *
 * This test suite enforces contract integrity across all location blueprints in src/data/locations/.
 */
describe("Location Blueprint Schema Contracts", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const dataDir = path.join(rootDir, "src/data/locations");

  const CANONICAL_ROOMS = [
    "courtyard",
    "thorn_chasm",
    "ashen_catacombs",
    "clocktower",
    "alchemist_library",
    "aether_sanctuary",
    "grand_bastion",
    "eclipse_crown",
  ];

  const VALID_ZONE_KINDS = new Set(["boss", "rest", "secret", "story"]);

  // Read and parse all JSON blueprint files
  const blueprintFiles = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".json") && !f.endsWith(".schema.json"));

  const loadedBlueprints: { filename: string; json: LocationJsonSchema }[] = blueprintFiles.map(
    (filename) => {
      const filePath = path.join(dataDir, filename);
      const raw = fs.readFileSync(filePath, "utf-8");
      return {
        filename,
        json: JSON.parse(raw) as LocationJsonSchema,
      };
    }
  );

  const registeredLocationIds = new Set(loadedBlueprints.map((b) => b.json.id));

  describe("Blueprint Discovery & Parsing", () => {
    it("discovers all 8 canonical world location blueprints", () => {
      expect(loadedBlueprints.length).toBe(CANONICAL_ROOMS.length);
      for (const roomId of CANONICAL_ROOMS) {
        expect(registeredLocationIds.has(roomId)).toBe(true);
      }
    });

    it("parses every blueprint into a valid runtime LocationDefinition via LocationParser", () => {
      for (const { filename, json } of loadedBlueprints) {
        expect(() => {
          const loc = LocationParser.parse(json);
          expect(loc.id).toBe(json.id);
          expect(loc.width).toBe(json.dimensions.width);
          expect(loc.height).toBe(json.dimensions.height);
          expect(loc.createEntities(false).length).toBeGreaterThan(0);
        }).not.toThrow();
      }
    });

    it("ensures every blueprint specifies a valid sceneType supported by LocationParser", () => {
      const validSceneTypes = new Set(LOCATION_SCENE_TYPES);
      for (const { filename, json } of loadedBlueprints) {
        const sceneType = json.sceneType || "action_platformer";
        expect(validSceneTypes.has(sceneType)).toBe(true);

        const loc = LocationParser.parse(json);
        expect(loc.sceneType).toBe(sceneType);
        if (json.linkedSceneId) {
          expect(loc.linkedSceneId).toBe(json.linkedSceneId);
        }
      }
    });

    it("ensures all locations have positive dimensions and valid spawn points within bounds", () => {
      for (const { filename, json } of loadedBlueprints) {
        const { width, height } = json.dimensions;
        expect(width).toBeGreaterThanOrEqual(100);
        expect(height).toBeGreaterThanOrEqual(100);

        const { default: spawn, p2Offset } = json.spawnPoints;
        expect(spawn.x).toBeGreaterThanOrEqual(0);
        expect(spawn.x).toBeLessThanOrEqual(width);
        expect(spawn.y).toBeGreaterThanOrEqual(0);
        expect(spawn.y).toBeLessThanOrEqual(height);

        expect(typeof p2Offset.x).toBe("number");
        expect(typeof p2Offset.y).toBe("number");
      }
    });
  });

  describe("Portal Routing & World Graph Integrity", () => {
    it("ensures every portal points to a valid destination room (zero dangling transitions)", () => {
      const danglingPortals: { file: string; portalId: string; target: string }[] = [];

      for (const { filename, json } of loadedBlueprints) {
        // 1. Check dictionary portals
        if (json.dictionaries?.portals) {
          for (const [key, portal] of Object.entries(json.dictionaries.portals)) {
            if (!registeredLocationIds.has(portal.targetLocationId)) {
              danglingPortals.push({
                file: filename,
                portalId: key,
                target: portal.targetLocationId,
              });
            }
          }
        }

        // 2. Check layout portals
        if (json.layout?.portals) {
          for (const portal of json.layout.portals) {
            const target =
              portal.targetLocationId ||
              (portal.portalKey
                ? json.dictionaries?.portals?.[portal.portalKey]?.targetLocationId
                : undefined);

            if (!target || !registeredLocationIds.has(target)) {
              danglingPortals.push({
                file: filename,
                portalId: portal.id,
                target: target || "undefined",
              });
            }
          }
        }
      }

      expect(danglingPortals).toEqual([]);
    });

    it("ensures every portal declares a valid activation trigger mode", () => {
      for (const { filename, json } of loadedBlueprints) {
        if (json.dictionaries?.portals) {
          for (const [key, portal] of Object.entries(json.dictionaries.portals)) {
            expect(["touch", "interact"]).toContain(portal.activation);
          }
        }
      }
    });

    it("ensures canonical forward progression loop is traversable across all rooms", () => {
      for (const { json } of loadedBlueprints) {
        const loc = LocationParser.parse(json);
        expect(loc.nextLocationId).toBeDefined();
        expect(registeredLocationIds.has(loc.nextLocationId!)).toBe(true);
      }
    });
  });

  describe("Enemy & Monster Template Integrity", () => {
    it("ensures zero location blueprints declare redundant local monster dictionaries (strict SSOT)", () => {
      const locationsWithLocalMonsters: string[] = [];
      for (const { filename, json } of loadedBlueprints) {
        if (json.dictionaries && json.dictionaries.monsters) {
          locationsWithLocalMonsters.push(filename);
        }
      }
      expect(locationsWithLocalMonsters).toEqual([]);
    });

    it("ensures every placed enemy references a valid monster template in canonical registry", () => {
      const missingMonsterRefs: { file: string; enemyId: string; monsterKey: string }[] = [];

      for (const { filename, json } of loadedBlueprints) {
        if (json.layout?.enemies) {
          for (const enemy of json.layout.enemies) {
            if (!CANONICAL_ENEMY_REGISTRY[enemy.monsterKey]) {
              missingMonsterRefs.push({
                file: filename,
                enemyId: enemy.id,
                monsterKey: enemy.monsterKey,
              });
            }
          }
        }
      }

      expect(missingMonsterRefs).toEqual([]);
    });



    it("instantiates enemies cleanly for single-player and two-player modes", () => {
      for (const { json } of loadedBlueprints) {
        const loc = LocationParser.parse(json);
        const p1Enemies = loc.createEnemies(false);
        const p2Enemies = loc.createEnemies(true);

        expect(Array.isArray(p1Enemies)).toBe(true);
        expect(Array.isArray(p2Enemies)).toBe(true);
        expect(p2Enemies.length).toBeGreaterThanOrEqual(p1Enemies.length);

        for (const enemy of p1Enemies) {
          expect(enemy.id).toBeDefined();
          expect(enemy.health).toBeGreaterThan(0);
          expect(enemy.width).toBeGreaterThan(0);
          expect(enemy.height).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("Parallax Background & Asset File Integrity", () => {
    it("uses the new parallax and zones shape without legacy parallaxBackground, bossZones, or imageUrl keys", () => {
      for (const { filename, json } of loadedBlueprints) {
        expect({ file: filename, hasParallax: Boolean(json.parallax) }).toEqual({ file: filename, hasParallax: true });
        expect({ file: filename, hasLegacyBg: json.parallaxBackground !== undefined }).toEqual({
          file: filename,
          hasLegacyBg: false,
        });
        expect({ file: filename, hasLegacyBossZones: json.bossZones !== undefined }).toEqual({
          file: filename,
          hasLegacyBossZones: false,
        });
        expect(JSON.stringify(json.parallax)).not.toContain('"imageUrl"');
        expect(JSON.stringify(json.zones ?? [])).not.toContain('"imageUrl"');
      }
    });

    it("ensures each location selects 1 to 4 unique variation keys (far implicit) and resolves every key in ParallaxRegistry", () => {
      const missingAssets: { file: string; key: string }[] = [];

      for (const { filename, json } of loadedBlueprints) {
        const worldId = json.worldId || json.id;
        const layers = json.parallax?.layers ?? [];
        expect(layers.length).toBeGreaterThanOrEqual(1);
        expect(layers.length).toBeLessThanOrEqual(4);
        expect(layers).not.toContain("far");
        expect(new Set(layers).size).toBe(layers.length);

        const keysToCheck = [`${worldId}:far`, ...layers.map((slot) => `${worldId}:${slot}`)];
        for (const key of keysToCheck) {
          const resolved = defaultParallaxRegistry.resolve(key);
          if (!resolved || !resolved.url) {
            missingAssets.push({ file: filename, key });
          }
        }
      }

      expect(missingAssets).toEqual([]);
    });

    it("ensures world meta defines an opaque far layer and non-opaque variation layers", () => {
      for (const { filename, json } of loadedBlueprints) {
        const worldId = json.worldId || json.id;
        const meta = defaultParallaxRegistry.getWorldMeta(worldId);
        expect({ file: filename, hasMeta: Boolean(meta) }).toEqual({ file: filename, hasMeta: true });
        expect({ file: filename, farOpaque: meta?.layers.far?.opaque }).toEqual({ file: filename, farOpaque: true });

        for (const slot of json.parallax?.layers ?? []) {
          expect(meta?.layers[slot]?.opaque).not.toBe(true);
        }
      }
    });

    it("ensures parallax box covers the level width plus a 400px margin and level height", () => {
      for (const { filename, json } of loadedBlueprints) {
        expect({ file: filename, widthOk: (json.parallax?.box?.width ?? 0) >= json.dimensions.width + 400 }).toEqual({
          file: filename,
          widthOk: true,
        });
        expect({ file: filename, heightOk: (json.parallax?.box?.height ?? 0) >= json.dimensions.height }).toEqual({
          file: filename,
          heightOk: true,
        });
      }
    });

    it("ensures every zone has a valid kind, positive bounds, and resolvable image effects", () => {
      for (const { filename, json } of loadedBlueprints) {
        const worldId = json.worldId || json.id;
        const meta = defaultParallaxRegistry.getWorldMeta(worldId);
        for (const zone of json.zones ?? []) {
          expect({ file: filename, kind: VALID_ZONE_KINDS.has(zone.kind) }).toEqual({ file: filename, kind: true });
          expect(zone.width).toBeGreaterThan(0);
          expect(zone.height).toBeGreaterThan(0);
          for (const effectId of zone.effects ?? []) {
            const effectMeta = meta?.effects?.[effectId];
            expect(effectMeta).toBeDefined();
            if (effectMeta?.kind === "image" && effectMeta.source) {
              expect(defaultParallaxRegistry.resolve(effectMeta.source)?.url).toBeDefined();
            }
          }
        }
      }
    });

    it("parses locations without mutating the input blueprint", () => {
      for (const { json } of loadedBlueprints) {
        const snapshotBefore = JSON.stringify(json);
        const parsed = LocationParser.parse(json);
        expect(JSON.stringify(json)).toBe(snapshotBefore);
        expect(parsed.parallaxBackground?.layers.some((l) => l.imageUrl !== undefined)).toBe(false);
      }
    });
  });

  describe("Localization (i18n) Parity Contracts", () => {
    const plDict = translations.pl as unknown as Record<string, string>;
    const enDict = translations.en as unknown as Record<string, string>;

    it("ensures location nameKey, descriptionKey, and openingNarrationKey exist in EN and PL", () => {
      const missingKeys: { file: string; key: string; lang: string }[] = [];

      for (const { filename, json } of loadedBlueprints) {
        const keysToCheck = [
          { name: "nameKey", val: json.nameKey },
          { name: "descriptionKey", val: json.descriptionKey },
          { name: "openingNarrationKey", val: json.openingNarrationKey },
        ];

        for (const { name, val } of keysToCheck) {
          if (!val) continue;
          if (!(val in enDict)) {
            missingKeys.push({ file: filename, key: `${name}:${val}`, lang: "en" });
          }
          if (!(val in plDict)) {
            missingKeys.push({ file: filename, key: `${name}:${val}`, lang: "pl" });
          }
        }
      }

      expect(missingKeys).toEqual([]);
    });

    it("ensures all portal labelKeys exist in EN and PL translation dictionaries", () => {
      const missingPortalKeys: { file: string; portalId: string; key: string; lang: string }[] = [];

      for (const { filename, json } of loadedBlueprints) {
        if (json.dictionaries?.portals) {
          for (const [portalId, portal] of Object.entries(json.dictionaries.portals)) {
            if (portal.labelKey) {
              if (!(portal.labelKey in enDict)) {
                missingPortalKeys.push({ file: filename, portalId, key: portal.labelKey, lang: "en" });
              }
              if (!(portal.labelKey in plDict)) {
                missingPortalKeys.push({ file: filename, portalId, key: portal.labelKey, lang: "pl" });
              }
            }
          }
        }
      }

      expect(missingPortalKeys).toEqual([]);
    });

  });
});
