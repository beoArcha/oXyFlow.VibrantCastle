import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { LayerBoundaryViolationError } from "@lib/errors";
import { getAllSourceFiles, findImportViolations, type ImportViolation } from "./helpers/archScanner";

function assertZeroViolations(violations: ImportViolation[], ruleDescription: string): void {
  if (violations.length > 0) {
    const details = violations.map((v) => `  ${v.file}:${v.lineNo} -> ${v.line}`).join("\n");
    throw new LayerBoundaryViolationError(
      `Architectural rule "${ruleDescription}" violated (${violations.length} breach(es)):\n${details}`,
      violations
    );
  }
  expect(violations).toEqual([]);
}

describe("Architectural Rule: Parallax Render Dependency Isolation", () => {
  const rootDir = process.cwd();
  const parallaxRenderDir = path.join(rootDir, "src", "game", "parallax", "render");

  it("ensures zero production files under src/game/parallax/render import assetLoader or debugManager", () => {
    const renderFiles = getAllSourceFiles(parallaxRenderDir).filter(
      (file) => !file.includes("__tests__") && !file.endsWith(".test.ts")
    );
    expect(renderFiles.length).toBeGreaterThan(0);

    const forbiddenPattern = /\b(assetLoader|debugManager)\b/;
    const violations = findImportViolations(renderFiles, forbiddenPattern, rootDir);

    assertZeroViolations(
      violations,
      "src/game/parallax/render must inject loader and flags instead of importing assetLoader or debugManager"
    );
  });

  it("ensures dead image parallax files are removed", () => {
    const legacyImageRenderer = path.join(rootDir, "src", "game", "renderer", "parallax", "parallaxImageRenderer.ts");
    const legacyOrchestrator = path.join(rootDir, "src", "game", "renderer", "parallaxRenderer.ts");
    const legacyMultiLayer = path.join(rootDir, "src", "game", "renderer", "multiLayerBackgroundSystem.ts");

    expect(fs.existsSync(legacyImageRenderer)).toBe(false);
    expect(fs.existsSync(legacyOrchestrator)).toBe(false);
    expect(fs.existsSync(legacyMultiLayer)).toBe(false);
  });
});
