import { describe, it, expect } from "bun:test";
import spellsJson from "@data/skills/spells.json";
import skillsJson from "@data/skills/skills.json";
import {
  validateSpellsJson,
  validateSpell,
  validateSkillsDictionary,
  validateSkillNode,
  SpellJsonSchema,
  SkillNodeJsonSchema
} from "../index";

describe("Schema Contracts & Validators (src/lib/schemas)", () => {
  describe("Production spells.json against SpellsSchema", () => {
    it("validates the canonical production spells.json successfully without errors", () => {
      const result = validateSpellsJson(spellsJson);
      if (!result.success) {
        console.error("Spells validation errors:", result.errors);
      }
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(19);
        const solarFlare = result.data.find((s) => s.id === "solar_flare");
        expect(solarFlare).toBeDefined();
        expect(solarFlare?.magicDomain).toBe("solar");
        expect(solarFlare?.castType).toBe("instant");
        expect(solarFlare?.projectileConfig).toBeDefined();
        expect(solarFlare?.projectileConfig?.trajectory).toBe("straight");
      }
    });

    it("rejects spell with missing required fields", () => {
      const invalidSpell: Partial<SpellJsonSchema> = {
        id: "broken_spell",
        nameKey: "brokenName"
      };
      const result = validateSpell(invalidSpell);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorPaths = result.errors.map((e) => e.path);
        expect(errorPaths).toContain("magicDomain");
        expect(errorPaths).toContain("castType");
        expect(errorPaths).toContain("manaCost");
      }
    });

    it("rejects spell with invalid magic domain or cast type", () => {
      const badSpell = {
        id: "bad_domain",
        magicDomain: "invalid_domain",
        castType: "laser_beam",
        category: "offensive",
        triggerType: "action",
        nameKey: "badName",
        descriptionKey: "badDesc",
        manaCost: 10,
        staminaCost: 0,
        cooldownFrames: 20,
        damage: 50,
        color: "#fff",
        icon: "Zap"
      };
      const result = validateSpell(badSpell);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map((e) => e.path);
        expect(paths).toContain("magicDomain");
        expect(paths).toContain("castType");
      }
    });

    it("detects duplicate spell IDs in spell list", () => {
      const duplicateList = [
        {
          id: "dup_spell",
          magicDomain: "solar",
          castType: "instant",
          category: "offensive",
          triggerType: "action",
          nameKey: "name1",
          descriptionKey: "desc1",
          manaCost: 10,
          staminaCost: 0,
          cooldownFrames: 20,
          damage: 50,
          color: "#fff",
          icon: "Zap"
        },
        {
          id: "dup_spell",
          magicDomain: "solar",
          castType: "instant",
          category: "offensive",
          triggerType: "action",
          nameKey: "name2",
          descriptionKey: "desc2",
          manaCost: 10,
          staminaCost: 0,
          cooldownFrames: 20,
          damage: 50,
          color: "#fff",
          icon: "Zap"
        }
      ];
      const result = validateSpellsJson(duplicateList);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.message.includes("Duplicate spell identifier"))).toBe(true);
      }
    });
  });

  describe("Production skills.json against SkillsSchema", () => {
    it("validates the canonical production skills.json successfully without errors", () => {
      const result = validateSkillsDictionary(skillsJson);
      if (!result.success) {
        console.error("Skills validation errors:", result.errors);
      }
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valen.length).toBeGreaterThan(0);
        expect(result.data.aurelia.length).toBeGreaterThan(0);

        // Verify DAG prerequisites refer only to valid nodes
        const valenIds = new Set(result.data.valen.map((n) => n.id));
        for (const node of result.data.valen) {
          if (node.reqSkillId) {
            expect(valenIds.has(node.reqSkillId)).toBe(true);
          }
        }
      }
    });

    it("rejects skill node with invalid category or character", () => {
      const badNode = {
        id: "bad_node",
        character: "unknown_hero",
        nameKey: "key",
        descKey: "desc",
        tier: 1,
        pointCost: 1,
        unlocked: false,
        icon: "Sun",
        category: "ultimate_magic",
        triggerType: "action",
        manaCost: 10,
        staminaCost: 0,
        cooldownFrames: 10,
        damage: 10,
        color: "#fff",
        reqSkillId: null,
        minLevel: 1,
        gridX: 1,
        gridY: 1
      };
      const result = validateSkillNode(badNode);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map((e) => e.path);
        expect(paths).toContain("character");
        expect(paths).toContain("category");
      }
    });

    it("detects dead prerequisite references in DAG", () => {
      const invalidTree = {
        valen: [
          {
            id: "node_1",
            character: "valen",
            nameKey: "name",
            descKey: "desc",
            tier: 1,
            pointCost: 1,
            unlocked: true,
            icon: "Sun",
            category: "offensive",
            triggerType: "action",
            manaCost: 10,
            staminaCost: 0,
            cooldownFrames: 10,
            damage: 10,
            color: "#fff",
            reqSkillId: "missing_parent_node",
            minLevel: 1,
            gridX: 1,
            gridY: 1
          }
        ],
        aurelia: []
      };
      const result = validateSkillsDictionary(invalidTree);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.message.includes("does not exist in valen's skill tree"))).toBe(true);
      }
    });
  });
});
