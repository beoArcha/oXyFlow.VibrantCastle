import { ItemType, type Item, type ItemRarity, type EquipmentState } from "@game/types";

export type ItemRarityVariant = "stone" | "green" | "cyan" | "amber";

export type EquipmentSlotKey = "helmet" | "mainHand" | "armor" | "offHand" | "amulet" | "ring";

export interface ItemSlotVM {
  readonly id: string | null;
  readonly nameKey: string | null;
  readonly iconName: string | null;
  readonly rarity: ItemRarity | null;
  readonly rarityVariant: ItemRarityVariant;
  readonly count?: number;
  readonly isEmpty: boolean;
  readonly label?: string;
  readonly placeholderIconName?: string;
}

export interface EquipmentSlotVM extends ItemSlotVM {
  readonly slotKey: EquipmentSlotKey;
  readonly labelKey: string;
  readonly placeholderIconName: string;
}

export interface EquipmentPaperdollVM {
  readonly helmet: EquipmentSlotVM;
  readonly mainHand: EquipmentSlotVM;
  readonly armor: EquipmentSlotVM;
  readonly offHand: EquipmentSlotVM;
  readonly amulet: EquipmentSlotVM;
  readonly ring: EquipmentSlotVM;
  readonly slots: readonly EquipmentSlotVM[];
}

export interface BackpackSlotVM extends ItemSlotVM {
  readonly slotIndex: number;
}

export interface BackpackGridVM {
  readonly slots: readonly BackpackSlotVM[];
  readonly occupiedCount: number;
  readonly totalCapacity: number;
}

export interface InventoryQuickBeltSlotVM extends ItemSlotVM {
  readonly slotIndex: number;
  readonly keyLabel: string;
  readonly healHp?: number;
  readonly healMana?: number;
  readonly healStamina?: number;
}

export interface InventoryQuickBeltVM {
  readonly slots: readonly InventoryQuickBeltSlotVM[];
  readonly isP1: boolean;
}

export type StatModifierType =
  | "attack"
  | "defense"
  | "hp"
  | "mana"
  | "stamina"
  | "healHp"
  | "healMana"
  | "healStamina"
  | "manaRegen"
  | "staminaRegen";

export interface StatModifierVM {
  readonly type: StatModifierType;
  readonly labelKey: string;
  readonly value: number;
  readonly formattedValue: string;
  readonly iconName: string;
  readonly textColorClass: string;
}

export interface ItemDetailsVM {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly iconName: string;
  readonly type: ItemType;
  readonly typeLabelKey: string;
  readonly rarity: ItemRarity;
  readonly rarityLabelKey: string;
  readonly rarityVariant: ItemRarityVariant;
  readonly count?: number;
  readonly isPotion: boolean;
  readonly isEquippable: boolean;
  readonly modifiers: readonly StatModifierVM[];
}

export interface InventoryStatsVM {
  readonly attack: number;
  readonly defense: number;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly currentMana: number;
  readonly maxMana: number;
  readonly currentStamina: number;
  readonly maxStamina: number;
  readonly hpDisplay: string;
  readonly manaDisplay: string;
  readonly staminaDisplay: string;
  readonly manaRegen?: number;
  readonly staminaRegen?: number;
}

export interface DerivedStatsInput {
  readonly totalAttack: number;
  readonly totalDefense: number;
  readonly maxHp: number;
  readonly maxMana: number;
  readonly maxStamina: number;
  readonly manaRegen?: number;
  readonly staminaRegen?: number;
}
