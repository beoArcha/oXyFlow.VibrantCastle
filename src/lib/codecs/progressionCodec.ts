/**
 * Skill Progression (DAG) Bidirectional Codec
 * 
 * Translates between external progression/skill_trees.json format and internal
 * DomainSkillProgression models with strict DAG validation and error handling.
 */

import { Result, ok, err, CodecError, ErrorCode } from "../errors";
import {
  SkillTreeNodeDagJsonSchema,
  SkillTreeDagJsonSchema,
  SkillProgressionDocumentJsonSchema,
  validateSkillTreeNodeDag,
  validateSkillTreeDag,
  validateSkillProgressionDocument
} from "../schemas/progressionSchema";
import { Codec } from "./codecInterface";

export interface DomainSkillTreeNodeDag {
  skillId: string;
  tier: number;
  pointCost: number;
  prerequisites: string[];
  gridPosition: {
    x: number;
    y: number;
  };
}

export interface DomainSkillTreeDag {
  treeId: string;
  nameKey: string;
  icon: string;
  rootSkillIds: string[];
  nodes: Record<string, DomainSkillTreeNodeDag>;
}

export interface DomainSkillProgressionDocument {
  version: string;
  characters: {
    valen: {
      trees: DomainSkillTreeDag[];
    };
    aurelia: {
      trees: DomainSkillTreeDag[];
    };
  };
}

export class ProgressionCodec
  implements Codec<SkillProgressionDocumentJsonSchema, DomainSkillProgressionDocument> {
  public readonly name = "ProgressionCodec";

  public decode(raw: unknown): Result<DomainSkillProgressionDocument, CodecError> {
    const valResult = validateSkillProgressionDocument(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode SkillProgressionDocument: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const doc = valResult.data;
    const mapTree = (tree: SkillTreeDagJsonSchema): DomainSkillTreeDag => {
      const nodesMap: Record<string, DomainSkillTreeNodeDag> = {};
      for (const [key, n] of Object.entries(tree.nodes)) {
        nodesMap[key] = {
          skillId: n.skillId,
          tier: n.tier,
          pointCost: n.pointCost,
          prerequisites: [...n.prerequisites],
          gridPosition: { ...n.gridPosition }
        };
      }
      return {
        treeId: tree.treeId,
        nameKey: tree.nameKey,
        icon: tree.icon,
        rootSkillIds: [...tree.rootSkillIds],
        nodes: nodesMap
      };
    };

    const domain: DomainSkillProgressionDocument = {
      version: doc.version,
      characters: {
        valen: {
          trees: doc.characters.valen.trees.map(mapTree)
        },
        aurelia: {
          trees: doc.characters.aurelia.trees.map(mapTree)
        }
      }
    };

    return ok(domain);
  }

  public encode(
    domain: DomainSkillProgressionDocument
  ): Result<SkillProgressionDocumentJsonSchema, CodecError> {
    if (!domain || typeof domain !== "object") {
      return err(
        new CodecError(
          "Invalid DomainSkillProgressionDocument provided for encoding",
          ErrorCode.CODEC_ENCODE_FAILED
        )
      );
    }

    const mapTreeJson = (tree: DomainSkillTreeDag): SkillTreeDagJsonSchema => {
      const nodesMap: Record<string, SkillTreeNodeDagJsonSchema> = {};
      for (const [key, n] of Object.entries(tree.nodes)) {
        nodesMap[key] = {
          skillId: n.skillId,
          tier: n.tier,
          pointCost: n.pointCost,
          prerequisites: [...n.prerequisites],
          gridPosition: { ...n.gridPosition }
        };
      }
      return {
        treeId: tree.treeId,
        nameKey: tree.nameKey,
        icon: tree.icon,
        rootSkillIds: [...tree.rootSkillIds],
        nodes: nodesMap
      };
    };

    const jsonDoc: SkillProgressionDocumentJsonSchema = {
      version: domain.version,
      characters: {
        valen: {
          trees: domain.characters.valen.trees.map(mapTreeJson)
        },
        aurelia: {
          trees: domain.characters.aurelia.trees.map(mapTreeJson)
        }
      }
    };

    const valResult = validateSkillProgressionDocument(jsonDoc);
    if (!valResult.success) {
      return err(
        new CodecError(
          "Encoded progression document failed schema validation",
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }

  public decodeTree(raw: unknown): Result<DomainSkillTreeDag, CodecError> {
    const valResult = validateSkillTreeDag(raw);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      return err(
        new CodecError(
          `Failed to decode SkillTree DAG: ${messages}`,
          ErrorCode.CODEC_DECODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    const tree = valResult.data;
    const nodesMap: Record<string, DomainSkillTreeNodeDag> = {};
    for (const [key, n] of Object.entries(tree.nodes)) {
      nodesMap[key] = {
        skillId: n.skillId,
        tier: n.tier,
        pointCost: n.pointCost,
        prerequisites: [...n.prerequisites],
        gridPosition: { ...n.gridPosition }
      };
    }

    return ok({
      treeId: tree.treeId,
      nameKey: tree.nameKey,
      icon: tree.icon,
      rootSkillIds: [...tree.rootSkillIds],
      nodes: nodesMap
    });
  }

  public encodeTree(domain: DomainSkillTreeDag): Result<SkillTreeDagJsonSchema, CodecError> {
    const nodesMap: Record<string, SkillTreeNodeDagJsonSchema> = {};
    for (const [key, n] of Object.entries(domain.nodes)) {
      nodesMap[key] = {
        skillId: n.skillId,
        tier: n.tier,
        pointCost: n.pointCost,
        prerequisites: [...n.prerequisites],
        gridPosition: { ...n.gridPosition }
      };
    }

    const treeJson: SkillTreeDagJsonSchema = {
      treeId: domain.treeId,
      nameKey: domain.nameKey,
      icon: domain.icon,
      rootSkillIds: [...domain.rootSkillIds],
      nodes: nodesMap
    };

    const valResult = validateSkillTreeDag(treeJson);
    if (!valResult.success) {
      return err(
        new CodecError(
          "Encoded skill tree DAG failed schema validation",
          ErrorCode.CODEC_ENCODE_FAILED,
          { details: { errors: valResult.errors } }
        )
      );
    }

    return ok(valResult.data);
  }
}
