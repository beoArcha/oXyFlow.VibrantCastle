import type { PlayerTheme } from "@styles/theme";

export type CharacterProfileId = "valen" | "aurelia";

export type CharacterEmblemType = "sun" | "astrolabe";

export interface CharacterBaseStats {
  readonly maxHp: number;
  readonly maxMana: number;
  readonly maxStamina: number;
  readonly baseAttack: number;
  readonly baseDefense: number;
  readonly manaRegen: number;
  readonly staminaRegen: number;
  readonly spellPowerMultiplier: number;
  readonly manaCostMultiplier: number;
  readonly attackCooldownTicks: number;
  readonly dashStaminaCost: number;
  readonly slideCooldownTicks: number;
  readonly backstepCooldownTicks: number;
}

export interface CharacterProfile {
  readonly id: CharacterProfileId;
  readonly displayName: string;
  readonly theme: PlayerTheme;
  readonly emblem: CharacterEmblemType;
  readonly titleKey: "valenLoreTitle" | "aureliaLoreTitle";
  readonly passiveNameKey: "valenPassiveName" | "aureliaPassiveName";
  readonly passiveDescKey: "valenPassiveDesc" | "aureliaPassiveDesc";
  readonly castParticleColor: string;
  readonly secondaryCastParticleColor: string;
  readonly baseStats: CharacterBaseStats;
}

/**
 * Single Source of Truth (OCP) registry of playable hero profiles.
 * Reflects subtle lore-authentic differences between Valen (Solar Knight)
 * and Aurelia (Scholar of Arcanum) while preserving identical jump/run
 * platforming physics across all 8 worlds.
 */
export const CHARACTER_PROFILE_REGISTRY: Readonly<Record<CharacterProfileId, CharacterProfile>> = {
  valen: {
    id: "valen",
    displayName: "Valen",
    theme: "crimson",
    emblem: "sun",
    titleKey: "valenLoreTitle",
    passiveNameKey: "valenPassiveName",
    passiveDescKey: "valenPassiveDesc",
    castParticleColor: "#f59e0b",
    secondaryCastParticleColor: "#fbbf24",
    baseStats: {
      maxHp: 115,
      maxMana: 90,
      maxStamina: 115,
      baseAttack: 23,
      baseDefense: 7,
      manaRegen: 0.07,
      staminaRegen: 0.30,
      spellPowerMultiplier: 1.0,
      manaCostMultiplier: 1.0,
      attackCooldownTicks: 18,
      dashStaminaCost: 18,
      slideCooldownTicks: 38,
      backstepCooldownTicks: 32,
    },
  },
  aurelia: {
    id: "aurelia",
    displayName: "Aurelia",
    theme: "cyan",
    emblem: "astrolabe",
    titleKey: "aureliaLoreTitle",
    passiveNameKey: "aureliaPassiveName",
    passiveDescKey: "aureliaPassiveDesc",
    castParticleColor: "#38bdf8",
    secondaryCastParticleColor: "#a855f7",
    baseStats: {
      maxHp: 90,
      maxMana: 125,
      maxStamina: 95,
      baseAttack: 18,
      baseDefense: 4,
      manaRegen: 0.14,
      staminaRegen: 0.24,
      spellPowerMultiplier: 1.15,
      manaCostMultiplier: 0.9,
      attackCooldownTicks: 22,
      dashStaminaCost: 15,
      slideCooldownTicks: 30,
      backstepCooldownTicks: 26,
    },
  },
};

export const PLAYABLE_CHARACTER_PROFILES: readonly CharacterProfile[] = [
  CHARACTER_PROFILE_REGISTRY.valen,
  CHARACTER_PROFILE_REGISTRY.aurelia,
];

/**
 * Resolves a character profile safely, falling back to Valen for unknown or omitted ids.
 */
export function getCharacterProfile(characterId?: string | null): CharacterProfile {
  if (characterId === "aurelia") {
    return CHARACTER_PROFILE_REGISTRY.aurelia;
  }
  return CHARACTER_PROFILE_REGISTRY.valen;
}

/**
 * Computes effective spell mana cost after applying the hero's lore affinity.
 */
export function computeEffectiveSpellManaCost(
  baseManaCost: number,
  characterId?: string | null
): number {
  if (baseManaCost <= 0) return 0;
  const profile = getCharacterProfile(characterId);
  return Math.max(1, Math.round(baseManaCost * profile.baseStats.manaCostMultiplier));
}

/**
 * Computes effective spell damage after applying the hero's lore spell power multiplier.
 */
export function computeEffectiveSpellDamage(
  baseDamage: number,
  characterId?: string | null
): number {
  if (baseDamage <= 0) return 0;
  const profile = getCharacterProfile(characterId);
  return Math.round(baseDamage * profile.baseStats.spellPowerMultiplier);
}
