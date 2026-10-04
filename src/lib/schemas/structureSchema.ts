/**
 * Structures Schema Contract & Validator
 * 
 * Formal contract for interactive world objects, mechanisms, barriers, and hazards
 * matching src/data/structures/structures.json.
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
  validateArray,
  validateObject
} from "./commonSchema";

export interface StructureDimensionsSchema {
  width: number;
  height: number;
}

export interface StructureAtlasSchema {
  presetId: string;
  states?: Record<string, string>;
}

export interface StructureInteractionEffectsSchema {
  playFanfare?: boolean;
  unlockNextStage?: boolean;
  emitParticles?: boolean;
  openGate?: boolean;
  sound?: string;
  damage?: number;
  [key: string]: unknown;
}

export interface StructureInteractionSchema {
  type: string;
  activation: string;
  triggerRadius?: number;
  effects?: StructureInteractionEffectsSchema;
}

export interface StructureJsonSchema {
  id: string;
  labelKey: string;
  defaultLabel: string;
  type: string;
  dimensions: StructureDimensionsSchema;
  atlas?: StructureAtlasSchema;
  interaction?: StructureInteractionSchema;
  proceduralFallback?: Record<string, string>;
}

export interface StructuresDocumentJsonSchema {
  version: string;
  structures: Record<string, StructureJsonSchema>;
}

export function validateStructure(raw: unknown, pathPrefix = ""): ValidationResult<StructureJsonSchema> {
  const errors: ValidationErrorDetail[] = [];
  const prefix = pathPrefix ? `${pathPrefix}.` : "";

  if (!validateObject(raw, pathPrefix || "structure", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.id, `${prefix}id`, errors);
  validateNonEmptyString(raw.labelKey, `${prefix}labelKey`, errors);
  validateNonEmptyString(raw.defaultLabel, `${prefix}defaultLabel`, errors);
  validateNonEmptyString(raw.type, `${prefix}type`, errors);

  if (validateObject(raw.dimensions, `${prefix}dimensions`, errors)) {
    validateNumber(raw.dimensions.width, `${prefix}dimensions.width`, errors, 1);
    validateNumber(raw.dimensions.height, `${prefix}dimensions.height`, errors, 1);
  }

  if (raw.atlas !== undefined && raw.atlas !== null) {
    if (validateObject(raw.atlas, `${prefix}atlas`, errors)) {
      validateNonEmptyString(raw.atlas.presetId, `${prefix}atlas.presetId`, errors);
      if (raw.atlas.states !== undefined && raw.atlas.states !== null) {
        if (validateObject(raw.atlas.states, `${prefix}atlas.states`, errors)) {
          for (const [stateKey, stateVal] of Object.entries(raw.atlas.states as Record<string, unknown>)) {
            validateNonEmptyString(stateVal, `${prefix}atlas.states.${stateKey}`, errors);
          }
        }
      }
    }
  }

  if (raw.interaction !== undefined && raw.interaction !== null) {
    if (validateObject(raw.interaction, `${prefix}interaction`, errors)) {
      validateNonEmptyString(raw.interaction.type, `${prefix}interaction.type`, errors);
      validateNonEmptyString(raw.interaction.activation, `${prefix}interaction.activation`, errors);
      validateOptionalNumber(raw.interaction.triggerRadius, `${prefix}interaction.triggerRadius`, errors, 0);

      if (raw.interaction.effects !== undefined && raw.interaction.effects !== null) {
        validateObject(raw.interaction.effects, `${prefix}interaction.effects`, errors);
      }
    }
  }

  if (raw.proceduralFallback !== undefined && raw.proceduralFallback !== null) {
    if (validateObject(raw.proceduralFallback, `${prefix}proceduralFallback`, errors)) {
      for (const [colorKey, colorVal] of Object.entries(raw.proceduralFallback as Record<string, unknown>)) {
        validateNonEmptyString(colorVal, `${prefix}proceduralFallback.${colorKey}`, errors);
      }
    }
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(raw as unknown as StructureJsonSchema);
}

export function validateStructuresDocument(raw: unknown): ValidationResult<StructuresDocumentJsonSchema> {
  const errors: ValidationErrorDetail[] = [];

  if (!validateObject(raw, "structuresDocument", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.version, "structuresDocument.version", errors);
  if (!validateObject(raw.structures, "structuresDocument.structures", errors)) {
    return failureResult(errors);
  }

  const dictionary: Record<string, StructureJsonSchema> = {};

  for (const [key, value] of Object.entries(raw.structures)) {
    const structRes = validateStructure(value, `structuresDocument.structures.${key}`);
    if (!structRes.success) {
      errors.push(...structRes.errors);
    } else {
      if (structRes.data.id !== key) {
        errors.push({
          path: `structuresDocument.structures.${key}.id`,
          message: `Structure key '${key}' does not match structure id '${structRes.data.id}'`,
          received: structRes.data.id
        });
      }
      dictionary[key] = structRes.data;
    }
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult({
    version: raw.version as string,
    structures: dictionary
  });
}

export function validateStructuresJson(raw: unknown): ValidationResult<StructureJsonSchema[]> {
  const errors: ValidationErrorDetail[] = [];

  // Case 1: Document wrapper { version: "1.0", structures: { ... } }
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw) && "structures" in raw) {
    const docRes = validateStructuresDocument(raw);
    if (!docRes.success) {
      return failureResult(docRes.errors);
    }
    return successResult(Object.values(docRes.data.structures));
  }

  // Case 2: Array of structures
  if (Array.isArray(raw)) {
    const structures: StructureJsonSchema[] = [];
    const seenIds = new Set<string>();

    raw.forEach((item, index) => {
      const structRes = validateStructure(item, `structures[${index}]`);
      if (!structRes.success) {
        errors.push(...structRes.errors);
      } else {
        if (seenIds.has(structRes.data.id)) {
          errors.push({
            path: `structures[${index}].id`,
            message: `Duplicate structure ID '${structRes.data.id}' found`,
            received: structRes.data.id
          });
        } else {
          seenIds.add(structRes.data.id);
          structures.push(structRes.data);
        }
      }
    });

    if (errors.length > 0) {
      return failureResult(errors);
    }

    return successResult(structures);
  }

  // Case 3: Dictionary of structures
  if (typeof raw === "object" && raw !== null) {
    const structures: StructureJsonSchema[] = [];
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      const structRes = validateStructure(value, `structures.${key}`);
      if (!structRes.success) {
        errors.push(...structRes.errors);
      } else {
        structures.push(structRes.data);
      }
    }

    if (errors.length > 0) {
      return failureResult(errors);
    }

    return successResult(structures);
  }

  return failureResult([
    {
      path: "structures",
      message: "Expected StructuresDocument, dictionary or array of structures",
      received: raw
    }
  ]);
}
