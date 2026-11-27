#!/usr/bin/env bun
/**
 * Prints the build version (major.minor from package.json + patch from git history).
 * `--github-output` also appends `version=<v>` to $GITHUB_OUTPUT for workflow steps.
 */
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveBuildVersion } from "./lib/buildVersion";

const rootDir = resolve(import.meta.dirname, "..");
const info = resolveBuildVersion(rootDir);

if (process.argv.includes("--github-output") && process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${info.version}\n`, "utf8");
}

console.log(info.version);
