import { describe, expect, it } from "bun:test";
import {
  aggregatePerfReport,
  bytesToMB,
  computePercentile,
  summarizeFrameDeltas,
} from "../perf/parallaxMetrics";
import {
  evaluateParallaxBudgets,
  formatBudgetReport,
  parseBudgetCliArgs,
} from "../perf/parallaxBudget";
import type { MapDprMeasurement, PerfEnvironmentInfo, PerfRunConfig } from "../perf/parallaxTypes";

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
  targetHz: 120,
  targetFrameMs: 8.333,
  droppedMultiplier: 1.5,
  dprs: [1, 2],
  locations: ["courtyard"],
};

function makeRun(overrides: Partial<MapDprMeasurement> & { p50Ms?: number; p95Ms?: number; droppedFrames?: number } = {}): MapDprMeasurement {
  return {
    locationId: overrides.locationId ?? "courtyard",
    dpr: overrides.dpr ?? 1,
    viewport: overrides.viewport ?? { width: 1280, height: 720 },
    frameTime: overrides.frameTime ?? {
      sampleCount: 120,
      p50Ms: overrides.p50Ms ?? 8.2,
      p95Ms: overrides.p95Ms ?? 8.3,
      maxMs: 10.1,
      meanMs: 8.25,
      droppedFrames: overrides.droppedFrames ?? 0,
      droppedPct: 0,
      targetFrameMs: 8.333,
      droppedThresholdMs: 12.5,
    },
    memory: overrides.memory ?? {
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
  it("should compute linear-interpolated percentiles from unsorted frame deltas", () => {
    // Arrange
    const deltas = [20, 4, 8, 12, 16];

    // Act
    const p50 = computePercentile(deltas, 50);
    const p95 = computePercentile(deltas, 95);

    // Assert
    expect(p50).toBe(12);
    expect(p95).toBe(19.2);
  });

  it("should count dropped frames exceeding 1.5x the target frame duration", () => {
    // Arrange
    const targetFrameMs = 1000 / 120;
    const deltas = [8.2, 8.3, 8.4, 12.6, 16.7];

    // Act
    const summary = summarizeFrameDeltas(deltas, targetFrameMs, 1.5);

    // Assert
    expect(summary.sampleCount).toBe(5);
    expect(summary.droppedFrames).toBe(2);
    expect(summary.droppedPct).toBe(40);
    expect(summary.p50Ms).toBe(8.4);
  });

  it("should aggregate worst-case summary metrics across map runs", () => {
    // Arrange
    const runs = [
      makeRun({ locationId: "courtyard", dpr: 1, p50Ms: 8.1, p95Ms: 8.3, droppedFrames: 1 }),
      makeRun({ locationId: "clocktower", dpr: 2, p50Ms: 8.5, p95Ms: 14.2, droppedFrames: 3 }),
    ];

    // Act
    const report = aggregatePerfReport(runs, TEST_ENV, TEST_CONFIG, "2026-11-27T16:00:00.000Z");

    // Assert
    expect(report.summary.totalRuns).toBe(2);
    expect(report.summary.failedRuns).toBe(0);
    expect(report.summary.worstP50Ms).toBe(8.5);
    expect(report.summary.worstP95Ms).toBe(14.2);
    expect(report.summary.totalDroppedFrames).toBe(4);
    expect(bytesToMB(1024 * 1024 * 12)).toBe(12);
  });
});

describe("parallax perf budget evaluation", () => {
  it("should exit 0 in report-only mode even when runs exceed the desktop p95 budget", () => {
    // Arrange
    const baseline = aggregatePerfReport(
      [makeRun({ locationId: "courtyard", dpr: 1, p50Ms: 8.2, p95Ms: 9.0, droppedFrames: 1 })],
      TEST_ENV,
      TEST_CONFIG
    );
    const current = aggregatePerfReport(
      [makeRun({ locationId: "courtyard", dpr: 1, p50Ms: 8.3, p95Ms: 10.5, droppedFrames: 2 })],
      TEST_ENV,
      TEST_CONFIG
    );

    // Act
    const result = evaluateParallaxBudgets(current, baseline, { profile: "desktop", strict: false });

    // Assert
    expect(result.passed).toBe(false);
    expect(result.failedCount).toBe(1);
    expect(result.exitCode).toBe(0);
    expect(result.comparisons[0]?.deltaP95Ms).toBe(1.5);
    expect(result.comparisons[0]?.deltaDroppedFrames).toBe(1);
  });

  it("should exit 1 in strict mode when any run exceeds budget", () => {
    // Arrange
    const current = aggregatePerfReport(
      [makeRun({ locationId: "courtyard", dpr: 2, p95Ms: 11.4 })],
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

  it("should pass tablet budget when p95 is at or below 16.6 ms", () => {
    // Arrange
    const current = aggregatePerfReport(
      [makeRun({ locationId: "courtyard", dpr: 2, p95Ms: 16.4 })],
      TEST_ENV,
      TEST_CONFIG
    );

    // Act
    const result = evaluateParallaxBudgets(current, null, { profile: "tablet", strict: true });

    // Assert
    expect(result.passed).toBe(true);
    expect(result.exitCode).toBe(0);
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
