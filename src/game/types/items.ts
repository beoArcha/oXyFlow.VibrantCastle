import type { DamageType, ItemStatusEffectSchema } from "@lib/schemas";
import { ItemType } from "./enums";

export type ItemRarity = "common" | "uncommon" | "rare" | "legendary";

export interface ItemBase {
  id: string;
  nameKey: string;
  descriptionKey: string;
  type: ItemType;
  icon: string;
  rarity: ItemRarity;
  damageType?: DamageType;
  effectsOnHit?: ItemStatusEffectSchema[];
  overTimeEffects?: ItemStatusEffectSchema[];
}

export interface ICombatModifiers {
  attackBonus?: number;
  defenseBonus?: number;
  maxHpBonus?: number;
  maxManaBonus?: number;
  maxStaminaBonus?: number;
  manaRegenBonus?: number;
  staminaRegenBonus?: number;
}

export interface IPotionEffects {
  healHp?: number;
  healMana?: number;
  healStamina?: number;
  count?: number;
}

export interface Item extends ItemBase, ICombatModifiers, IPotionEffects {}

export interface EquipmentState {
  mainHand: Item | null;
  offHand: Item | null;
  helmet: Item | null;
  armor: Item | null;
  amulet: Item | null;
  ring: Item | null;
}

export interface InventoryState {
  equipment: EquipmentState;
  quickPotions: (Item | null)[];
  backpack: (Item | null)[];
}
