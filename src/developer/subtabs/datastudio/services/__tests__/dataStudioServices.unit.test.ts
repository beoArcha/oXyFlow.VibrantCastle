import { describe, it, expect } from "bun:test";
import {
  validateSchemaPayload,
  getCanonicalSampleJson,
} from "../aiGeneratorService";
import {
  discoverSceneSpeakers,
  resolveEmotionsForSpeaker,
  calculateGridCoordinates,
  TACTICAL_SPEAKER_STANCES,
  NARRATOR_STANCES,
} from "../visualNovelService";
import dialoguesVnJson from "@data/narrative/dialogues_vn.json";

describe("DataStudio Services Unit Suite", () => {
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
      const scene = Object.values(dialoguesVnJson.scenes)[0] as any;
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
  });
});
