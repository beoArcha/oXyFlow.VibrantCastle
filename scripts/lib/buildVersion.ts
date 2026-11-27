/**
 * Build version: `major.minor` comes from package.json (changed only at phase gates);
 * `patch` is the number of first-parent commits on the current history since the commit
 * that last changed `major.minor` in package.json. Every build on main therefore gets a
 * higher patch, and the patch restarts at 0 when the minor version is bumped.
 *
 * `VC_APP_VERSION` overrides the computed value (CI passes it between jobs).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface BuildVersion {
  readonly version: string;
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly baseCommit: string | null;
}

export type GitRunner = (args: readonly string[]) => string | null;

const MAJOR_MINOR = /^(\d+)\.(\d+)(?:\.\d+)?/;

export function parseMajorMinor(version: string): { major: number; minor: number } | null {
  const match = MAJOR_MINOR.exec(version.trim());
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]) };
}

export function createGitRunner(cwd: string): GitRunner {
  return (args) => {
    const result = spawnSync("git", args as string[], { cwd, encoding: "utf8" });
    if (result.status !== 0) return null;
    return result.stdout.trim();
  };
}

function versionAt(git: GitRunner, commit: string): { major: number; minor: number } | null {
  const raw = git(["show", `${commit}:package.json`]);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as { version?: unknown };
    return typeof parsed.version === "string" ? parseMajorMinor(parsed.version) : null;
  } catch {
    return null;
  }
}

/**
 * Finds the oldest first-parent commit whose package.json already has the current
 * major.minor, walking back through the commits that touched package.json.
 */
export function findMinorBaseCommit(git: GitRunner, major: number, minor: number): string | null {
  const log = git(["log", "--first-parent", "--format=%H", "--", "package.json"]);
  if (!log) return null;
  let base: string | null = null;
  for (const commit of log.split("\n").filter(Boolean)) {
    const v = versionAt(git, commit);
    if (!v || v.major !== major || v.minor !== minor) break;
    base = commit;
  }
  return base;
}

export function resolveBuildVersion(
  rootDir: string,
  env: Record<string, string | undefined> = process.env,
  git: GitRunner = createGitRunner(rootDir)
): BuildVersion {
  const pkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8")) as { version: string };
  const mm = parseMajorMinor(pkg.version) ?? { major: 0, minor: 0 };

  const override = env.VC_APP_VERSION?.trim();
  if (override) {
    const parts = override.split(".").map(Number);
    return {
      version: override,
      major: parts[0] ?? mm.major,
      minor: parts[1] ?? mm.minor,
      patch: parts[2] ?? 0,
      baseCommit: null,
    };
  }

  const base = findMinorBaseCommit(git, mm.major, mm.minor);
  let patch = 0;
  if (base) {
    const count = git(["rev-list", "--count", "--first-parent", `${base}..HEAD`]);
    patch = count ? Number(count) || 0 : 0;
  }
  return {
    version: `${mm.major}.${mm.minor}.${patch}`,
    major: mm.major,
    minor: mm.minor,
    patch,
    baseCommit: base,
  };
}
