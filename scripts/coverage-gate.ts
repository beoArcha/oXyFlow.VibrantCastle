#!/usr/bin/env bun
/**
 * Vibrant Castle — Per-Suite LCOV Coverage Gate
 * Measures line coverage for the unit suite, the integration suite and their merged (combined)
 * view, and enforces the per-suite minimums declared in scripts/coverage.json.
 * Env overrides: COVERAGE_MIN_UNIT, COVERAGE_MIN_INTEGRATION, COVERAGE_MIN_COMBINED.
 */

import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface FileCoverageRecord {
  readonly file: string;
  readonly lines: Map<number, number>;
  readonly functions: Map<string, number>;
  /** Declared functions from FNF: (undefined when the report has no FNF line). */
  functionsFound?: number;
  /** Executed functions from FNH: (undefined when the report has no FNH line). */
  functionsHit?: number;
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
  readonly unitMin: number;
  readonly integrationMin: number;
  readonly combinedMin: number;
}

export interface CoverageSuites {
  readonly unit: CoverageSummary | null;
  readonly integration: CoverageSummary | null;
  readonly combined: CoverageSummary;
}

export interface CoverageGateResult extends CoverageSuites {
  readonly thresholds: CoverageThresholds;
  readonly unitPassed: boolean;
  readonly integrationPassed: boolean;
  readonly combinedPassed: boolean;
  readonly passed: boolean;
  readonly failures: readonly string[];
}

export const FALLBACK_THRESHOLDS: CoverageThresholds = {
  unitMin: 60,
  integrationMin: 40,
  combinedMin: 80,
};

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function envNumber(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Loads per-suite thresholds from scripts/coverage.json (falling back to FALLBACK_THRESHOLDS),
 * then applies COVERAGE_MIN_* environment overrides.
 */
export function loadThresholdsConfig(
  configPath?: string,
  env: Record<string, string | undefined> = process.env
): CoverageThresholds {
  const candidates = [
    configPath,
    join(import.meta.dirname, "coverage.json"),
    resolve(process.cwd(), "scripts", "coverage.json"),
  ].filter((p): p is string => Boolean(p));

  let base = FALLBACK_THRESHOLDS;
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      const parsed = JSON.parse(readFileSync(candidate, "utf8")) as Record<string, unknown>;
      base = {
        unitMin: numberOr(parsed.unitMin, FALLBACK_THRESHOLDS.unitMin),
        integrationMin: numberOr(parsed.integrationMin, FALLBACK_THRESHOLDS.integrationMin),
        combinedMin: numberOr(parsed.combinedMin, FALLBACK_THRESHOLDS.combinedMin),
      };
      break;
    } catch (err) {
      console.warn(`[coverage-gate] Failed parsing config at ${candidate}:`, err);
    }
  }

  return {
    unitMin: envNumber(env.COVERAGE_MIN_UNIT, base.unitMin),
    integrationMin: envNumber(env.COVERAGE_MIN_INTEGRATION, base.integrationMin),
    combinedMin: envNumber(env.COVERAGE_MIN_COMBINED, base.combinedMin),
  };
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
    } else if (line.startsWith("FNF:") && current) {
      const found = Number(line.slice(4));
      if (Number.isFinite(found)) current.functionsFound = found;
    } else if (line.startsWith("FNH:") && current) {
      const hit = Number(line.slice(4));
      if (Number.isFinite(hit)) current.functionsHit = hit;
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

function maxDefined(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return Math.max(a, b);
}

/**
 * Merges records per source file (summing line hits) and computes the coverage summary.
 * Function totals come from FNF/FNH per file; when the same file appears in several suites the
 * max is kept, so declared functions are not double-counted in the combined view.
 */
export function mergeCoverageRecords(records: readonly FileCoverageRecord[]): CoverageSummary {
  const merged = new Map<string, FileCoverageRecord>();

  for (const rec of records) {
    const existing = merged.get(rec.file);
    if (!existing) {
      merged.set(rec.file, {
        file: rec.file,
        lines: new Map(rec.lines),
        functions: new Map(rec.functions),
        functionsFound: rec.functionsFound,
        functionsHit: rec.functionsHit,
      });
      continue;
    }

    for (const [lineNo, hits] of rec.lines.entries()) {
      existing.lines.set(lineNo, (existing.lines.get(lineNo) ?? 0) + hits);
    }
    for (const [fnName, hits] of rec.functions.entries()) {
      existing.functions.set(fnName, (existing.functions.get(fnName) ?? 0) + hits);
    }
    existing.functionsFound = maxDefined(existing.functionsFound, rec.functionsFound);
    existing.functionsHit = maxDefined(existing.functionsHit, rec.functionsHit);
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
    // Prefer FNF/FNH; fall back to FNDA entries only when the report has no FNF/FNH lines.
    functionsFound += rec.functionsFound ?? rec.functions.size;
    functionsHit += rec.functionsHit ?? [...rec.functions.values()].filter((h) => h > 0).length;
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

/** Checks each measured suite's line coverage against its own minimum. Null suites are skipped. */
export function evaluateCoverageGate(
  suites: CoverageSuites,
  thresholds: CoverageThresholds
): CoverageGateResult {
  const failures: string[] = [];

  const check = (label: string, summary: CoverageSummary | null, min: number): boolean => {
    if (!summary) return true;
    if (summary.linePct < min) {
      failures.push(
        `${label} line coverage ${summary.linePct.toFixed(2)}% is below threshold ${min.toFixed(2)}%`
      );
      return false;
    }
    return true;
  };

  const unitPassed = check("Unit", suites.unit, thresholds.unitMin);
  const integrationPassed = check("Integration", suites.integration, thresholds.integrationMin);
  const combinedPassed = check("Combined", suites.combined, thresholds.combinedMin);

  return {
    ...suites,
    thresholds,
    unitPassed,
    integrationPassed,
    combinedPassed,
    passed: unitPassed && integrationPassed && combinedPassed,
    failures,
  };
}

function formatRow(label: string, summary: CoverageSummary | null, min: number, passed: boolean): string {
  if (!summary) return `| ${label} | n/a | ${min}% | ⏭️ SKIPPED |`;
  return `| ${label} | ${summary.linePct.toFixed(2)}% | ${min}% | ${passed ? "✅ PASS" : "❌ FAIL"} |`;
}

export function formatCoverageMarkdown(result: CoverageGateResult): string {
  const t = result.thresholds;
  return [
    "## 🛡️ Test Suite Coverage Gate Report",
    "",
    "| Suite | Line coverage | Minimum | Status |",
    "| --- | --- | --- | --- |",
    formatRow("🧪 **Unit Tests**", result.unit, t.unitMin, result.unitPassed),
    formatRow("🔌 **Integration Tests**", result.integration, t.integrationMin, result.integrationPassed),
    formatRow("🌐 **Combined Coverage**", result.combined, t.combinedMin, result.combinedPassed),
    "",
    result.passed ? "**Quality Gate Passed** ✅" : "**Quality Gate Failed** ❌",
    "",
  ].join("\n");
}

const DEFAULT_UNIT_LCOV = "coverage/unit/lcov.info";
const DEFAULT_INTEGRATION_LCOV = "coverage/integration/lcov.info";

function loadSuiteRecords(relPath: string): FileCoverageRecord[] | null {
  const absPath = resolve(process.cwd(), relPath);
  if (!existsSync(absPath)) return null;
  return parseLcov(readFileSync(absPath, "utf8"));
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const allowMissing = args.includes("--allow-missing");
  const positional = args.filter((a) => !a.startsWith("--"));
  const unitPath = positional[0] ?? DEFAULT_UNIT_LCOV;
  const integrationPath = positional[1] ?? DEFAULT_INTEGRATION_LCOV;

  const unitRecords = loadSuiteRecords(unitPath);
  const integrationRecords = loadSuiteRecords(integrationPath);

  const missing = [
    unitRecords === null ? `unit (${unitPath})` : null,
    integrationRecords === null ? `integration (${integrationPath})` : null,
  ].filter((m): m is string => m !== null);

  if (missing.length === 2 || (missing.length === 1 && !allowMissing)) {
    console.error(
      `[coverage-gate] ERROR: Missing LCOV for ${missing.join(" and ")}. Run test:unit:coverage and test:integration:coverage first.`
    );
    process.exit(1);
  }
  if (missing.length === 1) {
    console.warn(`[coverage-gate] WARN: Missing LCOV for ${missing[0]}; that suite is skipped.`);
  }

  const unitSummary = unitRecords ? mergeCoverageRecords(unitRecords) : null;
  const integrationSummary = integrationRecords ? mergeCoverageRecords(integrationRecords) : null;
  const combinedSummary = mergeCoverageRecords([...(unitRecords ?? []), ...(integrationRecords ?? [])]);

  const result = evaluateCoverageGate(
    { unit: unitSummary, integration: integrationSummary, combined: combinedSummary },
    loadThresholdsConfig()
  );

  console.log("=== Vibrant Castle Coverage Gate ===");
  const rows = [
    ["Unit", unitSummary, result.thresholds.unitMin],
    ["Integration", integrationSummary, result.thresholds.integrationMin],
    ["Combined", combinedSummary, result.thresholds.combinedMin],
  ] as const;
  for (const [label, summary, min] of rows) {
    if (!summary) {
      console.log(`${label.padEnd(12)}: SKIPPED (no LCOV)`);
      continue;
    }
    console.log(
      `${label.padEnd(12)}: lines ${summary.linesHit}/${summary.linesFound} (${summary.linePct.toFixed(2)}% | min ${min}%) | functions ${summary.functionPct.toFixed(2)}%`
    );
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${formatCoverageMarkdown(result)}\n`);
    } catch (err) {
      console.warn("[coverage-gate] Could not write step summary:", err);
    }
  }

  if (!result.passed) {
    for (const failure of result.failures) {
      console.error(`FAIL: ${failure}`);
    }
    process.exit(1);
  }

  console.log("STATUS: PASSED");
  process.exit(0);
}
