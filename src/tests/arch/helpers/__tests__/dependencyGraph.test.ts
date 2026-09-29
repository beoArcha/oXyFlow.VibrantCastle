import { describe, it, expect } from "bun:test";
import path from "path";
import {
  extractModuleImports,
  resolveModuleSpecifier,
  findCircularDependencies,
  formatCyclePath,
} from "../dependencyGraph";

describe("dependencyGraph Helper Unit Tests", () => {
  const rootDir = path.resolve(__dirname, "../../../../..");

  describe("extractModuleImports", () => {
    it("differentiates between runtime imports and type-only imports", () => {
      const sampleCode = `
        import { useState } from "react";
        import type { GameSessionStats } from "./logic/stats";
        import { PlayerId } from "@game/types";
        export type { LocationId } from "./locations/types";
        export * from "./statsStorage";
      `;

      const imports = extractModuleImports(sampleCode);

      expect(imports).toEqual([
        { specifier: "react", isTypeOnly: false, lineNo: 2 },
        { specifier: "./logic/stats", isTypeOnly: true, lineNo: 3 },
        { specifier: "@game/types", isTypeOnly: false, lineNo: 4 },
        { specifier: "./locations/types", isTypeOnly: true, lineNo: 5 },
        { specifier: "./statsStorage", isTypeOnly: false, lineNo: 6 },
      ]);
    });

    it("ignores commented-out imports", () => {
      const sampleCode = `
        // import { dead1 } from "./dead1";
        /* import { dead2 } from "./dead2"; */
        import { live } from "./live";
      `;

      const imports = extractModuleImports(sampleCode);

      expect(imports).toEqual([
        { specifier: "./live", isTypeOnly: false, lineNo: 4 },
      ]);
    });
  });

  describe("resolveModuleSpecifier", () => {
    const dummyFile = path.join(rootDir, "src/game/physics/physics.ts");

    it("returns null for external npm modules", () => {
      expect(resolveModuleSpecifier(dummyFile, "react", rootDir)).toBeNull();
      expect(resolveModuleSpecifier(dummyFile, "lucide-react", rootDir)).toBeNull();
      expect(resolveModuleSpecifier(dummyFile, "clsx", rootDir)).toBeNull();
    });

    it("resolves relative imports within src/", () => {
      const resolved = resolveModuleSpecifier(dummyFile, "./collisions", rootDir);
      expect(resolved).not.toBeNull();
      expect(resolved!.replace(/\\/g, "/")).toContain("src/game/physics/collisions.ts");
    });

    it("resolves @game/ path aliases", () => {
      const resolved = resolveModuleSpecifier(dummyFile, "@game/types", rootDir);
      expect(resolved).not.toBeNull();
      expect(resolved!.replace(/\\/g, "/")).toContain("src/game/types.ts");
    });

    it("resolves exact @i18n alias to index.ts", () => {
      const resolved = resolveModuleSpecifier(dummyFile, "@i18n", rootDir);
      expect(resolved).not.toBeNull();
      expect(resolved!.replace(/\\/g, "/")).toContain("src/i18n/index.ts");
    });
  });

  describe("findCircularDependencies", () => {
    it("reports zero cycles for a valid Directed Acyclic Graph (DAG)", () => {
      const graph = new Map<string, Set<string>>([
        ["A", new Set(["B", "C"])],
        ["B", new Set(["C"])],
        ["C", new Set()],
      ]);

      const cycles = findCircularDependencies(graph);
      expect(cycles).toHaveLength(0);
    });

    it("detects direct 2-node cycle (A -> B -> A)", () => {
      const graph = new Map<string, Set<string>>([
        ["A", new Set(["B"])],
        ["B", new Set(["A"])],
      ]);

      const cycles = findCircularDependencies(graph);
      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toEqual(["A", "B", "A"]);
    });

    it("detects multi-node cycle (A -> B -> C -> A)", () => {
      const graph = new Map<string, Set<string>>([
        ["A", new Set(["B"])],
        ["B", new Set(["C"])],
        ["C", new Set(["A"])],
      ]);

      const cycles = findCircularDependencies(graph);
      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toEqual(["A", "B", "C", "A"]);
    });

    it("deduplicates rotated representations of the same cycle", () => {
      // Starting DFS from B would produce B -> C -> A -> B
      // Starting from A would produce A -> B -> C -> A
      // The detector canonicalizes to one unique cycle.
      const graph = new Map<string, Set<string>>([
        ["B", new Set(["C"])],
        ["C", new Set(["A"])],
        ["A", new Set(["B"])],
      ]);

      const cycles = findCircularDependencies(graph);
      expect(cycles).toHaveLength(1);
    });

    it("formats cycle paths cleanly relative to root", () => {
      const formatted = formatCyclePath(
        ["/root/src/a.ts", "/root/src/b.ts", "/root/src/a.ts"],
        "/root"
      );
      expect(formatted).toBe("src/a.ts -> src/b.ts -> src/a.ts");
    });
  });
});
