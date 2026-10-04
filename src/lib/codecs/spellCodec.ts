/**
 * Spell Bidirectional Codec
 * 
 * Translates between external spells.json format (and SpellsDocumentJsonSchema)
 * and internal DomainSpell models.
 * Adheres strictly to Zero-External-Dependency rules for src/lib.
 */

import { Result, ok, err, CodecError, ErrorCode } from "../errors";
import {
  SpellJsonSchema,
  SpellsDocumentJsonSchema,
  validateSpell,
  validateSpellsJson,
  validateSpellsDocument,
  MagicDomain,
  SpellCastType,
  SpellCategory,
  SpellTriggerType,
  DamageBreakdownSchema,
  ProjectileConfigSchema,
  SpellStatusEffectSchema,
  CharacterId
} from "../schemas";
import { Codec } from "./codecInterface";

export interface DomainSpell {
  id: string;
  magicDomain: MagicDomain;
  castType: SpellCastType;
  category: SpellCategory;
  triggerType: SpellTriggerType;
  nameKey: string;
  descriptionKey: string;
  manaCost: number;
  staminaCost: number;
  cooldownFrames: number;
  damage: number;
  color: string;
  iconName: string;
  character?: CharacterId;
  restrictionKey?: string;
  tier?: number;
  minLevel?: number;
  projectileSpeed?: number;
  shieldDurationFrames?: number;
  healAmount?: number;
  autoIntervalFrames?: number;
  damageBreakdown?: DamageBreakdownSchema;
  projectileConfig?: ProjectileConfigSchema;
  statusEffects?: SpellStatusEffectSchema[];
  statusEffectsOnHit?: SpellStatusEffectSchema[];
}

export class SpellCodec implements Codec<SpellJsonSchema, DomainSpell> {
  public readonly name = "SpellCodec";

  public decode(raw: unknown): Result<DomainSpell, CodecError> {
    const valResult = validateSpell(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode Spell: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const data = valResult.data;
    const domain: DomainSpell = {
      id: data.id,
      magicDomain: data.magicDomain,
      castType: data.castType,
      category: data.category,
      triggerType: data.triggerType,
      nameKey: data.nameKey,
      descriptionKey: data.descriptionKey,
      manaCost: data.manaCost,
      staminaCost: data.staminaCost,
      cooldownFrames: data.cooldownFrames,
      damage: data.damage,
      color: data.color,
      iconName: data.iconName || data.icon || "Zap",
      character: data.character,
      restrictionKey: data.restrictionKey,
      tier: data.tier,
      minLevel: data.minLevel,
      projectileSpeed: data.projectileSpeed,
      shieldDurationFrames: data.shieldDurationFrames,
      healAmount: data.healAmount,
      autoIntervalFrames: data.autoIntervalFrames,
      damageBreakdown: data.damageBreakdown,
      projectileConfig: data.projectileConfig,
      statusEffects: data.statusEffects,
      statusEffectsOnHit: data.statusEffectsOnHit
    };

    return ok(domain);
  }

  public encode(domain: DomainSpell): Result<SpellJsonSchema, CodecError> {
    const json: SpellJsonSchema = {
      id: domain.id,
      magicDomain: domain.magicDomain,
      castType: domain.castType,
      category: domain.category,
      triggerType: domain.triggerType,
      nameKey: domain.nameKey,
      descriptionKey: domain.descriptionKey,
      manaCost: domain.manaCost,
      staminaCost: domain.staminaCost,
      cooldownFrames: domain.cooldownFrames,
      damage: domain.damage,
      color: domain.color,
      iconName: domain.iconName,
      character: domain.character,
      restrictionKey: domain.restrictionKey,
      tier: domain.tier,
      minLevel: domain.minLevel,
      projectileSpeed: domain.projectileSpeed,
      shieldDurationFrames: domain.shieldDurationFrames,
      healAmount: domain.healAmount,
      autoIntervalFrames: domain.autoIntervalFrames,
      damageBreakdown: domain.damageBreakdown,
      projectileConfig: domain.projectileConfig,
      statusEffects: domain.statusEffects,
      statusEffectsOnHit: domain.statusEffectsOnHit
    };

    const valResult = validateSpell(json);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode Spell: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }

  public decodeDictionary(raw: unknown): Result<Record<string, DomainSpell>, CodecError> {
    const valResult = validateSpellsJson(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode Spells dictionary: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const dict: Record<string, DomainSpell> = {};
    for (const spellJson of valResult.data) {
      const decoded = this.decode(spellJson);
      if (!decoded.isOk()) {
        return err(decoded.error);
      }
      dict[decoded.value.id] = decoded.value;
    }

    return ok(dict);
  }

  public encodeDictionary(domain: Record<string, DomainSpell>): Result<SpellsDocumentJsonSchema, CodecError> {
    const spellsJson: Record<string, SpellJsonSchema> = {};

    for (const [id, spell] of Object.entries(domain)) {
      const encoded = this.encode(spell);
      if (!encoded.isOk()) {
        return err(encoded.error);
      }
      spellsJson[id] = encoded.value;
    }

    const doc: SpellsDocumentJsonSchema = {
      version: "2.0",
      spells: spellsJson
    };

    const valResult = validateSpellsDocument(doc);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode SpellsDocument: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }

  public decodeAll(raw: unknown): Result<DomainSpell[], CodecError> {
    const dictResult = this.decodeDictionary(raw);
    if (!dictResult.isOk()) {
      return err(dictResult.error);
    }
    return ok(Object.values(dictResult.value));
  }

  public encodeAll(domain: DomainSpell[]): Result<SpellJsonSchema[], CodecError> {
    const encodedList: SpellJsonSchema[] = [];
    for (const spell of domain) {
      const encoded = this.encode(spell);
      if (!encoded.isOk()) {
        return err(encoded.error);
      }
      encodedList.push(encoded.value);
    }
    return ok(encodedList);
  }
}

export const spellCodec = new SpellCodec();
