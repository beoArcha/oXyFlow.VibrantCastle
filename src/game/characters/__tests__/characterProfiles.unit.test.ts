import { describe, it, expect } from "bun:test";
import {
  CHARACTER_PROFILE_REGISTRY,
  PLAYABLE_CHARACTER_PROFILES,
  getCharacterProfile,
  computeEffectiveSpellManaCost,
  computeEffectiveSpellDamage,
} from "../characterProfiles";
import { calculatePlayerDerivedStats } from "@game/logic/inventory";
import { LevelDesigner } from "@game/locations/levels";
import { PlayerId } from "@game/types";

describe("characterProfiles lore & subtle gameplay differences", () => {
  it("exposes Valen (Solar Knight) and Aurelia (Scholar of Arcanum) in the SSOT registry", () => {
    expect(PLAYABLE_CHARACTER_PROFILES.map((p) => p.id)).toEqual(["valen", "aurelia"]);
    expect(CHARACTER_PROFILE_REGISTRY.valen.emblem).toBe("sun");
    expect(CHARACTER_PROFILE_REGISTRY.valen.theme).toBe("crimson");
    expect(CHARACTER_PROFILE_REGISTRY.aurelia.emblem).toBe("astrolabe");
    expect(CHARACTER_PROFILE_REGISTRY.aurelia.theme).toBe("cyan");
  });

  it("gives Valen higher HP, stamina, stamina regen, defense, and faster rapier cadence than Aurelia", () => {
    const valen = getCharacterProfile("valen").baseStats;
    const aurelia = getCharacterProfile("aurelia").baseStats;

    expect(valen.maxHp).toBeGreaterThan(aurelia.maxHp);
    expect(valen.maxStamina).toBeGreaterThan(aurelia.maxStamina);
    expect(valen.staminaRegen).toBeGreaterThan(aurelia.staminaRegen);
    expect(valen.baseAttack).toBeGreaterThan(aurelia.baseAttack);
    expect(valen.baseDefense).toBeGreaterThan(aurelia.baseDefense);
    expect(valen.attackCooldownTicks).toBeLessThan(aurelia.attackCooldownTicks);
  });

  it("gives Aurelia higher Mana, mana regen, +15% spell power, -10% mana cost, and more agile evade", () => {
    const valen = getCharacterProfile("valen").baseStats;
    const aurelia = getCharacterProfile("aurelia").baseStats;

    expect(aurelia.maxMana).toBeGreaterThan(valen.maxMana);
    expect(aurelia.manaRegen).toBeGreaterThan(valen.manaRegen);
    expect(aurelia.spellPowerMultiplier).toBeGreaterThan(valen.spellPowerMultiplier);
    expect(aurelia.manaCostMultiplier).toBeLessThan(valen.manaCostMultiplier);
    expect(aurelia.dashStaminaCost).toBeLessThan(valen.dashStaminaCost);
    expect(aurelia.slideCooldownTicks).toBeLessThan(valen.slideCooldownTicks);
    expect(aurelia.backstepCooldownTicks).toBeLessThan(valen.backstepCooldownTicks);
  });

  it("computes effective spell mana cost and damage per character", () => {
    expect(computeEffectiveSpellManaCost(20, "valen")).toBe(20);
    expect(computeEffectiveSpellManaCost(20, "aurelia")).toBe(18);
    expect(computeEffectiveSpellDamage(40, "valen")).toBe(40);
    expect(computeEffectiveSpellDamage(40, "aurelia")).toBe(46);
  });

  it("initializes LevelDesigner players and calculatePlayerDerivedStats from character profiles", () => {
    const valenPlayer = LevelDesigner.createPlayerEntity(PlayerId.Player1, "valen", 100, 100);
    const aureliaPlayer = LevelDesigner.createPlayerEntity(PlayerId.Player2, "aurelia", 100, 100);

    expect(valenPlayer.maxHealth).toBe(115);
    expect(valenPlayer.maxMana).toBe(90);
    expect(valenPlayer.maxStamina).toBe(115);

    expect(aureliaPlayer.maxHealth).toBe(90);
    expect(aureliaPlayer.maxMana).toBe(125);
    expect(aureliaPlayer.maxStamina).toBe(95);

    const valenDerived = calculatePlayerDerivedStats(valenPlayer);
    const aureliaDerived = calculatePlayerDerivedStats(aureliaPlayer);

    expect(valenDerived.maxHp).toBeGreaterThan(aureliaDerived.maxHp);
    expect(aureliaDerived.maxMana).toBeGreaterThan(valenDerived.maxMana);
    expect(aureliaDerived.spellPowerMultiplier).toBeCloseTo(1.15, 2);
    expect(valenDerived.spellPowerMultiplier).toBeCloseTo(1.0, 2);
  });
});
