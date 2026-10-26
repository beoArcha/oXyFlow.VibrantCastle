/**
 * Visual Novel Scene Schema Contract & Validator
 * 
 * Formal schema for declarative dialogue scenes, branch choices,
 * narrator moments, and 5x5 portrait emotion mappings.
 */

import {
  ValidationErrorDetail,
  ValidationResult,
  failureResult,
  successResult,
  validateNonEmptyString,
  validateOptionalNumber,
  validateEnum,
  validateArray,
  validateObject
} from "./commonSchema";
import { validateDictionary, validateDocumentWrapper } from "./collectionValidation";

export const VN_SPEAKER_POSITIONS = ["left", "right", "center"] as const;
export type VnSpeakerPosition = (typeof VN_SPEAKER_POSITIONS)[number];

export const VALEN_PORTRAIT_EMOTIONS = [
  "neutral", "neutral_look", "curious", "skeptical_side", "skeptical",
  "calm", "gentle", "concerned_light", "concerned", "troubled",
  "serious", "stern", "annoyed", "angry", "distant",
  "shocked", "worried", "tense", "profile_speaking", "profile_listening",
  "stoic", "reflective", "pondering", "resolute", "pensive"
] as const;
export type ValenPortraitEmotion = (typeof VALEN_PORTRAIT_EMOTIONS)[number];

export const AURELIA_PORTRAIT_EMOTIONS = [
  "curious", "focused", "inquiring", "intrigued", "observant",
  "radiant", "gentle_smile", "warm", "hopeful", "delighted",
  "sorrow", "regret", "troubled", "pensive", "somber",
  "determined", "combat_ready", "focused_spell", "resolute", "defiant",
  "serene", "mystic", "aether_flow", "harmonious", "transcendent"
] as const;
export type AureliaPortraitEmotion = (typeof AURELIA_PORTRAIT_EMOTIONS)[number];

export interface VnChoiceConditionSchema {
  minPlayerLevel?: number;
  requiredStoryFlag?: string;
  requiredItem?: string;
}

export interface VnChoiceSchema {
  choiceId: string;
  textKey: string;
  targetNodeId: string;
  conditions?: VnChoiceConditionSchema;
}

export interface VisualNovelNodeSchema {
  id: string;
  speaker: string;
  speakerNameKey?: string;
  position?: VnSpeakerPosition;
  emotion?: string;
  dialogueKey: string;
  choices?: VnChoiceSchema[];
  nextNodeId?: string | null;
  soundCue?: string;
  backgroundId?: string;
}

export interface VisualNovelSceneMetadataSchema {
  characters?: string[];
  locationId?: string;
  actId?: string;
}

export interface VisualNovelSceneJsonSchema {
  sceneId: string;
  titleKey: string;
  initialNodeId: string;
  backgroundId: string;
  musicCue?: string;
  metadata?: VisualNovelSceneMetadataSchema;
  nodes: Record<string, VisualNovelNodeSchema>;
}

export interface VisualNovelDocumentJsonSchema {
  version: string;
  scenes: Record<string, VisualNovelSceneJsonSchema>;
}

export function validateVisualNovelChoice(
  raw: unknown,
  pathPrefix = ""
): ValidationResult<VnChoiceSchema> {
  const errors: ValidationErrorDetail[] = [];
  const prefix = pathPrefix ? `${pathPrefix}.` : "";

  if (!validateObject(raw, pathPrefix || "choice", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.choiceId, `${prefix}choiceId`, errors);
  validateNonEmptyString(raw.textKey, `${prefix}textKey`, errors);
  validateNonEmptyString(raw.targetNodeId, `${prefix}targetNodeId`, errors);

  if (raw.conditions !== undefined && raw.conditions !== null) {
    const condPath = `${prefix}conditions`;
    if (validateObject(raw.conditions, condPath, errors)) {
      validateOptionalNumber(raw.conditions.minPlayerLevel, `${condPath}.minPlayerLevel`, errors, 1);
      if (raw.conditions.requiredStoryFlag !== undefined && raw.conditions.requiredStoryFlag !== null) {
        validateNonEmptyString(raw.conditions.requiredStoryFlag, `${condPath}.requiredStoryFlag`, errors);
      }
      if (raw.conditions.requiredItem !== undefined && raw.conditions.requiredItem !== null) {
        validateNonEmptyString(raw.conditions.requiredItem, `${condPath}.requiredItem`, errors);
      }
    }
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(raw as unknown as VnChoiceSchema);
}

export function validateVisualNovelNode(
  raw: unknown,
  pathPrefix = ""
): ValidationResult<VisualNovelNodeSchema> {
  const errors: ValidationErrorDetail[] = [];
  const prefix = pathPrefix ? `${pathPrefix}.` : "";

  if (!validateObject(raw, pathPrefix || "node", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.id, `${prefix}id`, errors);
  validateNonEmptyString(raw.speaker, `${prefix}speaker`, errors);
  validateNonEmptyString(raw.dialogueKey, `${prefix}dialogueKey`, errors);

  if (raw.speakerNameKey !== undefined && raw.speakerNameKey !== null) {
    validateNonEmptyString(raw.speakerNameKey, `${prefix}speakerNameKey`, errors);
  }

  if (raw.position !== undefined && raw.position !== null) {
    validateEnum(raw.position, `${prefix}position`, VN_SPEAKER_POSITIONS, errors);
  }

  if (raw.emotion !== undefined && raw.emotion !== null) {
    validateNonEmptyString(raw.emotion, `${prefix}emotion`, errors);
  }

  if (raw.soundCue !== undefined && raw.soundCue !== null) {
    validateNonEmptyString(raw.soundCue, `${prefix}soundCue`, errors);
  }

  if (raw.backgroundId !== undefined && raw.backgroundId !== null) {
    validateNonEmptyString(raw.backgroundId, `${prefix}backgroundId`, errors);
  }

  if (raw.nextNodeId !== undefined && raw.nextNodeId !== null) {
    validateNonEmptyString(raw.nextNodeId, `${prefix}nextNodeId`, errors);
  }

  if (raw.choices !== undefined && raw.choices !== null) {
    if (validateArray(raw.choices, `${prefix}choices`, errors)) {
      raw.choices.forEach((choice, idx) => {
        const choiceRes = validateVisualNovelChoice(choice, `${prefix}choices[${idx}]`);
        if (!choiceRes.success) {
          errors.push(...choiceRes.errors);
        }
      });
    }
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(raw as unknown as VisualNovelNodeSchema);
}

export function validateVisualNovelScene(
  raw: unknown,
  pathPrefix = ""
): ValidationResult<VisualNovelSceneJsonSchema> {
  const errors: ValidationErrorDetail[] = [];
  const prefix = pathPrefix ? `${pathPrefix}.` : "";

  if (!validateObject(raw, pathPrefix || "scene", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.sceneId, `${prefix}sceneId`, errors);
  validateNonEmptyString(raw.titleKey, `${prefix}titleKey`, errors);
  validateNonEmptyString(raw.initialNodeId, `${prefix}initialNodeId`, errors);
  validateNonEmptyString(raw.backgroundId, `${prefix}backgroundId`, errors);

  if (raw.musicCue !== undefined && raw.musicCue !== null) {
    validateNonEmptyString(raw.musicCue, `${prefix}musicCue`, errors);
  }

  if (raw.metadata !== undefined && raw.metadata !== null) {
    const metaPath = `${prefix}metadata`;
    if (validateObject(raw.metadata, metaPath, errors)) {
      if (raw.metadata.characters !== undefined && raw.metadata.characters !== null) {
        if (validateArray(raw.metadata.characters, `${metaPath}.characters`, errors)) {
          raw.metadata.characters.forEach((char, idx) => {
            validateNonEmptyString(char, `${metaPath}.characters[${idx}]`, errors);
          });
        }
      }
      if (raw.metadata.locationId !== undefined && raw.metadata.locationId !== null) {
        validateNonEmptyString(raw.metadata.locationId, `${metaPath}.locationId`, errors);
      }
      if (raw.metadata.actId !== undefined && raw.metadata.actId !== null) {
        validateNonEmptyString(raw.metadata.actId, `${metaPath}.actId`, errors);
      }
    }
  }

  const validatedNodes = validateDictionary(
    raw.nodes,
    `${prefix}nodes`,
    errors,
    validateVisualNovelNode,
    (node) => node.id
  );

  if (!validatedNodes) {
    return failureResult(errors);
  }

  // Referential graph integrity check within scene
  if (typeof raw.initialNodeId === "string" && !validatedNodes[raw.initialNodeId]) {
    errors.push({
      path: `${prefix}initialNodeId`,
      message: `Initial node id '${raw.initialNodeId}' not found in scene nodes`,
      received: raw.initialNodeId
    });
  }

  for (const [nodeId, node] of Object.entries(validatedNodes)) {
    if (node.nextNodeId && !validatedNodes[node.nextNodeId]) {
      errors.push({
        path: `${prefix}nodes.${nodeId}.nextNodeId`,
        message: `Next node id '${node.nextNodeId}' referenced by node '${nodeId}' not found in scene`,
        received: node.nextNodeId
      });
    }

    if (node.choices) {
      node.choices.forEach((choice, cIdx) => {
        if (!validatedNodes[choice.targetNodeId]) {
          errors.push({
            path: `${prefix}nodes.${nodeId}.choices[${cIdx}].targetNodeId`,
            message: `Target node id '${choice.targetNodeId}' referenced by choice '${choice.choiceId}' not found in scene`,
            received: choice.targetNodeId
          });
        }
      });
    }
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(raw as unknown as VisualNovelSceneJsonSchema);
}

export function validateVisualNovelDocument(
  raw: unknown
): ValidationResult<VisualNovelDocumentJsonSchema> {
  const docRes = validateDocumentWrapper(
    raw,
    "visualNovelDocument",
    "scenes",
    validateVisualNovelScene,
    (scene) => scene.sceneId
  );

  if (!docRes.success) {
    return docRes;
  }

  return successResult({
    version: docRes.data.version,
    scenes: docRes.data.items
  } as VisualNovelDocumentJsonSchema);
}
