import { describe, it, expect } from "bun:test";
import enemiesData from "@data/enemies/enemies.json";
import skillsData from "@data/skills/skills.json";
import spellsData from "@data/skills/spells.json";
import itemsData from "@data/items/items.json";
import vnData from "@data/narrative/dialogues_vn.json";
import atlasManifest from "@assets/atlas_manifest.json";
import { translations } from "@i18n";
import { calculateDagNodePositions, DagLayoutSkillInput } from "@lib/math/dagLayout";
import { ItemJsonSchema } from "@lib/schemas/itemSchema";
import {
  VisualNovelSceneJsonSchema,
  VisualNovelNodeSchema,
  VnChoiceSchema,
  VALEN_PORTRAIT_EMOTIONS,
  AURELIA_PORTRAIT_EMOTIONS,
} from "@lib/schemas/visualNovelSchema";

describe("Data Integrity & Single Source of Truth Contracts", () => {
  const plDict = translations.pl as unknown as Record<string, string>;
  const enDict = translations.en as unknown as Record<string, string>;

  describe("Enemies and Bestiary Integrity", () => {
    const enemies = Object.values(enemiesData.enemies);

    it("verifies all enemy IDs are strictly unique", () => {
      const ids = enemies.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("verifies all enemy translation keys exist in both PL and EN dictionaries", () => {
      const missingKeys: string[] = [];

      enemies.forEach((enemy) => {
        if (!plDict[enemy.nameKey]) missingKeys.push(`PL missing enemy.nameKey: ${enemy.nameKey}`);
        if (!enDict[enemy.nameKey]) missingKeys.push(`EN missing enemy.nameKey: ${enemy.nameKey}`);

        if (enemy.soulDrop) {
          const { nameKey, descriptionKey } = enemy.soulDrop.i18n;
          if (!plDict[nameKey]) missingKeys.push(`PL missing soulDrop.nameKey: ${nameKey}`);
          if (!enDict[nameKey]) missingKeys.push(`EN missing soulDrop.nameKey: ${nameKey}`);
          if (!plDict[descriptionKey]) missingKeys.push(`PL missing soulDrop.descKey: ${descriptionKey}`);
          if (!enDict[descriptionKey]) missingKeys.push(`EN missing soulDrop.descKey: ${descriptionKey}`);
        }

        if (enemy.bestiary) {
          const { bestiaryKey, tacticsKey, loreQuoteKey } = enemy.bestiary;
          if (!plDict[bestiaryKey]) missingKeys.push(`PL missing bestiaryKey: ${bestiaryKey}`);
          if (!enDict[bestiaryKey]) missingKeys.push(`EN missing bestiaryKey: ${bestiaryKey}`);
          if (!plDict[tacticsKey]) missingKeys.push(`PL missing tacticsKey: ${tacticsKey}`);
          if (!enDict[tacticsKey]) missingKeys.push(`EN missing tacticsKey: ${tacticsKey}`);
          if (!plDict[loreQuoteKey]) missingKeys.push(`PL missing loreQuoteKey: ${loreQuoteKey}`);
          if (!enDict[loreQuoteKey]) missingKeys.push(`EN missing loreQuoteKey: ${loreQuoteKey}`);
        }
      });

      expect(missingKeys).toEqual([]);
    });

    it("verifies combat stats and dimensional boundaries are strictly positive", () => {
      enemies.forEach((enemy) => {
        expect(enemy.dimensions.width).toBeGreaterThan(0);
        expect(enemy.dimensions.height).toBeGreaterThan(0);
        expect(enemy.stats.health).toBeGreaterThan(0);
        expect(enemy.stats.maxHealth).toBeGreaterThanOrEqual(enemy.stats.health);
        expect(enemy.stats.speed).toBeGreaterThanOrEqual(0);
        expect(enemy.stats.attackPower).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Skills and Spells Progression Integrity", () => {
    const valenSkills = skillsData.valen;
    const aureliaSkills = skillsData.aurelia;
    const allSkills = [...valenSkills, ...aureliaSkills];
    const spells = Object.values(spellsData.spells);

    it("ensures all skill IDs are strictly unique across heroes", () => {
      const ids = allSkills.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("ensures skill trees form strictly acyclic graphs with valid prerequisites", () => {
      const valenResult = calculateDagNodePositions(valenSkills as DagLayoutSkillInput[]);
      expect(valenResult.hasCycles).toBe(false);

      const aureliaResult = calculateDagNodePositions(aureliaSkills as DagLayoutSkillInput[]);
      expect(aureliaResult.hasCycles).toBe(false);

      // Verify prerequisite skills exist in the same character's pool
      valenSkills.forEach((skill) => {
        if (skill.reqSkillId) {
          const exists = valenSkills.some((s) => s.id === skill.reqSkillId);
          expect(exists).toBe(true);
        }
      });

      aureliaSkills.forEach((skill) => {
        if (skill.reqSkillId) {
          const exists = aureliaSkills.some((s) => s.id === skill.reqSkillId);
          expect(exists).toBe(true);
        }
      });
    });

    it("ensures all spells have valid damage breakdowns and positive cooldowns", () => {
      spells.forEach((spell) => {
        expect(spell.damage).toBeGreaterThanOrEqual(0);
        expect(spell.cooldownFrames).toBeGreaterThanOrEqual(0);
        expect(spell.manaCost).toBeGreaterThanOrEqual(0);
        expect(spell.staminaCost).toBeGreaterThanOrEqual(0);

        expect(plDict[spell.nameKey]).toBeDefined();
        expect(enDict[spell.nameKey]).toBeDefined();
      });
    });
  });

  describe("Items and Equipment Integrity", () => {
    const items = Object.values(itemsData) as ItemJsonSchema[];

    it("verifies all item IDs are unique and present in localization dictionaries", () => {
      const ids = items.map((i) => i.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      const missingKeys: string[] = [];
      items.forEach((item) => {
        if (!plDict[item.nameKey]) missingKeys.push(`PL missing ${item.nameKey}`);
        if (!enDict[item.nameKey]) missingKeys.push(`EN missing ${item.nameKey}`);
        if (!plDict[item.descriptionKey]) missingKeys.push(`PL missing ${item.descriptionKey}`);
        if (!enDict[item.descriptionKey]) missingKeys.push(`EN missing ${item.descriptionKey}`);
      });

      expect(missingKeys).toEqual([]);
    });

    it("verifies equipment attribute values and valid rarities", () => {
      const validRarities = new Set(["common", "uncommon", "rare", "legendary"]);
      items.forEach((item) => {
        expect(validRarities.has(item.rarity)).toBe(true);
        if (item.attackBonus !== undefined) expect(item.attackBonus).toBeGreaterThanOrEqual(0);
        if (item.defenseBonus !== undefined) expect(item.defenseBonus).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Visual Novel Dialogue Scenes Integrity", () => {
    const scenes = Object.values(vnData.scenes) as VisualNovelSceneJsonSchema[];
    const valenEmotionSet = new Set<string>(VALEN_PORTRAIT_EMOTIONS);
    const aureliaEmotionSet = new Set<string>(AURELIA_PORTRAIT_EMOTIONS);

    it("verifies all visual novel scenes have a valid startNodeId and reachable nodes", () => {
      scenes.forEach((scene: VisualNovelSceneJsonSchema) => {
        expect(scene.sceneId).toBeDefined();
        expect(scene.initialNodeId).toBeDefined();
        expect(scene.nodes[scene.initialNodeId]).toBeDefined();

        (Object.values(scene.nodes) as VisualNovelNodeSchema[]).forEach((node: VisualNovelNodeSchema) => {
          if (node.nextNodeId) {
            expect(scene.nodes[node.nextNodeId]).toBeDefined();
          }

          if (node.choices && node.choices.length > 0) {
            node.choices.forEach((choice: VnChoiceSchema) => {
              expect(scene.nodes[choice.targetNodeId]).toBeDefined();
            });
          }
        });
      });
    });

    it("verifies dialogue and choice localization keys exist in PL and EN dictionaries", () => {
      const missingKeys: string[] = [];

      scenes.forEach((scene: VisualNovelSceneJsonSchema) => {
        (Object.values(scene.nodes) as VisualNovelNodeSchema[]).forEach((node: VisualNovelNodeSchema) => {
          if (node.dialogueKey && !plDict[node.dialogueKey]) {
            missingKeys.push(`PL missing dialogueKey: ${node.dialogueKey}`);
          }
          if (node.dialogueKey && !enDict[node.dialogueKey]) {
            missingKeys.push(`EN missing dialogueKey: ${node.dialogueKey}`);
          }

          if (node.choices) {
            node.choices.forEach((choice: VnChoiceSchema) => {
              if (choice.textKey && !plDict[choice.textKey]) {
                missingKeys.push(`PL missing choice.textKey: ${choice.textKey}`);
              }
              if (choice.textKey && !enDict[choice.textKey]) {
                missingKeys.push(`EN missing choice.textKey: ${choice.textKey}`);
              }
            });
          }
        });
      });

      expect(missingKeys).toEqual([]);
    });

    it("verifies character portrait emotions match the 5x5 emotion coordinate specifications", () => {
      scenes.forEach((scene: VisualNovelSceneJsonSchema) => {
        (Object.values(scene.nodes) as VisualNovelNodeSchema[]).forEach((node: VisualNovelNodeSchema) => {
          if (node.speaker === "valen" && node.emotion) {
            expect(valenEmotionSet.has(node.emotion)).toBe(true);
          }
          if (node.speaker === "aurelia" && node.emotion) {
            expect(aureliaEmotionSet.has(node.emotion)).toBe(true);
          }
        });
      });
    });
  });

  describe("Sprite and Atlas Manifest Integrity", () => {
    it("verifies all registered atlas entries have unique identifiers and valid categories", () => {
      const assets = Object.values(atlasManifest.assets);
      const ids = assets.map((a) => a.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);

      const validCategories = new Set(["character", "enemy", "structure", "portrait"]);
      assets.forEach((asset) => {
        expect(validCategories.has(asset.category)).toBe(true);
        expect(asset.imageRelPath).toBeDefined();
      });
    });
  });
});
