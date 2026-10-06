import { describe, it, expect } from "bun:test";
import {
  validateSchemaPayload,
  getCanonicalSampleJson,
} from "../aiGeneratorService";
import {
  discoverSceneSpeakers,
  resolveEmotionsForSpeaker,
  calculateGridCoordinates,
  getSceneSummaries,
  resolveSceneRoster,
  TACTICAL_SPEAKER_STANCES,
  NARRATOR_STANCES,
} from "../visualNovelService";
import {
  cloneEntityDraft,
  createDefaultEnemyDraft,
  createDefaultItemDraft,
  createDefaultSpellDraft,
} from "../entityDraftFactory";
import dialoguesVnJson from "@data/narrative/dialogues_vn.json";
import { VisualNovelDocumentJsonSchema } from "@lib/schemas/visualNovelSchema";
import { EnemyJsonSchema } from "@lib/schemas/enemySchema";
import { filterAndSortBestiaryEntries } from "../../types/bestiaryTypes";

describe("DataStudio Services Unit Suite", () => {
  describe("entityDraftFactory", () => {
    it("creates valid default drafts with structured defaults", () => {
      const enemy = createDefaultEnemyDraft("enemy_test_1");
      expect(enemy.id).toBe("enemy_test_1");
      expect(enemy.stats?.health).toBe(100);
      expect(enemy.soulDrop?.type).toBe("bullet");

      const item = createDefaultItemDraft("item_test_1");
      expect(item.id).toBe("item_test_1");
      expect(item.type).toBe("weapon");

      const spell = createDefaultSpellDraft("spell_test_1");
      expect(spell.id).toBe("spell_test_1");
      expect(spell.magicDomain).toBe("solar");
    });

    it("deeply clones objects preventing reference mutation", () => {
      const original = {
        id: "orig",
        nested: { count: 10, tags: ["a", "b"] },
      };
      const cloned = cloneEntityDraft(original);

      expect(cloned).toEqual(original);
      cloned.nested.count = 99;
      cloned.nested.tags.push("c");

      expect(original.nested.count).toBe(10);
      expect(original.nested.tags).toEqual(["a", "b"]);
    });
  });
  describe("aiGeneratorService", () => {
    it("provides canonical sample JSON strings for all supported schema types", () => {
      const types = ["spell", "enemy", "item", "visual_novel"] as const;
      for (const t of types) {
        const json = getCanonicalSampleJson(t);
        expect(typeof json).toBe("string");
        expect(json.length).toBeGreaterThan(10);
        const parsed = JSON.parse(json);
        expect(typeof parsed).toBe("object");
      }
    });

    it("validates valid canonical payloads with success", () => {
      const types = ["spell", "enemy", "item", "visual_novel"] as const;
      for (const t of types) {
        const sampleJson = getCanonicalSampleJson(t);
        const result = validateSchemaPayload(t, sampleJson, "Empty", "Malformed");
        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("returns error for empty json payload", () => {
      const result = validateSchemaPayload("spell", "   ", "Empty payload error", "Malformed");
      expect(result.success).toBe(false);
      expect(result.errors[0].message).toBe("Empty payload error");
    });

    it("returns syntax error for malformed JSON syntax", () => {
      const result = validateSchemaPayload("item", "{ invalid_json: 123 ", "Empty", "Syntax error");
      expect(result.success).toBe(false);
      expect(result.errors[0].path).toBe("syntax");
      expect(result.errors[0].message).toContain("Syntax error");
    });

    it("returns schema validation error when fields are missing or invalid", () => {
      const result = validateSchemaPayload(
        "enemy",
        JSON.stringify({ id: "invalid_enemy" }),
        "Empty",
        "Malformed"
      );
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("visualNovelService", () => {
    it("discovers all speakers including heroes, narrator, and monsters from enemies.json", () => {
      const vnDoc = dialoguesVnJson as VisualNovelDocumentJsonSchema;
      const scene = Object.values(vnDoc.scenes)[0];
      const speakers = discoverSceneSpeakers(scene, {
        heroValen: "Valen",
        heroAurelia: "Aurelia",
        narrator: "Narrator",
        bossPrefix: "Boss",
        enemyPrefix: "Creature",
      });
      const speakerValues = speakers.map((s) => s.value);

      expect(speakerValues).toContain("valen");
      expect(speakerValues).toContain("aurelia");
      expect(speakerValues).toContain("narrator");

      const enemySpeaker = speakers.find((s) => s.category === "boss" || s.category === "beast");
      expect(enemySpeaker).toBeDefined();
    });

    it("resolves emotions for hero speakers and tactical stances for beasts and narrator", () => {
      const valenEmotions = resolveEmotionsForSpeaker("valen");
      expect(valenEmotions).toContain("neutral");
      expect(valenEmotions.length).toBe(25);

      const beastEmotions = resolveEmotionsForSpeaker("slime");
      expect(beastEmotions).toEqual(TACTICAL_SPEAKER_STANCES);

      const narratorEmotions = resolveEmotionsForSpeaker("narrator");
      expect(narratorEmotions).toEqual(NARRATOR_STANCES);
    });

    it("computes 5x5 grid coordinates accurately within bounds [0..4]", () => {
      const emotionList = ["e0", "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12"];
      const cell0 = calculateGridCoordinates("e0", emotionList);
      expect(cell0).toEqual({ row: 0, col: 0, index: 0 });

      const cell5 = calculateGridCoordinates("e5", emotionList);
      expect(cell5).toEqual({ row: 1, col: 0, index: 5 });

      const cell12 = calculateGridCoordinates("e12", emotionList);
      expect(cell12).toEqual({ row: 2, col: 2, index: 12 });

      const fallback = calculateGridCoordinates("non_existent", emotionList);
      expect(fallback).toEqual({ row: 0, col: 0, index: 0 });
    });

    it("extracts registered scenes summaries from document", () => {
      const vnDoc = dialoguesVnJson as VisualNovelDocumentJsonSchema;
      const summaries = getSceneSummaries(vnDoc, (k) => k);
      expect(summaries.length).toBeGreaterThan(0);
      expect(summaries[0].sceneId).toBe("scene_clocktower_meeting");
      expect(summaries[0].characterCount).toBeGreaterThan(1);
    });

    it("resolves multi-character stage roster with spatial positions and active speaker highlight", () => {
      const vnDoc = dialoguesVnJson as VisualNovelDocumentJsonSchema;
      const scene = vnDoc.scenes.scene_clocktower_meeting;
      const node = scene.nodes.node_valen_arrival;

      const roster = resolveSceneRoster(scene, node, "valen", "stoic", (k) => k);
      expect(roster.length).toBeGreaterThanOrEqual(2);

      const valen = roster.find((a) => a.id === "valen");
      expect(valen).toBeDefined();
      expect(valen?.isActive).toBe(true);
      expect(valen?.position).toBe("left");
      expect(valen?.emotion).toBe("stoic");

      const aurelia = roster.find((a) => a.id === "aurelia");
      expect(aurelia).toBeDefined();
      expect(aurelia?.isActive).toBe(false);
      expect(aurelia?.position).toBe("right");
    });
  });

  describe("bestiaryTypes & filtering service", () => {
    const sampleEnemies: EnemyJsonSchema[] = [
      {
        id: "bat_scout",
        nameKey: "monsterBat",
        defaultName: "Vampiric Bat",
        category: "beast",
        isDummy: false,
        isAerial: true,
        dimensions: { width: 30, height: 30 },
        stats: { health: 50, maxHealth: 50, speed: 2.5, attackPower: 12, scoreReward: 100 },
      },
      {
        id: "gargoyle_boss",
        nameKey: "monsterGargoyle",
        defaultName: "Ancient Gargoyle",
        category: "boss",
        isDummy: false,
        isAerial: true,
        dimensions: { width: 80, height: 90 },
        stats: { health: 1200, maxHealth: 1200, speed: 1.0, attackPower: 65, scoreReward: 2500 },
      },
      {
        id: "wooden_dummy",
        nameKey: "monsterDummy",
        defaultName: "Wooden Dummy",
        category: "dummy",
        isDummy: true,
        isAerial: false,
        dimensions: { width: 35, height: 60 },
        stats: { health: 200, maxHealth: 200, speed: 0, attackPower: 0, scoreReward: 50 },
      },
      {
        id: "castle_guard",
        nameKey: "monsterGuard",
        defaultName: "Cursed Guard",
        category: "standard",
        isDummy: false,
        isAerial: false,
        dimensions: { width: 40, height: 65 },
        stats: { health: 150, maxHealth: 150, speed: 1.2, attackPower: 22, scoreReward: 180 },
      },
    ];

    it("filters enemies by text search matching name or id", () => {
      const results = filterAndSortBestiaryEntries(sampleEnemies, {
        searchQuery: "guard",
        category: "all",
        aerialOnly: false,
        sortBy: "name",
        sortOrder: "asc",
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe("castle_guard");
    });

    it("filters enemies by category and aerial flag", () => {
      const aerialBeasts = filterAndSortBestiaryEntries(sampleEnemies, {
        searchQuery: "",
        category: "beast",
        aerialOnly: true,
        sortBy: "name",
        sortOrder: "asc",
      });

      expect(aerialBeasts.length).toBe(1);
      expect(aerialBeasts[0].id).toBe("bat_scout");

      const bossesOnly = filterAndSortBestiaryEntries(sampleEnemies, {
        searchQuery: "",
        category: "boss",
        aerialOnly: false,
        sortBy: "name",
        sortOrder: "asc",
      });

      expect(bossesOnly.length).toBe(1);
      expect(bossesOnly[0].id).toBe("gargoyle_boss");
    });

    it("sorts enemies by hp descending and speed ascending", () => {
      const sortedByHpDesc = filterAndSortBestiaryEntries(sampleEnemies, {
        searchQuery: "",
        category: "all",
        aerialOnly: false,
        sortBy: "hp",
        sortOrder: "desc",
      });

      expect(sortedByHpDesc[0].id).toBe("gargoyle_boss");
      expect(sortedByHpDesc[sortedByHpDesc.length - 1].id).toBe("bat_scout");

      const sortedBySpeedAsc = filterAndSortBestiaryEntries(sampleEnemies, {
        searchQuery: "",
        category: "all",
        aerialOnly: false,
        sortBy: "speed",
        sortOrder: "asc",
      });

      expect(sortedBySpeedAsc[0].id).toBe("wooden_dummy");
      expect(sortedBySpeedAsc[sortedBySpeedAsc.length - 1].id).toBe("bat_scout");
    });
  });
});

