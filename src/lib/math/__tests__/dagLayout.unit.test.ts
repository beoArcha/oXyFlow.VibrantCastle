import { describe, it, expect } from "bun:test";
import { calculateDagNodePositions, DagLayoutSkillInput } from "../dagLayout";
import skillsJson from "@data/skills/skills.json";

describe("calculateDagNodePositions", () => {
  it("computes deterministic coordinates and edges for a linear dependency chain", () => {
    const input: DagLayoutSkillInput[] = [
      { id: "root", tier: 1 },
      { id: "mid", reqSkillId: "root", tier: 2 },
      { id: "leaf", reqSkillId: "mid", tier: 3 },
    ];

    const result = calculateDagNodePositions(input);

    expect(result.hasCycles).toBe(false);
    expect(result.cycles).toHaveLength(0);
    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toEqual([
      { fromId: "root", toId: "mid" },
      { fromId: "mid", toId: "leaf" },
    ]);

    const rootNode = result.nodes.find((n) => n.id === "root")!;
    const midNode = result.nodes.find((n) => n.id === "mid")!;
    const leafNode = result.nodes.find((n) => n.id === "leaf")!;

    expect(rootNode.y).toBeLessThan(midNode.y);
    expect(midNode.y).toBeLessThan(leafNode.y);
  });

  it("detects direct and indirect cycles in dependencies", () => {
    const directCycleInput: DagLayoutSkillInput[] = [
      { id: "node_a", reqSkillId: "node_b", tier: 1 },
      { id: "node_b", reqSkillId: "node_a", tier: 1 },
    ];

    const directResult = calculateDagNodePositions(directCycleInput);
    expect(directResult.hasCycles).toBe(true);
    expect(directResult.cycles.length).toBeGreaterThan(0);

    const triangleCycleInput: DagLayoutSkillInput[] = [
      { id: "alpha", reqSkillId: "gamma", tier: 1 },
      { id: "beta", reqSkillId: "alpha", tier: 2 },
      { id: "gamma", reqSkillId: "beta", tier: 3 },
    ];

    const triangleResult = calculateDagNodePositions(triangleCycleInput);
    expect(triangleResult.hasCycles).toBe(true);
    expect(triangleResult.cycles.length).toBeGreaterThan(0);
  });

  it("handles branch splitting and multi-child layout without overlap", () => {
    const branchingInput: DagLayoutSkillInput[] = [
      { id: "root", tier: 1 },
      { id: "branch_left", reqSkillId: "root", tier: 2, gridX: 0 },
      { id: "branch_right", reqSkillId: "root", tier: 2, gridX: 1 },
    ];

    const result = calculateDagNodePositions(branchingInput);
    expect(result.hasCycles).toBe(false);
    expect(result.nodes).toHaveLength(3);

    const left = result.nodes.find((n) => n.id === "branch_left")!;
    const right = result.nodes.find((n) => n.id === "branch_right")!;

    expect(left.y).toBe(right.y);
    expect(left.x).toBeLessThan(right.x);
  });

  it("verifies canonical skills document contains strictly zero dependency cycles", () => {
    const rawSkills = Object.values(skillsJson).flat() as DagLayoutSkillInput[];
    const result = calculateDagNodePositions(rawSkills);

    expect(result.hasCycles).toBe(false);
    expect(result.cycles).toHaveLength(0);
    expect(result.nodes.length).toBe(rawSkills.length);
  });
});
