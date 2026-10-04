/**
 * Items Schema Contract & Validator
 * 
 * Formal contract for RPG equipment, weapons, armor, accessories, and consumables
 * matching src/data/items/items.json.
 * Adheres strictly to Zero-External-Dependency rules for src/lib.
 */

import {
  ValidationErrorDetail,
  ValidationResult,
  successResult,
  failureResult,
  validateNonEmptyString,
  validateNumber,
  validateOptionalNumber,
  validateEnum,
  validateArray,
  validateObject
} from "./commonSchema";

export const ITEM_TYPES = [
  "weapon",
  "shield",
  "helmet",
  "armor",
  "amulet",
  "necklace",
  "ring",
  "potion"
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_RARITIES = ["common", "uncommon", "rare", "legendary"] as const;
export type ItemRarity = (typeof ITEM_RARITIES)[number];

export interface ItemJsonSchema {
  id: string;
  nameKey: string;
  descriptionKey: string;
  type: ItemType;
  icon: string;
  rarity: ItemRarity;
  attackBonus?: number;
  defenseBonus?: number;
  maxHpBonus?: number;
  maxManaBonus?: number;
  maxStaminaBonus?: number;
  manaRegenBonus?: number;
  staminaRegenBonus?: number;
  speedBonus?: number;
  healHp?: number;
  healMana?: number;
  healStamina?: number;
  count?: number;
}

export function validateItem(raw: unknown, pathPrefix = ""): ValidationResult<ItemJsonSchema> {
  const errors: ValidationErrorDetail[] = [];
  const prefix = pathPrefix ? `${pathPrefix}.` : "";

  if (!validateObject(raw, pathPrefix || "item", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.id, `${prefix}id`, errors);
  validateNonEmptyString(raw.nameKey, `${prefix}nameKey`, errors);
  validateNonEmptyString(raw.descriptionKey, `${prefix}descriptionKey`, errors);
  validateEnum(raw.type, `${prefix}type`, ITEM_TYPES, errors);
  validateNonEmptyString(raw.icon, `${prefix}icon`, errors);
  validateEnum(raw.rarity, `${prefix}rarity`, ITEM_RARITIES, errors);

  validateOptionalNumber(raw.attackBonus, `${prefix}attackBonus`, errors);
  validateOptionalNumber(raw.defenseBonus, `${prefix}defenseBonus`, errors);
  validateOptionalNumber(raw.maxHpBonus, `${prefix}maxHpBonus`, errors);
  validateOptionalNumber(raw.maxManaBonus, `${prefix}maxManaBonus`, errors);
  validateOptionalNumber(raw.maxStaminaBonus, `${prefix}maxStaminaBonus`, errors);
  validateOptionalNumber(raw.manaRegenBonus, `${prefix}manaRegenBonus`, errors);
  validateOptionalNumber(raw.staminaRegenBonus, `${prefix}staminaRegenBonus`, errors);
  validateOptionalNumber(raw.speedBonus, `${prefix}speedBonus`, errors);

  validateOptionalNumber(raw.healHp, `${prefix}healHp`, errors, 0);
  validateOptionalNumber(raw.healMana, `${prefix}healMana`, errors, 0);
  validateOptionalNumber(raw.healStamina, `${prefix}healStamina`, errors, 0);
  validateOptionalNumber(raw.count, `${prefix}count`, errors, 1);

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(raw as unknown as ItemJsonSchema);
}

export function validateItemsDictionary(raw: unknown): ValidationResult<Record<string, ItemJsonSchema>> {
  const errors: ValidationErrorDetail[] = [];

  if (!validateObject(raw, "itemsDictionary", errors)) {
    return failureResult(errors);
  }

  const dictionary: Record<string, ItemJsonSchema> = {};

  for (const [key, value] of Object.entries(raw)) {
    const itemRes = validateItem(value, `items.${key}`);
    if (!itemRes.success) {
      errors.push(...itemRes.errors);
    } else {
      if (itemRes.data.id !== key) {
        errors.push({
          path: `items.${key}.id`,
          message: `Item dictionary key '${key}' does not match item id '${itemRes.data.id}'`,
          received: itemRes.data.id
        });
      }
      dictionary[key] = itemRes.data;
    }
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(dictionary);
}

export function validateItemsList(raw: unknown): ValidationResult<ItemJsonSchema[]> {
  const errors: ValidationErrorDetail[] = [];

  if (!validateArray(raw, "itemsList", errors)) {
    return failureResult(errors);
  }

  const items: ItemJsonSchema[] = [];
  const seenIds = new Set<string>();

  raw.forEach((item, index) => {
    const itemRes = validateItem(item, `itemsList[${index}]`);
    if (!itemRes.success) {
      errors.push(...itemRes.errors);
    } else {
      if (seenIds.has(itemRes.data.id)) {
        errors.push({
          path: `itemsList[${index}].id`,
          message: `Duplicate item id '${itemRes.data.id}' found in list`,
          received: itemRes.data.id
        });
      } else {
        seenIds.add(itemRes.data.id);
        items.push(itemRes.data);
      }
    }
  });

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(items);
}
