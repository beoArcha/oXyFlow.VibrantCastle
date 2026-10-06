import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { LayerBoundaryViolationError } from "@lib/errors";
import { getAllSourceFiles, stripComments, ImportViolation } from "./helpers/archScanner";

function assertZeroLeakageViolations(
  violations: ImportViolation[],
  ruleDescription: string
): void {
  if (violations.length > 0) {
    const details = violations.map((v) => `  ${v.file}:${v.lineNo} -> ${v.line}`).join("\n");
    throw new LayerBoundaryViolationError(
      `Architectural rule "${ruleDescription}" violated (${violations.length} breach(es)):\n${details}`,
      violations
    );
  }
  expect(violations).toEqual([]);
}

describe("Layer Leakage & Engine Instantiation Boundaries", () => {
  const rootDir = process.cwd();
  const componentsDir = path.join(rootDir, "src", "components");
  const developerDir = path.join(rootDir, "src", "developer");
  const dataStudioDir = path.join(developerDir, "subtabs", "datastudio");

  it("ensures UI components in src/components/ and src/developer/ never instantiate engine or manager classes directly", () => {
    const uiFiles = [
      ...getAllSourceFiles(componentsDir),
      ...getAllSourceFiles(developerDir),
    ].filter((file) => !file.includes("__tests__"));

    // Forbidden patterns instantiating engine/manager classes directly
    const forbiddenNewPattern = /\bnew\s+\w+(?:Engine|Manager)\s*\(/;
    const violations: ImportViolation[] = [];

    for (const file of uiFiles) {
      const raw = fs.readFileSync(file, "utf-8");
      const clean = stripComments(raw);
      const lines = clean.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (forbiddenNewPattern.test(line)) {
          violations.push({
            file: path.relative(rootDir, file).replace(/\\/g, "/"),
            lineNo: i + 1,
            line: line.trim(),
          });
        }
      }
    }

    assertZeroLeakageViolations(
      violations,
      "UI components must not instantiate engine or procedural manager classes with `new` (use React context hooks)"
    );
  });

  it("ensures player UI components in src/components/ never import gameEngine singleton directly", () => {
    const componentFiles = getAllSourceFiles(componentsDir).filter(
      (file) => !file.includes("__tests__")
    );

    // Direct import of loop/engine in player UI components is prohibited
    const forbiddenEngineImportPattern = /from\s+["'].*loop\/engine["']/;
    const violations: ImportViolation[] = [];

    for (const file of componentFiles) {
      const raw = fs.readFileSync(file, "utf-8");
      const clean = stripComments(raw);
      const lines = clean.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (forbiddenEngineImportPattern.test(line)) {
          violations.push({
            file: path.relative(rootDir, file).replace(/\\/g, "/"),
            lineNo: i + 1,
            line: line.trim(),
          });
        }
      }
    }

    assertZeroLeakageViolations(
      violations,
      "Player UI components (src/components) must consume game state via React Context (e.g. useGameSession) rather than importing gameEngine directly"
    );
  });

  it("ensures DataStudio workbench subtab has zero direct dependencies on game physics or collision engine", () => {
    const dataStudioFiles = getAllSourceFiles(dataStudioDir).filter(
      (file) => !file.includes("__tests__")
    );

    const forbiddenPhysicsPattern = /from\s+["'].*(?:physics|collisions)["']/;
    const violations: ImportViolation[] = [];

    for (const file of dataStudioFiles) {
      const raw = fs.readFileSync(file, "utf-8");
      const clean = stripComments(raw);
      const lines = clean.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (forbiddenPhysicsPattern.test(line)) {
          violations.push({
            file: path.relative(rootDir, file).replace(/\\/g, "/"),
            lineNo: i + 1,
            line: line.trim(),
          });
        }
      }
    }

    assertZeroLeakageViolations(
      violations,
      "DataStudio authoring tools must remain decoupled from runtime game physics and collision subsystems"
    );
  });
});
