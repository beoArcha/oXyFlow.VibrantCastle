/**
 * Reactive Narrator Schema Contract & Validator
 * 
 * Formal schema for contextual, event-driven narration quotes.
 */

import {
  ValidationErrorDetail,
  ValidationResult,
  successResult,
  failureResult,
  validateNonEmptyString,
  validateNumber,
  validateOptionalNumber,
  validateArray,
  validateObject
} from "./commonSchema";

export interface NarratorQuoteConditionSchema {
  minPlayerLevel?: number;
  locationId?: string;
  hpPercentageBelow?: number;
  requiredStoryFlag?: string;
}

export interface NarratorQuoteSchema {
  id: string;
  eventType: string;
  quoteKey: string;
  priority: number;
  cooldownSeconds: number;
  maxTriggersPerSession?: number;
  conditions?: NarratorQuoteConditionSchema;
  soundCue?: string;
}

export interface NarratorDocumentJsonSchema {
  version: string;
  quotes: NarratorQuoteSchema[];
}

export function validateNarratorQuote(
  raw: unknown,
  pathPrefix = ""
): ValidationResult<NarratorQuoteSchema> {
  const errors: ValidationErrorDetail[] = [];
  const prefix = pathPrefix ? `${pathPrefix}.` : "";

  if (!validateObject(raw, pathPrefix || "quote", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.id, `${prefix}id`, errors);
  validateNonEmptyString(raw.eventType, `${prefix}eventType`, errors);
  validateNonEmptyString(raw.quoteKey, `${prefix}quoteKey`, errors);
  validateNumber(raw.priority, `${prefix}priority`, errors, 0);
  validateNumber(raw.cooldownSeconds, `${prefix}cooldownSeconds`, errors, 0);
  validateOptionalNumber(raw.maxTriggersPerSession, `${prefix}maxTriggersPerSession`, errors, 1);

  if (raw.soundCue !== undefined && raw.soundCue !== null) {
    validateNonEmptyString(raw.soundCue, `${prefix}soundCue`, errors);
  }

  if (raw.conditions !== undefined && raw.conditions !== null) {
    const condPath = `${prefix}conditions`;
    if (validateObject(raw.conditions, condPath, errors)) {
      validateOptionalNumber(raw.conditions.minPlayerLevel, `${condPath}.minPlayerLevel`, errors, 1);
      validateOptionalNumber(raw.conditions.hpPercentageBelow, `${condPath}.hpPercentageBelow`, errors, 1, 100);
      if (raw.conditions.locationId !== undefined && raw.conditions.locationId !== null) {
        validateNonEmptyString(raw.conditions.locationId, `${condPath}.locationId`, errors);
      }
      if (raw.conditions.requiredStoryFlag !== undefined && raw.conditions.requiredStoryFlag !== null) {
        validateNonEmptyString(raw.conditions.requiredStoryFlag, `${condPath}.requiredStoryFlag`, errors);
      }
    }
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(raw as unknown as NarratorQuoteSchema);
}

export function validateNarratorDocument(
  raw: unknown
): ValidationResult<NarratorDocumentJsonSchema> {
  const errors: ValidationErrorDetail[] = [];

  if (!validateObject(raw, "narratorDocument", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.version, "version", errors);

  if (validateArray(raw.quotes, "quotes", errors)) {
    const seenIds = new Set<string>();
    raw.quotes.forEach((q, idx) => {
      const qRes = validateNarratorQuote(q, `quotes[${idx}]`);
      if (!qRes.success) {
        errors.push(...qRes.errors);
      } else {
        if (seenIds.has(qRes.data.id)) {
          errors.push({
            path: `quotes[${idx}].id`,
            message: `Duplicate narrator quote id '${qRes.data.id}'`,
            received: qRes.data.id
          });
        }
        seenIds.add(qRes.data.id);
      }
    });
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(raw as unknown as NarratorDocumentJsonSchema);
}
