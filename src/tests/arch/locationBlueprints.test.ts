import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { LocationParser } from "@game/locations/parser/locationParser";
import {
  LocationJsonSchema,
  BackgroundLayerTier,
} from "@game/locations/schema/locationSchema";
import { translations } from "@i18n";

/**
 * ARCHITECTURAL TEST SUITE: Location Blueprint Schema Contracts
 *
 * Rationale & Invariants:
 * Castlevania-style levels are defined as declarative JSON blueprints.
 * Runtime crashes or broken game progression can occur if:
 * 1. Portals reference non-existent rooms (broken navigation graph).
 * 2. Placed enemies reference missing monster templates in the dictionary.
 * 3. Parallax layers reference missing background PNG files on disk.
 * 4. Blueprint translation keys are missing from i18n dictionaries (showing raw fallback keys to players).
 *
 * This test suite enforces contract integrity across all location blueprints in src/data/locations/.
 */
describe("Location Blueprint Schema Contracts", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const dataDir = path.join(rootDir, "src/data/locations");
  const assetsBgDir = path.join(rootDir, "src/assets/bg");

  const CANONICAL_ROOMS = [
    "courtyard",
    "thorn_chasm",
    "clocktower",
    "aether_sanctuary",
    "grand_bastion",
  ];

  const VALID_TIERS: Set<BackgroundLayerTier> = new Set([
    "far",
    "mid_far",
    "mid",
    "mid_close",
    "close",
  ]);

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
    it("discovers all 5 canonical location blueprints", () => {
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
    it("ensures every placed enemy references a valid monster template in dictionaries", () => {
      const missingMonsterRefs: { file: string; enemyId: string; monsterKey: string }[] = [];

      for (const { filename, json } of loadedBlueprints) {
        const monsterDict = json.dictionaries?.monsters || {};
        if (json.layout?.enemies) {
          for (const enemy of json.layout.enemies) {
            if (!monsterDict[enemy.monsterKey]) {
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

    it("ensures monster templates declare positive dimensions and health invariants", () => {
      for (const { filename, json } of loadedBlueprints) {
        const monsterDict = json.dictionaries?.monsters || {};
        for (const [key, monster] of Object.entries(monsterDict)) {
          expect(monster.width).toBeGreaterThan(0);
          expect(monster.height).toBeGreaterThan(0);
          expect(monster.health).toBeGreaterThan(0);
          expect(monster.maxHealth).toBeGreaterThanOrEqual(monster.health);
          expect(monster.speed).toBeGreaterThanOrEqual(0);
        }
      }
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
    it("ensures each location defines an oversized parallax bounding box with at least 5 layers", () => {
      for (const { filename, json } of loadedBlueprints) {
        const bg = json.parallaxBackground;
        expect(bg).toBeDefined();
        expect(bg.boxWidth).toBeGreaterThanOrEqual(json.dimensions.width);
        expect(bg.boxHeight).toBeGreaterThanOrEqual(json.dimensions.height);
        expect(bg.layers.length).toBeGreaterThanOrEqual(5);
      }
    });

    it("ensures all parallax layers have valid tiers", () => {
      for (const { filename, json } of loadedBlueprints) {
        for (const layer of json.parallaxBackground.layers) {
          if (layer.tier) {
            expect(VALID_TIERS.has(layer.tier)).toBe(true);
          }
        }
      }
    });

    it("ensures every image parallax layer points to a non-empty physical PNG asset on disk", () => {
      const missingAssets: { file: string; layerId: string; expectedPath: string }[] = [];

      for (const { filename, json } of loadedBlueprints) {
        const locId = json.id;
        for (const layer of json.parallaxBackground.layers) {
          if (layer.type === "image" && layer.imageUrl) {
            const expectedPath = path.join(assetsBgDir, locId, `${layer.imageUrl}.png`);
            if (!fs.existsSync(expectedPath)) {
              missingAssets.push({ file: filename, layerId: layer.id, expectedPath });
            } else {
              const stat = fs.statSync(expectedPath);
              expect(stat.size).toBeGreaterThan(0);
            }
          }
        }
      }

      expect(missingAssets).toEqual([]);
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

    it("ensures all monster nameKeys exist in EN and PL translation dictionaries", () => {
      const missingMonsterKeys: { file: string; monsterKey: string; key: string; lang: string }[] = [];

      for (const { filename, json } of loadedBlueprints) {
        const monsterDict = json.dictionaries?.monsters || {};
        for (const [monsterKey, monster] of Object.entries(monsterDict)) {
          if (monster.nameKey) {
            if (!(monster.nameKey in enDict)) {
              missingMonsterKeys.push({ file: filename, monsterKey, key: monster.nameKey, lang: "en" });
            }
            if (!(monster.nameKey in plDict)) {
              missingMonsterKeys.push({ file: filename, monsterKey, key: monster.nameKey, lang: "pl" });
            }
          }
        }
      }

      expect(missingMonsterKeys).toEqual([]);
    });
  });
});
