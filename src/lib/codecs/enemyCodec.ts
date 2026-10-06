/**
 * Enemy Bidirectional Codec
 * 
 * Translates between external enemies.json format and internal DomainEnemyTemplate models.
 * Adheres strictly to Zero-External-Dependency rules for src/lib.
 */

import { Result, ok, err, CodecError, ErrorCode } from "../errors";
import {
  EnemyJsonSchema,
  EnemiesDocumentJsonSchema,
  EnemyStatsSchema,
  EnemyAtlasSchema,
  EnemyProceduralFallbackSchema,
  EnemySoulDropSchema,
  EnemyBestiaryConfigSchema,
  validateEnemy,
  validateEnemiesDocument,
  validateEnemiesJson
} from "../schemas";
import { Codec } from "./codecInterface";

export interface DomainEnemyTemplate {
  id: string;
  nameKey: string;
  defaultName: string;
  category: string;
  isDummy: boolean;
  isAerial: boolean;
  dimensions: {
    width: number;
    height: number;
  };
  stats: EnemyStatsSchema;
  abilities?: string[];
  soulDrop?: EnemySoulDropSchema;
  elementalResistances?: Record<string, number>;
  bestiary?: EnemyBestiaryConfigSchema;
  atlas?: EnemyAtlasSchema;
  proceduralFallback?: EnemyProceduralFallbackSchema;
}

export class EnemyCodec implements Codec<EnemyJsonSchema, DomainEnemyTemplate> {
  public readonly name = "EnemyCodec";

  public decode(raw: unknown): Result<DomainEnemyTemplate, CodecError> {
    const valResult = validateEnemy(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode Enemy: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const d = valResult.data;
    const domain: DomainEnemyTemplate = {
      id: d.id,
      nameKey: d.nameKey,
      defaultName: d.defaultName,
      category: d.category,
      isDummy: d.isDummy,
      isAerial: d.isAerial,
      dimensions: {
        width: d.dimensions.width,
        height: d.dimensions.height
      },
      stats: { ...d.stats },
      abilities: d.abilities ? [...d.abilities] : undefined,
      soulDrop: d.soulDrop ? { ...d.soulDrop, i18n: { ...d.soulDrop.i18n } } : undefined,
      elementalResistances: d.elementalResistances ? { ...d.elementalResistances } : undefined,
      bestiary: d.bestiary ? { ...d.bestiary } : undefined,
      atlas: d.atlas ? { ...d.atlas } : undefined,
      proceduralFallback: d.proceduralFallback ? { ...d.proceduralFallback } : undefined
    };

    return ok(domain);
  }

  public encode(domain: DomainEnemyTemplate): Result<EnemyJsonSchema, CodecError> {
    const json: EnemyJsonSchema = {
      id: domain.id,
      nameKey: domain.nameKey,
      defaultName: domain.defaultName,
      category: domain.category,
      isDummy: domain.isDummy,
      isAerial: domain.isAerial,
      dimensions: {
        width: domain.dimensions.width,
        height: domain.dimensions.height
      },
      stats: { ...domain.stats },
      abilities: domain.abilities ? [...domain.abilities] : undefined,
      soulDrop: domain.soulDrop ? { ...domain.soulDrop, i18n: { ...domain.soulDrop.i18n } } : undefined,
      elementalResistances: domain.elementalResistances ? { ...domain.elementalResistances } : undefined,
      bestiary: domain.bestiary ? { ...domain.bestiary } : undefined,
      atlas: domain.atlas ? { ...domain.atlas } : undefined,
      proceduralFallback: domain.proceduralFallback ? { ...domain.proceduralFallback } : undefined
    };

    const valResult = validateEnemy(json);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode Enemy: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }

  public decodeDictionary(raw: unknown): Result<Record<string, DomainEnemyTemplate>, CodecError> {
    const valResult = validateEnemiesJson(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode Enemies dictionary: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const dict: Record<string, DomainEnemyTemplate> = {};
    for (const enemyJson of valResult.data) {
      const res = this.decode(enemyJson);
      if (!res.isOk()) return err(res.error);
      dict[res.value.id] = res.value;
    }

    return ok(dict);
  }

  public encodeDictionary(domain: Record<string, DomainEnemyTemplate>): Result<EnemiesDocumentJsonSchema, CodecError> {
    const enemiesMap: Record<string, EnemyJsonSchema> = {};
    for (const [id, enemy] of Object.entries(domain)) {
      const res = this.encode(enemy);
      if (!res.isOk()) return err(res.error);
      enemiesMap[id] = res.value;
    }

    const doc: EnemiesDocumentJsonSchema = {
      version: "1.0",
      enemies: enemiesMap
    };

    const valResult = validateEnemiesDocument(doc);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode EnemiesDocument: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }

  public decodeAll(raw: unknown): Result<DomainEnemyTemplate[], CodecError> {
    const dictRes = this.decodeDictionary(raw);
    if (!dictRes.isOk()) {
      return err(dictRes.error);
    }
    return ok(Object.values(dictRes.value));
  }

  public encodeAll(domain: DomainEnemyTemplate[]): Result<EnemyJsonSchema[], CodecError> {
    const list: EnemyJsonSchema[] = [];
    for (const enemy of domain) {
      const res = this.encode(enemy);
      if (!res.isOk()) return err(res.error);
      list.push(res.value);
    }
    return ok(list);
  }
}

export const enemyCodec = new EnemyCodec();
