#!/usr/bin/env bun
/**
 * Vibrant Castle — LCOV Coverage Gate
 * Parses one or more LCOV files (unit + integration), deduplicates line hits per source file,
 * and enforces minimum line/function coverage thresholds for CI.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface FileCoverageRecord {
  readonly file: string;
  readonly lines: Map<number, number>;
  readonly functions: Map<string, number>;
}

export interface CoverageSummary {
  readonly filesCount: number;
  readonly linesFound: number;
  readonly linesHit: number;
  readonly linePct: number;
  readonly functionsFound: number;
  readonly functionsHit: number;
  readonly functionPct: number;
}

export interface CoverageThresholds {
  readonly minLinesPct: number;
  readonly minFunctionsPct: number;
}

export interface CoverageGateResult {
  readonly summary: CoverageSummary;
  readonly thresholds: CoverageThresholds;
  readonly passed: boolean;
  readonly failures: readonly string[];
}

export function parseLcov(content: string): FileCoverageRecord[] {
  const records: FileCoverageRecord[] = [];
  let current: FileCoverageRecord | null = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("SF:")) {
      current = {
        file: line.slice(3).replace(/\\/g, "/"),
        lines: new Map(),
        functions: new Map(),
      };
    } else if (line.startsWith("DA:") && current) {
      const [lineNumRaw, hitsRaw] = line.slice(3).split(",");
      const lineNum = Number(lineNumRaw);
      const hits = Number(hitsRaw);
      if (Number.isFinite(lineNum) && Number.isFinite(hits)) {
        const prev = current.lines.get(lineNum) ?? 0;
        current.lines.set(lineNum, prev + hits);
      }
    } else if (line.startsWith("FNDA:") && current) {
      const commaIdx = line.indexOf(",");
      if (commaIdx > 5) {
        const hits = Number(line.slice(5, commaIdx));
        const fnName = line.slice(commaIdx + 1);
        if (Number.isFinite(hits) && fnName) {
          const prev = current.functions.get(fnName) ?? 0;
          current.functions.set(fnName, prev + hits);
        }
      }
    } else if (line === "end_of_record" && current) {
      records.push(current);
      current = null;
    }
  }

  if (current) {
    records.push(current);
  }

  return records;
}

export function mergeCoverageRecords(records: readonly FileCoverageRecord[]): CoverageSummary {
  const merged = new Map<string, FileCoverageRecord>();

  for (const rec of records) {
    const existing = merged.get(rec.file);
    if (!existing) {
      merged.set(rec.file, {
        file: rec.file,
        lines: new Map(rec.lines),
        functions: new Map(rec.functions),
      });
      continue;
    }

    for (const [lineNo, hits] of rec.lines.entries()) {
      existing.lines.set(lineNo, (existing.lines.get(lineNo) ?? 0) + hits);
    }
    for (const [fnName, hits] of rec.functions.entries()) {
      existing.functions.set(fnName, (existing.functions.get(fnName) ?? 0) + hits);
    }
  }

  let linesFound = 0;
  let linesHit = 0;
  let functionsFound = 0;
  let functionsHit = 0;

  for (const rec of merged.values()) {
    for (const hits of rec.lines.values()) {
      linesFound += 1;
      if (hits > 0) linesHit += 1;
    }
    for (const hits of rec.functions.values()) {
      functionsFound += 1;
      if (hits > 0) functionsHit += 1;
    }
  }

  const linePct = linesFound > 0 ? Number(((linesHit / linesFound) * 100).toFixed(2)) : 100;
  const functionPct =
    functionsFound > 0 ? Number(((functionsHit / functionsFound) * 100).toFixed(2)) : 100;

  return {
    filesCount: merged.size,
    linesFound,
    linesHit,
    linePct,
    functionsFound,
    functionsHit,
    functionPct,
  };
}

export function evaluateCoverageGate(
  summary: CoverageSummary,
  thresholds: CoverageThresholds
): CoverageGateResult {
  const failures: string[] = [];

  if (summary.linePct < thresholds.minLinesPct) {
    failures.push(
      `Line coverage ${summary.linePct.toFixed(2)}% is below threshold ${thresholds.minLinesPct.toFixed(2)}%`
    );
  }
  if (summary.functionsFound > 0 && summary.functionPct < thresholds.minFunctionsPct) {
    failures.push(
      `Function coverage ${summary.functionPct.toFixed(2)}% is below threshold ${thresholds.minFunctionsPct.toFixed(2)}%`
    );
  }

  return {
    summary,
    thresholds,
    passed: failures.length === 0,
    failures,
  };
}

const DEFAULT_LCOV_PATHS = [
  "coverage/unit/lcov.info",
  "coverage/integration/lcov.info",
];

if (import.meta.main) {
  const args = process.argv.slice(2);
  const allowMissing = args.includes("--allow-missing");
  const customPaths = args.filter((a) => !a.startsWith("--"));
  const pathsToRead = customPaths.length > 0 ? customPaths : DEFAULT_LCOV_PATHS;

  const rootDir = process.cwd();
  const loadedRecords: FileCoverageRecord[] = [];
  let filesFoundCount = 0;

  for (const relPath of pathsToRead) {
    const absPath = resolve(rootDir, relPath);
    if (existsSync(absPath)) {
      filesFoundCount += 1;
      const content = readFileSync(absPath, "utf8");
      loadedRecords.push(...parseLcov(content));
    }
  }

  if (filesFoundCount === 0) {
    const message = `No LCOV files found at: ${pathsToRead.join(", ")}. Run test:unit:coverage first.`;
    if (allowMissing) {
      console.warn(`[coverage-gate] WARN: ${message}`);
      process.exit(0);
    }
    console.error(`[coverage-gate] ERROR: ${message}`);
    process.exit(1);
  }

  const minLinesPct = Number(process.env.COVERAGE_MIN_LINES ?? "35");
  const minFunctionsPct = Number(process.env.COVERAGE_MIN_FUNCTIONS ?? "30");

  const summary = mergeCoverageRecords(loadedRecords);
  const result = evaluateCoverageGate(summary, {
    minLinesPct: Number.isFinite(minLinesPct) ? minLinesPct : 35,
    minFunctionsPct: Number.isFinite(minFunctionsPct) ? minFunctionsPct : 30,
  });

  console.log("=== Vibrant Castle Coverage Gate ===");
  console.log(`Files measured : ${summary.filesCount}`);
  console.log(
    `Lines covered  : ${summary.linesHit}/${summary.linesFound} (${summary.linePct.toFixed(2)}% | min ${result.thresholds.minLinesPct}%)`
  );
  console.log(
    `Functions cov. : ${summary.functionsHit}/${summary.functionsFound} (${summary.functionPct.toFixed(2)}% | min ${result.thresholds.minFunctionsPct}%)`
  );

  if (!result.passed) {
    for (const failure of result.failures) {
      console.error(`FAIL: ${failure}`);
    }
    process.exit(1);
  }

  console.log("STATUS: PASSED");
  process.exit(0);
}
