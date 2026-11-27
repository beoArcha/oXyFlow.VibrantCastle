import { Item, InventoryState, EquipmentState, Player } from "@game/types";
import { getCharacterProfile } from "@game/characters";

export interface PlayerDerivedStats {
  totalAttack: number;
  totalDefense: number;
  maxHp: number;
  maxMana: number;
  maxStamina: number;
  manaRegen: number;
  staminaRegen: number;
  spellPowerMultiplier: number;
  manaCostMultiplier: number;
}

/**
 * Creates default initial inventory for a new game / player.
 * Matches classic isometric RPGs layout with equipped starter gear and a few potions in the belt.
 */
export function createDefaultInventory(itemRegistry: Record<string, Item>): InventoryState {
  const backpack: (Item | null)[] = new Array(16).fill(null);
  backpack[0] = itemRegistry.frost_rapier ? { ...itemRegistry.frost_rapier } : null;
  backpack[1] = itemRegistry.spell_grimoire ? { ...itemRegistry.spell_grimoire } : null;
  backpack[2] = itemRegistry.scholar_robe ? { ...itemRegistry.scholar_robe } : null;
  backpack[3] = itemRegistry.swift_ring ? { ...itemRegistry.swift_ring } : null;

  const quickPotions: (Item | null)[] = [
    itemRegistry.potion_health ? { ...itemRegistry.potion_health, count: 2 } : null,
    itemRegistry.potion_mana ? { ...itemRegistry.potion_mana, count: 2 } : null,
    itemRegistry.potion_elixir ? { ...itemRegistry.potion_elixir, count: 2 } : null,
  ];

  const equipment: EquipmentState = {
    mainHand: itemRegistry.solar_rapier ? { ...itemRegistry.solar_rapier } : null,
    offHand: itemRegistry.brass_buckler ? { ...itemRegistry.brass_buckler } : null,
    helmet: itemRegistry.velvet_hat ? { ...itemRegistry.velvet_hat } : null,
    armor: itemRegistry.crimson_coat ? { ...itemRegistry.crimson_coat } : null,
    amulet: itemRegistry.amber_amulet ? { ...itemRegistry.amber_amulet } : null,
    ring: null,
  };

  return {
    equipment,
    quickPotions,
    backpack,
  };
}

/**
 * Recalculates total stats given character lore profile, active equipped gear, and passive skills.
 */
export function calculatePlayerDerivedStats(player: Player): PlayerDerivedStats {
  const profile = getCharacterProfile(player.characterId);
  const {
    maxHp: baseHp,
    maxMana: baseMana,
    maxStamina: baseStamina,
    baseAttack,
    baseDefense,
    manaRegen: baseManaRegen,
    staminaRegen: baseStaminaRegen,
    spellPowerMultiplier,
    manaCostMultiplier,
  } = profile.baseStats;

  let totalAttack = baseAttack;
  let totalDefense = baseDefense;
  let hpBonus = 0;
  let manaBonus = 0;
  let staminaBonus = 0;
  let manaRegen = baseManaRegen;
  let staminaRegen = baseStaminaRegen;

  const eq = player.inventory.equipment;
  const equippedItems = [eq.mainHand, eq.offHand, eq.helmet, eq.armor, eq.amulet, eq.ring].filter(Boolean) as Item[];

  equippedItems.forEach((item) => {
    if (item.attackBonus) totalAttack += item.attackBonus;
    if (item.defenseBonus) totalDefense += item.defenseBonus;
    if (item.maxHpBonus) hpBonus += item.maxHpBonus;
    if (item.maxManaBonus) manaBonus += item.maxManaBonus;
    if (item.maxStaminaBonus) staminaBonus += item.maxStaminaBonus;
    if (item.manaRegenBonus) manaRegen += item.manaRegenBonus;
    if (item.staminaRegenBonus) staminaRegen += item.staminaRegenBonus;
  });

  // Passive skill bonuses
  if (player.unlockedSkills.includes("mana_font")) {
    manaRegen += 0.15;
    manaBonus += 25;
  }
  if (player.unlockedSkills.includes("stamina_surge")) {
    staminaRegen += 0.2;
    staminaBonus += 25;
  }
  if (player.unlockedSkills.includes("blade_infusion")) {
    totalAttack += 15;
  }
  if (player.unlockedSkills.includes("vitality_surge")) {
    hpBonus += 35;
    totalDefense += 4;
  }
  if (player.unlockedSkills.includes("scholarly_focus")) {
    manaRegen += 0.12;
  }

  return {
    totalAttack,
    totalDefense,
    maxHp: baseHp + hpBonus,
    maxMana: baseMana + manaBonus,
    maxStamina: baseStamina + staminaBonus,
    manaRegen,
    staminaRegen,
    spellPowerMultiplier,
    manaCostMultiplier,
  };
}

/**
 * Recomputes effective max HP/mana/stamina (profile + equipment + skills) and writes them onto the player.
 * Current values are only clamped down (min(current, max)); they are never raised when max grows.
 * Every path that can change max stats (equip, unequip, skill unlock, hero switch, swap, reset, save load)
 * goes through this helper so current never exceeds max.
 */
export function syncPlayerMaxStats(player: Player): PlayerDerivedStats {
  const stats = calculatePlayerDerivedStats(player);
  player.maxHealth = stats.maxHp;
  player.maxMana = stats.maxMana;
  player.maxStamina = stats.maxStamina;
  player.health = Math.min(player.health, player.maxHealth);
  player.mana = Math.min(player.mana, player.maxMana);
  player.stamina = Math.min(player.stamina, player.maxStamina);
  return stats;
}
