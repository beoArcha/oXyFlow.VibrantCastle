import { describe, it, expect } from "bun:test";
import fs from "fs";
import { getAllSourceFiles, stripComments } from "./helpers/archScanner";

/**
 * ARCHITECTURAL TEST SUITE: No off-screen gate sentinel
 *
 * Rationale & Invariants:
 * 1. A gate stops colliding through its explicit opening state (`src/game/physics/gateState.ts`),
 *    never by being teleported to a magic y coordinate.
 * 2. Production code under `src/` must not carry the old `-1000` sentinel.
 */

const SENTINEL = /-\s*1000\b/;

function isProduction(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  return !normalized.includes("/__tests__/") && !normalized.includes("/tests/") && !/\.test\.tsx?$/.test(normalized);
}

describe("Architectural Rule: No -1000 gate sentinel", () => {
  it("keeps the off-screen y sentinel out of production code", () => {
    const offenders: string[] = [];
    for (const file of getAllSourceFiles("src").filter(isProduction)) {
      const lines = stripComments(fs.readFileSync(file, "utf8")).split(/\r?\n/);
      lines.forEach((line, index) => {
        if (SENTINEL.test(line)) offenders.push(`${file}:${index + 1}: ${line.trim()}`);
      });
    }

    expect(offenders).toEqual([]);
  });
});
