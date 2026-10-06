/**
 * Visual Novel Scene Bidirectional Codec
 * 
 * Translates between external narrative/dialogues_vn.json format and internal
 * DomainVisualNovelScene models with graph integrity and choice validation.
 */

import { Result, ok, err, CodecError, ErrorCode } from "../errors";
import {
  VisualNovelNodeSchema,
  VisualNovelSceneJsonSchema,
  VisualNovelDocumentJsonSchema,
  VnChoiceSchema,
  VnSpeakerPosition,
  validateVisualNovelScene,
  validateVisualNovelDocument
} from "../schemas/visualNovelSchema";
import { Codec } from "./codecInterface";

export interface DomainVnChoice {
  choiceId: string;
  textKey: string;
  targetNodeId: string;
  conditions?: {
    minPlayerLevel?: number;
    requiredStoryFlag?: string;
    requiredItem?: string;
  };
}

export interface DomainVisualNovelNode {
  id: string;
  speaker: string;
  speakerNameKey?: string;
  position?: VnSpeakerPosition;
  emotion?: string;
  dialogueKey: string;
  choices?: DomainVnChoice[];
  nextNodeId?: string | null;
  soundCue?: string;
  backgroundId?: string;
}

export interface DomainVisualNovelScene {
  sceneId: string;
  titleKey: string;
  initialNodeId: string;
  backgroundId: string;
  musicCue?: string;
  metadata?: {
    characters?: string[];
    locationId?: string;
    actId?: string;
  };
  nodes: Record<string, DomainVisualNovelNode>;
}

export interface DomainVisualNovelDocument {
  version: string;
  scenes: Record<string, DomainVisualNovelScene>;
}

export class VisualNovelCodec
  implements Codec<VisualNovelDocumentJsonSchema, DomainVisualNovelDocument> {
  public readonly name = "VisualNovelCodec";

  public decode(raw: unknown): Result<DomainVisualNovelDocument, CodecError> {
    const valResult = validateVisualNovelDocument(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode Visual Novel document: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const doc = valResult.data;
    const domainScenes: Record<string, DomainVisualNovelScene> = {};

    for (const [sKey, sVal] of Object.entries(doc.scenes)) {
      const sceneRes = this.decodeScene(sVal);
      if (!sceneRes.isOk()) {
        return err(sceneRes.error);
      }
      domainScenes[sKey] = sceneRes.value;
    }

    return ok({
      version: doc.version,
      scenes: domainScenes
    });
  }

  public encode(domain: DomainVisualNovelDocument): Result<VisualNovelDocumentJsonSchema, CodecError> {
    const scenesJson: Record<string, VisualNovelSceneJsonSchema> = {};

    for (const [sKey, sVal] of Object.entries(domain.scenes)) {
      const sceneRes = this.encodeScene(sVal);
      if (!sceneRes.isOk()) {
        return err(sceneRes.error);
      }
      scenesJson[sKey] = sceneRes.value;
    }

    const docJson: VisualNovelDocumentJsonSchema = {
      version: domain.version,
      scenes: scenesJson
    };

    const valResult = validateVisualNovelDocument(docJson);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode Visual Novel document: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }

  public decodeScene(raw: unknown): Result<DomainVisualNovelScene, CodecError> {
    const valResult = validateVisualNovelScene(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode Visual Novel scene: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const s = valResult.data;
    const domainNodes: Record<string, DomainVisualNovelNode> = {};

    for (const [nKey, nVal] of Object.entries(s.nodes)) {
      domainNodes[nKey] = {
        id: nVal.id,
        speaker: nVal.speaker,
        speakerNameKey: nVal.speakerNameKey,
        position: nVal.position,
        emotion: nVal.emotion,
        dialogueKey: nVal.dialogueKey,
        choices: nVal.choices?.map((c) => ({
          choiceId: c.choiceId,
          textKey: c.textKey,
          targetNodeId: c.targetNodeId,
          conditions: c.conditions ? { ...c.conditions } : undefined
        })),
        nextNodeId: nVal.nextNodeId,
        soundCue: nVal.soundCue,
        backgroundId: nVal.backgroundId
      };
    }

    return ok({
      sceneId: s.sceneId,
      titleKey: s.titleKey,
      initialNodeId: s.initialNodeId,
      backgroundId: s.backgroundId,
      musicCue: s.musicCue,
      metadata: s.metadata ? { ...s.metadata, characters: s.metadata.characters ? [...s.metadata.characters] : undefined } : undefined,
      nodes: domainNodes
    });
  }

  public encodeScene(domain: DomainVisualNovelScene): Result<VisualNovelSceneJsonSchema, CodecError> {
    const nodesJson: Record<string, VisualNovelNodeSchema> = {};

    for (const [nKey, nVal] of Object.entries(domain.nodes)) {
      nodesJson[nKey] = {
        id: nVal.id,
        speaker: nVal.speaker,
        speakerNameKey: nVal.speakerNameKey,
        position: nVal.position,
        emotion: nVal.emotion,
        dialogueKey: nVal.dialogueKey,
        choices: nVal.choices?.map((c) => ({
          choiceId: c.choiceId,
          textKey: c.textKey,
          targetNodeId: c.targetNodeId,
          conditions: c.conditions ? { ...c.conditions } : undefined
        })),
        nextNodeId: nVal.nextNodeId,
        soundCue: nVal.soundCue,
        backgroundId: nVal.backgroundId
      };
    }

    const sceneJson: VisualNovelSceneJsonSchema = {
      sceneId: domain.sceneId,
      titleKey: domain.titleKey,
      initialNodeId: domain.initialNodeId,
      backgroundId: domain.backgroundId,
      musicCue: domain.musicCue,
      metadata: domain.metadata ? { ...domain.metadata, characters: domain.metadata.characters ? [...domain.metadata.characters] : undefined } : undefined,
      nodes: nodesJson
    };

    const valResult = validateVisualNovelScene(sceneJson);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode Visual Novel scene: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }
}

export const visualNovelCodec = new VisualNovelCodec();
