import { describe, it, expect } from "bun:test";
import enemiesData from "@data/enemies/enemies.json";
import spellsData from "@data/skills/spells.json";
import skillsData from "@data/skills/skills.json";
import { EnemyCodec } from "@lib/codecs/enemyCodec";
import { SpellCodec } from "@lib/codecs/spellCodec";

describe("Enemy Abilities & Unison Tech Referential Integrity", () => {
  const enemyCodec = new EnemyCodec();
  const spellCodec = new SpellCodec();

  const decodedEnemies = enemyCodec.decodeDictionary(enemiesData);
  const decodedSpells = spellCodec.decodeDictionary(spellsData);

  // Compile Master Skill/Spell IDs set
  const allMasterSkillIds = new Set<string>();

  // Add all spell IDs
  if (decodedSpells.isOk()) {
    Object.keys(decodedSpells.value).forEach((id) => allMasterSkillIds.add(id));
  }

  // Add all physical hero skill IDs
  skillsData.valen.forEach((s) => allMasterSkillIds.add(s.id));
  skillsData.aurelia.forEach((s) => allMasterSkillIds.add(s.id));

  it("decodes enemies.json and spells.json without errors", () => {
    expect(decodedEnemies.isOk()).toBe(true);
    expect(decodedSpells.isOk()).toBe(true);
  });

  it("verifies that every enemy declares abilities and every ability exists in Master Skills/Spells Dictionary", () => {
    expect(decodedEnemies.isOk()).toBe(true);
    if (decodedEnemies.isOk()) {
      const enemies = decodedEnemies.value;
      const enemyIds = Object.keys(enemies);
      expect(enemyIds.length).toBeGreaterThan(0);

      for (const [enemyId, enemy] of Object.entries(enemies)) {
        expect(enemy.abilities).toBeDefined();
        expect(enemy.abilities?.length).toBeGreaterThan(0);

        for (const abilityId of enemy.abilities ?? []) {
          expect(allMasterSkillIds.has(abilityId)).toBe(
            true
          );
        }
      }
    }
  });

  it("verifies that every enemy soulDrop grants a skill that exists in Master Dictionary", () => {
    if (decodedEnemies.isOk()) {
      const enemies = decodedEnemies.value;
      for (const [enemyId, enemy] of Object.entries(enemies)) {
        if (enemy.soulDrop) {
          expect(allMasterSkillIds.has(enemy.soulDrop.grantedSkillId)).toBe(true);
          expect(enemy.soulDrop.dropRate).toBeGreaterThan(0);
          expect(enemy.soulDrop.dropRate).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("verifies Unison Techs (Valen & Aurelia dual combinations) declaration", () => {
    expect(decodedSpells.isOk()).toBe(true);
    if (decodedSpells.isOk()) {
      const spells = decodedSpells.value;
      const supernova = spells["unison_supernova_nova"];
      expect(supernova).toBeDefined();
      expect(supernova.ownerType).toBe("unison");
      expect(supernova.requiredParticipants).toEqual(["valen", "aurelia"]);
      expect(supernova.damage).toBeGreaterThan(150);
      expect(supernova.damageBreakdown).toBeDefined();
    }
  });
});
