import { Player, InventoryState } from "../types";
import {
  calculatePlayerDerivedStats,
  createDefaultInventory,
} from "../logic/inventory";
import { getDefaultSkillsForCharacter } from "../logic/skills";

export function cloneInventoryState(inv: InventoryState): InventoryState {
  return {
    equipment: {
      mainHand: inv.equipment.mainHand ? { ...inv.equipment.mainHand } : null,
      offHand: inv.equipment.offHand ? { ...inv.equipment.offHand } : null,
      helmet: inv.equipment.helmet ? { ...inv.equipment.helmet } : null,
      armor: inv.equipment.armor ? { ...inv.equipment.armor } : null,
      amulet: inv.equipment.amulet ? { ...inv.equipment.amulet } : null,
      ring: inv.equipment.ring ? { ...inv.equipment.ring } : null,
    },
    quickPotions: inv.quickPotions.map((p) => (p ? { ...p } : null)),
    backpack: inv.backpack.map((b) => (b ? { ...b } : null)),
  };
}

/**
 * Applies a target character identity and profile to a player entity,
 * preserving previous progression in characterProfiles cache.
 */
export function applyCharacterToPlayer(player: Player, characterId: "valen" | "aurelia"): void {
  const currentChar = player.characterId || "valen";
  if (!player.characterProfiles) {
    player.characterProfiles = {};
  }

  // Cache outgoing character progression
  player.characterProfiles[currentChar] = {
    characterId: currentChar,
    unlockedSkills: [...player.unlockedSkills],
    skillPoints: player.skillPoints,
    primarySpellId: player.primarySpellId,
    secondarySpellId: player.secondarySpellId,
    inventory: cloneInventoryState(player.inventory),
  };

  // Restore or initialize incoming character progression
  const existingProfile = player.characterProfiles[characterId];
  if (existingProfile) {
    player.unlockedSkills = [...existingProfile.unlockedSkills];
    player.skillPoints = existingProfile.skillPoints;
    player.primarySpellId = existingProfile.primarySpellId;
    player.secondarySpellId = existingProfile.secondarySpellId;
    player.inventory = cloneInventoryState(existingProfile.inventory);
  } else {
    const defaults = getDefaultSkillsForCharacter(characterId);
    player.unlockedSkills = [...defaults.unlockedSkills];
    player.skillPoints = Math.max(player.skillPoints, defaults.skillPoints);
    player.primarySpellId = defaults.primarySpellId;
    player.secondarySpellId = defaults.secondarySpellId;
    player.inventory = createDefaultInventory();
  }

  player.characterId = characterId;
  player.characterName = characterId === "aurelia" ? "Aurelia" : "Valen";

  const stats = calculatePlayerDerivedStats(player);
  player.maxHealth = stats.maxHp;
  player.maxMana = stats.maxMana;
  player.maxStamina = stats.maxStamina;
  player.health = Math.min(player.health, player.maxHealth);
  player.mana = Math.min(player.mana, player.maxMana);
  player.stamina = Math.min(player.stamina, player.maxStamina);
}

/**
 * Swaps all character progression, inventory, and identity data between two players in a co-op session.
 */
export function swapPlayerProgression(p1: Player, p2: Player): void {
  const tempCharId = p1.characterId;
  const tempCharName = p1.characterName;
  p1.characterId = p2.characterId;
  p1.characterName = p2.characterName;
  p2.characterId = tempCharId;
  p2.characterName = tempCharName;

  const tempSkills = p1.unlockedSkills;
  const tempPoints = p1.skillPoints;
  const tempPrimary = p1.primarySpellId;
  const tempSecondary = p1.secondarySpellId;

  p1.unlockedSkills = p2.unlockedSkills;
  p1.skillPoints = p2.skillPoints;
  p1.primarySpellId = p2.primarySpellId;
  p1.secondarySpellId = p2.secondarySpellId;

  p2.unlockedSkills = tempSkills;
  p2.skillPoints = tempPoints;
  p2.primarySpellId = tempPrimary;
  p2.secondarySpellId = tempSecondary;

  const tempInventory = p1.inventory;
  p1.inventory = p2.inventory;
  p2.inventory = tempInventory;

  const tempProfiles = p1.characterProfiles;
  p1.characterProfiles = p2.characterProfiles;
  p2.characterProfiles = tempProfiles;

  const p1Stats = calculatePlayerDerivedStats(p1);
  p1.maxHealth = p1Stats.maxHp;
  p1.maxMana = p1Stats.maxMana;
  p1.maxStamina = p1Stats.maxStamina;

  const p2Stats = calculatePlayerDerivedStats(p2);
  p2.maxHealth = p2Stats.maxHp;
  p2.maxMana = p2Stats.maxMana;
  p2.maxStamina = p2Stats.maxStamina;
}
