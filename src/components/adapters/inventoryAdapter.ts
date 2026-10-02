import { Item, ItemRarity, ItemType, EquipmentState } from "@game/types";

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

export const RARITY_VARIANT_MAP: Record<ItemRarity, ItemRarityVariant> = {
  common: "stone",
  uncommon: "green",
  rare: "cyan",
  legendary: "amber",
};

export const RARITY_LABEL_KEY_MAP: Record<ItemRarity, string> = {
  common: "rarityCommon",
  uncommon: "rarityUncommon",
  rare: "rarityRare",
  legendary: "rarityLegendary",
};

export const ITEM_TYPE_LABEL_KEY_MAP: Record<ItemType, string> = {
  [ItemType.Weapon]: "itemTypeWeapon",
  [ItemType.Shield]: "itemTypeShield",
  [ItemType.Helmet]: "itemTypeHelmet",
  [ItemType.Armor]: "itemTypeArmor",
  [ItemType.Amulet]: "itemTypeAmulet",
  [ItemType.Ring]: "itemTypeRing",
  [ItemType.Potion]: "itemTypePotion",
};

const DEFAULT_PAPERDOLL_CONFIG: readonly {
  readonly slotKey: EquipmentSlotKey;
  readonly labelKey: string;
  readonly placeholderIconName: string;
}[] = [
  { slotKey: "helmet", labelKey: "helmet", placeholderIconName: "Crown" },
  { slotKey: "mainHand", labelKey: "mainHand", placeholderIconName: "Sword" },
  { slotKey: "armor", labelKey: "armor", placeholderIconName: "Shirt" },
  { slotKey: "offHand", labelKey: "offHand", placeholderIconName: "Shield" },
  { slotKey: "amulet", labelKey: "amulet", placeholderIconName: "Sparkles" },
  { slotKey: "ring", labelKey: "ring", placeholderIconName: "CircleDot" },
];

/**
 * Resolves color badge/border variant for a given item rarity.
 */
export function resolveRarityVariant(rarity: ItemRarity | string | null | undefined): ItemRarityVariant {
  if (!rarity) return "stone";
  return RARITY_VARIANT_MAP[rarity as ItemRarity] || "stone";
}

/**
 * Resolves i18n translation key for a given item rarity.
 */
export function resolveRarityLabelKey(rarity: ItemRarity | string | null | undefined): string {
  if (!rarity) return "rarityCommon";
  return RARITY_LABEL_KEY_MAP[rarity as ItemRarity] || "rarityCommon";
}

/**
 * Resolves i18n translation key for a given item type.
 */
export function resolveItemTypeLabelKey(type: ItemType | string | null | undefined): string {
  if (!type) return "itemTypeWeapon";
  return ITEM_TYPE_LABEL_KEY_MAP[type as ItemType] || "itemTypeWeapon";
}

/**
 * Transforms an Item entity into an ItemSlotVM presentation model.
 */
export function resolveItemSlotVM(
  item: Item | null | undefined,
  fallbackLabel?: string,
  placeholderIconName?: string
): ItemSlotVM {
  if (!item) {
    return {
      id: null,
      nameKey: null,
      iconName: null,
      rarity: null,
      rarityVariant: "stone",
      count: undefined,
      isEmpty: true,
      label: fallbackLabel,
      placeholderIconName,
    };
  }

  return {
    id: item.id,
    nameKey: item.nameKey,
    iconName: item.icon,
    rarity: item.rarity,
    rarityVariant: resolveRarityVariant(item.rarity),
    count: item.count,
    isEmpty: false,
    label: fallbackLabel,
    placeholderIconName,
  };
}

/**
 * Transforms engine equipment state into an EquipmentPaperdollVM.
 */
export function resolvePaperdollVM(equipment: EquipmentState | null | undefined): EquipmentPaperdollVM {
  const safeEquipment: Partial<EquipmentState> = equipment || {};

  const slots = DEFAULT_PAPERDOLL_CONFIG.map(({ slotKey, labelKey, placeholderIconName }) => {
    const item = safeEquipment[slotKey] ?? null;
    const baseSlot = resolveItemSlotVM(item, labelKey, placeholderIconName);
    return {
      ...baseSlot,
      slotKey,
      labelKey,
      placeholderIconName,
    };
  });

  const slotsMap = slots.reduce<Record<EquipmentSlotKey, EquipmentSlotVM>>(
    (acc, slot) => {
      acc[slot.slotKey] = slot;
      return acc;
    },
    {} as Record<EquipmentSlotKey, EquipmentSlotVM>
  );

  return {
    helmet: slotsMap.helmet,
    mainHand: slotsMap.mainHand,
    armor: slotsMap.armor,
    offHand: slotsMap.offHand,
    amulet: slotsMap.amulet,
    ring: slotsMap.ring,
    slots,
  };
}

/**
 * Transforms backpack item array into a BackpackGridVM.
 */
export function resolveBackpackVM(
  backpack: readonly (Item | null)[] | (Item | null)[] | null | undefined,
  maxSlots: number = 16
): BackpackGridVM {
  const safeCapacity = Math.max(1, maxSlots);
  const slots: BackpackSlotVM[] = [];
  let occupiedCount = 0;

  for (let idx = 0; idx < safeCapacity; idx++) {
    const item = backpack ? backpack[idx] ?? null : null;
    if (item) {
      occupiedCount++;
    }
    const baseSlot = resolveItemSlotVM(item);
    slots.push({
      ...baseSlot,
      slotIndex: idx,
    });
  }

  return {
    slots,
    occupiedCount,
    totalCapacity: safeCapacity,
  };
}

/**
 * Transforms quick potion items into an InventoryQuickBeltVM with key bindings.
 */
export function resolveInventoryQuickBeltVM(
  quickPotions: readonly (Item | null)[] | (Item | null)[] | null | undefined,
  isP1: boolean = true
): InventoryQuickBeltVM {
  const slots: InventoryQuickBeltSlotVM[] = [];

  for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
    const item = quickPotions ? quickPotions[slotIndex] ?? null : null;
    const keyLabel = isP1 ? String(slotIndex + 1) : String(slotIndex + 7);
    const baseSlot = resolveItemSlotVM(item);

    slots.push({
      ...baseSlot,
      slotIndex,
      keyLabel,
      healHp: item?.healHp,
      healMana: item?.healMana,
      healStamina: item?.healStamina,
    });
  }

  return {
    slots,
    isP1,
  };
}

/**
 * Extracts and formats all active stat modifiers for an item.
 */
export function resolveStatModifiersVM(item: Item | null | undefined): readonly StatModifierVM[] {
  if (!item) return [];

  const modifiers: StatModifierVM[] = [];

  if (item.attackBonus !== undefined && item.attackBonus > 0) {
    modifiers.push({
      type: "attack",
      labelKey: "itemAttackBonus",
      value: item.attackBonus,
      formattedValue: `+${item.attackBonus}`,
      iconName: "Sword",
      textColorClass: "text-amber-300",
    });
  }

  if (item.defenseBonus !== undefined && item.defenseBonus > 0) {
    modifiers.push({
      type: "defense",
      labelKey: "itemDefenseBonus",
      value: item.defenseBonus,
      formattedValue: `+${item.defenseBonus}`,
      iconName: "Shield",
      textColorClass: "text-red-300",
    });
  }

  if (item.maxHpBonus !== undefined && item.maxHpBonus > 0) {
    modifiers.push({
      type: "hp",
      labelKey: "itemHpBonus",
      value: item.maxHpBonus,
      formattedValue: `+${item.maxHpBonus}`,
      iconName: "Heart",
      textColorClass: "text-rose-300",
    });
  }

  if (item.maxManaBonus !== undefined && item.maxManaBonus > 0) {
    modifiers.push({
      type: "mana",
      labelKey: "itemManaBonus",
      value: item.maxManaBonus,
      formattedValue: `+${item.maxManaBonus}`,
      iconName: "Zap",
      textColorClass: "text-cyan-300",
    });
  }

  if (item.maxStaminaBonus !== undefined && item.maxStaminaBonus > 0) {
    modifiers.push({
      type: "stamina",
      labelKey: "itemStaminaBonus",
      value: item.maxStaminaBonus,
      formattedValue: `+${item.maxStaminaBonus}`,
      iconName: "Zap",
      textColorClass: "text-amber-200",
    });
  }

  if (item.healHp !== undefined && item.healHp > 0) {
    modifiers.push({
      type: "healHp",
      labelKey: "itemHealHp",
      value: item.healHp,
      formattedValue: `+${item.healHp}`,
      iconName: "Heart",
      textColorClass: "text-rose-300",
    });
  }

  if (item.healMana !== undefined && item.healMana > 0) {
    modifiers.push({
      type: "healMana",
      labelKey: "itemHealMana",
      value: item.healMana,
      formattedValue: `+${item.healMana}`,
      iconName: "Zap",
      textColorClass: "text-cyan-300",
    });
  }

  if (item.healStamina !== undefined && item.healStamina > 0) {
    modifiers.push({
      type: "healStamina",
      labelKey: "itemHealStamina",
      value: item.healStamina,
      formattedValue: `+${item.healStamina}`,
      iconName: "Zap",
      textColorClass: "text-amber-200",
    });
  }

  if (item.manaRegenBonus !== undefined && item.manaRegenBonus > 0) {
    modifiers.push({
      type: "manaRegen",
      labelKey: "itemManaBonus",
      value: item.manaRegenBonus,
      formattedValue: `+${item.manaRegenBonus}`,
      iconName: "Zap",
      textColorClass: "text-cyan-300",
    });
  }

  if (item.staminaRegenBonus !== undefined && item.staminaRegenBonus > 0) {
    modifiers.push({
      type: "staminaRegen",
      labelKey: "itemStaminaBonus",
      value: item.staminaRegenBonus,
      formattedValue: `+${item.staminaRegenBonus}`,
      iconName: "Zap",
      textColorClass: "text-amber-200",
    });
  }

  return modifiers;
}

/**
 * Transforms an Item entity into a complete ItemDetailsVM.
 */
export function resolveItemDetailsVM(item: Item | null | undefined): ItemDetailsVM | null {
  if (!item) return null;

  return {
    id: item.id,
    nameKey: item.nameKey,
    descriptionKey: item.descriptionKey,
    iconName: item.icon,
    type: item.type,
    typeLabelKey: resolveItemTypeLabelKey(item.type),
    rarity: item.rarity,
    rarityLabelKey: resolveRarityLabelKey(item.rarity),
    rarityVariant: resolveRarityVariant(item.rarity),
    count: item.count,
    isPotion: item.type === ItemType.Potion,
    isEquippable: item.type !== ItemType.Potion,
    modifiers: resolveStatModifiersVM(item),
  };
}

/**
 * Transforms raw derived combat stats and vitals into a display-ready InventoryStatsVM.
 */
export function resolveInventoryStatsVM(
  derivedStats: DerivedStatsInput | null | undefined,
  currentHp: number = 0,
  currentMana: number = 0,
  currentStamina: number = 0
): InventoryStatsVM {
  const attack = Math.round(derivedStats?.totalAttack ?? 20);
  const defense = Math.round(derivedStats?.totalDefense ?? 5);
  const maxHp = Math.max(1, Math.round(derivedStats?.maxHp ?? 100));
  const maxMana = Math.max(1, Math.round(derivedStats?.maxMana ?? 100));
  const maxStamina = Math.max(1, Math.round(derivedStats?.maxStamina ?? 100));

  const safeHp = Math.max(0, Math.round(currentHp));
  const safeMana = Math.max(0, Math.round(currentMana));
  const safeStamina = Math.max(0, Math.round(currentStamina));

  return {
    attack,
    defense,
    currentHp: safeHp,
    maxHp,
    currentMana: safeMana,
    maxMana,
    currentStamina: safeStamina,
    maxStamina,
    hpDisplay: `${safeHp} / ${maxHp}`,
    manaDisplay: `${safeMana} / ${maxMana}`,
    staminaDisplay: `${safeStamina} / ${maxStamina}`,
    manaRegen: derivedStats?.manaRegen,
    staminaRegen: derivedStats?.staminaRegen,
  };
}
