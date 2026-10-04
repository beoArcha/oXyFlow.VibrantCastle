import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { LayerBoundaryViolationError } from "@lib/errors";

/**
 * ARCHITECTURAL TEST SUITE: Data Purity and Strict JSON Enforcement
 *
 * Rationale & Invariants:
 * 1. src/data is the declarative source of truth for the RPG game world.
 * 2. It must contain exclusively declarative data (.json files).
 * 3. The only permitted TypeScript file in src/data is the barrel entrypoint: src/data/index.ts.
 * 4. Subdirectories of src/data must never contain .ts, .tsx, .js, .svg, .png, or binary files.
 * 5. Every .json file must be syntactically valid JSON and parse cleanly without errors.
 * 6. src/data/index.ts must only act as a re-export layer for JSON data files.
 */
describe("Architectural Rule: Data Purity & Declarative JSON Invariants", () => {
  const rootDir = process.cwd();
  const dataDir = path.join(rootDir, "src", "data");

  function getFilesRecursively(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getFilesRecursively(fullPath));
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  }

  const allDataFiles = getFilesRecursively(dataDir);

  it("ensures only src/data/index.ts is permitted as a TypeScript file in src/data", () => {
    const tsFiles = allDataFiles.filter(
      (f) => (f.endsWith(".ts") || f.endsWith(".tsx")) && path.relative(dataDir, f) !== "index.ts"
    );

    if (tsFiles.length > 0) {
      throw new LayerBoundaryViolationError(
        `Architectural violation: Found TypeScript files inside src/data subdirectories:\n${tsFiles.join("\n")}`
      );
    }

    expect(tsFiles).toEqual([]);
  });

  it("ensures zero image or binary assets exist inside src/data (must live in src/assets)", () => {
    const forbiddenExtensions = [".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp3", ".wav", ".ogg"];
    const assetViolations = allDataFiles.filter((f) =>
      forbiddenExtensions.some((ext) => f.toLowerCase().endsWith(ext))
    );

    if (assetViolations.length > 0) {
      throw new LayerBoundaryViolationError(
        `Architectural violation: Asset files found inside src/data (move them to src/assets/):\n${assetViolations.join("\n")}`
      );
    }

    expect(assetViolations).toEqual([]);
  });

  it("ensures every file in src/data is either a .json file or the index.ts facade", () => {
    const nonCompliantFiles = allDataFiles.filter((f) => {
      const rel = path.relative(dataDir, f);
      if (rel === "index.ts") return false;
      return !f.endsWith(".json");
    });

    if (nonCompliantFiles.length > 0) {
      throw new LayerBoundaryViolationError(
        `Architectural violation: Non-JSON files found in src/data:\n${nonCompliantFiles.join("\n")}`
      );
    }

    expect(nonCompliantFiles).toEqual([]);
  });

  it("ensures all JSON files in src/data are syntactically valid and non-empty", () => {
    const jsonFiles = allDataFiles.filter((f) => f.endsWith(".json"));
    expect(jsonFiles.length).toBeGreaterThan(0);

    for (const jsonFile of jsonFiles) {
      const content = fs.readFileSync(jsonFile, "utf-8");
      expect(content.trim().length).toBeGreaterThan(0);

      try {
        const parsed = JSON.parse(content);
        expect(parsed).toBeDefined();
        expect(typeof parsed).toBe("object");
      } catch (err: unknown) {
        throw new LayerBoundaryViolationError(
          `Architectural violation: Malformed JSON file at ${jsonFile}: ${(err as Error).message}`
        );
      }
    }
  });

  it("ensures src/data/index.ts contains only re-exports and no procedural game logic", () => {
    const indexPath = path.join(dataDir, "index.ts");
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, "utf-8");
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("//") && !l.startsWith("/*") && !l.startsWith("*"));

    for (const line of lines) {
      const isExport = line.startsWith("export {");
      if (!isExport) {
        throw new LayerBoundaryViolationError(
          `Architectural violation: src/data/index.ts must contain only re-exports, found: "${line}"`
        );
      }
    }
  });
});
