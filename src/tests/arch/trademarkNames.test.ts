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
 * 3. A brand token matches only as its own word or as a snake / kebab / camelCase part, so ordinary
 *    words that merely contain the same letters (ROUTINES, LINES, ZONES, machines) never fail the check.
 */

// Brand spellings are assembled from parts so this file does not match its own scan.
const fromParts = (...parts: string[]): string => parts.join("");
const BRAND_PART = new RegExp(`^s?${fromParts("n", "e", "s")}$`, "i");
const BRAND_SUBSTRING = new RegExp(fromParts("nin", "tendo"), "i");

/** Splits on separators and camelCase / acronym boundaries into words, e.g. a camel word followed by an acronym. */
const WORD_PARTS = /[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+/g;

/**
 * Pure matcher: true when the text names the brand as a standalone word or identifier part.
 * Exported so the table test can exercise it without scanning the repository.
 */
export function containsTrademarkToken(text: string): boolean {
  if (BRAND_SUBSTRING.test(text)) return true;
  const parts = text.match(WORD_PARTS) ?? [];
  return parts.some((part) => BRAND_PART.test(part));
}

const repoRoot = process.cwd();

const TEXT_EXTENSION = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|svg|css|html|yml|yaml|txt|sh|ps1)$/i;

const SCANNED_ROOTS: ReadonlyArray<string> = ["src/", "scripts/", "docs/", ".agents/", "AGENTS.md", "README.md"];

const SCAN_TIMEOUT_MS = 30000;

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
    if (containsTrademarkToken(line)) hits.push(`${file}:${index + 1}: ${line.trim()}`);
  });
  return hits;
}

describe("Architectural Rule: Trademark-Free Naming", () => {
  it("keeps brand names out of every tracked file name", () => {
    const offenders = listTrackedFiles().filter((file) => containsTrademarkToken(path.basename(file)));

    expect(offenders).toEqual([]);
  }, SCAN_TIMEOUT_MS);

  it("keeps brand names out of tracked source, script, documentation and rule text", () => {
    const offenders = listTrackedFiles().filter(isScannedText).flatMap(findTrademarkLines);

    expect(offenders).toEqual([]);
  }, SCAN_TIMEOUT_MS);

  it("flags brand tokens in identifiers and prose while ignoring ordinary words", () => {
    const brandIdentifier = ["N", "E", "S", "_PALETTE"].join("");
    const brandCamel = ["s", "n", "e", "s", "Block"].join("");
    const brandProse = ["the ", "S", "N", "E", "S", " sheet"].join("");
    const ordinaryWords = ["lines", "nested", "scenes", "genes", "business", "useEngineSubscription"];

    expect(containsTrademarkToken(brandIdentifier)).toBe(true);
    expect(containsTrademarkToken(brandCamel)).toBe(true);
    expect(containsTrademarkToken(brandProse)).toBe(true);
    expect(ordinaryWords.filter((word) => containsTrademarkToken(word))).toEqual([]);
  });

  describe("containsTrademarkToken matcher table", () => {
    const passing = ["ROUTINES", "LINES", "ZONES", "machines", "business", "genes"];
    const failing = [
      fromParts("N", "E", "S"),
      fromParts("S", "N", "E", "S"),
      fromParts("n", "e", "s", "_tier"),
      fromParts("hi-", "n", "e", "s"),
      fromParts("HI_", "S", "N", "E", "S"),
      fromParts("tier", "S", "n", "e", "s"),
      fromParts("N", "i", "n", "t", "e", "n", "d", "o"),
    ];

    it.each(passing)("passes ordinary word %s", (word) => {
      expect(containsTrademarkToken(word)).toBe(false);
    });

    it.each(failing)("fails brand token %s", (token) => {
      expect(containsTrademarkToken(token)).toBe(true);
    });
  });
});
