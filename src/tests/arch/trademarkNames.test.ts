import { describe, it, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import fs from "fs";
import path from "path";

/**
 * ARCHITECTURAL TEST SUITE: Trademark-Free Naming
 *
 * Rationale & Invariants:
 * 1. Third-party console brand names are not used anywhere in the repository: identifiers, file names,
 *    assets, tests, i18n strings and documentation. Quality tiers are named by their look instead.
 * 2. The check covers every tracked file name and every tracked text file under the source, script,
 *    documentation and agent-rule roots. Git history is out of scope.
 * 3. The pattern matches the brand tokens only as standalone words or as camelCase / snake_case parts,
 *    so ordinary words that contain the same letters (lines, nested, scenes) never fail the check.
 */

const repoRoot = process.cwd();

const TRADEMARK_TOKEN = /(?<![a-z])(?:[sS]?[nN][eE][sS](?![a-z])|[sS]?[N][E][S](?![A-Za-z]))|[nN][iI][nN][tT][eE][nN][dD][oO]/;

const TEXT_EXTENSION = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|svg|css|html|yml|yaml|txt|sh|ps1)$/i;

const SCANNED_ROOTS: ReadonlyArray<string> = ["src/", "scripts/", "docs/", ".agents/", "AGENTS.md", "README.md"];


function listTrackedFiles(): string[] {
  const listing = spawnSync("git", ["ls-files", "-z"], { cwd: repoRoot, encoding: "utf8" });
  expect(listing.status).toBe(0);
  return listing.stdout.split("\0").filter((file) => file.length > 0);
}

function isScannedText(file: string): boolean {
  if (!TEXT_EXTENSION.test(file)) return false;
  return SCANNED_ROOTS.some((root) => (root.endsWith("/") ? file.startsWith(root) : file === root));
}

function findTrademarkLines(file: string): string[] {
  const lines = fs.readFileSync(path.join(repoRoot, file), "utf8").split(/\r?\n/);
  const hits: string[] = [];
  lines.forEach((line, index) => {
    if (TRADEMARK_TOKEN.test(line)) hits.push(`${file}:${index + 1}: ${line.trim()}`);
  });
  return hits;
}

describe("Architectural Rule: Trademark-Free Naming", () => {
  const trackedFiles = listTrackedFiles();

  it("keeps brand names out of every tracked file name", () => {
    const offenders = trackedFiles.filter((file) => TRADEMARK_TOKEN.test(path.basename(file)));

    expect(offenders).toEqual([]);
  });

  it("keeps brand names out of tracked source, script, documentation and rule text", () => {
    const offenders = trackedFiles.filter(isScannedText).flatMap(findTrademarkLines);

    expect(offenders).toEqual([]);
  });

  it("flags brand tokens in identifiers and prose while ignoring ordinary words", () => {
    const brandIdentifier = ["N", "E", "S", "_PALETTE"].join("");
    const brandCamel = ["s", "n", "e", "s", "Block"].join("");
    const brandProse = ["the ", "S", "N", "E", "S", " sheet"].join("");
    const ordinaryWords = ["lines", "nested", "scenes", "genes", "business", "useEngineSubscription"];

    expect(TRADEMARK_TOKEN.test(brandIdentifier)).toBe(true);
    expect(TRADEMARK_TOKEN.test(brandCamel)).toBe(true);
    expect(TRADEMARK_TOKEN.test(brandProse)).toBe(true);
    expect(ordinaryWords.filter((word) => TRADEMARK_TOKEN.test(word))).toEqual([]);
  });
});
