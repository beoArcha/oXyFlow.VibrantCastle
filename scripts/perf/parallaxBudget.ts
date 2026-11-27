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
  type ProfileSelection,
  type RunBudgetComparison,
} from "./parallaxTypes";

export interface BudgetCheckOptions {
  readonly profile: ProfileSelection;
  readonly strict: boolean;
}

function buildBaselineLookup(baseline: PerfReport | null): Map<string, MapDprMeasurement> {
  const map = new Map<string, MapDprMeasurement>();
  if (!baseline) return map;
  for (const run of baseline.runs) {
    map.set(`${run.profile}:${run.locationId}@${run.dpr}`, run);
  }
  return map;
}

function compareSingleRun(
  run: MapDprMeasurement,
  baselineRun: MapDprMeasurement | undefined,
  maxP95Ms: number
): RunBudgetComparison {
  const hasError = Boolean(run.error);
  const hasSamples = run.work.sampleCount > 0;
  const p95WithinBudget = run.work.p95Ms <= maxP95Ms;
  const withinBudget = !hasError && hasSamples && p95WithinBudget;

  let reason: string | null = null;
  if (hasError) {
    reason = run.error ?? "run error";
  } else if (!hasSamples) {
    reason = "no work samples recorded";
  } else if (!p95WithinBudget) {
    reason = `work p95 ${run.work.p95Ms.toFixed(2)} ms > ${maxP95Ms.toFixed(2)} ms`;
  }

  return {
    profile: run.profile,
    locationId: run.locationId,
    dpr: run.dpr,
    workP50Ms: run.work.p50Ms,
    workP95Ms: run.work.p95Ms,
    workP99Ms: run.work.p99Ms,
    workMaxMs: run.work.maxMs,
    overBudgetPct: run.work.overBudgetPct,
    droppedFrames: run.cadence.droppedFrames,
    longFrameCount: run.longFrames.count,
    totalBlockingTimeMs: run.longFrames.totalBlockingTimeMs,
    decodedParallaxMB: run.memory.decodedParallaxMB,
    jsHeapUsedMB: run.memory.jsHeapUsedMB,
    timeToFirstParallaxFrameMs: run.timeToFirstParallaxFrameMs,
    baselineWorkP50Ms: baselineRun ? baselineRun.work.p50Ms : null,
    baselineWorkP95Ms: baselineRun ? baselineRun.work.p95Ms : null,
    deltaWorkP50Ms: baselineRun ? roundMetric(run.work.p50Ms - baselineRun.work.p50Ms, 3) : null,
    deltaWorkP95Ms: baselineRun ? roundMetric(run.work.p95Ms - baselineRun.work.p95Ms, 3) : null,
    deltaOverBudgetPct: baselineRun
      ? roundMetric(run.work.overBudgetPct - baselineRun.work.overBudgetPct, 2)
      : null,
    deltaDroppedFrames: baselineRun
      ? run.cadence.droppedFrames - baselineRun.cadence.droppedFrames
      : null,
    deltaLongFrameCount: baselineRun
      ? run.longFrames.count - baselineRun.longFrames.count
      : null,
    deltaDecodedParallaxMB: baselineRun
      ? roundMetric(run.memory.decodedParallaxMB - baselineRun.memory.decodedParallaxMB, 3)
      : null,
    withinBudget,
    reason,
  };
}

function selectTargetRuns(
  runs: readonly MapDprMeasurement[],
  selection: ProfileSelection
): readonly MapDprMeasurement[] {
  if (selection === "all") return runs;
  const distinctProfiles = new Set(runs.map((run) => run.profile));
  if (distinctProfiles.size <= 1) return runs;
  return runs.filter((run) => run.profile === selection);
}

/**
 * Evaluates every measured (profile, location, DPR) run against the profile work p95 budget and baseline.
 * Defaults to report-only (exitCode 0); strict mode returns exitCode 1 when any run exceeds budget.
 */
export function evaluateParallaxBudgets(
  report: PerfReport,
  baseline: PerfReport | null,
  options: BudgetCheckOptions
): BudgetCheckResult {
  const baselineByKey = buildBaselineLookup(baseline);
  const targetRuns = selectTargetRuns(report.runs, options.profile);

  const comparisons = targetRuns.map((run) => {
    const budgetProfile: ProfileName = options.profile === "all" ? run.profile : options.profile;
    const budget = PARALLAX_BUDGET_PROFILES[budgetProfile];
    const baselineRun = baselineByKey.get(`${run.profile}:${run.locationId}@${run.dpr}`);
    return compareSingleRun(run, baselineRun, budget.maxP95Ms);
  });

  const passedCount = comparisons.filter((item) => item.withinBudget).length;
  const failedCount = comparisons.length - passedCount;
  const passed = comparisons.length > 0 && failedCount === 0;

  return {
    profile: options.profile,
    strict: options.strict,
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
  const budgetDesc =
    result.profile === "all"
      ? "desktop<=8.3ms, tablet<=16.6ms, low-power-laptop<=16.6ms"
      : `${PARALLAX_BUDGET_PROFILES[result.profile].targetHz} Hz, work p95 <= ${PARALLAX_BUDGET_PROFILES[result.profile].maxP95Ms.toFixed(1)} ms`;

  const lines: string[] = [
    `[perf:parallax] Budget Check (profile=${result.profile}, ${budgetDesc}, mode=${modeLabel})`,
    result.baselineGeneratedAt
      ? `[perf:parallax] Baseline: ${result.baselineGeneratedAt}`
      : "[perf:parallax] Baseline: none",
    "",
    [
      "profile".padEnd(17),
      "location".padEnd(18),
      "dpr".padStart(3),
      "w_p50".padStart(7),
      "w_p95".padStart(7),
      "w_p99".padStart(7),
      "w_max".padStart(7),
      "over%".padStart(6),
      "d_p95".padStart(7),
      "drop".padStart(5),
      "loaf".padStart(5),
      "tbt".padStart(7),
      "pxMB".padStart(6),
      "1stPx".padStart(7),
      "status",
    ].join(" "),
  ];

  for (const row of result.comparisons) {
    const status = row.withinBudget ? "PASS" : `OVER (${row.reason ?? "failed"})`;
    lines.push(
      [
        row.profile.padEnd(17),
        row.locationId.padEnd(18),
        `${row.dpr}x`.padStart(3),
        row.workP50Ms.toFixed(2).padStart(7),
        row.workP95Ms.toFixed(2).padStart(7),
        row.workP99Ms.toFixed(2).padStart(7),
        row.workMaxMs.toFixed(2).padStart(7),
        `${row.overBudgetPct.toFixed(1)}%`.padStart(6),
        formatDelta(row.deltaWorkP95Ms).padStart(7),
        String(row.droppedFrames).padStart(5),
        String(row.longFrameCount).padStart(5),
        row.totalBlockingTimeMs.toFixed(1).padStart(7),
        row.decodedParallaxMB.toFixed(1).padStart(6),
        (row.timeToFirstParallaxFrameMs === null
          ? "n/a"
          : row.timeToFirstParallaxFrameMs.toFixed(0)
        ).padStart(7),
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
  readonly profile: ProfileSelection;
  readonly strict: boolean;
}

export function parseBudgetCliArgs(
  argv: readonly string[],
  cwd: string = process.cwd()
): BudgetCliArgs {
  let reportPath = resolve(cwd, "scripts/perf/out/latest.json");
  let baselinePath = resolve(cwd, "docs/perf/baseline.json");
  let profile: ProfileSelection = "all";
  let strict = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--strict") {
      strict = true;
    } else if (arg === "--profile" && argv[i + 1]) {
      const next = argv[++i];
      if (next === "desktop" || next === "tablet" || next === "low-power-laptop" || next === "all") {
        profile = next;
      } else if (next === "laptop") {
        profile = "low-power-laptop";
      }
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
