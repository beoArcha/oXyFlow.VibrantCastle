import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { ArchitectureError, LayerBoundaryViolationError } from "@lib/errors";
import { getAllSourceFiles, stripComments, ImportViolation } from "./helpers/archScanner";
import {
  FORBIDDEN_HTML_TAGS_REGISTRY,
  scanFilesForForbiddenTags,
  assertZeroForbiddenTagViolations,
} from "./helpers/htmlTagBoundaryScanner";

function assertZeroDesignViolations(
  violations: ImportViolation[],
  ruleDescription: string
): void {
  if (violations.length > 0) {
    const details = violations.map((v) => `  ${v.file}:${v.lineNo} -> ${v.line}`).join("\n");
    throw new LayerBoundaryViolationError(
      `Design System rule "${ruleDescription}" violated (${violations.length} breach(es)):\n${details}`,
      violations
    );
  }
  expect(violations).toEqual([]);
}

describe("Design System Boundaries & UI Primitives Integrity", () => {
  const rootDir = process.cwd();
  const developerDir = path.join(rootDir, "src", "developer");
  const hudDir = path.join(rootDir, "src", "hud");
  const gameMenuDir = path.join(rootDir, "src", "game-menu");
  const dataStudioDir = path.join(developerDir, "subtabs", "datastudio");
  const componentsDir = path.join(rootDir, "src", "components");
  const uiPrimitivesDir = path.join(rootDir, "src", "ui", "primitives");

  it("ensures zero forbidden HTML tags in src/developer/ subtabs and views via extensible registry", () => {
    const devTsxFiles = getAllSourceFiles(developerDir, /\.tsx$/).filter(
      (file) => !file.includes("__tests__")
    );

    const violations = scanFilesForForbiddenTags(devTsxFiles, FORBIDDEN_HTML_TAGS_REGISTRY, rootDir);
    assertZeroForbiddenTagViolations(violations, "src/developer/");
    expect(violations).toHaveLength(0);
  });

  it("ensures zero forbidden HTML tags in src/hud/ presentation layer via extensible registry", () => {
    const hudTsxFiles = getAllSourceFiles(hudDir, /\.tsx$/).filter(
      (file) => !file.includes("__tests__")
    );

    const violations = scanFilesForForbiddenTags(hudTsxFiles, FORBIDDEN_HTML_TAGS_REGISTRY, rootDir);
    assertZeroForbiddenTagViolations(violations, "src/hud/");
    expect(violations).toHaveLength(0);
  });

  it("ensures zero forbidden HTML tags in src/game-menu/ views via extensible registry", () => {
    const menuTsxFiles = getAllSourceFiles(gameMenuDir, /\.tsx$/).filter(
      (file) => !file.includes("__tests__")
    );

    const violations = scanFilesForForbiddenTags(menuTsxFiles, FORBIDDEN_HTML_TAGS_REGISTRY, rootDir);
    assertZeroForbiddenTagViolations(violations, "src/game-menu/");
    expect(violations).toHaveLength(0);
  });

  it("ensures zero hardcoded hex color literals in JSX of src/developer/subtabs/datastudio/", () => {
    const dataStudioTsxFiles = getAllSourceFiles(dataStudioDir, /\.tsx$/).filter(
      (file) => !file.includes("__tests__")
    );

    // Matches arbitrary hex color literals like #1e293b, #000, #ff0000 in JSX attributes/text
    const hexColorPattern = /#[0-9a-fA-F]{3,8}\b/;
    const violations: ImportViolation[] = [];

    for (const file of dataStudioTsxFiles) {
      const raw = fs.readFileSync(file, "utf-8");
      const clean = stripComments(raw);
      const lines = clean.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (hexColorPattern.test(line)) {
          violations.push({
            file: path.relative(rootDir, file).replace(/\\/g, "/"),
            lineNo: i + 1,
            line: line.trim(),
          });
        }
      }
    }

    assertZeroDesignViolations(
      violations,
      "DataStudio TSX views must use semantic tokens and design system utility classes rather than raw hex colors"
    );
  });

  it("verifies that core UI primitives and controls exist and export foundational components from @ui", () => {
    expect(fs.existsSync(uiPrimitivesDir)).toBe(true);
    const uiControlsDir = path.join(rootDir, "src", "ui", "controls");
    expect(fs.existsSync(uiControlsDir)).toBe(true);

    const buttonPath = path.join(uiPrimitivesDir, "Button.tsx");
    const inputPath = path.join(uiControlsDir, "Input.tsx");
    const selectPath = path.join(uiControlsDir, "Select.tsx");
    const textareaPath = path.join(uiControlsDir, "Textarea.tsx");

    expect(fs.existsSync(buttonPath)).toBe(true);
    expect(fs.existsSync(inputPath)).toBe(true);
    expect(fs.existsSync(selectPath)).toBe(true);
    expect(fs.existsSync(textareaPath)).toBe(true);

    // Verify @ui index.ts re-exports primitives and controls
    const uiIndexPath = path.join(rootDir, "src", "ui", "index.ts");
    expect(fs.existsSync(uiIndexPath)).toBe(true);
    const indexContent = fs.readFileSync(uiIndexPath, "utf-8");

    expect(indexContent).toContain("./primitives");
    expect(indexContent).toContain("./controls");
  });

  it("ensures zero hardcoded hex color literals in source code of src/ui/", () => {
    const uiDir = path.join(rootDir, "src", "ui");
    const uiFiles = getAllSourceFiles(uiDir, /\.(tsx|ts)$/).filter(
      (file) =>
        !file.includes("__tests__") &&
        !file.replace(/\\/g, "/").includes("color-picker-input.tsx")
    );

    const hexColorPattern = /#[0-9a-fA-F]{3,8}\b/;
    const violations: ImportViolation[] = [];

    for (const file of uiFiles) {
      const raw = fs.readFileSync(file, "utf-8");
      const clean = stripComments(raw);
      const lines = clean.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (hexColorPattern.test(line)) {
          violations.push({
            file: path.relative(rootDir, file).replace(/\\/g, "/"),
            lineNo: i + 1,
            line: line.trim(),
          });
        }
      }
    }

    assertZeroDesignViolations(
      violations,
      "Design system source code in src/ui/ must use semantic tokens and CSS custom properties rather than hardcoded hex colors"
    );
  });
});
