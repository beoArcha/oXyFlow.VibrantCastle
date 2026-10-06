import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { LayerBoundaryViolationError } from "@lib/errors";
import {
  getAllSourceFiles,
  findImportViolations,
  findCrossGroupRelativeImports,
  stripComments,
  type ImportViolation,
  type CrossGroupViolation,
} from "./helpers/archScanner";

function assertZeroViolations(
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

function assertZeroCrossGroupViolations(
  violations: CrossGroupViolation[],
  ruleDescription: string
): void {
  if (violations.length > 0) {
    const details = violations
      .map((v) => `  ${v.file}:${v.lineNo} -> [${v.fromGroup}] imports [${v.toGroup}]: ${v.line}`)
      .join("\n");
    throw new LayerBoundaryViolationError(
      `Architectural rule "${ruleDescription}" violated (${violations.length} breach(es)):\n${details}`,
      violations
    );
  }
  expect(violations).toEqual([]);
}

describe("Architectural Boundary Rules", () => {
  const rootDir = process.cwd();
  const gameDir = path.join(rootDir, "src", "game");
  const physicsDir = path.join(gameDir, "physics");
  const i18nDir = path.join(rootDir, "src", "i18n");
  const srcDir = path.join(rootDir, "src");

  it("ensures zero production files in src/game import from UI components", () => {
    const gameFiles = getAllSourceFiles(gameDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'](@\/components|\.\.?\/.*components|\/components)/;
    const violations = findImportViolations(gameFiles, forbiddenPattern, rootDir);

    assertZeroViolations(violations, "Game engine must not import UI components");
  });

  it("ensures zero production files in src/game import from React Context", () => {
    const gameFiles = getAllSourceFiles(gameDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'](@\/context|\.\.?\/.*context)/;
    const violations = findImportViolations(gameFiles, forbiddenPattern, rootDir);

    assertZeroViolations(violations, "Game engine must not import React Context");
  });

  it("ensures physics domain is decoupled from game engine orchestrator and renderer", () => {
    const physicsFiles = getAllSourceFiles(physicsDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'].*(loop\/engine|renderer|components).*["']/;
    const violations = findImportViolations(physicsFiles, forbiddenPattern, rootDir);

    assertZeroViolations(violations, "Physics domain must be decoupled from engine orchestrator and renderer");
  });

  it("ensures src/game/types.ts is pure domain and has no dependencies on React", () => {
    const typesFile = path.join(gameDir, "types.ts");
    expect(fs.existsSync(typesFile)).toBe(true);

    const content = stripComments(fs.readFileSync(typesFile, "utf-8"));
    expect(content).not.toContain("from \"react\"");
    expect(content).not.toContain("from 'react'");
    expect(content).not.toContain("React.");
  });

  it("ensures i18n horizontal domain has zero dependencies on game engine, UI components, or React context", () => {
    const i18nFiles = getAllSourceFiles(i18nDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'](react|react-dom|@\/game|@game|\.\.?\/.*game|@\/components|@components|\.\.?\/.*components|@\/context|@context|\.\.?\/.*context)/;
    const violations = findImportViolations(i18nFiles, forbiddenPattern, rootDir);

    assertZeroViolations(violations, "i18n domain must not depend on game engine, UI components, or React context");
  });

  it("ensures zero files in src import from obsolete game/i18n directory", () => {
    const allSrcFiles = getAllSourceFiles(srcDir);
    const obsoletePattern = /(from|import)\s*\(?["'].*game\/i18n/;
    const violations = findImportViolations(allSrcFiles, obsoletePattern, rootDir);

    assertZeroViolations(violations, "Obsolete game/i18n directory must not be imported");
  });

  it("ensures zero files in src import from obsolete root hooks directory or @hooks alias", () => {
    const allSrcFiles = getAllSourceFiles(srcDir);
    const obsoletePattern = /(from|import)\s*\(?["'](@hooks\/|@\/hooks\/)/;
    const violations = findImportViolations(allSrcFiles, obsoletePattern, rootDir);

    assertZeroViolations(violations, "Obsolete root hooks directory or @hooks alias must not be imported");
  });

  it("enforces strict type checking and safety flags in tsconfig.json", () => {
    const tsconfigPath = path.join(rootDir, "tsconfig.json");
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const rawContent = fs.readFileSync(tsconfigPath, "utf-8");
    const sanitized = stripComments(rawContent);
    const tsconfig = JSON.parse(sanitized);

    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.forceConsistentCasingInFileNames).toBe(true);
    expect(tsconfig.compilerOptions.noFallthroughCasesInSwitch).toBe(true);
  });

  it("ensures game simulation core (physics, combat, logic) has zero direct dependencies on DOM globals outside known adapters", () => {
    // Explicit list of permitted browser adapters on the periphery of the game engine:
    // - loop/input.ts: Browser window/document keyboard event listeners
    // - logic/save/saveExporter.ts: Triggers file download via document.createElement('a')
    // - logic/stats/statsStorage.ts: Persists gameplay statistics to window.localStorage
    const knownBrowserAdapters = new Set([
      "src/game/loop/input.ts",
      "src/game/logic/save/saveExporter.ts",
      "src/game/logic/stats/statsStorage.ts",
    ]);

    const simulationDirs = [
      path.join(gameDir, "logic"),
      path.join(gameDir, "physics"),
      path.join(gameDir, "loop"),
    ];
    const files = simulationDirs
      .flatMap((dir) => getAllSourceFiles(dir))
      .filter((file) => {
        const rel = path.relative(rootDir, file).replace(/\\/g, "/");
        return !file.includes("__tests__") && !knownBrowserAdapters.has(rel);
      });

    const domGlobalPattern = /\b(window\.|document\.|localStorage\.|sessionStorage\.|HTMLElement)\b/;
    const violations = findImportViolations(files, domGlobalPattern, rootDir);

    assertZeroViolations(violations, "Simulation core must not access DOM globals directly");
  });

  it("ensures utility layer src/lib has zero dependencies on application layers (game, context, components, i18n)", () => {
    const libDir = path.join(rootDir, "src", "lib");
    const libFiles = getAllSourceFiles(libDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'].*(game|context|components|i18n)/;
    const violations = findImportViolations(libFiles, forbiddenPattern, rootDir);

    assertZeroViolations(violations, "Utility layer src/lib must not depend on application layers");
  });

  it("ensures React context layer src/context has zero dependencies on UI components", () => {
    const contextDir = path.join(rootDir, "src", "context");
    const contextFiles = getAllSourceFiles(contextDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'].*components/;
    const violations = findImportViolations(contextFiles, forbiddenPattern, rootDir);

    assertZeroViolations(violations, "React context layer src/context must not depend on UI components");
  });

  it("ensures cross-group imports between logical domains use path aliases instead of relative traversal", () => {
    const allowedTargetGroups = new Set<string>();
    const violations = findCrossGroupRelativeImports(rootDir, allowedTargetGroups);

    assertZeroCrossGroupViolations(violations, "Cross-group relative imports are prohibited (use @ aliases)");
  });

  it("enforces prohibition of raw `new Error(...)` across production code", () => {
    const allProdFiles = getAllSourceFiles(srcDir).filter(
      (file) =>
        !file.includes("__tests__") &&
        !file.endsWith(".test.ts") &&
        !file.endsWith(".test.tsx") &&
        !file.replace(/\\/g, "/").endsWith("src/lib/errors/GameBaseError.ts")
    );

    const forbiddenPattern = new RegExp("\\bnew\\s+" + "Error\\s*\\(");
    const violations = findImportViolations(allProdFiles, forbiddenPattern, rootDir);

    assertZeroViolations(violations, "Production code must not use raw new Error(...) (use GameBaseError hierarchy)");
  });

  it("enforces prohibition of raw `new Error(...)` across architectural test suite (src/tests/arch)", () => {
    const archFiles = getAllSourceFiles(path.join(rootDir, "src", "tests", "arch")).filter(
      (file) =>
        !file.includes("__tests__") &&
        !file.replace(/\\/g, "/").endsWith("src/tests/arch/architectureBoundaries.test.ts")
    );

    const forbiddenPattern = new RegExp("\\bnew\\s+" + "Error\\s*\\(");
    const violations = findImportViolations(archFiles, forbiddenPattern, rootDir);

    assertZeroViolations(
      violations,
      "Architectural tests must use ArchitectureError hierarchy instead of raw new Error(...)"
    );
  });

  it("ensures design system layer src/ui has zero dependencies on game, context, components, or developer", () => {
    const uiDir = path.join(rootDir, "src", "ui");
    const uiFiles = getAllSourceFiles(uiDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'].*(game|context|components|developer)/;
    const violations = findImportViolations(uiFiles, forbiddenPattern, rootDir);

    assertZeroViolations(violations, "Design system src/ui must not depend on game, context, components, or developer");
  });

  it("ensures player UI components in src/components have zero dependencies on developer tools", () => {
    const componentsDir = path.join(rootDir, "src", "components");
    const componentFiles = getAllSourceFiles(componentsDir).filter(
      (file) =>
        !file.includes("__tests__") &&
        !file.replace(/\\/g, "/").endsWith("components/layout/GameModalHost.tsx")
    );
    const forbiddenPattern = /from\s+["'].*developer/;
    const violations = findImportViolations(componentFiles, forbiddenPattern, rootDir);

    assertZeroViolations(violations, "Player UI components in src/components must not import developer tools");
  });

  it("ensures game simulation and engine core has zero dependencies on developer tools", () => {
    const gameFiles = getAllSourceFiles(gameDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'].*developer/;
    const violations = findImportViolations(gameFiles, forbiddenPattern, rootDir);

    assertZeroViolations(violations, "Game simulation and engine core must not depend on developer tools");
  });

  it("ensures all data imports in src use unified @data alias rather than obsolete game/data or locations/data paths", () => {
    const allSrcFiles = getAllSourceFiles(srcDir);
    const obsoleteDataPattern = /(from|import)\s*\(?["'].*(game\/data|locations\/data)/;
    const violations = findImportViolations(allSrcFiles, obsoleteDataPattern, rootDir);

    assertZeroViolations(violations, "Data imports must use unified @data alias rather than obsolete paths");
  });

  it("ensures all exceptions thrown in src/game use formalized GameBaseError domain hierarchy", () => {
    const gameFiles = getAllSourceFiles(gameDir).filter((file) => !file.includes("__tests__"));
    const throwNewPattern = /\bthrow\s+new\s+(\w+)\s*\(/g;
    const allowedErrorClasses = new Set([
      "GameBaseError",
      "EngineError",
      "CanvasContextError",
      "ParserError",
      "AssetError",
      "CombatError",
      "SaveError",
      "CollisionError",
    ]);

    const violations: ImportViolation[] = [];

    for (const file of gameFiles) {
      const raw = fs.readFileSync(file, "utf-8");
      const clean = stripComments(raw);
      const lines = clean.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match: RegExpExecArray | null;
        while ((match = throwNewPattern.exec(line)) !== null) {
          const errorClassName = match[1];
          if (!allowedErrorClasses.has(errorClassName)) {
            violations.push({
              file: path.relative(rootDir, file).replace(/\\/g, "/"),
              lineNo: i + 1,
              line: line.trim(),
            });
          }
        }
      }
    }

    assertZeroViolations(
      violations,
      "Exceptions thrown in src/game must use the GameBaseError domain hierarchy rather than raw Error or ad-hoc classes"
    );
  });

  it("enforces barrel file discipline: external consumers must import via @ui, @lib/logger, and @lib/errors facades instead of deep internal paths", () => {
    const allProdFiles = getAllSourceFiles(srcDir).filter(
      (file) =>
        !file.includes("__tests__") &&
        !file.endsWith(".test.ts") &&
        !file.endsWith(".test.tsx")
    );

    const deepUiPattern = /from\s+["'].*ui\/(?:primitives|controls|layout)\//;
    const deepLoggerPattern = /from\s+["'].*lib\/logger\/(?:transports|formatters)\//;
    const deepErrorsPattern = /from\s+["'].*lib\/errors\/(?:domainErrors|types)\//;

    const violations: ImportViolation[] = [];

    for (const file of allProdFiles) {
      const rel = path.relative(rootDir, file).replace(/\\/g, "/");
      const isInsideUi = rel.startsWith("src/ui/");
      const isInsideLogger = rel.startsWith("src/lib/logger/");
      const isInsideErrors = rel.startsWith("src/lib/errors/");

      const raw = fs.readFileSync(file, "utf-8");
      const clean = stripComments(raw);
      const lines = clean.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!isInsideUi && deepUiPattern.test(line)) {
          violations.push({
            file: rel,
            lineNo: i + 1,
            line: line.trim(),
          });
        }
        if (!isInsideLogger && deepLoggerPattern.test(line)) {
          violations.push({
            file: rel,
            lineNo: i + 1,
            line: line.trim(),
          });
        }
        if (!isInsideErrors && deepErrorsPattern.test(line)) {
          violations.push({
            file: rel,
            lineNo: i + 1,
            line: line.trim(),
          });
        }
      }
    }

    assertZeroViolations(
      violations,
      "External consumers must use module entry-point barrel facades (@ui, @lib/logger, @lib/errors) instead of deep private paths"
    );
  });
});

