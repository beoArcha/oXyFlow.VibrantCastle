import { describe, expect, it } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findMinorBaseCommit, parseMajorMinor, resolveBuildVersion, type GitRunner } from "../lib/buildVersion";

// Fake first-parent history, newest first: c5..c1. package.json changed at c4 (0.3.0), c2 (0.2.4).
const PKG_AT: Record<string, string> = { c4: "0.3.0", c2: "0.2.4" };
const fakeGit = (headCount: Record<string, number>): GitRunner => (args) => {
  if (args[0] === "log") return "c4\nc2";
  if (args[0] === "show") {
    const commit = args[1].split(":")[0];
    return PKG_AT[commit] ? JSON.stringify({ version: PKG_AT[commit] }) : null;
  }
  if (args[0] === "rev-list") return String(headCount[args[3].split("..")[0]] ?? 0);
  return null;
};

function tempRoot(version: string): string {
  const dir = mkdtempSync(join(tmpdir(), "vc-ver-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ version }));
  return dir;
}

describe("build version", () => {
  it("parses major.minor", () => {
    // Arrange / Act / Assert
    expect(parseMajorMinor("0.3.0")).toEqual({ major: 0, minor: 3 });
    expect(parseMajorMinor("1.12")).toEqual({ major: 1, minor: 12 });
    expect(parseMajorMinor("x")).toBeNull();
  });

  it("finds the commit that introduced the current minor", () => {
    expect(findMinorBaseCommit(fakeGit({}), 0, 3)).toBe("c4");
  });

  it("counts first-parent commits since the minor bump as the patch", () => {
    // Arrange
    const root = tempRoot("0.3.0");
    // Act
    const v = resolveBuildVersion(root, {}, fakeGit({ c4: 95 }));
    // Assert
    expect(v.version).toBe("0.3.95");
    expect(v.patch).toBe(95);
  });

  it("restarts the patch at 0 right after a minor bump", () => {
    const root = tempRoot("0.3.0");
    expect(resolveBuildVersion(root, {}, fakeGit({ c4: 0 })).version).toBe("0.3.0");
  });

  it("honours the VC_APP_VERSION override", () => {
    const root = tempRoot("0.3.0");
    expect(resolveBuildVersion(root, { VC_APP_VERSION: "0.3.7" }, fakeGit({})).version).toBe("0.3.7");
  });

  it("is wired into ci-main, build:pages and release-promote", () => {
    const ci = readFileSync(".github/workflows/ci-main.yml", "utf8");
    const rel = readFileSync(".github/workflows/release-promote.yml", "utf8");
    const dist = readFileSync("scripts/build-distribution.ts", "utf8");
    expect(ci).toContain("bun scripts/version.ts --github-output");
    expect(ci).toContain("fetch-depth: 0");
    expect(rel).toContain("VERSION=$(bun scripts/version.ts)");
    expect(dist).toContain("version.json");
  });
});
