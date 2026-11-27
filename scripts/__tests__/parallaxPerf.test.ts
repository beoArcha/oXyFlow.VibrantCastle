import { describe, expect, it } from "bun:test";
import {
  aggregatePerfReport,
  bytesToMB,
  computePercentile,
  summarizeFrameDeltas,
  summarizeLongFrames,
  summarizeWorkDurations,
} from "../perf/parallaxMetrics";
import {
  evaluateParallaxBudgets,
  formatBudgetReport,
  parseBudgetCliArgs,
} from "../perf/parallaxBudget";
import type {
  MapDprMeasurement,
  PerfEnvironmentInfo,
  PerfRunConfig,
  ProfileName,
} from "../perf/parallaxTypes";

const TEST_ENV: PerfEnvironmentInfo = {
  machine: "test-host",
  os: "Linux 6.x",
  cpu: "Test CPU",
  cpuCores: 8,
  browser: "Chromium 156.0",
  userAgent: "TestUA",
  bunVersion: "1.4.2",
};

const TEST_CONFIG: PerfRunConfig = {
  serverMode: "build",
  holdRightMs: 2500,
  jumpAtMs: 1000,
  warmupMs: 150,
  profiles: [
    {
      profile: "desktop",
      viewport: { width: 1280, height: 720 },
      dprs: [1, 2],
      cpuThrottlingRate: 1,
      targetHz: 120,
      targetFrameMs: 8.333,
      frameBudgetMs: 8.3,
      droppedMultiplier: 1.5,
    },
    {
      profile: "tablet",
      viewport: { width: 1024, height: 768 },
      dprs: [2],
      cpuThrottlingRate: 4,
      targetHz: 60,
      targetFrameMs: 16.667,
      frameBudgetMs: 16.6,
      droppedMultiplier: 1.5,
    },
  ],
  locations: ["courtyard"],
};

interface MakeRunOverrides {
  profile?: ProfileName;
  locationId?: string;
  dpr?: number;
  workP50Ms?: number;
  workP95Ms?: number;
  workP99Ms?: number;
  workMaxMs?: number;
  overBudgetPct?: number;
  droppedFrames?: number;
  longFrameCount?: number;
  totalBlockingTimeMs?: number;
  timeToFirstParallaxFrameMs?: number | null;
  error?: string;
}

function makeRun(overrides: MakeRunOverrides = {}): MapDprMeasurement {
  const profile = overrides.profile ?? "desktop";
  const frameBudgetMs = profile === "tablet" ? 16.6 : 8.3;
  const targetFrameMs = profile === "tablet" ? 16.667 : 8.333;

  return {
    profile,
    locationId: overrides.locationId ?? "courtyard",
    dpr: overrides.dpr ?? (profile === "tablet" ? 2 : 1),
    viewport: profile === "tablet" ? { width: 1024, height: 768 } : { width: 1280, height: 720 },
    cpuThrottlingRate: profile === "tablet" ? 4 : 1,
    work: {
      sampleCount: 120,
      p50Ms: overrides.workP50Ms ?? 2.4,
      p95Ms: overrides.workP95Ms ?? 4.1,
      p99Ms: overrides.workP99Ms ?? 6.0,
      maxMs: overrides.workMaxMs ?? 7.2,
      meanMs: 2.6,
      overBudgetFrames: 0,
      overBudgetPct: overrides.overBudgetPct ?? 0,
      frameBudgetMs,
    },
    cadence: {
      sampleCount: 120,
      p50Ms: targetFrameMs,
      p95Ms: targetFrameMs + 0.2,
      maxMs: 12.1,
      meanMs: targetFrameMs + 0.05,
      droppedFrames: overrides.droppedFrames ?? 0,
      droppedPct: 0,
      targetFrameMs,
      droppedThresholdMs: targetFrameMs * 1.5,
    },
    longFrames: {
      observerType: "long-animation-frame",
      count: overrides.longFrameCount ?? 1,
      totalBlockingTimeMs: overrides.totalBlockingTimeMs ?? 12.5,
      maxDurationMs: 62.5,
    },
    memory: {
      jsHeapUsedMB: 24.5,
      jsHeapTotalMB: 40.0,
      decodedImagesCount: 10,
      decodedImagesTotalMB: 42.0,
      decodedParallaxCount: 5,
      decodedParallaxMB: 30.0,
    },
    timeToFirstParallaxFrameMs:
      overrides.timeToFirstParallaxFrameMs === undefined ? 185.5 : overrides.timeToFirstParallaxFrameMs,
    ...(overrides.error ? { error: overrides.error } : {}),
  };
}

describe("parallax perf metrics aggregation", () => {
  it("should compute linear-interpolated percentiles from unsorted samples", () => {
    // Arrange
    const samples = [20, 4, 8, 12, 16];

    // Act
    const p50 = computePercentile(samples, 50);
    const p95 = computePercentile(samples, 95);
    const p99 = computePercentile(samples, 99);

    // Assert
    expect(p50).toBe(12);
    expect(p95).toBe(19.2);
    expect(p99).toBe(19.84);
  });

  it("should summarize per-frame work durations and share exceeding frame budget", () => {
    // Arrange
    const durations = [1.5, 2.0, 3.5, 8.4, 12.0];

    // Act
    const work = summarizeWorkDurations(durations, 8.3);

    // Assert
    expect(work.sampleCount).toBe(5);
    expect(work.p50Ms).toBe(3.5);
    expect(work.p95Ms).toBe(11.28);
    expect(work.p99Ms).toBe(11.856);
    expect(work.maxMs).toBe(12);
    expect(work.overBudgetFrames).toBe(2);
    expect(work.overBudgetPct).toBe(40);
    expect(work.frameBudgetMs).toBe(8.3);
  });

  it("should count dropped frames exceeding 1.5x the target frame cadence interval", () => {
    // Arrange
    const targetFrameMs = 1000 / 120;
    const deltas = [8.2, 8.3, 8.4, 12.6, 16.7];

    // Act
    const cadence = summarizeFrameDeltas(deltas, targetFrameMs, 1.5);

    // Assert
    expect(cadence.sampleCount).toBe(5);
    expect(cadence.droppedFrames).toBe(2);
    expect(cadence.droppedPct).toBe(40);
    expect(cadence.p50Ms).toBe(8.4);
  });

  it("should aggregate worst-case work, cadence, and long-frame summary metrics across runs", () => {
    // Arrange
    const runs = [
      makeRun({
        profile: "desktop",
        locationId: "courtyard",
        dpr: 1,
        workP50Ms: 2.1,
        workP95Ms: 3.4,
        workP99Ms: 5.0,
        workMaxMs: 6.2,
        overBudgetPct: 0.5,
        droppedFrames: 1,
        longFrameCount: 2,
        totalBlockingTimeMs: 30.5,
      }),
      makeRun({
        profile: "tablet",
        locationId: "clocktower",
        dpr: 2,
        workP50Ms: 7.5,
        workP95Ms: 14.2,
        workP99Ms: 17.8,
        workMaxMs: 21.4,
        overBudgetPct: 4.0,
        droppedFrames: 3,
        longFrameCount: 5,
        totalBlockingTimeMs: 112.25,
      }),
    ];

    // Act
    const report = aggregatePerfReport(runs, TEST_ENV, TEST_CONFIG, "2026-11-27T16:00:00.000Z");

    // Assert
    expect(report.schemaVersion).toBe(2);
    expect(report.summary.totalRuns).toBe(2);
    expect(report.summary.failedRuns).toBe(0);
    expect(report.summary.worstWorkP50Ms).toBe(7.5);
    expect(report.summary.worstWorkP95Ms).toBe(14.2);
    expect(report.summary.worstWorkP99Ms).toBe(17.8);
    expect(report.summary.worstWorkMaxMs).toBe(21.4);
    expect(report.summary.worstOverBudgetPct).toBe(4);
    expect(report.summary.totalDroppedFrames).toBe(4);
    expect(report.summary.totalLongFrames).toBe(7);
    expect(report.summary.totalBlockingTimeMs).toBe(142.75);
    expect(bytesToMB(1024 * 1024 * 12)).toBe(12);
    expect(summarizeLongFrames("long-animation-frame", 3, 45.126, 78.999)).toEqual({
      observerType: "long-animation-frame",
      count: 3,
      totalBlockingTimeMs: 45.13,
      maxDurationMs: 79,
    });
  });
});

describe("parallax perf budget evaluation", () => {
  it("should exit 0 in report-only mode even when work p95 exceeds the desktop budget", () => {
    // Arrange
    const baseline = aggregatePerfReport(
      [makeRun({ profile: "desktop", locationId: "courtyard", dpr: 1, workP50Ms: 3.2, workP95Ms: 7.0, droppedFrames: 1 })],
      TEST_ENV,
      TEST_CONFIG
    );
    const current = aggregatePerfReport(
      [makeRun({ profile: "desktop", locationId: "courtyard", dpr: 1, workP50Ms: 4.1, workP95Ms: 9.5, droppedFrames: 2 })],
      TEST_ENV,
      TEST_CONFIG
    );

    // Act
    const result = evaluateParallaxBudgets(current, baseline, { profile: "desktop", strict: false });

    // Assert
    expect(result.passed).toBe(false);
    expect(result.failedCount).toBe(1);
    expect(result.exitCode).toBe(0);
    expect(result.comparisons[0]?.deltaWorkP95Ms).toBe(2.5);
    expect(result.comparisons[0]?.deltaDroppedFrames).toBe(1);
  });

  it("should exit 1 in strict mode when any run exceeds its profile work p95 budget", () => {
    // Arrange
    const current = aggregatePerfReport(
      [makeRun({ profile: "desktop", locationId: "courtyard", dpr: 2, workP95Ms: 11.4 })],
      TEST_ENV,
      TEST_CONFIG
    );

    // Act
    const result = evaluateParallaxBudgets(current, null, { profile: "desktop", strict: true });

    // Assert
    expect(result.passed).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(formatBudgetReport(result)).toContain("OVER");
  });

  it("should evaluate desktop and tablet runs against their respective budgets when profile is all", () => {
    // Arrange
    const current = aggregatePerfReport(
      [
        makeRun({ profile: "desktop", locationId: "courtyard", dpr: 2, workP95Ms: 6.2 }),
        makeRun({ profile: "tablet", locationId: "courtyard", dpr: 2, workP95Ms: 15.8 }),
      ],
      TEST_ENV,
      TEST_CONFIG
    );

    // Act
    const result = evaluateParallaxBudgets(current, null, { profile: "all", strict: true });

    // Assert
    expect(result.passed).toBe(true);
    expect(result.passedCount).toBe(2);
    expect(result.exitCode).toBe(0);
  });

  it("should filter multi-profile reports when checking a single profile", () => {
    // Arrange
    const current = aggregatePerfReport(
      [
        makeRun({ profile: "desktop", locationId: "courtyard", dpr: 2, workP95Ms: 10.2 }),
        makeRun({ profile: "tablet", locationId: "courtyard", dpr: 2, workP95Ms: 15.8 }),
      ],
      TEST_ENV,
      TEST_CONFIG
    );

    // Act
    const tabletOnly = evaluateParallaxBudgets(current, null, { profile: "tablet", strict: true });

    // Assert
    expect(tabletOnly.comparisons).toHaveLength(1);
    expect(tabletOnly.passed).toBe(true);
    expect(tabletOnly.exitCode).toBe(0);
  });

  it("should parse CLI arguments for profile, strict flag, and report path", () => {
    // Arrange
    const argv = ["custom/report.json", "--profile", "tablet", "--strict", "--baseline", "docs/perf/baseline.json"];

    // Act
    const parsed = parseBudgetCliArgs(argv, "/repo");

    // Assert
    expect(parsed.profile).toBe("tablet");
    expect(parsed.strict).toBe(true);
    expect(parsed.reportPath.endsWith("report.json")).toBe(true);
    expect(parsed.baselinePath.endsWith("baseline.json")).toBe(true);
  });
});
