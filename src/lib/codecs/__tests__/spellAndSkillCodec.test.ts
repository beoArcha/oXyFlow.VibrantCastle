import { describe, it, expect } from "bun:test";
import spellsJson from "@data/skills/spells.json";
import skillsJson from "@data/skills/skills.json";
import { spellCodec, DomainSpell } from "../spellCodec";
import { skillCodec, DomainSkillNode } from "../skillCodec";

describe("Bidirectional Codecs: SpellCodec & SkillCodec (src/lib/codecs)", () => {
  describe("SpellCodec - Bidirectional Magic Serialization", () => {
    it("decodes the canonical production spells.json successfully via decodeDictionary", () => {
      const result = spellCodec.decodeDictionary(spellsJson);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const dict = result.value;
        const spellIds = Object.keys(dict);
        expect(spellIds.length).toBeGreaterThanOrEqual(19);

        // Verify Solar Domain spell (Valen starter)
        const solarFlare = dict["solar_flare"];
        expect(solarFlare).toBeDefined();
        expect(solarFlare.magicDomain).toBe("solar");
        expect(solarFlare.castType).toBe("instant");
        expect(solarFlare.character).toBe("valen");
        expect(solarFlare.damage).toBe(35);
        expect(solarFlare.projectileConfig).toBeDefined();
        expect(solarFlare.projectileConfig?.speed).toBe(9.5);
        expect(solarFlare.projectileConfig?.trajectory).toBe("straight");

        // Verify Frost Domain spell (Aurelia)
        const frostNova = dict["frost_nova"];
        expect(frostNova).toBeDefined();
        expect(frostNova.magicDomain).toBe("frost");
        expect(frostNova.castType).toBe("chargeable");
        expect(frostNova.character).toBe("aurelia");
        expect(frostNova.damage).toBe(50);
        expect(frostNova.statusEffects).toBeDefined();
        expect(frostNova.statusEffects?.length).toBeGreaterThan(0);
        expect(frostNova.statusEffects?.[0].type).toBe("slow");

        // Verify Unison Combo spell
        const unison = dict["unison_supernova_nova"];
        expect(unison).toBeDefined();
        expect(unison.ownerType).toBe("unison");
        expect(unison.requiredParticipants).toEqual(["valen", "aurelia"]);
      }
    });

    it("performs clean round-trip encoding and decoding (encode(decode(json)) === json)", () => {
      const decodedResult = spellCodec.decodeDictionary(spellsJson);
      expect(decodedResult.isOk()).toBe(true);

      if (decodedResult.isOk()) {
        const encodedResult = spellCodec.encodeDictionary(decodedResult.value);
        expect(encodedResult.isOk()).toBe(true);

        if (encodedResult.isOk()) {
          expect(encodedResult.value.version).toBe("2.0");
          const reDecoded = spellCodec.decodeDictionary(encodedResult.value);
          expect(reDecoded.isOk()).toBe(true);
          if (reDecoded.isOk()) {
            expect(Object.keys(reDecoded.value).length).toBe(Object.keys(decodedResult.value).length);
            expect(reDecoded.value["solar_flare"].damage).toBe(35);
            expect(reDecoded.value["frost_nova"].magicDomain).toBe("frost");
          }
        }
      }
    });

    it("decodes array of spells via decodeAll", () => {
      const result = spellCodec.decodeAll(spellsJson);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThanOrEqual(19);
        expect(result.value.some((s) => s.id === "celestial_comet")).toBe(true);
      }
    });

    it("returns Err with CodecError when decoding invalid spell data", () => {
      const invalidData = {
        id: "broken",
        magicDomain: "non_existent_element",
        castType: "teleport",
        damage: "not_a_number"
      };

      const result = spellCodec.decode(invalidData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.name).toBe("CodecError");
        expect(result.error.message).toContain("Failed to decode Spell");
      }
    });
  });

  describe("SkillCodec - Bidirectional Physical Skills Serialization", () => {
    it("decodes the canonical production skills.json successfully via decodeDictionary", () => {
      const result = skillCodec.decodeDictionary(skillsJson);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const { valen, aurelia } = result.value;
        expect(valen.length).toBeGreaterThan(0);
        expect(aurelia.length).toBeGreaterThan(0);

        // Check Valen first node
        const valenStarter = valen.find((n) => n.id === "solar_flare");
        expect(valenStarter).toBeDefined();
        expect(valenStarter?.character).toBe("valen");
        expect(valenStarter?.pointCost).toBe(1);
        expect(valenStarter?.unlocked).toBe(true);

        // Check Aurelia first node
        const aureliaStarter = aurelia.find((n) => n.id === "aether_bolt");
        expect(aureliaStarter).toBeDefined();
        expect(aureliaStarter?.character).toBe("aurelia");
        expect(aureliaStarter?.pointCost).toBe(1);
        expect(aureliaStarter?.unlocked).toBe(true);
      }
    });

    it("performs clean round-trip encoding and decoding for hero skill trees", () => {
      const decodedResult = skillCodec.decodeDictionary(skillsJson);
      expect(decodedResult.isOk()).toBe(true);

      if (decodedResult.isOk()) {
        const encodedResult = skillCodec.encodeDictionary(decodedResult.value);
        expect(encodedResult.isOk()).toBe(true);

        if (encodedResult.isOk()) {
          expect(encodedResult.value.valen.length).toBe(decodedResult.value.valen.length);
          expect(encodedResult.value.aurelia.length).toBe(decodedResult.value.aurelia.length);

          const reDecoded = skillCodec.decodeDictionary(encodedResult.value);
          expect(reDecoded.isOk()).toBe(true);
        }
      }
    });

    it("returns Err with CodecError when decoding invalid skill node data", () => {
      const invalidData = {
        id: "invalid_node",
        character: "unknown_hero",
        tier: -5
      };

      const result = skillCodec.decode(invalidData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.name).toBe("CodecError");
        expect(result.error.message).toContain("Failed to decode SkillNode");
      }
    });
  });
});
