import { ItemType, type Item, type ItemRarity, type EquipmentState } from "@game/types";
import { clampPositiveInt } from "@lib/math";
import { getLogger } from "@lib/logger";
import { resolveStatModifiersVM } from "./inventoryComparison";
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
  ItemDetailsVM,
  InventoryStatsVM,
  DerivedStatsInput,
} from "./types";

export * from "./types";
export {
  resolveEquipmentSlotForItemType,
  resolveStatModifiersVM,
  resolveItemStatComparison,
} from "./inventoryComparison";

const logger = getLogger("InventoryMapper");

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
  { slotKey: "amulet", labelKey: "amulet", placeholderIconName: "Sparkles" },
  { slotKey: "helmet", labelKey: "helmet", placeholderIconName: "Crown" },
  { slotKey: "ring", labelKey: "ring", placeholderIconName: "CircleDot" },
  { slotKey: "mainHand", labelKey: "mainHand", placeholderIconName: "Sword" },
  { slotKey: "offHand", labelKey: "offHand", placeholderIconName: "Shield" },
  { slotKey: "armor", labelKey: "armor", placeholderIconName: "Shirt" },
];

export function resolveRarityVariant(rarity: ItemRarity | string | null | undefined): ItemRarityVariant {
  if (!rarity) return "stone";
  const mapped = RARITY_VARIANT_MAP[rarity as ItemRarity];
  if (!mapped) {
    logger.warn(`[InventoryMapper] Unknown item rarity '${rarity}', falling back to 'stone'.`);
    return "stone";
  }
  return mapped;
}

export function resolveRarityLabelKey(rarity: ItemRarity | string | null | undefined): string {
  if (!rarity) return "rarityCommon";
  const mapped = RARITY_LABEL_KEY_MAP[rarity as ItemRarity];
  if (!mapped) {
    logger.warn(`[InventoryMapper] Unknown item rarity '${rarity}', falling back to 'rarityCommon'.`);
    return "rarityCommon";
  }
  return mapped;
}

export function resolveItemTypeLabelKey(type: ItemType | string | null | undefined): string {
  if (!type) return "itemTypeWeapon";
  return ITEM_TYPE_LABEL_KEY_MAP[type as ItemType] ?? "itemTypeWeapon";
}

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

export function resolvePaperdollVM(equipment: EquipmentState | null | undefined): EquipmentPaperdollVM {
  const safeEquipment: Partial<EquipmentState> = equipment || {};
  const slots = DEFAULT_PAPERDOLL_CONFIG.map(({ slotKey, labelKey, placeholderIconName }) => ({
    ...resolveItemSlotVM(safeEquipment[slotKey] ?? null, labelKey, placeholderIconName),
    slotKey,
    labelKey,
    placeholderIconName,
  }));
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

export function resolveBackpackVM(
  backpack: readonly (Item | null)[] | (Item | null)[] | null | undefined,
  maxSlots: number = 16
): BackpackGridVM {
  const safeCapacity = Math.max(1, maxSlots);
  const slots: BackpackSlotVM[] = [];
  let occupiedCount = 0;
  for (let idx = 0; idx < safeCapacity; idx++) {
    const item = backpack?.[idx] ?? null;
    if (item) occupiedCount++;
    slots.push({ ...resolveItemSlotVM(item), slotIndex: idx });
  }
  return { slots, occupiedCount, totalCapacity: safeCapacity, isEmpty: occupiedCount === 0 };
}

export function resolveInventoryQuickBeltVM(
  quickPotions: readonly (Item | null)[] | (Item | null)[] | null | undefined,
  isP1: boolean = true
): InventoryQuickBeltVM {
  const slots: InventoryQuickBeltSlotVM[] = [];
  for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
    const item = quickPotions?.[slotIndex] ?? null;
    const keyLabel = isP1 ? String(slotIndex + 1) : String(slotIndex + 7);
    slots.push({
      ...resolveItemSlotVM(item),
      slotIndex,
      keyLabel,
      healHp: item?.healHp,
      healMana: item?.healMana,
      healStamina: item?.healStamina,
    });
  }
  return { slots, isP1 };
}

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
