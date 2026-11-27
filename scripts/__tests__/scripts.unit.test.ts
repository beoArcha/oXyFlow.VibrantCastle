import { describe, it, expect } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  evaluateCoverageGate,
  mergeCoverageRecords,
  parseLcov,
} from "../coverage-gate";
import { runLevelValidation } from "../validate-level";
import { assembleWikiShell } from "../build-distribution";

const ROOT_DIR = resolve(import.meta.dirname, "../..");

describe("CI & Distribution Scripts", () => {
  describe("coverage-gate LCOV parser & evaluator", () => {
    it("merges duplicate source files across unit and integration LCOV reports without double counting", () => {
      const unitLcov = [
        "SF:src/game/example.ts",
        "FNDA:2,computeA",
        "FNDA:0,computeB",
        "DA:1,2",
        "DA:2,0",
        "DA:3,1",
        "end_of_record",
      ].join("\n");

      const integrationLcov = [
        "SF:src/game/example.ts",
        "FNDA:0,computeA",
        "FNDA:1,computeB",
        "DA:1,0",
        "DA:2,3",
        "DA:3,0",
        "end_of_record",
      ].join("\n");

      const records = [...parseLcov(unitLcov), ...parseLcov(integrationLcov)];
      const summary = mergeCoverageRecords(records);

      expect(summary.filesCount).toBe(1);
      expect(summary.linesFound).toBe(3);
      expect(summary.linesHit).toBe(3);
      expect(summary.linePct).toBe(100);
      expect(summary.functionsFound).toBe(2);
      expect(summary.functionsHit).toBe(2);
      expect(summary.functionPct).toBe(100);
    });

    it("fails the gate when coverage drops below configured thresholds", () => {
      const records = parseLcov(
        ["SF:src/a.ts", "FNDA:0,fnA", "DA:1,1", "DA:2,0", "DA:3,0", "DA:4,0", "end_of_record"].join("\n")
      );
      const summary = mergeCoverageRecords(records);
      const result = evaluateCoverageGate(
        { unit: summary, integration: null, combined: summary },
        { unitMin: 50, integrationMin: 40, combinedMin: 80 }
      );

      expect(result.passed).toBe(false);
      expect(result.unitPassed).toBe(false);
      expect(result.combinedPassed).toBe(false);
      expect(result.failures.length).toBe(2);
    });
  });

  describe("validate-level CLI runner", () => {
    it("validates all 8 shipped worlds cleanly", () => {
      const summary = runLevelValidation(["--all"]);
      expect(summary.checkedCount).toBeGreaterThanOrEqual(8);
      expect(summary.unknownIds).toEqual([]);
      expect(summary.passed).toBe(true);
    }, 20000);

    it("reports unknown location ids as a failure", () => {
      const summary = runLevelValidation(["non_existent_world"]);
      expect(summary.unknownIds).toEqual(["non_existent_world"]);
      expect(summary.passed).toBe(false);
    });
  });

  describe("Wiki shell distribution assembler", () => {
    it("emits .nojekyll, lifted wiki HTML/CSS/JS, and bilingual PL/EN chronicles", () => {
      const tempDir = mkdtempSync(join(tmpdir(), "vc-wiki-test-"));
      try {
        assembleWikiShell(tempDir);

        expect(existsSync(join(tempDir, ".nojekyll"))).toBe(true);
        const html = readFileSync(join(tempDir, "index.html"), "utf8");
        expect(html).toContain("Vibrant Castle");
        expect(html).toContain('id="game-viewport"');
        expect(html).toContain('id="viewport-splash"');
        expect(html).toContain('allow="fullscreen"');
        expect(html).not.toContain('allow="fullscreen; autoplay"');

        expect(existsSync(join(tempDir, "styles", "wiki.css"))).toBe(true);
        expect(existsSync(join(tempDir, "scripts", "wiki-app.js"))).toBe(true);
        expect(existsSync(join(tempDir, "i18n", "pl.json"))).toBe(true);
        expect(existsSync(join(tempDir, "i18n", "en.json"))).toBe(true);
        expect(existsSync(join(tempDir, "pl", "intro.md"))).toBe(true);
        expect(existsSync(join(tempDir, "en", "intro.md"))).toBe(true);
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("GitHub Actions 3-tier workflows", () => {
    it("provides composite Bun cache action and PR, Main, Release Promotion, and Pages Deploy workflows", () => {
      const files = [
        ".github/actions/setup-bun-cached/action.yml",
        ".github/workflows/ci-pr.yml",
        ".github/workflows/ci-main.yml",
        ".github/workflows/release-promote.yml",
        ".github/workflows/deploy-pages.yml",
      ];

      for (const rel of files) {
        expect(existsSync(join(ROOT_DIR, rel))).toBe(true);
      }

      const prYaml = readFileSync(join(ROOT_DIR, ".github/workflows/ci-pr.yml"), "utf8");
      expect(prYaml).toContain("pull_request:");
      expect(prYaml).toContain("cancel-in-progress: true");
      expect(prYaml).toContain("test:integration:coverage");
      expect(prYaml).toContain("coverage:gate");

      const mainYaml = readFileSync(join(ROOT_DIR, ".github/workflows/ci-main.yml"), "utf8");
      expect(mainYaml).toContain("coverage:gate");
      expect(mainYaml).toContain("build:pages");

      const releaseYaml = readFileSync(join(ROOT_DIR, ".github/workflows/release-promote.yml"), "utf8");
      expect(releaseYaml).toContain("schedule:");
      expect(releaseYaml).toContain("workflow_dispatch:");
      expect(releaseYaml).toContain("cancel-in-progress: false");
      expect(releaseYaml).toContain("uses: ./.github/workflows/deploy-pages.yml");

      const deployYaml = readFileSync(join(ROOT_DIR, ".github/workflows/deploy-pages.yml"), "utf8");
      expect(deployYaml).toContain("- release");
      expect(deployYaml).toContain("workflow_call:");
      expect(deployYaml).toContain("actions/deploy-pages@v4");
    });
  });
});
