/**
 * Skill Tree Progression (DAG) Schema Contract & Validator
 * 
 * Formal contract for hero progression trees modeled as Directed Acyclic Graphs (DAG).
 * Validates acyclicity, root skill entry points, prerequisites referential integrity,
 * and character segregation for Valen and Aurelia.
 */

import {
  ValidationErrorDetail,
  ValidationResult,
  successResult,
  failureResult,
  validateNonEmptyString,
  validateNumber,
  validateArray,
  validateObject
} from "./commonSchema";

export interface SkillTreeNodeDagJsonSchema {
  skillId: string;
  tier: number;
  pointCost: number;
  prerequisites: string[];
  gridPosition: {
    x: number;
    y: number;
  };
}

export interface SkillTreeDagJsonSchema {
  treeId: string;
  nameKey: string;
  icon: string;
  rootSkillIds: string[];
  nodes: Record<string, SkillTreeNodeDagJsonSchema>;
}

export interface CharacterSkillTreesJsonSchema {
  trees: SkillTreeDagJsonSchema[];
}

export interface SkillProgressionDocumentJsonSchema {
  version: string;
  characters: {
    valen: CharacterSkillTreesJsonSchema;
    aurelia: CharacterSkillTreesJsonSchema;
  };
}

/**
 * Validates an individual node within a skill tree DAG.
 */
export function validateSkillTreeNodeDag(
  raw: unknown,
  pathPrefix = ""
): ValidationResult<SkillTreeNodeDagJsonSchema> {
  const errors: ValidationErrorDetail[] = [];
  const prefix = pathPrefix ? `${pathPrefix}.` : "";

  if (!validateObject(raw, pathPrefix || "skillTreeNodeDag", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.skillId, `${prefix}skillId`, errors);
  validateNumber(raw.tier, `${prefix}tier`, errors, 1, 10);
  validateNumber(raw.pointCost, `${prefix}pointCost`, errors, 0, 100);

  if (validateArray(raw.prerequisites, `${prefix}prerequisites`, errors)) {
    raw.prerequisites.forEach((prereq, index) => {
      validateNonEmptyString(prereq, `${prefix}prerequisites[${index}]`, errors);
    });
  }

  if (validateObject(raw.gridPosition, `${prefix}gridPosition`, errors)) {
    validateNumber(raw.gridPosition.x, `${prefix}gridPosition.x`, errors);
    validateNumber(raw.gridPosition.y, `${prefix}gridPosition.y`, errors);
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult(raw as unknown as SkillTreeNodeDagJsonSchema);
}

/**
 * Detects cycles in a Directed Graph defined by nodes and their prerequisites.
 * An edge exists from prerequisite -> node (prerequisite unlocks node).
 * Returns cycle path string if cycle exists, or null if strictly acyclic (DAG).
 */
export function detectDagCycle(
  nodes: Record<string, SkillTreeNodeDagJsonSchema>
): string[] | null {
  // 0 = unvisited, 1 = visiting, 2 = visited
  const state = new Map<string, number>();
  const parent = new Map<string, string>();
  const nodeKeys = Object.keys(nodes);

  for (const key of nodeKeys) {
    state.set(key, 0);
  }

  function dfs(current: string, path: string[]): string[] | null {
    state.set(current, 1);
    path.push(current);

    const node = nodes[current];
    if (node && Array.isArray(node.prerequisites)) {
      for (const prereq of node.prerequisites) {
        // We evaluate edges prereq -> current or dependency edge current depends on prereq
        // A cycle in dependency: current -> prereq
        const prereqState = state.get(prereq);
        if (prereqState === 1) {
          // Back-edge found: Cycle!
          const cycleStartIndex = path.indexOf(prereq);
          const cycle = path.slice(cycleStartIndex);
          cycle.push(prereq);
          return cycle;
        }
        if (prereqState === 0) {
          parent.set(prereq, current);
          const cycleFound = dfs(prereq, path);
          if (cycleFound) return cycleFound;
        }
      }
    }

    path.pop();
    state.set(current, 2);
    return null;
  }

  for (const key of nodeKeys) {
    if (state.get(key) === 0) {
      const cycle = dfs(key, []);
      if (cycle) return cycle;
    }
  }

  return null;
}

/**
 * Validates a single skill tree DAG, verifying roots, referential prerequisite integrity,
 * and acyclicity.
 */
export function validateSkillTreeDag(
  raw: unknown,
  pathPrefix = ""
): ValidationResult<SkillTreeDagJsonSchema> {
  const errors: ValidationErrorDetail[] = [];
  const prefix = pathPrefix ? `${pathPrefix}.` : "";

  if (!validateObject(raw, pathPrefix || "skillTreeDag", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.treeId, `${prefix}treeId`, errors);
  validateNonEmptyString(raw.nameKey, `${prefix}nameKey`, errors);
  validateNonEmptyString(raw.icon, `${prefix}icon`, errors);

  if (validateArray(raw.rootSkillIds, `${prefix}rootSkillIds`, errors)) {
    if (raw.rootSkillIds.length === 0) {
      errors.push({
        path: `${prefix}rootSkillIds`,
        message: "Skill tree DAG must define at least one root skill identifier",
        received: raw.rootSkillIds
      });
    }
    raw.rootSkillIds.forEach((rootId, index) => {
      validateNonEmptyString(rootId, `${prefix}rootSkillIds[${index}]`, errors);
    });
  }

  if (!validateObject(raw.nodes, `${prefix}nodes`, errors)) {
    return failureResult(errors);
  }

  const validatedNodes: Record<string, SkillTreeNodeDagJsonSchema> = {};

  for (const [key, value] of Object.entries(raw.nodes)) {
    const nodeRes = validateSkillTreeNodeDag(value, `${prefix}nodes.${key}`);
    if (!nodeRes.success) {
      errors.push(...nodeRes.errors);
    } else {
      if (nodeRes.data.skillId !== key) {
        errors.push({
          path: `${prefix}nodes.${key}.skillId`,
          message: `Node key '${key}' does not match skillId '${nodeRes.data.skillId}'`,
          received: nodeRes.data.skillId
        });
      }
      validatedNodes[key] = nodeRes.data;
    }
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  // Referential Integrity: Root skills must exist in nodes
  if (Array.isArray(raw.rootSkillIds)) {
    for (const rootId of raw.rootSkillIds) {
      if (!validatedNodes[rootId]) {
        errors.push({
          path: `${prefix}rootSkillIds`,
          message: `Root skill '${rootId}' is not declared in tree nodes dictionary`,
          received: rootId
        });
      }
    }
  }

  // Referential Integrity: Prerequisites must exist in nodes
  for (const [nodeId, node] of Object.entries(validatedNodes)) {
    for (const prereqId of node.prerequisites) {
      if (!validatedNodes[prereqId]) {
        errors.push({
          path: `${prefix}nodes.${nodeId}.prerequisites`,
          message: `Prerequisite '${prereqId}' declared by node '${nodeId}' does not exist in tree nodes`,
          received: prereqId
        });
      }
    }
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  // Cycle Detection: Must be a strictly Directed Acyclic Graph (DAG)
  const detectedCycle = detectDagCycle(validatedNodes);
  if (detectedCycle) {
    errors.push({
      path: `${prefix}nodes`,
      message: `Cyclic dependency detected in skill tree DAG: ${detectedCycle.join(" -> ")}`,
      received: detectedCycle
    });
    return failureResult(errors);
  }

  return successResult({
    treeId: raw.treeId as string,
    nameKey: raw.nameKey as string,
    icon: raw.icon as string,
    rootSkillIds: raw.rootSkillIds as string[],
    nodes: validatedNodes
  });
}

/**
 * Validates the full progression document containing skill trees for Valen and Aurelia.
 */
export function validateSkillProgressionDocument(
  raw: unknown
): ValidationResult<SkillProgressionDocumentJsonSchema> {
  const errors: ValidationErrorDetail[] = [];

  if (!validateObject(raw, "progressionDocument", errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.version, "progressionDocument.version", errors);

  if (!validateObject(raw.characters, "progressionDocument.characters", errors)) {
    return failureResult(errors);
  }

  const charactersResult: SkillProgressionDocumentJsonSchema["characters"] = {
    valen: { trees: [] },
    aurelia: { trees: [] }
  };

  const characterKeys = ["valen", "aurelia"] as const;

  for (const charKey of characterKeys) {
    const charObj = raw.characters[charKey];
    const charPath = `progressionDocument.characters.${charKey}`;

    if (!validateObject(charObj, charPath, errors)) {
      continue;
    }

    if (!validateArray(charObj.trees, `${charPath}.trees`, errors)) {
      continue;
    }

    const seenTreeIds = new Set<string>();

    charObj.trees.forEach((treeRaw, index) => {
      const treeRes = validateSkillTreeDag(treeRaw, `${charPath}.trees[${index}]`);
      if (!treeRes.success) {
        errors.push(...treeRes.errors);
      } else {
        if (seenTreeIds.has(treeRes.data.treeId)) {
          errors.push({
            path: `${charPath}.trees[${index}].treeId`,
            message: `Duplicate treeId '${treeRes.data.treeId}' found for character '${charKey}'`,
            received: treeRes.data.treeId
          });
        } else {
          seenTreeIds.add(treeRes.data.treeId);
          charactersResult[charKey].trees.push(treeRes.data);
        }
      }
    });
  }

  if (errors.length > 0) {
    return failureResult(errors);
  }

  return successResult({
    version: raw.version as string,
    characters: charactersResult
  });
}
