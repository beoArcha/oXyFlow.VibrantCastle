import { Item, InventoryState, EquipmentState, Player } from "@game/types";

export interface PlayerDerivedStats {
  totalAttack: number;
  totalDefense: number;
  maxHp: number;
  maxMana: number;
  maxStamina: number;
  manaRegen: number;
  staminaRegen: number;
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
 * Recalculates total stats given base stats and active equipped gear.
 */
export function calculatePlayerDerivedStats(player: Player): PlayerDerivedStats {
  const baseHp = 100;
  const baseMana = 100;
  const baseStamina = 100;
  let totalAttack = 20; // base rapier damage
  let totalDefense = 5;
  let hpBonus = 0;
  let manaBonus = 0;
  let staminaBonus = 0;
  let manaRegen = 0.08;
  let staminaRegen = 0.25;

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

  return {
    totalAttack,
    totalDefense,
    maxHp: baseHp + hpBonus,
    maxMana: baseMana + manaBonus,
    maxStamina: baseStamina + staminaBonus,
    manaRegen,
    staminaRegen,
  };
}
