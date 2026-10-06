/**
 * Item Bidirectional Codec
 * 
 * Translates between external items.json format and internal DomainItem models.
 * Adheres strictly to Zero-External-Dependency rules for src/lib.
 */

import { Result, ok, err, CodecError, ErrorCode } from "../errors";
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
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode Item: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
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
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode Item: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }

  public decodeDictionary(raw: unknown): Result<Record<string, DomainItem>, CodecError> {
    const valResult = validateItemsDictionary(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode Items dictionary: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const dict: Record<string, DomainItem> = {};
    for (const [key, itemJson] of Object.entries(valResult.data)) {
      const res = this.decode(itemJson);
      if (!res.isOk()) return err(res.error);
      dict[key] = res.value;
    }

    return ok(dict);
  }

  public encodeDictionary(domain: Record<string, DomainItem>): Result<Record<string, ItemJsonSchema>, CodecError> {
    const dict: Record<string, ItemJsonSchema> = {};
    for (const [key, item] of Object.entries(domain)) {
      const res = this.encode(item);
      if (!res.isOk()) return err(res.error);
      dict[key] = res.value;
    }

    const valResult = validateItemsDictionary(dict);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode Items dictionary: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }

  public decodeAll(raw: unknown): Result<DomainItem[], CodecError> {
    if (Array.isArray(raw)) {
      const valResult = validateItemsList(raw);
      if (!valResult.success) {
        const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
        return err(
          new CodecError(
            `Failed to decode Items list: ${messages}`,
            ErrorCode.CODEC_DECODE_FAILED,
            { details: { errors: valResult.errors } }
          )
        );
      }
      const list: DomainItem[] = [];
      for (const itemJson of valResult.data) {
        const res = this.decode(itemJson);
        if (!res.isOk()) return err(res.error);
        list.push(res.value);
      }
      return ok(list);
    }

    const dictRes = this.decodeDictionary(raw);
    if (!dictRes.isOk()) {
      return err(dictRes.error);
    }
    return ok(Object.values(dictRes.value));
  }

  public encodeAll(domain: DomainItem[]): Result<ItemJsonSchema[], CodecError> {
    const list: ItemJsonSchema[] = [];
    for (const item of domain) {
      const res = this.encode(item);
      if (!res.isOk()) return err(res.error);
      list.push(res.value);
    }

    const valResult = validateItemsList(list);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode Items list: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }
}

export const itemCodec = new ItemCodec();
