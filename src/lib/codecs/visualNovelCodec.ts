/**
 * Visual Novel Scene Bidirectional Codec
 * 
 * Translates between external narrative/dialogues_vn.json format and internal
 * DomainVisualNovelScene models with graph integrity and choice validation.
 */

import { Result, ok, err, CodecError } from "../errors";
import {
  VisualNovelNodeSchema,
  VisualNovelSceneJsonSchema,
  VisualNovelDocumentJsonSchema,
  VnSpeakerPosition,
  validateVisualNovelScene,
  validateVisualNovelDocument
} from "../schemas/visualNovelSchema";
import { Codec } from "./codecInterface";
import { failCodecDecode, failCodecEncode, transformDictionaryResult } from "./codecUtils";

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

function cloneVisualNovelNode(node: DomainVisualNovelNode | VisualNovelNodeSchema): DomainVisualNovelNode {
  return {
    id: node.id,
    speaker: node.speaker,
    speakerNameKey: node.speakerNameKey,
    position: node.position,
    emotion: node.emotion,
    dialogueKey: node.dialogueKey,
    choices: node.choices?.map((c) => ({
      choiceId: c.choiceId,
      textKey: c.textKey,
      targetNodeId: c.targetNodeId,
      conditions: c.conditions ? { ...c.conditions } : undefined
    })),
    nextNodeId: node.nextNodeId,
    soundCue: node.soundCue,
    backgroundId: node.backgroundId
  };
}

function cloneSceneMetadata(metadata?: VisualNovelSceneJsonSchema["metadata"]) {
  if (!metadata) return undefined;
  return {
    ...metadata,
    characters: metadata.characters ? [...metadata.characters] : undefined
  };
}

export class VisualNovelCodec
  implements Codec<VisualNovelDocumentJsonSchema, DomainVisualNovelDocument> {
  public readonly name = "VisualNovelCodec";

  public decode(raw: unknown): Result<DomainVisualNovelDocument, CodecError> {
    const valResult = validateVisualNovelDocument(raw);
    if (!valResult.success) {
      return failCodecDecode("Visual Novel document", valResult.errors);
    }

    const doc = valResult.data;
    const scenesRes = transformDictionaryResult(doc.scenes, (s) => this.decodeScene(s));
    if (!scenesRes.isOk()) {
      return err(scenesRes.error);
    }

    return ok({
      version: doc.version,
      scenes: scenesRes.value
    });
  }

  public encode(domain: DomainVisualNovelDocument): Result<VisualNovelDocumentJsonSchema, CodecError> {
    const scenesRes = transformDictionaryResult(domain.scenes, (s) => this.encodeScene(s));
    if (!scenesRes.isOk()) {
      return err(scenesRes.error);
    }

    const docJson: VisualNovelDocumentJsonSchema = {
      version: domain.version,
      scenes: scenesRes.value
    };

    const valResult = validateVisualNovelDocument(docJson);
    if (!valResult.success) {
      return failCodecEncode("Visual Novel document", valResult.errors);
    }

    return ok(valResult.data);
  }

  public decodeScene(raw: unknown): Result<DomainVisualNovelScene, CodecError> {
    const valResult = validateVisualNovelScene(raw);
    if (!valResult.success) {
      return failCodecDecode("Visual Novel scene", valResult.errors);
    }

    const s = valResult.data;
    const domainNodes: Record<string, DomainVisualNovelNode> = {};
    for (const [nKey, nVal] of Object.entries(s.nodes)) {
      domainNodes[nKey] = cloneVisualNovelNode(nVal);
    }

    return ok({
      sceneId: s.sceneId,
      titleKey: s.titleKey,
      initialNodeId: s.initialNodeId,
      backgroundId: s.backgroundId,
      musicCue: s.musicCue,
      metadata: cloneSceneMetadata(s.metadata),
      nodes: domainNodes
    });
  }

  public encodeScene(domain: DomainVisualNovelScene): Result<VisualNovelSceneJsonSchema, CodecError> {
    const nodesJson: Record<string, VisualNovelNodeSchema> = {};
    for (const [nKey, nVal] of Object.entries(domain.nodes)) {
      nodesJson[nKey] = cloneVisualNovelNode(nVal);
    }

    const sceneJson: VisualNovelSceneJsonSchema = {
      sceneId: domain.sceneId,
      titleKey: domain.titleKey,
      initialNodeId: domain.initialNodeId,
      backgroundId: domain.backgroundId,
      musicCue: domain.musicCue,
      metadata: cloneSceneMetadata(domain.metadata),
      nodes: nodesJson
    };

    const valResult = validateVisualNovelScene(sceneJson);
    if (!valResult.success) {
      return failCodecEncode("Visual Novel scene", valResult.errors);
    }

    return ok(valResult.data);
  }
}

export const visualNovelCodec = new VisualNovelCodec();
