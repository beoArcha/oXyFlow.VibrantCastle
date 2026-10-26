/**
 * Spells Schema Contract & Validator
 * 
 * Formal contract for declarative magic spells and skills matching src/data/skills/spells.json.
 * Validates RPG domains, complex casting mechanisms, composite damage types and trajectory physics.
 */

import {
  ValidationErrorDetail,
  ValidationResult,
  failureResult,
  successResult,
  validateNonEmptyString,
  validateOptionalString,
  validateNumber,
  validateOptionalNumber,
  validateEnum,
  validateOptionalEnum,
  validateArray,
  validateObject,
  CHARACTER_IDS,
  CharacterId,
  COMBAT_CATEGORIES,
  CombatCategory,
  COMBAT_TRIGGER_TYPES,
  CombatTriggerType
} from "./commonSchema";
import { validateDocumentWrapper, validateFlexibleCollection } from "./collectionValidation";

export const MAGIC_DOMAINS = ["solar", "astral", "chrono", "frost", "shadow"] as const;
export type MagicDomain = (typeof MAGIC_DOMAINS)[number];

export const SPELL_CAST_TYPES = ["instant", "channeled", "chargeable", "aura", "sigil_trap"] as const;
export type SpellCastType = (typeof SPELL_CAST_TYPES)[number];

export const DAMAGE_TYPES = [
  "physical",
  "magical",
  "fire",
  "frost",
  "astral",
  "aether",
  "holy",
  "chrono",
  "pure",
  "shadow",
  "arcane",
  "lightning"
] as const;
export type DamageType = (typeof DAMAGE_TYPES)[number];

export const PROJECTILE_TRAJECTORIES = [
  "straight",
  "linear",
  "arc",
  "arc_gravity",
  "homing",
  "orbital",
  "wave",
  "nova_radial"
] as const;
export type ProjectileTrajectory = (typeof PROJECTILE_TRAJECTORIES)[number];

export const SPELL_CATEGORIES = COMBAT_CATEGORIES;
export type SpellCategory = CombatCategory;

export const SPELL_TRIGGER_TYPES = COMBAT_TRIGGER_TYPES;
export type SpellTriggerType = CombatTriggerType;

export const CHARACTERS = CHARACTER_IDS;
export type { CharacterId };

export const SPELL_OWNER_TYPES = ["hero", "enemy", "boss", "unison"] as const;
export type SpellOwnerType = (typeof SPELL_OWNER_TYPES)[number];

export interface DamageComponentSchema {
  type: DamageType;
  amount: number;
  scalingStat?: string;
  scalingRatio?: number;
}

export type DamageBreakdownSchema =
  | {
      primary: DamageComponentSchema;
      secondary?: DamageComponentSchema;
    }
  | DamageComponentSchema[];

export interface ProjectileConfigSchema {
  speed: number;
  trajectory: ProjectileTrajectory;
  piercing?: boolean;
  radius?: number;
  pierceCount?: number;
  maxRange?: number;
}

export interface SpellStatusEffectSchema {
  type: string;
  effectId?: string;
  damageType?: DamageType;
  damagePerTick?: number;
  durationSeconds?: number;
  intervalSeconds?: number;
  speedMultiplier?: number;
  durationFrames?: number;
  potency?: number;
}

export interface SpellJsonSchema {
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
  icon?: string;
  character?: CharacterId;
  ownerType?: SpellOwnerType;
  requiredParticipants?: CharacterId[];
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

export interface SpellsDocumentJsonSchema {
  version: string;
  spells: Record<string, SpellJsonSchema>;
}

export function validateSpell(raw: unknown, pathPrefix = ""): ValidationResult<SpellJsonSchema> {
  const errors: ValidationErrorDetail[] = [];
  const prefix = pathPrefix ? `${pathPrefix}.` : "";

  if (!validateObject(raw, pathPrefix || "spell", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.id, `${prefix}id`, errors);
  validateEnum(raw.magicDomain, `${prefix}magicDomain`, MAGIC_DOMAINS, errors);
  validateEnum(raw.castType, `${prefix}castType`, SPELL_CAST_TYPES, errors);
  validateEnum(raw.category, `${prefix}category`, SPELL_CATEGORIES, errors);
  validateEnum(raw.triggerType, `${prefix}triggerType`, SPELL_TRIGGER_TYPES, errors);
  validateNonEmptyString(raw.nameKey, `${prefix}nameKey`, errors);
  validateNonEmptyString(raw.descriptionKey, `${prefix}descriptionKey`, errors);
  validateNumber(raw.manaCost, `${prefix}manaCost`, errors, 0);
  validateNumber(raw.staminaCost, `${prefix}staminaCost`, errors, 0);
  validateNumber(raw.cooldownFrames, `${prefix}cooldownFrames`, errors, 0);
  validateNumber(raw.damage, `${prefix}damage`, errors, 0);
  validateNonEmptyString(raw.color, `${prefix}color`, errors);

  // Icon validation: either iconName or icon must be non-empty string
  const iconVal = raw.iconName ?? raw.icon;
  if (typeof iconVal !== "string" || iconVal.trim().length === 0) {
    errors.push({
      path: `${prefix}iconName`,
      message: `Expected non-empty string for 'iconName' (or 'icon') at '${prefix}iconName'`,
      received: iconVal
    });
  }

  validateOptionalEnum(raw.character, `${prefix}character`, CHARACTERS, errors);
  validateOptionalEnum(raw.ownerType, `${prefix}ownerType`, SPELL_OWNER_TYPES, errors);

  if (raw.requiredParticipants !== undefined && raw.requiredParticipants !== null) {
    if (validateArray(raw.requiredParticipants, `${prefix}requiredParticipants`, errors)) {
      raw.requiredParticipants.forEach((p, idx) => {
        validateEnum(p, `${prefix}requiredParticipants[${idx}]`, CHARACTERS, errors);
      });
    }
  }

  validateOptionalString(raw.restrictionKey, `${prefix}restrictionKey`, errors);
  validateOptionalNumber(raw.tier, `${prefix}tier`, errors, 1, 10);
  validateOptionalNumber(raw.minLevel, `${prefix}minLevel`, errors, 1, 100);
  validateOptionalNumber(raw.projectileSpeed, `${prefix}projectileSpeed`, errors, 0);
  validateOptionalNumber(raw.shieldDurationFrames, `${prefix}shieldDurationFrames`, errors, 0);
  validateOptionalNumber(raw.healAmount, `${prefix}healAmount`, errors, 0);
  validateOptionalNumber(raw.autoIntervalFrames, `${prefix}autoIntervalFrames`, errors, 1);

  if (raw.damageBreakdown !== undefined && raw.damageBreakdown !== null) {
    if (Array.isArray(raw.damageBreakdown)) {
      raw.damageBreakdown.forEach((item, index) => {
        const itemPath = `${prefix}damageBreakdown[${index}]`;
        if (validateObject(item, itemPath, errors)) {
          validateEnum(item.type, `${itemPath}.type`, DAMAGE_TYPES, errors);
          validateNumber(item.amount ?? item.base, `${itemPath}.amount`, errors, 0);
          validateOptionalString(item.scalingStat, `${itemPath}.scalingStat`, errors);
          validateOptionalNumber(item.scalingRatio, `${itemPath}.scalingRatio`, errors, 0);
        }
      });
    } else if (validateObject(raw.damageBreakdown, `${prefix}damageBreakdown`, errors)) {
      const db = raw.damageBreakdown;
      if (validateObject(db.primary, `${prefix}damageBreakdown.primary`, errors)) {
        validateEnum(db.primary.type, `${prefix}damageBreakdown.primary.type`, DAMAGE_TYPES, errors);
        validateNumber(db.primary.amount ?? db.primary.base, `${prefix}damageBreakdown.primary.amount`, errors, 0);
      }
      if (db.secondary !== undefined && db.secondary !== null) {
        if (validateObject(db.secondary, `${prefix}damageBreakdown.secondary`, errors)) {
          validateEnum(db.secondary.type, `${prefix}damageBreakdown.secondary.type`, DAMAGE_TYPES, errors);
          validateNumber(db.secondary.amount ?? db.secondary.base, `${prefix}damageBreakdown.secondary.amount`, errors, 0);
        }
      }
    }
  }

  if (raw.projectileConfig !== undefined && raw.projectileConfig !== null) {
    const pcPath = `${prefix}projectileConfig`;
    if (validateObject(raw.projectileConfig, pcPath, errors)) {
      validateNumber(raw.projectileConfig.speed, `${pcPath}.speed`, errors, 0);
      validateEnum(raw.projectileConfig.trajectory, `${pcPath}.trajectory`, PROJECTILE_TRAJECTORIES, errors);
      validateOptionalNumber(raw.projectileConfig.radius, `${pcPath}.radius`, errors, 1);
      validateOptionalNumber(raw.projectileConfig.pierceCount, `${pcPath}.pierceCount`, errors, 0);
      validateOptionalNumber(raw.projectileConfig.maxRange, `${pcPath}.maxRange`, errors, 1);
    }
  }

  const validateStatusEffectList = (list: unknown, fieldName: string) => {
    if (list !== undefined && list !== null) {
      if (validateArray(list, `${prefix}${fieldName}`, errors)) {
        list.forEach((item, index) => {
          const itemPath = `${prefix}${fieldName}[${index}]`;
          if (validateObject(item, itemPath, errors)) {
            validateNonEmptyString(item.type, `${itemPath}.type`, errors);
            validateOptionalString(item.effectId, `${itemPath}.effectId`, errors);
            if (item.damageType) {
              validateEnum(item.damageType, `${itemPath}.damageType`, DAMAGE_TYPES, errors);
            }
          }
        });
      }
    }
  };

  validateStatusEffectList(raw.statusEffects, "statusEffects");
  validateStatusEffectList(raw.statusEffectsOnHit, "statusEffectsOnHit");

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(raw as unknown as SpellJsonSchema);
}

export function validateSpellsDocument(raw: unknown): ValidationResult<SpellsDocumentJsonSchema> {
  const docRes = validateDocumentWrapper(
    raw,
    "spellsDocument",
    "spells",
    validateSpell,
    (spell) => spell.id
  );

  if (!docRes.success) {
    return docRes;
  }

  return successResult({
    version: docRes.data.version,
    spells: docRes.data.items
  });
}

export function validateSpellsJson(raw: unknown): ValidationResult<SpellJsonSchema[]> {
  return validateFlexibleCollection(raw, {
    collectionName: "spells",
    itemsKey: "spells",
    itemValidator: validateSpell,
    getId: (spell) => spell.id,
    duplicateErrorMessage: (id) => `Duplicate spell identifier '${id}' found`,
    expectedTypeMessage: "Expected SpellsDocument, dictionary or array of spells"
  });
}
