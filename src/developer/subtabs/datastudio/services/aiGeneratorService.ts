import { SupportedSchemaType } from "@lib/schemas/openapiExporter";
import { validateSpell } from "@lib/schemas/spellsSchema";
import { validateEnemy } from "@lib/schemas/enemySchema";
import { validateItem } from "@lib/schemas/itemSchema";
import { validateVisualNovelScene } from "@lib/schemas/visualNovelSchema";
import { ValidationErrorDetail } from "@lib/schemas/commonSchema";
import spellsJson from "@data/skills/spells.json";
import enemiesJson from "@data/enemies/enemies.json";
import itemsJson from "@data/items/items.json";
import dialoguesVnJson from "@data/narrative/dialogues_vn.json";

export interface SchemaValidationOutcome {
  readonly success: boolean;
  readonly errors: ValidationErrorDetail[];
}

export type SchemaValidator = (payload: unknown) => SchemaValidationOutcome;

export const SCHEMA_VALIDATORS: Record<SupportedSchemaType, SchemaValidator> = {
  spell: (payload) => {
    const res = validateSpell(payload);
    return res.success ? { success: true, errors: [] } : { success: false, errors: res.errors };
  },
  enemy: (payload) => {
    const res = validateEnemy(payload);
    return res.success ? { success: true, errors: [] } : { success: false, errors: res.errors };
  },
  item: (payload) => {
    const res = validateItem(payload);
    return res.success ? { success: true, errors: [] } : { success: false, errors: res.errors };
  },
  visual_novel: (payload) => {
    const res = validateVisualNovelScene(payload);
    return res.success ? { success: true, errors: [] } : { success: false, errors: res.errors };
  },
};

export const SCHEMA_SAMPLES: Record<SupportedSchemaType, () => unknown> = {
  spell: () => Object.values(spellsJson.spells)[0],
  enemy: () => Object.values(enemiesJson.enemies)[0],
  item: () => Object.values(itemsJson)[0],
  visual_novel: () => Object.values(dialoguesVnJson.scenes)[0],
};

export function validateSchemaPayload(
  type: SupportedSchemaType,
  rawJson: string,
  emptyErrorMessage: string,
  malformedErrorPrefix: string
): SchemaValidationOutcome {
  const trimmed = rawJson.trim();
  if (!trimmed) {
    return {
      success: false,
      errors: [{ path: "root", message: emptyErrorMessage }],
    };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const validator = SCHEMA_VALIDATORS[type];
    return validator(parsed);
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      errors: [{ path: "syntax", message: `${malformedErrorPrefix}: ${detail}` }],
    };
  }
}

export function getCanonicalSampleJson(type: SupportedSchemaType): string {
  const sampleGetter = SCHEMA_SAMPLES[type];
  const sample = sampleGetter ? sampleGetter() : {};
  return JSON.stringify(sample, null, 2);
}
