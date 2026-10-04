/**
 * Skill Bidirectional Codec
 * 
 * Translates between external skills.json format (and SkillsDictionaryJsonSchema)
 * and internal DomainSkillNode models.
 * Adheres strictly to Zero-External-Dependency rules for src/lib.
 */

import { Result, ok, err, CodecError, ErrorCode } from "../errors";
import {
  SkillNodeJsonSchema,
  SkillsDictionaryJsonSchema,
  validateSkillNode,
  validateSkillsDictionary,
  SkillCharacter,
  SkillCategory,
  SkillTriggerType
} from "../schemas";
import { Codec } from "./codecInterface";

export interface DomainSkillNode {
  id: string;
  character: SkillCharacter;
  nameKey: string;
  descKey: string;
  restrictionKey?: string;
  tier: number;
  pointCost: number;
  unlocked: boolean;
  icon: string;
  category: SkillCategory;
  triggerType: SkillTriggerType;
  manaCost: number;
  staminaCost: number;
  cooldownFrames: number;
  damage: number;
  color: string;
  reqSkillId: string | null;
  minLevel: number;
  gridX: number;
  gridY: number;
  projectileSpeed?: number;
  shieldDurationFrames?: number;
  autoIntervalFrames?: number;
}

export interface DomainSkillsByCharacter {
  valen: DomainSkillNode[];
  aurelia: DomainSkillNode[];
}

export class SkillCodec implements Codec<SkillNodeJsonSchema, DomainSkillNode> {
  public readonly name = "SkillCodec";

  public decode(raw: unknown): Result<DomainSkillNode, CodecError> {
    const valResult = validateSkillNode(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode SkillNode: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const data = valResult.data;
    const domain: DomainSkillNode = {
      id: data.id,
      character: data.character,
      nameKey: data.nameKey,
      descKey: data.descKey,
      restrictionKey: data.restrictionKey,
      tier: data.tier,
      pointCost: data.pointCost,
      unlocked: data.unlocked,
      icon: data.icon,
      category: data.category,
      triggerType: data.triggerType,
      manaCost: data.manaCost,
      staminaCost: data.staminaCost,
      cooldownFrames: data.cooldownFrames,
      damage: data.damage,
      color: data.color,
      reqSkillId: data.reqSkillId,
      minLevel: data.minLevel,
      gridX: data.gridX,
      gridY: data.gridY,
      projectileSpeed: data.projectileSpeed,
      shieldDurationFrames: data.shieldDurationFrames,
      autoIntervalFrames: data.autoIntervalFrames
    };

    return ok(domain);
  }

  public encode(domain: DomainSkillNode): Result<SkillNodeJsonSchema, CodecError> {
    const json: SkillNodeJsonSchema = {
      id: domain.id,
      character: domain.character,
      nameKey: domain.nameKey,
      descKey: domain.descKey,
      restrictionKey: domain.restrictionKey,
      tier: domain.tier,
      pointCost: domain.pointCost,
      unlocked: domain.unlocked,
      icon: domain.icon,
      category: domain.category,
      triggerType: domain.triggerType,
      manaCost: domain.manaCost,
      staminaCost: domain.staminaCost,
      cooldownFrames: domain.cooldownFrames,
      damage: domain.damage,
      color: domain.color,
      reqSkillId: domain.reqSkillId,
      minLevel: domain.minLevel,
      gridX: domain.gridX,
      gridY: domain.gridY,
      projectileSpeed: domain.projectileSpeed,
      shieldDurationFrames: domain.shieldDurationFrames,
      autoIntervalFrames: domain.autoIntervalFrames
    };

    const valResult = validateSkillNode(json);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode SkillNode: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }

  public decodeDictionary(raw: unknown): Result<DomainSkillsByCharacter, CodecError> {
    const valResult = validateSkillsDictionary(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode Skills dictionary: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const valenDecoded: DomainSkillNode[] = [];
    for (const node of valResult.data.valen) {
      const res = this.decode(node);
      if (!res.isOk()) return err(res.error);
      valenDecoded.push(res.value);
    }

    const aureliaDecoded: DomainSkillNode[] = [];
    for (const node of valResult.data.aurelia) {
      const res = this.decode(node);
      if (!res.isOk()) return err(res.error);
      aureliaDecoded.push(res.value);
    }

    return ok({
      valen: valenDecoded,
      aurelia: aureliaDecoded
    });
  }

  public encodeDictionary(domain: DomainSkillsByCharacter): Result<SkillsDictionaryJsonSchema, CodecError> {
    const valenEncoded: SkillNodeJsonSchema[] = [];
    for (const node of domain.valen) {
      const res = this.encode(node);
      if (!res.isOk()) return err(res.error);
      valenEncoded.push(res.value);
    }

    const aureliaEncoded: SkillNodeJsonSchema[] = [];
    for (const node of domain.aurelia) {
      const res = this.encode(node);
      if (!res.isOk()) return err(res.error);
      aureliaEncoded.push(res.value);
    }

    const dict: SkillsDictionaryJsonSchema = {
      valen: valenEncoded,
      aurelia: aureliaEncoded
    };

    const valResult = validateSkillsDictionary(dict);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode Skills dictionary: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }

  public decodeAll(raw: unknown): Result<DomainSkillNode[], CodecError> {
    const dictRes = this.decodeDictionary(raw);
    if (!dictRes.isOk()) {
      return err(dictRes.error);
    }
    return ok([...dictRes.value.valen, ...dictRes.value.aurelia]);
  }
}

export const skillCodec = new SkillCodec();
