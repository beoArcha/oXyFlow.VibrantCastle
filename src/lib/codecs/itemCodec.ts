/**
 * Item Bidirectional Codec
 * 
 * Translates between external items.json format and internal DomainItem models.
 */

import { Result, ok, err, CodecError } from "../errors";
import {
  ItemJsonSchema,
  ItemType,
  ItemRarity,
  DamageType,
  ItemStatusEffectSchema,
  validateItem,
  validateItemsDictionary,
  validateItemsList
} from "../schemas";
import { Codec } from "./codecInterface";
import {
  failCodecDecode,
  failCodecEncode,
  transformArrayResult,
  transformDictionaryResult
} from "./codecUtils";

export interface DomainItem {
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

export class ItemCodec implements Codec<ItemJsonSchema, DomainItem> {
  public readonly name = "ItemCodec";

  public decode(raw: unknown): Result<DomainItem, CodecError> {
    const valResult = validateItem(raw);
    if (!valResult.success) {
      return failCodecDecode("Item", valResult.errors);
    }

    const d = valResult.data;
    const normalizedType = d.type === "necklace" ? "amulet" : d.type;
    const domain: DomainItem = {
      id: d.id,
      nameKey: d.nameKey,
      descriptionKey: d.descriptionKey,
      type: normalizedType as ItemType,
      icon: d.icon,
      rarity: d.rarity,
      damageType: d.damageType,
      attackBonus: d.attackBonus,
      defenseBonus: d.defenseBonus,
      maxHpBonus: d.maxHpBonus,
      maxManaBonus: d.maxManaBonus,
      maxStaminaBonus: d.maxStaminaBonus,
      manaRegenBonus: d.manaRegenBonus,
      staminaRegenBonus: d.staminaRegenBonus,
      speedBonus: d.speedBonus,
      healHp: d.healHp,
      healMana: d.healMana,
      healStamina: d.healStamina,
      count: d.count,
      effectsOnHit: d.effectsOnHit ? d.effectsOnHit.map((e) => ({ ...e })) : undefined,
      overTimeEffects: d.overTimeEffects ? d.overTimeEffects.map((e) => ({ ...e })) : undefined
    };

    return ok(domain);
  }

  public encode(domain: DomainItem): Result<ItemJsonSchema, CodecError> {
    const json: ItemJsonSchema = {
      id: domain.id,
      nameKey: domain.nameKey,
      descriptionKey: domain.descriptionKey,
      type: domain.type,
      icon: domain.icon,
      rarity: domain.rarity,
      damageType: domain.damageType,
      attackBonus: domain.attackBonus,
      defenseBonus: domain.defenseBonus,
      maxHpBonus: domain.maxHpBonus,
      maxManaBonus: domain.maxManaBonus,
      maxStaminaBonus: domain.maxStaminaBonus,
      manaRegenBonus: domain.manaRegenBonus,
      staminaRegenBonus: domain.staminaRegenBonus,
      speedBonus: domain.speedBonus,
      healHp: domain.healHp,
      healMana: domain.healMana,
      healStamina: domain.healStamina,
      count: domain.count,
      effectsOnHit: domain.effectsOnHit ? domain.effectsOnHit.map((e) => ({ ...e })) : undefined,
      overTimeEffects: domain.overTimeEffects ? domain.overTimeEffects.map((e) => ({ ...e })) : undefined
    };

    const valResult = validateItem(json);
    if (!valResult.success) {
      return failCodecEncode("Item", valResult.errors);
    }

    return ok(valResult.data);
  }

  public decodeDictionary(raw: unknown): Result<Record<string, DomainItem>, CodecError> {
    const valResult = validateItemsDictionary(raw);
    if (!valResult.success) {
      return failCodecDecode("Items dictionary", valResult.errors);
    }

    return transformDictionaryResult(valResult.data, (itemJson) => this.decode(itemJson));
  }

  public encodeDictionary(domain: Record<string, DomainItem>): Result<Record<string, ItemJsonSchema>, CodecError> {
    const dictRes = transformDictionaryResult(domain, (item) => this.encode(item));
    if (!dictRes.isOk()) return err(dictRes.error);

    const valResult = validateItemsDictionary(dictRes.value);
    if (!valResult.success) {
      return failCodecEncode("Items dictionary", valResult.errors);
    }

    return ok(valResult.data);
  }

  public decodeAll(raw: unknown): Result<DomainItem[], CodecError> {
    if (Array.isArray(raw)) {
      const valResult = validateItemsList(raw);
      if (!valResult.success) {
        return failCodecDecode("Items list", valResult.errors);
      }
      return transformArrayResult(valResult.data, (itemJson) => this.decode(itemJson));
    }

    const dictRes = this.decodeDictionary(raw);
    if (!dictRes.isOk()) {
      return err(dictRes.error);
    }
    return ok(Object.values(dictRes.value));
  }

  public encodeAll(domain: DomainItem[]): Result<ItemJsonSchema[], CodecError> {
    const listRes = transformArrayResult(domain, (item) => this.encode(item));
    if (!listRes.isOk()) return err(listRes.error);

    const valResult = validateItemsList(listRes.value);
    if (!valResult.success) {
      return failCodecEncode("Items list", valResult.errors);
    }

    return ok(valResult.data);
  }
}

export const itemCodec = new ItemCodec();
