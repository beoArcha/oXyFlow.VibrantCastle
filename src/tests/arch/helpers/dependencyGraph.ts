import fs from "fs";
import path from "path";
import { stripComments } from "./archScanner";

export interface ExtractedModuleImport {
  specifier: string;
  isTypeOnly: boolean;
  lineNo: number;
}

export interface DependencyGraphOptions {
  rootDir: string;
  files: string[];
  includeTypeOnly?: boolean;
}

const TSCONFIG_ALIASES: Record<string, string> = {
  "@/": "src/",
  "@assets/": "src/assets/",
  "@game-menu/": "src/game-menu/",
  "@hud/": "src/hud/",
  "@context/": "src/context/",
  "@data/": "src/data/",
  "@game/": "src/game/",
  "@lib/": "src/lib/",
  "@i18n/": "src/i18n/",
  "@styles/": "src/styles/",
  "@test-utils/": "src/test-utils/",
  "@types/": "src/types/",
  "@ui/": "src/ui/",
};

const EXACT_ALIASES: Record<string, string> = {
  "@data": "src/data/index.ts",
  "@hud": "src/hud/index.ts",
  "@i18n": "src/i18n/index.ts",
  "@test-utils": "src/test-utils/index.ts",
  "@ui": "src/ui/index.ts",
};

const CANDIDATE_EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx", ".json"];

/**
 * Extracts static import and export-from statements from source code,
 * distinguishing runtime dependencies from type-only imports.
 */
export function extractModuleImports(code: string): ExtractedModuleImport[] {
  const clean = stripComments(code);
  const results: ExtractedModuleImport[] = [];

  // Unified regex matching both import and export-from statements in document order
  const moduleRegex = /(?:^|[;\r\n])\s*(import|export)\s*(?:(type)\s+)?(?:[\w*\s{},$]+from\s+)?['"]([^'"]+)['"]/g;

  let match: RegExpExecArray | null;
  while ((match = moduleRegex.exec(clean)) !== null) {
    const statementType = match[1]; // "import" or "export"
    const isTypeOnly = match[2] === "type";
    const specifier = match[3];

    // Compute exact line number of the import/export keyword
    const keywordOffset = match[0].indexOf(statementType);
    const keywordPos = match.index + keywordOffset;
    const lineNo = clean.substring(0, keywordPos).split("\n").length;

    results.push({ specifier, isTypeOnly, lineNo });
  }

  return results;
}

/**
 * Resolves a module specifier (relative or path alias) to an absolute filesystem path.
 * Returns null if the specifier belongs to an external package or cannot be resolved.
 */
export function resolveModuleSpecifier(
  importingFile: string,
  specifier: string,
  rootDir: string
): string | null {
  const srcDir = path.join(rootDir, "src");

  // Filter out node_modules / standard library packages
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
    let isConfiguredAlias = false;
    for (const prefix of Object.keys(TSCONFIG_ALIASES)) {
      if (specifier.startsWith(prefix)) {
        isConfiguredAlias = true;
        break;
      }
    }
    if (!isConfiguredAlias && !EXACT_ALIASES[specifier]) {
      return null;
    }
  }

  let basePath = "";
  if (EXACT_ALIASES[specifier]) {
    basePath = path.join(rootDir, EXACT_ALIASES[specifier]);
  } else if (specifier.startsWith(".")) {
    basePath = path.resolve(path.dirname(importingFile), specifier);
  } else {
    for (const [prefix, relTarget] of Object.entries(TSCONFIG_ALIASES)) {
      if (specifier.startsWith(prefix)) {
        basePath = path.join(rootDir, relTarget, specifier.slice(prefix.length));
        break;
      }
    }
  }

  if (!basePath) return null;

  // Direct file match
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return path.normalize(basePath);
  }

  // Probe known TypeScript extensions
  for (const ext of CANDIDATE_EXTENSIONS) {
    const candidate = basePath + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.normalize(candidate);
    }
  }

  return null;
}

/**
 * Builds a directed adjacency list representing dependencies between source files.
 */
export function buildDependencyGraph(options: DependencyGraphOptions): Map<string, Set<string>> {
  const { rootDir, files, includeTypeOnly = false } = options;
  const graph = new Map<string, Set<string>>();
  const srcDir = path.join(rootDir, "src");

  for (const file of files) {
    const targets = new Set<string>();
    const content = fs.readFileSync(file, "utf-8");
    const imports = extractModuleImports(content);

    for (const imp of imports) {
      if (!includeTypeOnly && imp.isTypeOnly) {
        continue;
      }

      const resolved = resolveModuleSpecifier(file, imp.specifier, rootDir);
      if (resolved && resolved.startsWith(srcDir) && resolved !== file) {
        targets.add(resolved);
      }
    }

    graph.set(path.normalize(file), targets);
  }

  return graph;
}

/**
 * Canonicalizes a cycle array by rotating it so the lexicographically smallest node comes first.
 * This guarantees that cycle [A, B, C, A] and [B, C, A, B] produce the same identity string.
 */
function canonicalizeCycle(cycle: string[]): string {
  const nodes = cycle.slice(0, cycle.length - 1);
  if (nodes.length <= 1) return nodes.join(" -> ");

  let minIndex = 0;
  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i] < nodes[minIndex]) {
      minIndex = i;
    }
  }

  const rotated = nodes.slice(minIndex).concat(nodes.slice(0, minIndex));
  rotated.push(rotated[0]);
  return rotated.join(" -> ");
}

/**
 * Detects all circular dependency paths in the directed graph using Depth-First Search (DFS).
 * Returns unique canonical cycles.
 */
export function findCircularDependencies(graph: Map<string, Set<string>>): string[][] {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const stack: string[] = [];
  const canonicalCycles = new Set<string>();
  const results: string[][] = [];

  function dfs(node: string) {
    visited.add(node);
    inStack.add(node);
    stack.push(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (inStack.has(neighbor)) {
        const cycleStartIndex = stack.indexOf(neighbor);
        const cycle = stack.slice(cycleStartIndex).concat(neighbor);
        const canonical = canonicalizeCycle(cycle);
        if (!canonicalCycles.has(canonical)) {
          canonicalCycles.add(canonical);
          results.push(cycle);
        }
      }
    }

    stack.pop();
    inStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return results;
}

/**
 * Formats a cycle path into a human-readable string relative to rootDir.
 */
export function formatCyclePath(cycle: string[], rootDir: string): string {
  return cycle
    .map((filePath) => path.relative(rootDir, filePath).replace(/\\/g, "/"))
    .join(" -> ");
}
