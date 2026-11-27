#!/usr/bin/env bun
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { roundMetric } from "./parallaxMetrics";
import {
  PARALLAX_BUDGET_PROFILES,
  type BudgetCheckResult,
  type MapDprMeasurement,
  type PerfReport,
  type ProfileName,
  type RunBudgetComparison,
} from "./parallaxTypes";

export interface BudgetCheckOptions {
  readonly profile: ProfileName;
  readonly strict: boolean;
}

function buildBaselineLookup(baseline: PerfReport | null): Map<string, MapDprMeasurement> {
  const map = new Map<string, MapDprMeasurement>();
  if (!baseline) return map;
  for (const run of baseline.runs) {
    map.set(`${run.locationId}@${run.dpr}`, run);
  }
  return map;
}

function compareSingleRun(
  run: MapDprMeasurement,
  baselineRun: MapDprMeasurement | undefined,
  maxP95Ms: number
): RunBudgetComparison {
  const hasError = Boolean(run.error);
  const hasSamples = run.frameTime.sampleCount > 0;
  const p95WithinBudget = run.frameTime.p95Ms <= maxP95Ms;
  const withinBudget = !hasError && hasSamples && p95WithinBudget;

  let reason: string | null = null;
  if (hasError) {
    reason = run.error ?? "run error";
  } else if (!hasSamples) {
    reason = "no frame samples recorded";
  } else if (!p95WithinBudget) {
    reason = `p95 ${run.frameTime.p95Ms.toFixed(2)} ms > ${maxP95Ms.toFixed(2)} ms`;
  }

  return {
    locationId: run.locationId,
    dpr: run.dpr,
    p50Ms: run.frameTime.p50Ms,
    p95Ms: run.frameTime.p95Ms,
    droppedFrames: run.frameTime.droppedFrames,
    decodedParallaxMB: run.memory.decodedParallaxMB,
    jsHeapUsedMB: run.memory.jsHeapUsedMB,
    timeToFirstParallaxFrameMs: run.timeToFirstParallaxFrameMs,
    baselineP50Ms: baselineRun ? baselineRun.frameTime.p50Ms : null,
    baselineP95Ms: baselineRun ? baselineRun.frameTime.p95Ms : null,
    deltaP50Ms: baselineRun ? roundMetric(run.frameTime.p50Ms - baselineRun.frameTime.p50Ms, 3) : null,
    deltaP95Ms: baselineRun ? roundMetric(run.frameTime.p95Ms - baselineRun.frameTime.p95Ms, 3) : null,
    deltaDroppedFrames: baselineRun
      ? run.frameTime.droppedFrames - baselineRun.frameTime.droppedFrames
      : null,
    deltaDecodedParallaxMB: baselineRun
      ? roundMetric(run.memory.decodedParallaxMB - baselineRun.memory.decodedParallaxMB, 3)
      : null,
    withinBudget,
    reason,
  };
}

/**
 * Evaluates every measured (location, DPR) run against the profile p95 budget and baseline report.
 * Defaults to report-only (exitCode 0); strict mode returns exitCode 1 when any run exceeds budget.
 */
export function evaluateParallaxBudgets(
  report: PerfReport,
  baseline: PerfReport | null,
  options: BudgetCheckOptions
): BudgetCheckResult {
  const budget = PARALLAX_BUDGET_PROFILES[options.profile];
  const baselineByKey = buildBaselineLookup(baseline);

  const comparisons = report.runs.map((run) =>
    compareSingleRun(run, baselineByKey.get(`${run.locationId}@${run.dpr}`), budget.maxP95Ms)
  );

  const passedCount = comparisons.filter((item) => item.withinBudget).length;
  const failedCount = comparisons.length - passedCount;
  const passed = comparisons.length > 0 && failedCount === 0;

  return {
    profile: options.profile,
    strict: options.strict,
    budget,
    baselineGeneratedAt: baseline?.generatedAt ?? null,
    comparisons,
    passedCount,
    failedCount,
    passed,
    exitCode: options.strict && !passed ? 1 : 0,
  };
}

function formatDelta(delta: number | null): string {
  if (delta === null) return "n/a";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(2)}`;
}

export function formatBudgetReport(result: BudgetCheckResult): string {
  const modeLabel = result.strict ? "strict" : "report-only";
  const lines: string[] = [
    `[perf:parallax] Budget Check (${result.profile}, ${result.budget.targetHz} Hz, p95 <= ${result.budget.maxP95Ms.toFixed(1)} ms, mode=${modeLabel})`,
    result.baselineGeneratedAt
      ? `[perf:parallax] Baseline: ${result.baselineGeneratedAt}`
      : "[perf:parallax] Baseline: none",
    "",
    [
      "location".padEnd(19),
      "dpr".padStart(3),
      "p50(ms)".padStart(8),
      "p95(ms)".padStart(8),
      "d_p95".padStart(8),
      "drop".padStart(5),
      "pxMB".padStart(7),
      "heapMB".padStart(7),
      "1stPx(ms)".padStart(10),
      "status",
    ].join(" "),
  ];

  for (const row of result.comparisons) {
    const status = row.withinBudget ? "PASS" : `OVER (${row.reason ?? "failed"})`;
    lines.push(
      [
        row.locationId.padEnd(19),
        `${row.dpr}x`.padStart(3),
        row.p50Ms.toFixed(2).padStart(8),
        row.p95Ms.toFixed(2).padStart(8),
        formatDelta(row.deltaP95Ms).padStart(8),
        String(row.droppedFrames).padStart(5),
        row.decodedParallaxMB.toFixed(1).padStart(7),
        (row.jsHeapUsedMB === null ? "n/a" : row.jsHeapUsedMB.toFixed(1)).padStart(7),
        (row.timeToFirstParallaxFrameMs === null
          ? "n/a"
          : row.timeToFirstParallaxFrameMs.toFixed(1)
        ).padStart(10),
        status,
      ].join(" ")
    );
  }

  lines.push("");
  lines.push(
    `Summary: ${result.passedCount}/${result.comparisons.length} within budget, ${result.failedCount} over budget (${result.strict ? "exit " + result.exitCode : "report-only exit 0"}).`
  );

  return lines.join("\n");
}

function readJsonReport(filePath: string): PerfReport | null {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as PerfReport;
  } catch {
    return null;
  }
}

export interface BudgetCliArgs {
  readonly reportPath: string;
  readonly baselinePath: string;
  readonly profile: ProfileName;
  readonly strict: boolean;
}

export function parseBudgetCliArgs(
  argv: readonly string[],
  cwd: string = process.cwd()
): BudgetCliArgs {
  let reportPath = resolve(cwd, "scripts/perf/out/latest.json");
  let baselinePath = resolve(cwd, "docs/perf/baseline.json");
  let profile: ProfileName = "desktop";
  let strict = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--strict") {
      strict = true;
    } else if (arg === "--profile" && argv[i + 1]) {
      const next = argv[++i];
      if (next === "desktop" || next === "tablet") profile = next;
    } else if (arg === "--baseline" && argv[i + 1]) {
      baselinePath = resolve(cwd, argv[++i]);
    } else if (arg === "--report" && argv[i + 1]) {
      reportPath = resolve(cwd, argv[++i]);
    } else if (!arg.startsWith("-")) {
      reportPath = resolve(cwd, arg);
    }
  }

  return { reportPath, baselinePath, profile, strict };
}

function main(): void {
  const cli = parseBudgetCliArgs(process.argv.slice(2));
  const report = readJsonReport(cli.reportPath);
  if (!report) {
    console.error(`[perf:parallax] Report file not found or invalid JSON: ${cli.reportPath}`);
    process.exit(1);
  }

  const baseline = readJsonReport(cli.baselinePath);
  const result = evaluateParallaxBudgets(report, baseline, {
    profile: cli.profile,
    strict: cli.strict,
  });

  console.log(formatBudgetReport(result));
  process.exit(result.exitCode);
}

if (import.meta.main) {
  main();
}
