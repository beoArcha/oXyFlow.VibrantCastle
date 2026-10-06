import { describe, it, expect } from "bun:test";
import itemsData from "@data/items/items.json";
import enemiesData from "@data/enemies/enemies.json";
import spellsData from "@data/skills/spells.json";
import skillsData from "@data/skills/skills.json";
import { ItemCodec } from "@lib/codecs/itemCodec";
import { EnemyCodec } from "@lib/codecs/enemyCodec";
import { SpellCodec } from "@lib/codecs/spellCodec";
import { translations } from "@i18n/index";

describe("RPG Mechanics Integration", () => {
  const itemCodec = new ItemCodec();
  const enemyCodec = new EnemyCodec();
  const spellCodec = new SpellCodec();

  describe("Item Elemental Damage & DoT/HoT Status Effects", () => {
    it("successfully decodes items with elemental damageType and effectsOnHit", () => {
      const decodedRes = itemCodec.decodeDictionary(itemsData);
      expect(decodedRes.isOk()).toBe(true);
      if (!decodedRes.isOk()) return;

      const items = decodedRes.value;

      // Solar Rapier (Fire DoT)
      const solarRapier = items["solar_rapier"];
      expect(solarRapier).toBeDefined();
      expect(solarRapier.damageType).toBe("fire");
      expect(solarRapier.effectsOnHit).toBeDefined();
      expect(solarRapier.effectsOnHit?.length).toBe(1);
      expect(solarRapier.effectsOnHit?.[0].type).toBe("dot");
      expect(solarRapier.effectsOnHit?.[0].effectId).toBe("solar_burn");
      expect(solarRapier.effectsOnHit?.[0].damageType).toBe("fire");
      expect(solarRapier.effectsOnHit?.[0].durationSeconds).toBe(3);
      expect(solarRapier.effectsOnHit?.[0].damagePerTick).toBe(5);

      // Frost Rapier (Frost DoT)
      const frostRapier = items["frost_rapier"];
      expect(frostRapier).toBeDefined();
      expect(frostRapier.damageType).toBe("frost");
      expect(frostRapier.effectsOnHit).toBeDefined();
      expect(frostRapier.effectsOnHit?.length).toBe(1);
      expect(frostRapier.effectsOnHit?.[0].type).toBe("dot");
      expect(frostRapier.effectsOnHit?.[0].effectId).toBe("frostbite");
      expect(frostRapier.effectsOnHit?.[0].damageType).toBe("frost");
      expect(frostRapier.effectsOnHit?.[0].durationSeconds).toBe(3);
      expect(frostRapier.effectsOnHit?.[0].damagePerTick).toBe(4);

      // Aether Staff (Aether DoT)
      const aetherStaff = items["aether_staff"];
      expect(aetherStaff).toBeDefined();
      expect(aetherStaff.damageType).toBe("aether");
      expect(aetherStaff.effectsOnHit).toBeDefined();
      expect(aetherStaff.effectsOnHit?.length).toBe(1);
      expect(aetherStaff.effectsOnHit?.[0].type).toBe("dot");
      expect(aetherStaff.effectsOnHit?.[0].effectId).toBe("aether_burn");
      expect(aetherStaff.effectsOnHit?.[0].damageType).toBe("aether");
      expect(aetherStaff.effectsOnHit?.[0].durationSeconds).toBe(3);
      expect(aetherStaff.effectsOnHit?.[0].damagePerTick).toBe(4);
    });

    it("successfully decodes potions with overTimeEffects (HoT)", () => {
      const decodedRes = itemCodec.decodeDictionary(itemsData);
      expect(decodedRes.isOk()).toBe(true);
      if (!decodedRes.isOk()) return;

      const items = decodedRes.value;

      // Health Potion
      const healthPotion = items["potion_health"];
      expect(healthPotion).toBeDefined();
      expect(healthPotion.healHp).toBe(45);
      expect(healthPotion.overTimeEffects).toBeDefined();
      expect(healthPotion.overTimeEffects?.length).toBe(1);
      expect(healthPotion.overTimeEffects?.[0].type).toBe("hot");
      expect(healthPotion.overTimeEffects?.[0].effectId).toBe("health_regen");
      expect(healthPotion.overTimeEffects?.[0].healPerTick).toBe(5);

      // Mana Potion
      const manaPotion = items["potion_mana"];
      expect(manaPotion).toBeDefined();
      expect(manaPotion.healMana).toBe(40);
      expect(manaPotion.overTimeEffects).toBeDefined();
      expect(manaPotion.overTimeEffects?.length).toBe(1);
      expect(manaPotion.overTimeEffects?.[0].type).toBe("hot");
      expect(manaPotion.overTimeEffects?.[0].effectId).toBe("mana_regen");
      expect(manaPotion.overTimeEffects?.[0].healPerTick).toBe(4);

      // Elixir
      const elixir = items["potion_elixir"];
      expect(elixir).toBeDefined();
      expect(elixir.overTimeEffects).toBeDefined();
      expect(elixir.overTimeEffects?.length).toBe(1);
      expect(elixir.overTimeEffects?.[0].type).toBe("hot");
      expect(elixir.overTimeEffects?.[0].effectId).toBe("rejuvenation_surge");
      expect(elixir.overTimeEffects?.[0].healPerTick).toBe(8);
    });

    it("preserves item status effects and elemental types through round-trip encoding", () => {
      const decodedRes = itemCodec.decodeDictionary(itemsData);
      expect(decodedRes.isOk()).toBe(true);
      if (!decodedRes.isOk()) return;

      const encodedRes = itemCodec.encodeDictionary(decodedRes.value);
      expect(encodedRes.isOk()).toBe(true);
      if (!encodedRes.isOk()) return;

      const reDecodedRes = itemCodec.decodeDictionary(encodedRes.value);
      expect(reDecodedRes.isOk()).toBe(true);
      if (!reDecodedRes.isOk()) return;

      expect(reDecodedRes.value).toEqual(decodedRes.value);
    });
  });

  describe("Enemy Soul Drops & Tactical Souls", () => {
    it("verifies all 15 enemies define valid soul drops with appropriate soul categories", () => {
      const decodedRes = enemyCodec.decodeDictionary(enemiesData);
      expect(decodedRes.isOk()).toBe(true);
      if (!decodedRes.isOk()) return;

      const enemies = decodedRes.value;
      const enemyCount = Object.keys(enemies).length;
      expect(enemyCount).toBe(15);

      const validSoulTypes = new Set(["bullet", "guardian", "enchant"]);

      for (const [enemyId, enemy] of Object.entries(enemies)) {
        expect(enemy.soulDrop).toBeDefined();
        if (!enemy.soulDrop) continue;

        expect(validSoulTypes.has(enemy.soulDrop.type)).toBe(true);
        expect(enemy.soulDrop.dropRate).toBeGreaterThan(0);
        expect(enemy.soulDrop.dropRate).toBeLessThanOrEqual(1);
        expect(enemy.soulDrop.i18n.nameKey.length).toBeGreaterThan(0);
        expect(enemy.soulDrop.i18n.descriptionKey.length).toBeGreaterThan(0);
      }
    });

    it("verifies all enemy soul drop granted skills resolve to existing master skills or spells", () => {
      const decodedRes = enemyCodec.decodeDictionary(enemiesData);
      expect(decodedRes.isOk()).toBe(true);
      if (!decodedRes.isOk()) return;

      const decodedSpellsRes = spellCodec.decodeDictionary(spellsData);
      expect(decodedSpellsRes.isOk()).toBe(true);
      if (!decodedSpellsRes.isOk()) return;

      const masterSkillIds = new Set<string>();
      Object.keys(decodedSpellsRes.value).forEach((k) => masterSkillIds.add(k));
      skillsData.valen.forEach((s) => masterSkillIds.add(s.id));
      skillsData.aurelia.forEach((s) => masterSkillIds.add(s.id));

      const enemies = decodedRes.value;
      for (const [enemyId, enemy] of Object.entries(enemies)) {
        if (enemy.soulDrop) {
          expect(masterSkillIds.has(enemy.soulDrop.grantedSkillId)).toBe(true);
        }
      }
    });
  });

  describe("Progressive Bestiary & Elemental Resistances", () => {
    it("verifies all 15 enemies define elemental resistances and bestiary configurations", () => {
      const decodedRes = enemyCodec.decodeDictionary(enemiesData);
      expect(decodedRes.isOk()).toBe(true);
      if (!decodedRes.isOk()) return;

      const enemies = decodedRes.value;

      for (const [enemyId, enemy] of Object.entries(enemies)) {
        // Resistances
        expect(enemy.elementalResistances).toBeDefined();
        if (enemy.elementalResistances) {
          for (const [element, mult] of Object.entries(enemy.elementalResistances)) {
            expect(typeof mult).toBe("number");
            expect(mult).toBeGreaterThanOrEqual(-1.5);
            expect(mult).toBeLessThanOrEqual(2.5);
          }
        }

        // Bestiary
        expect(enemy.bestiary).toBeDefined();
        if (enemy.bestiary) {
          expect(enemy.bestiary.bestiaryKey.length).toBeGreaterThan(0);
          expect(enemy.bestiary.tacticsKey.length).toBeGreaterThan(0);
          expect(enemy.bestiary.loreQuoteKey.length).toBeGreaterThan(0);
          expect(enemy.bestiary.killThresholds?.basic).toBeGreaterThanOrEqual(1);
          expect(enemy.bestiary.killThresholds?.tactics).toBeGreaterThanOrEqual(1);
          expect(enemy.bestiary.killThresholds?.lore).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it("verifies complete i18n translation parity in PL and EN for Bestiary entries and Souls", () => {
      const decodedRes = enemyCodec.decodeDictionary(enemiesData);
      expect(decodedRes.isOk()).toBe(true);
      if (!decodedRes.isOk()) return;

      const enemies = decodedRes.value;
      const dictPl = translations.pl as unknown as Record<string, string>;
      const dictEn = translations.en as unknown as Record<string, string>;

      for (const [enemyId, enemy] of Object.entries(enemies)) {
        // Bestiary keys
        if (enemy.bestiary) {
          const entryKey = enemy.bestiary.bestiaryKey;
          const tacticsKey = enemy.bestiary.tacticsKey;
          const loreKey = enemy.bestiary.loreQuoteKey;

          expect(dictPl[entryKey]).toBeDefined();
          expect(dictPl[entryKey]?.length).toBeGreaterThan(0);
          expect(dictEn[entryKey]).toBeDefined();
          expect(dictEn[entryKey]?.length).toBeGreaterThan(0);

          expect(dictPl[tacticsKey]).toBeDefined();
          expect(dictPl[tacticsKey]?.length).toBeGreaterThan(0);
          expect(dictEn[tacticsKey]).toBeDefined();
          expect(dictEn[tacticsKey]?.length).toBeGreaterThan(0);

          expect(dictPl[loreKey]).toBeDefined();
          expect(dictPl[loreKey]?.length).toBeGreaterThan(0);
          expect(dictEn[loreKey]).toBeDefined();
          expect(dictEn[loreKey]?.length).toBeGreaterThan(0);
        }

        // Soul Drop keys
        if (enemy.soulDrop) {
          const nameKey = enemy.soulDrop.i18n.nameKey;
          const descKey = enemy.soulDrop.i18n.descriptionKey;

          expect(dictPl[nameKey]).toBeDefined();
          expect(dictPl[nameKey]?.length).toBeGreaterThan(0);
          expect(dictEn[nameKey]).toBeDefined();
          expect(dictEn[nameKey]?.length).toBeGreaterThan(0);

          expect(dictPl[descKey]).toBeDefined();
          expect(dictPl[descKey]?.length).toBeGreaterThan(0);
          expect(dictEn[descKey]).toBeDefined();
          expect(dictEn[descKey]?.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
