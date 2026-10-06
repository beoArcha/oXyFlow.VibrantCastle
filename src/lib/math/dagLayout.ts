export interface DagNodePosition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly tier: number;
}

export interface DagEdge {
  readonly fromId: string;
  readonly toId: string;
}

export interface DagLayoutResult {
  readonly nodes: DagNodePosition[];
  readonly edges: DagEdge[];
  readonly hasCycles: boolean;
  readonly cycles: string[][];
  readonly width: number;
  readonly height: number;
}

export interface DagLayoutSkillInput {
  id: string;
  reqSkillId?: string | null;
  tier?: number;
  gridX?: number;
  gridY?: number;
}

export interface DagLayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
  padding?: number;
}

/**
 * Calculates deterministic node coordinates and edge routes for skill tree DAGs.
 * Detects cycles using directed depth-first search.
 */
export function calculateDagNodePositions(
  skills: readonly DagLayoutSkillInput[],
  options: DagLayoutOptions = {}
): DagLayoutResult {
  const nodeWidth = options.nodeWidth ?? 120;
  const nodeHeight = options.nodeHeight ?? 60;
  const horizontalSpacing = options.horizontalSpacing ?? 60;
  const verticalSpacing = options.verticalSpacing ?? 80;
  const padding = options.padding ?? 40;

  // 1. Extract Edges & Adjacency Graph
  const edges: DagEdge[] = [];
  const adjacency = new Map<string, string[]>();

  skills.forEach((skill) => {
    if (!adjacency.has(skill.id)) {
      adjacency.set(skill.id, []);
    }
    if (skill.reqSkillId) {
      edges.push({ fromId: skill.reqSkillId, toId: skill.id });
      const currentList = adjacency.get(skill.reqSkillId) ?? [];
      currentList.push(skill.id);
      adjacency.set(skill.reqSkillId, currentList);
    }
  });

  // 2. Cycle Detection via DFS
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: string[][] = [];

  function detectCycles(nodeId: string, path: string[]) {
    visited.add(nodeId);
    inStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        detectCycles(neighbor, path);
      } else if (inStack.has(neighbor)) {
        // Cycle detected
        const cycleStartIndex = path.indexOf(neighbor);
        if (cycleStartIndex >= 0) {
          cycles.push(path.slice(cycleStartIndex).concat(neighbor));
        }
      }
    }

    path.pop();
    inStack.delete(nodeId);
  }

  skills.forEach((skill) => {
    if (!visited.has(skill.id)) {
      detectCycles(skill.id, []);
    }
  });

  // 3. Group Nodes by Tier / Layer
  const tierGroups = new Map<number, DagLayoutSkillInput[]>();
  skills.forEach((skill) => {
    const tier = skill.tier ?? 1;
    const group = tierGroups.get(tier) ?? [];
    group.push(skill);
    tierGroups.set(tier, group);
  });

  // Sort tiers numerically
  const sortedTiers = Array.from(tierGroups.keys()).sort((a, b) => a - b);

  // 4. Compute Coordinates
  const nodes: DagNodePosition[] = [];
  let maxColCount = 1;

  sortedTiers.forEach((tier) => {
    const group = tierGroups.get(tier) ?? [];
    if (group.length > maxColCount) {
      maxColCount = group.length;
    }
  });

  const totalWidth = Math.max(
    600,
    padding * 2 + maxColCount * nodeWidth + (maxColCount - 1) * horizontalSpacing
  );

  sortedTiers.forEach((tier, tierIdx) => {
    const group = tierGroups.get(tier) ?? [];
    // Sort skills deterministically by gridX or id
    const sortedGroup = [...group].sort((a, b) => {
      if (a.gridX !== undefined && b.gridX !== undefined) {
        return a.gridX - b.gridX;
      }
      return a.id.localeCompare(b.id);
    });

    const tierCount = sortedGroup.length;
    const tierRowWidth = tierCount * nodeWidth + (tierCount - 1) * horizontalSpacing;
    const startX = (totalWidth - tierRowWidth) / 2;
    const y = padding + tierIdx * (nodeHeight + verticalSpacing);

    sortedGroup.forEach((skill, colIdx) => {
      const x = startX + colIdx * (nodeWidth + horizontalSpacing);
      nodes.push({
        id: skill.id,
        x: Math.round(x),
        y: Math.round(y),
        tier,
      });
    });
  });

  const totalHeight =
    padding * 2 +
    sortedTiers.length * nodeHeight +
    Math.max(0, sortedTiers.length - 1) * verticalSpacing;

  return {
    nodes,
    edges,
    hasCycles: cycles.length > 0,
    cycles,
    width: totalWidth,
    height: totalHeight,
  };
}
