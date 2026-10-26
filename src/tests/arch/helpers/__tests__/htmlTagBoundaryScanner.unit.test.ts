import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import os from "os";
import { LayerBoundaryViolationError } from "@lib/errors";
import {
  buildTagRegex,
  scanFilesForForbiddenTags,
  assertZeroForbiddenTagViolations,
  type ForbiddenTagRule,
} from "../htmlTagBoundaryScanner";

describe("htmlTagBoundaryScanner Helper Unit Tests", () => {
  describe("buildTagRegex pattern matching", () => {
    it("matches opening and self-closing tags with various JSX attributes", () => {
      // Arrange
      const buttonRegex = buildTagRegex("button");
      const inputRegex = buildTagRegex("input");
      const h1Regex = buildTagRegex("h1");
      const pRegex = buildTagRegex("p");

      // Act & Assert
      expect(buttonRegex.test("<button>")).toBe(true);
      expect(buttonRegex.test("<button type=\"button\">")).toBe(true);
      expect(buttonRegex.test("<button className=\"btn\" onClick={handleClick}>")).toBe(true);
      expect(buttonRegex.test("  <button ")).toBe(true);

      expect(inputRegex.test("<input />")).toBe(true);
      expect(inputRegex.test("<input type=\"text\" value={val} />")).toBe(true);

      expect(h1Regex.test("<h1>Title</h1>")).toBe(true);
      expect(h1Regex.test("<h1 className=\"title\">")).toBe(true);

      expect(pRegex.test("<p>Text</p>")).toBe(true);
      expect(pRegex.test("<p className=\"lead\">")).toBe(true);
    });

    it("does not match closing tags, comparisons, or generic types", () => {
      // Arrange
      const buttonRegex = buildTagRegex("button");
      const pRegex = buildTagRegex("p");

      // Act & Assert - Closing tags should not trigger (to avoid duplicate counting)
      expect(buttonRegex.test("</button>")).toBe(false);
      expect(pRegex.test("</p>")).toBe(false);

      // Comparison operators
      expect(pRegex.test("if (index < pMax) return;")).toBe(false);
      expect(buttonRegex.test("const isValid = count < buttonTotal;")).toBe(false);

      // TypeScript generics
      expect(buttonRegex.test("type Handler = Promise<button>;")).toBe(false);

      // Hyphenated custom elements or compound names
      expect(buttonRegex.test("<button-group>")).toBe(false);
      expect(pRegex.test("<paragraph-container>")).toBe(false);
    });
  });

  describe("scanFilesForForbiddenTags", () => {
    const tmpDir = path.join(os.tmpdir(), "vc_arch_scanner_tests_" + Date.now());

    const rules: ForbiddenTagRule[] = [
      {
        tag: "button",
        category: "control",
        replacement: "<Button>",
        reason: "Must use @ui Button",
      },
      {
        tag: "p",
        category: "typography",
        replacement: "<Paragraph>",
        reason: "Must use @ui Paragraph",
      },
    ];

    it("detects violations with exact line number and replacement metadata", () => {
      // Arrange
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const testFile = path.join(tmpDir, "SampleView.tsx");
      const code = [
        "import React from 'react';",
        "export function SampleView() {",
        "  return (",
        "    <div>",
        "      <button type=\"button\">Click</button>",
        "      <p className=\"desc\">Description</p>",
        "    </div>",
        "  );",
        "}",
      ].join("\n");
      fs.writeFileSync(testFile, code, "utf-8");

      // Act
      const violations = scanFilesForForbiddenTags([testFile], rules, tmpDir);

      // Assert
      expect(violations.length).toBe(2);
      expect(violations[0].tag).toBe("button");
      expect(violations[0].lineNo).toBe(5);
      expect(violations[0].replacement).toBe("<Button>");
      expect(violations[1].tag).toBe("p");
      expect(violations[1].lineNo).toBe(6);
      expect(violations[1].replacement).toBe("<Paragraph>");

      // Cleanup
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("ignores matches within single-line and multi-line comments", () => {
      // Arrange
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const testFile = path.join(tmpDir, "CommentedView.tsx");
      const code = [
        "// <button>Ignored in comment</button>",
        "/*",
        "  <p>Also ignored in block comment</p>",
        "*/",
        "export const x = 42;",
      ].join("\n");
      fs.writeFileSync(testFile, code, "utf-8");

      // Act
      const violations = scanFilesForForbiddenTags([testFile], rules, tmpDir);

      // Assert
      expect(violations.length).toBe(0);

      // Cleanup
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  });

  describe("assertZeroForbiddenTagViolations", () => {
    it("throws structured LayerBoundaryViolationError when violations are present", () => {
      // Arrange
      const violations = [
        {
          file: "src/sample/Test.tsx",
          lineNo: 12,
          tag: "button",
          replacement: "<Button>",
          line: "<button>Submit</button>",
          reason: "Must use @ui Button",
        },
      ];

      // Act & Assert
      expect(() => {
        assertZeroForbiddenTagViolations(violations, "Sample Module");
      }).toThrow(LayerBoundaryViolationError);
    });

    it("does not throw when violations array is empty", () => {
      // Arrange & Act & Assert
      expect(() => {
        assertZeroForbiddenTagViolations([], "Sample Module");
      }).not.toThrow();
    });
  });
});
