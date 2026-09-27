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
});

