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
  validateSkillTreeDag,
  validateSkillProgressionDocument
} from "../schemas/progressionSchema";
import { Codec } from "./codecInterface";
import { failCodecDecode, failCodecEncode } from "./codecUtils";

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

function cloneSkillTreeNodes(
  nodes: Record<string, SkillTreeNodeDagJsonSchema | DomainSkillTreeNodeDag>
): Record<string, DomainSkillTreeNodeDag> {
  const result: Record<string, DomainSkillTreeNodeDag> = {};
  for (const [key, n] of Object.entries(nodes)) {
    result[key] = {
      skillId: n.skillId,
      tier: n.tier,
      pointCost: n.pointCost,
      prerequisites: [...n.prerequisites],
      gridPosition: { ...n.gridPosition }
    };
  }
  return result;
}

function cloneSkillTree(tree: SkillTreeDagJsonSchema | DomainSkillTreeDag): DomainSkillTreeDag {
  return {
    treeId: tree.treeId,
    nameKey: tree.nameKey,
    icon: tree.icon,
    rootSkillIds: [...tree.rootSkillIds],
    nodes: cloneSkillTreeNodes(tree.nodes)
  };
}

export class ProgressionCodec
  implements Codec<SkillProgressionDocumentJsonSchema, DomainSkillProgressionDocument> {
  public readonly name = "ProgressionCodec";

  public decode(raw: unknown): Result<DomainSkillProgressionDocument, CodecError> {
    const valResult = validateSkillProgressionDocument(raw);
    if (!valResult.success) {
      return failCodecDecode("SkillProgressionDocument", valResult.errors);
    }

    const doc = valResult.data;
    return ok({
      version: doc.version,
      characters: {
        valen: {
          trees: doc.characters.valen.trees.map(cloneSkillTree)
        },
        aurelia: {
          trees: doc.characters.aurelia.trees.map(cloneSkillTree)
        }
      }
    });
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

    const jsonDoc: SkillProgressionDocumentJsonSchema = {
      version: domain.version,
      characters: {
        valen: {
          trees: domain.characters.valen.trees.map(cloneSkillTree)
        },
        aurelia: {
          trees: domain.characters.aurelia.trees.map(cloneSkillTree)
        }
      }
    };

    const valResult = validateSkillProgressionDocument(jsonDoc);
    if (!valResult.success) {
      return failCodecEncode("SkillProgressionDocument", valResult.errors);
    }

    return ok(valResult.data);
  }

  public decodeTree(raw: unknown): Result<DomainSkillTreeDag, CodecError> {
    const valResult = validateSkillTreeDag(raw);
    if (!valResult.success) {
      return failCodecDecode("SkillTree DAG", valResult.errors);
    }

    return ok(cloneSkillTree(valResult.data));
  }

  public encodeTree(domain: DomainSkillTreeDag): Result<SkillTreeDagJsonSchema, CodecError> {
    const treeJson = cloneSkillTree(domain);
    const valResult = validateSkillTreeDag(treeJson);
    if (!valResult.success) {
      return failCodecEncode("SkillTree DAG", valResult.errors);
    }

    return ok(valResult.data);
  }
}

export const progressionCodec = new ProgressionCodec();
