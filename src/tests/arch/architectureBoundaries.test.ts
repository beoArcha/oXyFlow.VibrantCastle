import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";

function getAllSourceFiles(dir: string, extensionRegex = /\.(ts|tsx)$/): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
        results = results.concat(getAllSourceFiles(fullPath, extensionRegex));
      }
    } else if (entry.isFile() && extensionRegex.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

function findImportViolations(
  files: string[],
  forbiddenPattern: RegExp,
  rootDir: string
): { file: string; line: string }[] {
  const violations: { file: string; line: string }[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (forbiddenPattern.test(line)) {
        violations.push({
          file: path.relative(rootDir, file).replace(/\\/g, "/"),
          line: line.trim(),
        });
      }
    }
  }

  return violations;
}

function findCrossGroupRelativeImports(
  rootDir: string,
  allowedTargetGroups: Set<string> = new Set()
): { file: string; lineNo: number; line: string; fromGroup: string; toGroup: string }[] {
  const srcDir = path.join(rootDir, "src");
  const allFiles = getAllSourceFiles(srcDir);
  const topGroups = ["assets", "components", "context", "game", "i18n", "lib"];
  const violations: { file: string; lineNo: number; line: string; fromGroup: string; toGroup: string }[] = [];

  for (const file of allFiles) {
    const relFile = path.relative(srcDir, file).replace(/\\/g, "/");
    const fromGroup = relFile.split("/")[0];
    if (!topGroups.includes(fromGroup)) continue;

    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/(?:from|import)\s*\(?['"](\.[^'"]+)['"]/);
      if (match) {
        const importPath = match[1];
        const resolvedTarget = path.normalize(path.join(path.dirname(file), importPath));
        const relTarget = path.relative(srcDir, resolvedTarget).replace(/\\/g, "/");
        const toGroup = relTarget.split("/")[0];

        if (topGroups.includes(toGroup) && fromGroup !== toGroup) {
          if (!allowedTargetGroups.has(toGroup)) {
            violations.push({
              file: relFile,
              lineNo: i + 1,
              line: line.trim(),
              fromGroup,
              toGroup,
            });
          }
        }
      }
    }
  }

  return violations;
}

describe("Architectural Boundary Rules (AGENT.md Sec. 1.1)", () => {
  const rootDir = process.cwd();
  const gameDir = path.join(rootDir, "src", "game");
  const physicsDir = path.join(gameDir, "physics");
  const i18nDir = path.join(rootDir, "src", "i18n");
  const srcDir = path.join(rootDir, "src");

  it("ensures zero production files in src/game import from UI components", () => {
    const gameFiles = getAllSourceFiles(gameDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'](@\/components|\.\.?\/.*components|\/components)/;
    const violations = findImportViolations(gameFiles, forbiddenPattern, rootDir);

    expect(violations).toEqual([]);
  });

  it("ensures zero production files in src/game import from React Context", () => {
    const gameFiles = getAllSourceFiles(gameDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'](@\/context|\.\.?\/.*context)/;
    const violations = findImportViolations(gameFiles, forbiddenPattern, rootDir);

    expect(violations).toEqual([]);
  });

  it("ensures physics domain is decoupled from game engine orchestrator and renderer", () => {
    const physicsFiles = getAllSourceFiles(physicsDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'].*(loop\/engine|renderer|components).*["']/;
    const violations = findImportViolations(physicsFiles, forbiddenPattern, rootDir);

    expect(violations).toEqual([]);
  });

  it("ensures src/game/types.ts is pure domain and has no dependencies on React", () => {
    const typesFile = path.join(gameDir, "types.ts");
    expect(fs.existsSync(typesFile)).toBe(true);

    const content = fs.readFileSync(typesFile, "utf-8");
    expect(content).not.toContain("from \"react\"");
    expect(content).not.toContain("from 'react'");
    expect(content).not.toContain("React.");
  });

  it("ensures i18n horizontal domain has zero dependencies on game engine, UI components, or React context", () => {
    const i18nFiles = getAllSourceFiles(i18nDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'](react|react-dom|@\/game|@game|\.\.?\/.*game|@\/components|@components|\.\.?\/.*components|@\/context|@context|\.\.?\/.*context)/;
    const violations = findImportViolations(i18nFiles, forbiddenPattern, rootDir);

    expect(violations).toEqual([]);
  });

  it("ensures zero files in src import from obsolete game/i18n directory", () => {
    const allSrcFiles = getAllSourceFiles(srcDir);
    const obsoletePattern = /(from|import)\s*\(?["'].*game\/i18n/;
    const violations = findImportViolations(allSrcFiles, obsoletePattern, rootDir);

    expect(violations).toEqual([]);
  });

  it("ensures zero files in src import from obsolete root hooks directory or @hooks alias", () => {
    const allSrcFiles = getAllSourceFiles(srcDir);
    const obsoletePattern = /(from|import)\s*\(?["'](@hooks\/|@\/hooks\/)/;
    const violations = findImportViolations(allSrcFiles, obsoletePattern, rootDir);

    expect(violations).toEqual([]);
  });

  it("enforces strict type checking and safety flags in tsconfig.json", () => {
    const tsconfigPath = path.join(rootDir, "tsconfig.json");
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const rawContent = fs.readFileSync(tsconfigPath, "utf-8");
    const sanitized = rawContent.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    const tsconfig = JSON.parse(sanitized);

    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.forceConsistentCasingInFileNames).toBe(true);
    expect(tsconfig.compilerOptions.noFallthroughCasesInSwitch).toBe(true);
  });

  it("ensures game simulation core (physics, combat, logic) has zero direct dependencies on DOM globals outside known adapters", () => {
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

    expect(violations).toEqual([]);
  });

  it("ensures utility layer src/lib has zero dependencies on application layers (game, context, components, i18n)", () => {
    const libDir = path.join(rootDir, "src", "lib");
    const libFiles = getAllSourceFiles(libDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'].*(game|context|components|i18n)/;
    const violations = findImportViolations(libFiles, forbiddenPattern, rootDir);

    expect(violations).toEqual([]);
  });

  it("ensures React context layer src/context has zero dependencies on UI components", () => {
    const contextDir = path.join(rootDir, "src", "context");
    const contextFiles = getAllSourceFiles(contextDir).filter((file) => !file.includes("__tests__"));
    const forbiddenPattern = /from\s+["'].*components/;
    const violations = findImportViolations(contextFiles, forbiddenPattern, rootDir);

    expect(violations).toEqual([]);
  });

  it("ensures cross-group imports between logical domains use path aliases instead of relative traversal", () => {
    // Relative imports within the same group (e.g. game -> game, components -> components) are allowed.
    // Cross-group imports (components -> lib, components -> game, game -> lib, game -> assets) must use configured @ aliases.
    const allowedTargetGroups = new Set<string>();
    const violations = findCrossGroupRelativeImports(rootDir, allowedTargetGroups);

    expect(violations).toEqual([]);
  });
});

