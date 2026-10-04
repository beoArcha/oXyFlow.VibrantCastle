import { describe, it, expect } from "bun:test";
import path from "path";
import { getAllSourceFiles } from "./helpers/archScanner";
import {
  buildDependencyGraph,
  findCircularDependencies,
  formatCyclePath,
} from "./helpers/dependencyGraph";
import { CircularDependencyError } from "@lib/errors";

/**
 * ARCHITECTURAL TEST SUITE: Circular Dependencies Detection
 *
 * Rationale & Invariant:
 * ESM and Vite bundlers require a Directed Acyclic Graph (DAG) for module initialization.
 * Circular dependencies at runtime introduce Temporal Dead Zone (TDZ) bugs, leading to:
 *   `ReferenceError: Cannot access '<Module>' before initialization`
 * or silent undefined exports during bundle startup.
 *
 * This test suite enforces that:
 * 1. Zero runtime circular dependencies exist across all TypeScript/TSX source files in src/.
 * 2. Zero static module dependency cycles (including type re-exports) exist across production files.
 */
describe("Circular Dependency Invariants (ESM & Bundler Safety)", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const srcDir = path.join(rootDir, "src");

  // Collect all TypeScript source files, excluding test fixtures and test specs
  const allSourceFiles = getAllSourceFiles(srcDir);
  const productionSourceFiles = allSourceFiles.filter(
    (f) => !f.includes("__tests__") && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx")
  );

  it("ensures zero runtime circular dependency cycles across all production source files", () => {
    const graph = buildDependencyGraph({
      rootDir,
      files: productionSourceFiles,
      includeTypeOnly: false,
    });

    const cycles = findCircularDependencies(graph);

    if (cycles.length > 0) {
      const formattedCycles = cycles
        .map((cycle, idx) => `  [Cycle ${idx + 1}] ${formatCyclePath(cycle, rootDir)}`)
        .join("\n");

      throw new CircularDependencyError(
        `Found ${cycles.length} runtime circular dependency cycle(s):\n${formattedCycles}\n` +
          `Remediation: Decouple dependencies by extracting shared types/interfaces to a foundational module ` +
          `or converting value imports to 'import type'.`,
        cycles
      );
    }

    expect(cycles).toHaveLength(0);
  });

  it("ensures zero module dependency cycles (including type re-exports) across production files", () => {
    const graph = buildDependencyGraph({
      rootDir,
      files: productionSourceFiles,
      includeTypeOnly: true,
    });

    const cycles = findCircularDependencies(graph);

    if (cycles.length > 0) {
      const formattedCycles = cycles
        .map((cycle, idx) => `  [Cycle ${idx + 1}] ${formatCyclePath(cycle, rootDir)}`)
        .join("\n");

      throw new CircularDependencyError(
        `Found ${cycles.length} module dependency cycle(s) (including types):\n${formattedCycles}\n` +
          `Remediation: Eliminate mutual import loops between modules to preserve clean DAG architecture.`,
        cycles
      );
    }

    expect(cycles).toHaveLength(0);
  });

  it("ensures zero runtime circular dependencies exist when including test files", () => {
    const graph = buildDependencyGraph({
      rootDir,
      files: allSourceFiles,
      includeTypeOnly: false,
    });

    const cycles = findCircularDependencies(graph);

    if (cycles.length > 0) {
      const formattedCycles = cycles
        .map((cycle, idx) => `  [Cycle ${idx + 1}] ${formatCyclePath(cycle, rootDir)}`)
        .join("\n");

      throw new CircularDependencyError(
        `Found ${cycles.length} runtime circular dependency cycle(s) including tests:\n${formattedCycles}`,
        cycles
      );
    }

    expect(cycles).toHaveLength(0);
  });
});
