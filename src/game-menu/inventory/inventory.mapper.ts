import { ItemType, type Item, type ItemRarity, type EquipmentState } from "@game/types";
import { clampPositiveInt } from "@lib/math";
import { getLogger } from "@lib/logger";

const logger = getLogger("InventoryMapper");
import type {
  ItemRarityVariant,
  EquipmentSlotKey,
  ItemSlotVM,
  EquipmentSlotVM,
  EquipmentPaperdollVM,
  BackpackSlotVM,
  BackpackGridVM,
  InventoryQuickBeltSlotVM,
  InventoryQuickBeltVM,
  StatModifierType,
  StatModifierVM,
  ItemDetailsVM,
  InventoryStatsVM,
  DerivedStatsInput,
} from "./types";

export type {
  ItemRarityVariant,
  EquipmentSlotKey,
  ItemSlotVM,
  EquipmentSlotVM,
  EquipmentPaperdollVM,
  BackpackSlotVM,
  BackpackGridVM,
  InventoryQuickBeltSlotVM,
  InventoryQuickBeltVM,
  StatModifierType,
  StatModifierVM,
  ItemDetailsVM,
  InventoryStatsVM,
  DerivedStatsInput,
};

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
  const mapped = RARITY_VARIANT_MAP[rarity as ItemRarity];
  if (!mapped) {
    logger.warn(`[InventoryMapper] Unknown item rarity encountered: '${rarity}', falling back to 'stone'.`, {
      code: "UNKNOWN_ITEM_RARITY",
      rarity,
    });
    return "stone";
  }
  return mapped;
}

/**
 * Resolves i18n translation key for a given item rarity.
 */
export function resolveRarityLabelKey(rarity: ItemRarity | string | null | undefined): string {
  if (!rarity) return "rarityCommon";
  const mapped = RARITY_LABEL_KEY_MAP[rarity as ItemRarity];
  if (!mapped) {
    logger.warn(`[InventoryMapper] Unknown item rarity encountered: '${rarity}', falling back to 'rarityCommon'.`, {
      code: "UNKNOWN_ITEM_RARITY",
      rarity,
    });
    return "rarityCommon";
  }
  return mapped;
}

/**
 * Resolves i18n translation key for a given item type.
 */
export function resolveItemTypeLabelKey(type: ItemType | string | null | undefined): string {
  if (!type) return "itemTypeWeapon";
  const mapped = ITEM_TYPE_LABEL_KEY_MAP[type as ItemType];
  if (!mapped) {
    logger.warn(`[InventoryMapper] Unknown item type encountered: '${type}', falling back to 'itemTypeWeapon'.`, {
      code: "UNKNOWN_ITEM_TYPE",
      type,
    });
    return "itemTypeWeapon";
  }
  return mapped;
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

  const safeHp = clampPositiveInt(currentHp);
  const safeMana = clampPositiveInt(currentMana);
  const safeStamina = clampPositiveInt(currentStamina);

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
