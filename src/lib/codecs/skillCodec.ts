/**
 * Skill Bidirectional Codec
 * 
 * Translates between external skills.json format (and SkillsDictionaryJsonSchema)
 * and internal DomainSkillNode models.
 */

import { Result, ok, err, CodecError } from "../errors";
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
import { failCodecDecode, failCodecEncode, transformArrayResult } from "./codecUtils";

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
      return failCodecDecode("SkillNode", valResult.errors);
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
      return failCodecEncode("SkillNode", valResult.errors);
    }

    return ok(valResult.data);
  }

  public decodeDictionary(raw: unknown): Result<DomainSkillsByCharacter, CodecError> {
    const valResult = validateSkillsDictionary(raw);
    if (!valResult.success) {
      return failCodecDecode("Skills dictionary", valResult.errors);
    }

    const valenDecoded = transformArrayResult(valResult.data.valen, (node) => this.decode(node));
    if (!valenDecoded.isOk()) return err(valenDecoded.error);

    const aureliaDecoded = transformArrayResult(valResult.data.aurelia, (node) => this.decode(node));
    if (!aureliaDecoded.isOk()) return err(aureliaDecoded.error);

    return ok({
      valen: valenDecoded.value,
      aurelia: aureliaDecoded.value
    });
  }

  public encodeDictionary(domain: DomainSkillsByCharacter): Result<SkillsDictionaryJsonSchema, CodecError> {
    const valenEncoded = transformArrayResult(domain.valen, (node) => this.encode(node));
    if (!valenEncoded.isOk()) return err(valenEncoded.error);

    const aureliaEncoded = transformArrayResult(domain.aurelia, (node) => this.encode(node));
    if (!aureliaEncoded.isOk()) return err(aureliaEncoded.error);

    const dict: SkillsDictionaryJsonSchema = {
      valen: valenEncoded.value,
      aurelia: aureliaEncoded.value
    };

    const valResult = validateSkillsDictionary(dict);
    if (!valResult.success) {
      return failCodecEncode("Skills dictionary", valResult.errors);
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
