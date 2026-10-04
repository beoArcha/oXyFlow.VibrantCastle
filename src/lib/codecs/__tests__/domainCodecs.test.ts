import { describe, it, expect } from "bun:test";
import { itemCodec } from "../itemCodec";
import { enemyCodec } from "../enemyCodec";
import { structureCodec } from "../structureCodec";
import itemsJson from "@data/items/items.json";
import enemiesJson from "@data/enemies/enemies.json";
import structuresJson from "@data/structures/structures.json";

import { ErrorCode } from "../../errors";

describe("Domain Codecs (Faza 2.2)", () => {
  describe("ItemCodec", () => {
    it("successfully decodes canonical items.json as a dictionary", () => {
      const result = itemCodec.decodeDictionary(itemsJson);
      expect(result.isOk()).toBe(true);
      if (!result.isOk()) return;

      const items = result.value;
      expect(Object.keys(items).length).toBeGreaterThan(5);
      expect(items["solar_rapier"]).toBeDefined();
      expect(items["solar_rapier"].nameKey).toBe("itemSolarRapierName");
      expect(items["solar_rapier"].type).toBe("weapon");
      expect(items["solar_rapier"].attackBonus).toBe(15);
      expect(items["potion_health"]).toBeDefined();
      expect(items["potion_health"].type).toBe("potion");
      expect(items["potion_health"].healHp).toBe(45);
    });

    it("successfully decodes items.json via decodeAll", () => {
      const result = itemCodec.decodeAll(itemsJson);
      expect(result.isOk()).toBe(true);
      if (!result.isOk()) return;

      expect(result.value.length).toBe(Object.keys(itemsJson).length);
      const rapier = result.value.find((i) => i.id === "solar_rapier");
      expect(rapier).toBeDefined();
    });

    it("performs lossless round-trip encode/decode on items", () => {
      const decodeRes = itemCodec.decodeDictionary(itemsJson);
      expect(decodeRes.isOk()).toBe(true);
      if (!decodeRes.isOk()) return;

      const domainItems = decodeRes.value;
      const encodeRes = itemCodec.encodeDictionary(domainItems);
      expect(encodeRes.isOk()).toBe(true);
      if (!encodeRes.isOk()) return;

      // Re-decode to ensure identical structure
      const reDecodedRes = itemCodec.decodeDictionary(encodeRes.value);
      expect(reDecodedRes.isOk()).toBe(true);
      if (!reDecodedRes.isOk()) return;

      expect(reDecodedRes.value).toEqual(domainItems);
    });

    it("fails cleanly when decoding malformed item data", () => {
      const malformedItem = {
        id: "invalid_item",
        // missing nameKey, descriptionKey
        type: "laser_cannon", // invalid type
        icon: "",
        rarity: "mythic", // invalid rarity
      };

      const result = itemCodec.decode(malformedItem);
      expect(result.isOk()).toBe(false);
      if (result.isOk()) return;

      expect(result.error.code).toBe(ErrorCode.CODEC_DECODE_FAILED);
      expect(result.error.message).toContain("Failed to decode Item");
    });
  });

  describe("EnemyCodec", () => {
    it("successfully decodes canonical enemies.json as a dictionary", () => {
      const result = enemyCodec.decodeDictionary(enemiesJson);
      expect(result.isOk()).toBe(true);
      if (!result.isOk()) return;

      const enemies = result.value;
      expect(Object.keys(enemies).length).toBeGreaterThan(3);

      expect(enemies["court_sentinel"]).toBeDefined();
      expect(enemies["court_sentinel"].nameKey).toBe("monsterCourtSentinel");
      expect(enemies["court_sentinel"].stats.health).toBe(80);
      expect(enemies["court_sentinel"].stats.attackPower).toBe(20);

      expect(enemies["training_dummy"]).toBeDefined();
      expect(enemies["training_dummy"].isDummy).toBe(true);

      expect(enemies["clockwork_owl_gargoyle"]).toBeDefined();
      expect(enemies["clockwork_owl_gargoyle"].isAerial).toBe(true);
    });

    it("successfully decodes enemies.json via decodeAll", () => {
      const result = enemyCodec.decodeAll(enemiesJson);
      expect(result.isOk()).toBe(true);
      if (!result.isOk()) return;

      expect(result.value.length).toBe(Object.keys(enemiesJson.enemies).length);
      const owl = result.value.find((e) => e.id === "clockwork_owl_gargoyle");
      expect(owl).toBeDefined();
    });

    it("performs lossless round-trip encode/decode on enemies document", () => {
      const decodeRes = enemyCodec.decodeDictionary(enemiesJson);
      expect(decodeRes.isOk()).toBe(true);
      if (!decodeRes.isOk()) return;

      const domainEnemies = decodeRes.value;
      const encodeRes = enemyCodec.encodeDictionary(domainEnemies);
      expect(encodeRes.isOk()).toBe(true);
      if (!encodeRes.isOk()) return;

      expect(encodeRes.value.version).toBe("1.0");
      expect(Object.keys(encodeRes.value.enemies).length).toBe(Object.keys(domainEnemies).length);

      const reDecodedRes = enemyCodec.decodeDictionary(encodeRes.value);
      expect(reDecodedRes.isOk()).toBe(true);
      if (!reDecodedRes.isOk()) return;

      expect(reDecodedRes.value).toEqual(domainEnemies);
    });

    it("fails cleanly when decoding malformed enemy", () => {
      const malformedEnemy = {
        id: "",
        category: "beast",
        isDummy: false,
        isAerial: false,
        dimensions: { width: -10, height: 0 },
        stats: { health: -5, maxHealth: -5, speed: -1, attackPower: -1, scoreReward: 0 }
      };

      const result = enemyCodec.decode(malformedEnemy);
      expect(result.isOk()).toBe(false);
      if (result.isOk()) return;

      expect(result.error.code).toBe(ErrorCode.CODEC_DECODE_FAILED);
      expect(result.error.message).toContain("Failed to decode Enemy");
    });
  });

  describe("StructureCodec", () => {
    it("successfully decodes canonical structures.json as a dictionary", () => {
      const result = structureCodec.decodeDictionary(structuresJson);
      expect(result.isOk()).toBe(true);
      if (!result.isOk()) return;

      const structures = result.value;
      expect(Object.keys(structures).length).toBeGreaterThan(4);

      expect(structures["aether_gate"]).toBeDefined();
      expect(structures["aether_gate"].labelKey).toBe("portalMastery");
      expect(structures["aether_gate"].type).toBe("goal");
      expect(structures["aether_gate"].dimensions.width).toBe(100);
      expect(structures["aether_gate"].atlas?.presetId).toBe("aether_gate");
      expect(structures["aether_gate"].interaction?.type).toBe("victory_gate");
      expect(structures["aether_gate"].interaction?.effects?.playFanfare).toBe(true);

      expect(structures["chrono_lever"]).toBeDefined();
      expect(structures["chrono_lever"].type).toBe("lever");
      expect(structures["hazard_thorns"]).toBeDefined();
      expect(structures["hazard_thorns"].type).toBe("hazard");
    });

    it("successfully decodes structures.json via decodeAll", () => {
      const result = structureCodec.decodeAll(structuresJson);
      expect(result.isOk()).toBe(true);
      if (!result.isOk()) return;

      expect(result.value.length).toBe(Object.keys(structuresJson.structures).length);
      const gate = result.value.find((s) => s.id === "aether_gate");
      expect(gate).toBeDefined();
    });

    it("performs lossless round-trip encode/decode on structures document", () => {
      const decodeRes = structureCodec.decodeDictionary(structuresJson);
      expect(decodeRes.isOk()).toBe(true);
      if (!decodeRes.isOk()) return;

      const domainStructures = decodeRes.value;
      const encodeRes = structureCodec.encodeDictionary(domainStructures);
      expect(encodeRes.isOk()).toBe(true);
      if (!encodeRes.isOk()) return;

      expect(encodeRes.value.version).toBe("1.0");
      expect(Object.keys(encodeRes.value.structures).length).toBe(Object.keys(domainStructures).length);

      const reDecodedRes = structureCodec.decodeDictionary(encodeRes.value);
      expect(reDecodedRes.isOk()).toBe(true);
      if (!reDecodedRes.isOk()) return;

      expect(reDecodedRes.value).toEqual(domainStructures);
    });

    it("fails cleanly when decoding malformed structure", () => {
      const malformedStructure = {
        id: "",
        type: "unknown",
        dimensions: { width: 0, height: -20 }
      };

      const result = structureCodec.decode(malformedStructure);
      expect(result.isOk()).toBe(false);
      if (result.isOk()) return;

      expect(result.error.code).toBe(ErrorCode.CODEC_DECODE_FAILED);
      expect(result.error.message).toContain("Failed to decode Structure");
    });
  });
});
