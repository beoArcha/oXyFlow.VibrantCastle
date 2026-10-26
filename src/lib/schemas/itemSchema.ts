/**
 * Items Schema Contract & Validator
 * 
 * Formal contract for RPG equipment, weapons, armor, accessories, and consumables
 */

import {
  ValidationErrorDetail,
  ValidationResult,
  failureResult,
  successResult,
  validateNonEmptyString,
  validateNumber,
  validateOptionalNumber,
  validateEnum,
  validateArray,
  validateObject
} from "./commonSchema";
import { validateDictionary, validateList } from "./collectionValidation";
import { DamageType, DAMAGE_TYPES } from "./spellsSchema";

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

export const STATUS_EFFECT_TYPES = ["dot", "hot", "buff", "debuff"] as const;
export type StatusEffectType = (typeof STATUS_EFFECT_TYPES)[number];

export interface ItemStatusEffectSchema {
  type: StatusEffectType;
  effectId: string;
  damageType?: DamageType;
  durationSeconds: number;
  tickRateSeconds?: number;
  damagePerTick?: number;
  healPerTick?: number;
}

export interface ItemJsonSchema {
  id: string;
  nameKey: string;
  descriptionKey: string;
  type: ItemType;
  icon: string;
  rarity: ItemRarity;
  damageType?: DamageType;
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
  effectsOnHit?: ItemStatusEffectSchema[];
  overTimeEffects?: ItemStatusEffectSchema[];
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

  if (raw.damageType !== undefined && raw.damageType !== null) {
    validateEnum(raw.damageType, `${prefix}damageType`, DAMAGE_TYPES, errors);
  }

  const validateStatusEffects = (list: unknown, fieldName: string) => {
    if (list !== undefined && list !== null) {
      if (validateArray(list, `${prefix}${fieldName}`, errors)) {
        list.forEach((eff, idx) => {
          const ePath = `${prefix}${fieldName}[${idx}]`;
          if (validateObject(eff, ePath, errors)) {
            validateEnum(eff.type, `${ePath}.type`, STATUS_EFFECT_TYPES, errors);
            validateNonEmptyString(eff.effectId, `${ePath}.effectId`, errors);
            if (eff.damageType !== undefined && eff.damageType !== null) {
              validateEnum(eff.damageType, `${ePath}.damageType`, DAMAGE_TYPES, errors);
            }
            validateNumber(eff.durationSeconds, `${ePath}.durationSeconds`, errors, 0);
            validateOptionalNumber(eff.tickRateSeconds, `${ePath}.tickRateSeconds`, errors, 0);
            validateOptionalNumber(eff.damagePerTick, `${ePath}.damagePerTick`, errors, 0);
            validateOptionalNumber(eff.healPerTick, `${ePath}.healPerTick`, errors, 0);
          }
        });
      }
    }
  };

  validateStatusEffects(raw.effectsOnHit, "effectsOnHit");
  validateStatusEffects(raw.overTimeEffects, "overTimeEffects");

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

  const dictionary = validateDictionary(
    raw,
    "items",
    errors,
    validateItem,
    (item) => item.id
  );

  if (!dictionary || errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(dictionary);
}

export function validateItemsList(raw: unknown): ValidationResult<ItemJsonSchema[]> {
  const errors: ValidationErrorDetail[] = [];

  const items = validateList(
    raw,
    "itemsList",
    errors,
    validateItem,
    {
      getId: (item) => item.id,
      duplicateErrorMessage: (id) => `Duplicate item id '${id}' found in list`
    }
  );

  if (!items || errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(items);
}
