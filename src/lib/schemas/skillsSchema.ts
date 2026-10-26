/**
 * Skills Schema Contract & Validator
 * 
 * Formal contract for hero skill trees and progression nodes matching src/data/skills/skills.json.
 * Validates character segregation, graph prerequisites, grid coordinates, and point costs.
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
  validateObject,
  CHARACTER_IDS,
  CharacterId,
  COMBAT_CATEGORIES,
  CombatCategory,
  COMBAT_TRIGGER_TYPES,
  CombatTriggerType
} from "./commonSchema";

export const SKILL_CHARACTERS = CHARACTER_IDS;
export type SkillCharacter = CharacterId;

export const SKILL_CATEGORIES = COMBAT_CATEGORIES;
export type SkillCategory = CombatCategory;

export const SKILL_TRIGGER_TYPES = COMBAT_TRIGGER_TYPES;
export type SkillTriggerType = CombatTriggerType;

export interface SkillNodeJsonSchema {
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

export interface SkillsDictionaryJsonSchema {
  valen: SkillNodeJsonSchema[];
  aurelia: SkillNodeJsonSchema[];
}

export function validateSkillNode(raw: unknown, pathPrefix = ""): ValidationResult<SkillNodeJsonSchema> {
  const errors: ValidationErrorDetail[] = [];
  const prefix = pathPrefix ? `${pathPrefix}.` : "";

  if (!validateObject(raw, pathPrefix || "skillNode", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.id, `${prefix}id`, errors);
  validateEnum(raw.character, `${prefix}character`, SKILL_CHARACTERS, errors);
  validateNonEmptyString(raw.nameKey, `${prefix}nameKey`, errors);
  validateNonEmptyString(raw.descKey, `${prefix}descKey`, errors);
  validateOptionalString(raw.restrictionKey, `${prefix}restrictionKey`, errors);
  validateNumber(raw.tier, `${prefix}tier`, errors, 1, 10);
  validateNumber(raw.pointCost, `${prefix}pointCost`, errors, 0, 100);
  validateBoolean(raw.unlocked, `${prefix}unlocked`, errors);
  validateNonEmptyString(raw.icon, `${prefix}icon`, errors);
  validateEnum(raw.category, `${prefix}category`, SKILL_CATEGORIES, errors);
  validateEnum(raw.triggerType, `${prefix}triggerType`, SKILL_TRIGGER_TYPES, errors);
  validateNumber(raw.manaCost, `${prefix}manaCost`, errors, 0);
  validateNumber(raw.staminaCost, `${prefix}staminaCost`, errors, 0);
  validateNumber(raw.cooldownFrames, `${prefix}cooldownFrames`, errors, 0);
  validateNumber(raw.damage, `${prefix}damage`, errors, 0);
  validateNonEmptyString(raw.color, `${prefix}color`, errors);

  if (raw.reqSkillId !== null && raw.reqSkillId !== undefined) {
    validateNonEmptyString(raw.reqSkillId, `${prefix}reqSkillId`, errors);
  }

  validateNumber(raw.minLevel, `${prefix}minLevel`, errors, 1, 100);
  validateNumber(raw.gridX, `${prefix}gridX`, errors, 1, 20);
  validateNumber(raw.gridY, `${prefix}gridY`, errors, 1, 20);

  validateOptionalNumber(raw.projectileSpeed, `${prefix}projectileSpeed`, errors, 0);
  validateOptionalNumber(raw.shieldDurationFrames, `${prefix}shieldDurationFrames`, errors, 0);
  validateOptionalNumber(raw.autoIntervalFrames, `${prefix}autoIntervalFrames`, errors, 1);

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(raw as unknown as SkillNodeJsonSchema);
}

export function validateSkillsDictionary(raw: unknown): ValidationResult<SkillsDictionaryJsonSchema> {
  const errors: ValidationErrorDetail[] = [];

  if (!validateObject(raw, "skills", errors)) {
    return failureResult(errors);
  }

  const valenNodes: SkillNodeJsonSchema[] = [];
  const aureliaNodes: SkillNodeJsonSchema[] = [];
  const allIds = new Set<string>();

  for (const character of SKILL_CHARACTERS) {
    const list = raw[character];
    if (!validateArray(list, `skills.${character}`, errors)) {
      continue;
    }

    list.forEach((item, index) => {
      const nodeRes = validateSkillNode(item, `skills.${character}[${index}]`);
      if (!nodeRes.success) {
        errors.push(...nodeRes.errors);
      } else {
        if (nodeRes.data.character !== character) {
          errors.push({
            path: `skills.${character}[${index}].character`,
            message: `Mismatched character field: expected '${character}', got '${nodeRes.data.character}'`,
            received: nodeRes.data.character
          });
        }
        if (allIds.has(nodeRes.data.id)) {
          errors.push({
            path: `skills.${character}[${index}].id`,
            message: `Duplicate skill node ID '${nodeRes.data.id}' found in skills dictionary`,
            received: nodeRes.data.id
          });
        } else {
          allIds.add(nodeRes.data.id);
          if (character === "valen") {
            valenNodes.push(nodeRes.data);
          } else {
            aureliaNodes.push(nodeRes.data);
          }
        }
      }
    });
  }

  // Validate prerequisite referential integrity across the DAG
  const validatePrerequisites = (nodes: SkillNodeJsonSchema[], charName: string) => {
    const charNodeIds = new Set(nodes.map(n => n.id));
    nodes.forEach((node, index) => {
      if (node.reqSkillId && !charNodeIds.has(node.reqSkillId)) {
        errors.push({
          path: `skills.${charName}[${index}].reqSkillId`,
          message: `Referenced prerequisite '${node.reqSkillId}' does not exist in ${charName}'s skill tree`,
          received: node.reqSkillId
        });
      }
    });
  };

  validatePrerequisites(valenNodes, "valen");
  validatePrerequisites(aureliaNodes, "aurelia");

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult({
    valen: valenNodes,
    aurelia: aureliaNodes
  });
}
