import { describe, it, expect } from "bun:test";
import {
  validateSkillTreeDag,
  validateSkillProgressionDocument,
  detectDagCycle,
  SkillTreeDagJsonSchema,
  SkillProgressionDocumentJsonSchema
} from "../progressionSchema";
import { ProgressionCodec } from "../../codecs/progressionCodec";

describe("Skill Tree DAG Schema & Progression Codec", () => {
  const validTree: SkillTreeDagJsonSchema = {
    treeId: "solar_duelist",
    nameKey: "treeValenSolarDuelist",
    icon: "Swords",
    rootSkillIds: ["valen_solar_thrust"],
    nodes: {
      valen_solar_thrust: {
        skillId: "valen_solar_thrust",
        tier: 1,
        pointCost: 1,
        prerequisites: [],
        gridPosition: { x: 1, y: 1 }
      },
      valen_flame_parry: {
        skillId: "valen_flame_parry",
        tier: 2,
        pointCost: 2,
        prerequisites: ["valen_solar_thrust"],
        gridPosition: { x: 1, y: 2 }
      },
      valen_radiant_execution: {
        skillId: "valen_radiant_execution",
        tier: 3,
        pointCost: 3,
        prerequisites: ["valen_flame_parry"],
        gridPosition: { x: 1, y: 3 }
      }
    }
  };

  const validDoc: SkillProgressionDocumentJsonSchema = {
    version: "2.0",
    characters: {
      valen: {
        trees: [validTree]
      },
      aurelia: {
        trees: [
          {
            treeId: "astral_sorcery",
            nameKey: "treeAureliaAstralSorcery",
            icon: "Sparkles",
            rootSkillIds: ["aurelia_aether_bolt"],
            nodes: {
              aurelia_aether_bolt: {
                skillId: "aurelia_aether_bolt",
                tier: 1,
                pointCost: 1,
                prerequisites: [],
                gridPosition: { x: 1, y: 1 }
              },
              aurelia_celestial_comet: {
                skillId: "aurelia_celestial_comet",
                tier: 2,
                pointCost: 2,
                prerequisites: ["aurelia_aether_bolt"],
                gridPosition: { x: 1, y: 2 }
              }
            }
          }
        ]
      }
    }
  };

  it("successfully validates a valid linear DAG tree", () => {
    const result = validateSkillTreeDag(validTree);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.treeId).toBe("solar_duelist");
      expect(Object.keys(result.data.nodes).length).toBe(3);
    }
  });

  it("successfully validates a branching DAG (multiple children and multiple roots)", () => {
    const branchingTree: SkillTreeDagJsonSchema = {
      treeId: "sun_warden",
      nameKey: "treeValenSunWarden",
      icon: "Shield",
      rootSkillIds: ["root_a", "root_b"],
      nodes: {
        root_a: {
          skillId: "root_a",
          tier: 1,
          pointCost: 1,
          prerequisites: [],
          gridPosition: { x: 1, y: 1 }
        },
        root_b: {
          skillId: "root_b",
          tier: 1,
          pointCost: 1,
          prerequisites: [],
          gridPosition: { x: 2, y: 1 }
        },
        child_ab: {
          skillId: "child_ab",
          tier: 2,
          pointCost: 2,
          prerequisites: ["root_a", "root_b"],
          gridPosition: { x: 1, y: 2 }
        }
      }
    };

    const result = validateSkillTreeDag(branchingTree);
    expect(result.success).toBe(true);
  });

  it("detects and rejects a direct 2-node cycle (A -> B -> A)", () => {
    const cyclicTree: SkillTreeDagJsonSchema = {
      treeId: "cyclic_tree_2",
      nameKey: "treeCyclic",
      icon: "Alert",
      rootSkillIds: ["node_a"],
      nodes: {
        node_a: {
          skillId: "node_a",
          tier: 1,
          pointCost: 1,
          prerequisites: ["node_b"],
          gridPosition: { x: 1, y: 1 }
        },
        node_b: {
          skillId: "node_b",
          tier: 2,
          pointCost: 2,
          prerequisites: ["node_a"],
          gridPosition: { x: 1, y: 2 }
        }
      }
    };

    const cycle = detectDagCycle(cyclicTree.nodes);
    expect(cycle).not.toBeNull();

    const result = validateSkillTreeDag(cyclicTree);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.message.includes("Cyclic dependency detected"))).toBe(true);
    }
  });

  it("detects and rejects a multi-node cycle (A -> B -> C -> A)", () => {
    const cyclicTree: SkillTreeDagJsonSchema = {
      treeId: "cyclic_tree_3",
      nameKey: "treeCyclic3",
      icon: "Alert",
      rootSkillIds: ["node_a"],
      nodes: {
        node_a: {
          skillId: "node_a",
          tier: 1,
          pointCost: 1,
          prerequisites: ["node_c"],
          gridPosition: { x: 1, y: 1 }
        },
        node_b: {
          skillId: "node_b",
          tier: 2,
          pointCost: 2,
          prerequisites: ["node_a"],
          gridPosition: { x: 1, y: 2 }
        },
        node_c: {
          skillId: "node_c",
          tier: 3,
          pointCost: 3,
          prerequisites: ["node_b"],
          gridPosition: { x: 1, y: 3 }
        }
      }
    };

    const cycle = detectDagCycle(cyclicTree.nodes);
    expect(cycle).not.toBeNull();

    const result = validateSkillTreeDag(cyclicTree);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.message.includes("Cyclic dependency detected"))).toBe(true);
    }
  });

  it("rejects trees where rootSkillIds are empty or not in nodes", () => {
    const invalidRoots: SkillTreeDagJsonSchema = {
      treeId: "invalid_roots",
      nameKey: "treeInvalidRoots",
      icon: "Cross",
      rootSkillIds: ["ghost_root"],
      nodes: {
        node_1: {
          skillId: "node_1",
          tier: 1,
          pointCost: 1,
          prerequisites: [],
          gridPosition: { x: 1, y: 1 }
        }
      }
    };

    const result = validateSkillTreeDag(invalidRoots);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.message.includes("ghost_root"))).toBe(true);
    }
  });

  it("rejects trees where prerequisite references a non-existent skill", () => {
    const missingPrereq: SkillTreeDagJsonSchema = {
      treeId: "missing_prereq",
      nameKey: "treeMissingPrereq",
      icon: "Cross",
      rootSkillIds: ["node_root"],
      nodes: {
        node_root: {
          skillId: "node_root",
          tier: 1,
          pointCost: 1,
          prerequisites: [],
          gridPosition: { x: 1, y: 1 }
        },
        node_child: {
          skillId: "node_child",
          tier: 2,
          pointCost: 2,
          prerequisites: ["phantom_skill_xyz"],
          gridPosition: { x: 1, y: 2 }
        }
      }
    };

    const result = validateSkillTreeDag(missingPrereq);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.message.includes("phantom_skill_xyz"))).toBe(true);
    }
  });

  it("validates full progression document with character separation", () => {
    const result = validateSkillProgressionDocument(validDoc);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.characters.valen.trees.length).toBe(1);
      expect(result.data.characters.aurelia.trees.length).toBe(1);
    }
  });

  it("ProgressionCodec decodes and encodes cleanly (round-trip)", () => {
    const codec = new ProgressionCodec();
    const decodeResult = codec.decode(validDoc);
    expect(decodeResult.isOk()).toBe(true);

    const domain = decodeResult.unwrap();
    expect(domain.version).toBe("2.0");
    expect(domain.characters.valen.trees[0].treeId).toBe("solar_duelist");

    const encodeResult = codec.encode(domain);
    expect(encodeResult.isOk()).toBe(true);

    const reEncoded = encodeResult.unwrap();
    expect(reEncoded).toEqual(validDoc);
  });

  it("ProgressionCodec returns error Result on malformed raw input", () => {
    const codec = new ProgressionCodec();
    const result = codec.decode({ invalid: true });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Failed to decode SkillProgressionDocument");
    }
  });

  it("validates canonical src/data/progression/skill_trees.json with zero schema errors", async () => {
    const { skillTreesData, skillsData } = await import("@data/index");
    const codec = new ProgressionCodec();
    const decodeResult = codec.decode(skillTreesData);
    expect(decodeResult.isOk()).toBe(true);

    const progression = decodeResult.unwrap();
    expect(progression.characters.valen.trees.length).toBe(2);
    expect(progression.characters.aurelia.trees.length).toBe(2);

    // Verify all nodes reference existing skills in skillsData
    const valenSkillIds = new Set(skillsData.valen.map((s) => s.id));
    const aureliaSkillIds = new Set(skillsData.aurelia.map((s) => s.id));

    for (const tree of progression.characters.valen.trees) {
      for (const node of Object.values(tree.nodes)) {
        expect(valenSkillIds.has(node.skillId)).toBe(true);
      }
    }

    for (const tree of progression.characters.aurelia.trees) {
      for (const node of Object.values(tree.nodes)) {
        expect(aureliaSkillIds.has(node.skillId)).toBe(true);
      }
    }
  });
});
