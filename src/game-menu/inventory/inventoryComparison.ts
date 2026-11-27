import { ItemType, type Item, type EquipmentState } from "@game/types";
import type {
  EquipmentSlotKey,
  ItemComparisonVM,
  StatComparisonDeltaVM,
  StatModifierType,
  StatModifierVM,
} from "./types";

const ITEM_TYPE_TO_SLOT_MAP: Partial<Record<ItemType, EquipmentSlotKey>> = {
  [ItemType.Weapon]: "mainHand",
  [ItemType.Shield]: "offHand",
  [ItemType.Helmet]: "helmet",
  [ItemType.Armor]: "armor",
  [ItemType.Amulet]: "amulet",
  [ItemType.Ring]: "ring",
};

const SLOT_LABEL_KEY_MAP: Record<EquipmentSlotKey, string> = {
  amulet: "amulet",
  helmet: "helmet",
  ring: "ring",
  mainHand: "mainHand",
  offHand: "offHand",
  armor: "armor",
};

type NumericItemStatField =
  | "attackBonus"
  | "defenseBonus"
  | "maxHpBonus"
  | "maxManaBonus"
  | "maxStaminaBonus"
  | "healHp"
  | "healMana"
  | "healStamina"
  | "manaRegenBonus"
  | "staminaRegenBonus";

const STAT_MODIFIER_SPECS: readonly {
  readonly field: NumericItemStatField;
  readonly type: StatModifierType;
  readonly labelKey: string;
  readonly iconName: string;
  readonly textColorClass: string;
  readonly comparable: boolean;
}[] = [
  { field: "attackBonus", type: "attack", labelKey: "itemAttackBonus", iconName: "Sword", textColorClass: "text-amber-300", comparable: true },
  { field: "defenseBonus", type: "defense", labelKey: "itemDefenseBonus", iconName: "Shield", textColorClass: "text-red-300", comparable: true },
  { field: "maxHpBonus", type: "hp", labelKey: "itemHpBonus", iconName: "Heart", textColorClass: "text-rose-300", comparable: true },
  { field: "maxManaBonus", type: "mana", labelKey: "itemManaBonus", iconName: "Zap", textColorClass: "text-cyan-300", comparable: true },
  { field: "maxStaminaBonus", type: "stamina", labelKey: "itemStaminaBonus", iconName: "Zap", textColorClass: "text-amber-200", comparable: true },
  { field: "manaRegenBonus", type: "manaRegen", labelKey: "manaRegen", iconName: "Zap", textColorClass: "text-cyan-300", comparable: true },
  { field: "staminaRegenBonus", type: "staminaRegen", labelKey: "staminaRegen", iconName: "Zap", textColorClass: "text-amber-200", comparable: true },
  { field: "healHp", type: "healHp", labelKey: "itemHealHp", iconName: "Heart", textColorClass: "text-rose-300", comparable: false },
  { field: "healMana", type: "healMana", labelKey: "itemHealMana", iconName: "Zap", textColorClass: "text-cyan-300", comparable: false },
  { field: "healStamina", type: "healStamina", labelKey: "itemHealStamina", iconName: "Zap", textColorClass: "text-amber-200", comparable: false },
];

/**
 * Maps an item type to its target equipment slot, or null for consumables.
 */
export function resolveEquipmentSlotForItemType(type: ItemType): EquipmentSlotKey | null {
  return ITEM_TYPE_TO_SLOT_MAP[type] ?? null;
}

export function resolveStatModifiersVM(item: Item | null | undefined): StatModifierVM[] {
  if (!item) return [];
  const modifiers: StatModifierVM[] = [];
  for (const spec of STAT_MODIFIER_SPECS) {
    const value = item[spec.field];
    if (value !== undefined && value > 0) {
      modifiers.push({
        type: spec.type,
        labelKey: spec.labelKey,
        value,
        formattedValue: `+${value}`,
        iconName: spec.iconName,
        textColorClass: spec.textColorClass,
      });
    }
  }
  return modifiers;
}

/**
 * Computes signed stat deltas comparing a candidate backpack item against
 * whatever is currently equipped in the matching equipment slot.
 */
export function resolveItemStatComparison(
  candidate: Item | null | undefined,
  equipment: EquipmentState | null | undefined
): ItemComparisonVM | null {
  if (!candidate) return null;
  const targetSlot = resolveEquipmentSlotForItemType(candidate.type);
  if (!targetSlot) return null;

  const equipped = equipment?.[targetSlot] ?? null;
  const deltas: StatComparisonDeltaVM[] = [];

  for (const spec of STAT_MODIFIER_SPECS) {
    if (!spec.comparable) continue;
    const candidateValue = candidate[spec.field] ?? 0;
    const equippedValue = equipped?.[spec.field] ?? 0;
    if (candidateValue === 0 && equippedValue === 0) continue;

    const delta = Math.round((candidateValue - equippedValue) * 100) / 100;
    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "neutral";
    const formattedDelta = delta > 0 ? `+${delta}` : String(delta);
    const textColorClass =
      direction === "up" ? "text-emerald-400" : direction === "down" ? "text-rose-400" : "text-stone-400";

    deltas.push({
      type: spec.type,
      labelKey: spec.labelKey,
      iconName: spec.iconName,
      candidateValue,
      equippedValue,
      delta,
      formattedDelta,
      direction,
      textColorClass,
    });
  }

  return {
    targetSlot,
    targetSlotLabelKey: SLOT_LABEL_KEY_MAP[targetSlot],
    equippedItemNameKey: equipped?.nameKey ?? null,
    deltas,
  };
}
