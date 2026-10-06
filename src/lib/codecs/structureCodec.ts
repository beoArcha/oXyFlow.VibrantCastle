/**
 * Structure Bidirectional Codec
 * Translates between external structures.json format and internal DomainStructureTemplate models.
 */

import { Result, ok, err, CodecError, ErrorCode } from "../errors";
import {
  StructureJsonSchema,
  StructuresDocumentJsonSchema,
  StructureDimensionsSchema,
  StructureAtlasSchema,
  StructureInteractionSchema,
  validateStructure,
  validateStructuresDocument,
  validateStructuresJson
} from "../schemas";
import { Codec } from "./codecInterface";

export interface DomainStructureTemplate {
  id: string;
  labelKey: string;
  defaultLabel: string;
  type: string;
  dimensions: StructureDimensionsSchema;
  atlas?: StructureAtlasSchema;
  interaction?: StructureInteractionSchema;
  proceduralFallback?: Record<string, string>;
}

export class StructureCodec implements Codec<StructureJsonSchema, DomainStructureTemplate> {
  public readonly name = "StructureCodec";

  public decode(raw: unknown): Result<DomainStructureTemplate, CodecError> {
    const valResult = validateStructure(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode Structure: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const d = valResult.data;
    const domain: DomainStructureTemplate = {
      id: d.id,
      labelKey: d.labelKey,
      defaultLabel: d.defaultLabel,
      type: d.type,
      dimensions: {
        width: d.dimensions.width,
        height: d.dimensions.height
      },
      atlas: d.atlas
        ? {
          presetId: d.atlas.presetId,
          states: d.atlas.states ? { ...d.atlas.states } : undefined
        }
        : undefined,
      interaction: d.interaction
        ? {
          type: d.interaction.type,
          activation: d.interaction.activation,
          triggerRadius: d.interaction.triggerRadius,
          effects: d.interaction.effects ? { ...d.interaction.effects } : undefined
        }
        : undefined,
      proceduralFallback: d.proceduralFallback ? { ...d.proceduralFallback } : undefined
    };

    return ok(domain);
  }

  public encode(domain: DomainStructureTemplate): Result<StructureJsonSchema, CodecError> {
    const json: StructureJsonSchema = {
      id: domain.id,
      labelKey: domain.labelKey,
      defaultLabel: domain.defaultLabel,
      type: domain.type,
      dimensions: {
        width: domain.dimensions.width,
        height: domain.dimensions.height
      },
      atlas: domain.atlas
        ? {
          presetId: domain.atlas.presetId,
          states: domain.atlas.states ? { ...domain.atlas.states } : undefined
        }
        : undefined,
      interaction: domain.interaction
        ? {
          type: domain.interaction.type,
          activation: domain.interaction.activation,
          triggerRadius: domain.interaction.triggerRadius,
          effects: domain.interaction.effects ? { ...domain.interaction.effects } : undefined
        }
        : undefined,
      proceduralFallback: domain.proceduralFallback ? { ...domain.proceduralFallback } : undefined
    };

    const valResult = validateStructure(json);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode Structure: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }

  public decodeDictionary(raw: unknown): Result<Record<string, DomainStructureTemplate>, CodecError> {
    const valResult = validateStructuresJson(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode Structures dictionary: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const dict: Record<string, DomainStructureTemplate> = {};
    for (const structJson of valResult.data) {
      const res = this.decode(structJson);
      if (!res.isOk()) return err(res.error);
      dict[res.value.id] = res.value;
    }

    return ok(dict);
  }

  public encodeDictionary(domain: Record<string, DomainStructureTemplate>): Result<StructuresDocumentJsonSchema, CodecError> {
    const structuresMap: Record<string, StructureJsonSchema> = {};
    for (const [id, structure] of Object.entries(domain)) {
      const res = this.encode(structure);
      if (!res.isOk()) return err(res.error);
      structuresMap[id] = res.value;
    }

    const doc: StructuresDocumentJsonSchema = {
      version: "1.0",
      structures: structuresMap
    };

    const valResult = validateStructuresDocument(doc);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to encode StructuresDocument: ${messages}`,
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }

  public decodeAll(raw: unknown): Result<DomainStructureTemplate[], CodecError> {
    const dictRes = this.decodeDictionary(raw);
    if (!dictRes.isOk()) {
      return err(dictRes.error);
    }
    return ok(Object.values(dictRes.value));
  }

  public encodeAll(domain: DomainStructureTemplate[]): Result<StructureJsonSchema[], CodecError> {
    const list: StructureJsonSchema[] = [];
    for (const structure of domain) {
      const res = this.encode(structure);
      if (!res.isOk()) return err(res.error);
      list.push(res.value);
    }
    return ok(list);
  }
}

export const structureCodec = new StructureCodec();
