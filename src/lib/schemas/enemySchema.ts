/**
 * Enemies Schema Contract & Validator
 * 
 * Formal contract for enemy templates, combat stats, atlas bindings and fallbacks
 * matching src/data/enemies/enemies.json.
 * Adheres strictly to Zero-External-Dependency rules for src/lib.
 */

import {
  ValidationErrorDetail,
  ValidationResult,
  successResult,
  failureResult,
  validateNonEmptyString,
  validateOptionalString,
  validateNumber,
  validateOptionalNumber,
  validateBoolean,
  validateEnum,
  validateArray,
  validateObject
} from "./commonSchema";

export const SOUL_TYPES = ["bullet", "guardian", "enchant"] as const;
export type SoulType = (typeof SOUL_TYPES)[number];

export interface EnemySoulDropSchema {
  soulId: string;
  type: SoulType;
  dropRate: number;
  grantedSkillId: string;
  manaCost?: number;
  icon: string;
  i18n: {
    nameKey: string;
    descriptionKey: string;
  };
}

export interface EnemyBestiaryConfigSchema {
  bestiaryKey: string;
  tacticsKey: string;
  loreQuoteKey: string;
  killThresholds?: {
    basic?: number;
    tactics?: number;
    lore?: number;
  };
}

export interface EnemyStatsSchema {
  health: number;
  maxHealth: number;
  speed: number;
  attackPower: number;
  scoreReward: number;
  defense?: number;
  xpReward?: number;
}

export interface EnemyAtlasSchema {
  presetId: string;
  defaultAnimation: string;
  hitAnimation?: string;
  attackAnimation?: string;
  deathAnimation?: string;
}

export interface EnemyProceduralFallbackSchema {
  bodyColor: string;
  accentColor?: string;
  eyesColor?: string;
}

export interface EnemyJsonSchema {
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

export interface EnemiesDocumentJsonSchema {
  version: string;
  enemies: Record<string, EnemyJsonSchema>;
}

export function validateEnemy(raw: unknown, pathPrefix = ""): ValidationResult<EnemyJsonSchema> {
  const errors: ValidationErrorDetail[] = [];
  const prefix = pathPrefix ? `${pathPrefix}.` : "";

  if (!validateObject(raw, pathPrefix || "enemy", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.id, `${prefix}id`, errors);
  validateNonEmptyString(raw.nameKey, `${prefix}nameKey`, errors);
  validateNonEmptyString(raw.defaultName, `${prefix}defaultName`, errors);
  validateNonEmptyString(raw.category, `${prefix}category`, errors);
  validateBoolean(raw.isDummy, `${prefix}isDummy`, errors);
  validateBoolean(raw.isAerial, `${prefix}isAerial`, errors);

  if (validateObject(raw.dimensions, `${prefix}dimensions`, errors)) {
    validateNumber(raw.dimensions.width, `${prefix}dimensions.width`, errors, 1);
    validateNumber(raw.dimensions.height, `${prefix}dimensions.height`, errors, 1);
  }

  if (validateObject(raw.stats, `${prefix}stats`, errors)) {
    validateNumber(raw.stats.health, `${prefix}stats.health`, errors, 1);
    validateNumber(raw.stats.maxHealth, `${prefix}stats.maxHealth`, errors, 1);
    validateNumber(raw.stats.speed, `${prefix}stats.speed`, errors, 0);
    validateNumber(raw.stats.attackPower, `${prefix}stats.attackPower`, errors, 0);
    validateNumber(raw.stats.scoreReward, `${prefix}stats.scoreReward`, errors, 0);
    validateOptionalNumber(raw.stats.defense, `${prefix}stats.defense`, errors, 0);
    validateOptionalNumber(raw.stats.xpReward, `${prefix}stats.xpReward`, errors, 0);
  }

  if (raw.atlas !== undefined && raw.atlas !== null) {
    if (validateObject(raw.atlas, `${prefix}atlas`, errors)) {
      validateNonEmptyString(raw.atlas.presetId, `${prefix}atlas.presetId`, errors);
      validateNonEmptyString(raw.atlas.defaultAnimation, `${prefix}atlas.defaultAnimation`, errors);
      validateOptionalString(raw.atlas.hitAnimation, `${prefix}atlas.hitAnimation`, errors);
      validateOptionalString(raw.atlas.attackAnimation, `${prefix}atlas.attackAnimation`, errors);
      validateOptionalString(raw.atlas.deathAnimation, `${prefix}atlas.deathAnimation`, errors);
    }
  }

  if (raw.abilities !== undefined && raw.abilities !== null) {
    if (validateArray(raw.abilities, `${prefix}abilities`, errors)) {
      raw.abilities.forEach((ab, idx) => {
        validateNonEmptyString(ab, `${prefix}abilities[${idx}]`, errors);
      });
    }
  }

  if (raw.soulDrop !== undefined && raw.soulDrop !== null) {
    const sPath = `${prefix}soulDrop`;
    if (validateObject(raw.soulDrop, sPath, errors)) {
      validateNonEmptyString(raw.soulDrop.soulId, `${sPath}.soulId`, errors);
      validateEnum(raw.soulDrop.type, `${sPath}.type`, SOUL_TYPES, errors);
      validateNumber(raw.soulDrop.dropRate, `${sPath}.dropRate`, errors, 0, 1);
      validateNonEmptyString(raw.soulDrop.grantedSkillId, `${sPath}.grantedSkillId`, errors);
      validateOptionalNumber(raw.soulDrop.manaCost, `${sPath}.manaCost`, errors, 0);
      validateNonEmptyString(raw.soulDrop.icon, `${sPath}.icon`, errors);
      if (validateObject(raw.soulDrop.i18n, `${sPath}.i18n`, errors)) {
        validateNonEmptyString(raw.soulDrop.i18n.nameKey, `${sPath}.i18n.nameKey`, errors);
        validateNonEmptyString(raw.soulDrop.i18n.descriptionKey, `${sPath}.i18n.descriptionKey`, errors);
      }
    }
  }

  if (raw.elementalResistances !== undefined && raw.elementalResistances !== null) {
    const rPath = `${prefix}elementalResistances`;
    if (validateObject(raw.elementalResistances, rPath, errors)) {
      for (const [resKey, resVal] of Object.entries(raw.elementalResistances)) {
        validateNumber(resVal, `${rPath}.${resKey}`, errors);
      }
    }
  }

  if (raw.bestiary !== undefined && raw.bestiary !== null) {
    const bPath = `${prefix}bestiary`;
    if (validateObject(raw.bestiary, bPath, errors)) {
      validateNonEmptyString(raw.bestiary.bestiaryKey, `${bPath}.bestiaryKey`, errors);
      validateNonEmptyString(raw.bestiary.tacticsKey, `${bPath}.tacticsKey`, errors);
      validateNonEmptyString(raw.bestiary.loreQuoteKey, `${bPath}.loreQuoteKey`, errors);
      if (raw.bestiary.killThresholds !== undefined && raw.bestiary.killThresholds !== null) {
        if (validateObject(raw.bestiary.killThresholds, `${bPath}.killThresholds`, errors)) {
          validateOptionalNumber(raw.bestiary.killThresholds.basic, `${bPath}.killThresholds.basic`, errors, 1);
          validateOptionalNumber(raw.bestiary.killThresholds.tactics, `${bPath}.killThresholds.tactics`, errors, 1);
          validateOptionalNumber(raw.bestiary.killThresholds.lore, `${bPath}.killThresholds.lore`, errors, 1);
        }
      }
    }
  }

  if (raw.proceduralFallback !== undefined && raw.proceduralFallback !== null) {
    if (validateObject(raw.proceduralFallback, `${prefix}proceduralFallback`, errors)) {
      validateNonEmptyString(raw.proceduralFallback.bodyColor, `${prefix}proceduralFallback.bodyColor`, errors);
      validateOptionalString(raw.proceduralFallback.accentColor, `${prefix}proceduralFallback.accentColor`, errors);
      validateOptionalString(raw.proceduralFallback.eyesColor, `${prefix}proceduralFallback.eyesColor`, errors);
    }
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(raw as unknown as EnemyJsonSchema);
}

export function validateEnemiesDocument(raw: unknown): ValidationResult<EnemiesDocumentJsonSchema> {
  const errors: ValidationErrorDetail[] = [];

  if (!validateObject(raw, "enemiesDocument", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.version, "enemiesDocument.version", errors);
  if (!validateObject(raw.enemies, "enemiesDocument.enemies", errors)) {
    return failureResult(errors);
  }

  const dictionary: Record<string, EnemyJsonSchema> = {};

  for (const [key, value] of Object.entries(raw.enemies)) {
    const enemyRes = validateEnemy(value, `enemiesDocument.enemies.${key}`);
    if (!enemyRes.success) {
      errors.push(...enemyRes.errors);
    } else {
      if (enemyRes.data.id !== key) {
        errors.push({
          path: `enemiesDocument.enemies.${key}.id`,
          message: `Enemy key '${key}' does not match enemy id '${enemyRes.data.id}'`,
          received: enemyRes.data.id
        });
      }
      dictionary[key] = enemyRes.data;
    }
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult({
    version: raw.version as string,
    enemies: dictionary
  });
}

export function validateEnemiesJson(raw: unknown): ValidationResult<EnemyJsonSchema[]> {
  const errors: ValidationErrorDetail[] = [];

  // Case 1: Document wrapper { version: "1.0", enemies: { ... } }
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw) && "enemies" in raw) {
    const docRes = validateEnemiesDocument(raw);
    if (!docRes.success) {
      return failureResult(docRes.errors);
    }
    return successResult(Object.values(docRes.data.enemies));
  }

  // Case 2: Array of enemies
  if (Array.isArray(raw)) {
    const enemies: EnemyJsonSchema[] = [];
    const seenIds = new Set<string>();

    raw.forEach((item, index) => {
      const enemyRes = validateEnemy(item, `enemies[${index}]`);
      if (!enemyRes.success) {
        errors.push(...enemyRes.errors);
      } else {
        if (seenIds.has(enemyRes.data.id)) {
          errors.push({
            path: `enemies[${index}].id`,
            message: `Duplicate enemy ID '${enemyRes.data.id}' found`,
            received: enemyRes.data.id
          });
        } else {
          seenIds.add(enemyRes.data.id);
          enemies.push(enemyRes.data);
        }
      }
    });

    if (errors.length > 0) {
      return failureResult(errors);
    }

    return successResult(enemies);
  }

  // Case 3: Dictionary of enemies
  if (typeof raw === "object" && raw !== null) {
    const enemies: EnemyJsonSchema[] = [];
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      const enemyRes = validateEnemy(value, `enemies.${key}`);
      if (!enemyRes.success) {
        errors.push(...enemyRes.errors);
      } else {
        enemies.push(enemyRes.data);
      }
    }

    if (errors.length > 0) {
      return failureResult(errors);
    }

    return successResult(enemies);
  }

  return failureResult([
    {
      path: "enemies",
      message: "Expected EnemiesDocument, dictionary or array of enemies",
      received: raw
    }
  ]);
}
