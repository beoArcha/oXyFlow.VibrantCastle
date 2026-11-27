import type {
  FrameTimeMetrics,
  MapDprMeasurement,
  PerfEnvironmentInfo,
  PerfReport,
  PerfReportSummary,
  PerfRunConfig,
} from "./parallaxTypes";

export function roundMetric(value: number, decimals: number = 3): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function bytesToMB(bytes: number): number {
  if (!Number.isFinite(bytes) || bytes <= 0) return 0;
  return roundMetric(bytes / (1024 * 1024), 3);
}

/**
 * Computes a linear-interpolated percentile (0..100) from frame delta samples.
 */
export function computePercentile(values: readonly number[], percentile: number): number {
  const valid = values.filter((v) => Number.isFinite(v) && v >= 0);
  if (valid.length === 0) return 0;

  const sorted = [...valid].sort((a, b) => a - b);
  const clamped = Math.max(0, Math.min(100, percentile));
  const index = (clamped / 100) * (sorted.length - 1);
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  if (lo === hi) return roundMetric(sorted[lo], 3);

  const weight = index - lo;
  return roundMetric(sorted[lo] * (1 - weight) + sorted[hi] * weight, 3);
}

/**
 * Summarizes raw requestAnimationFrame delta timings against a target frame interval.
 */
export function summarizeFrameDeltas(
  deltasMs: readonly number[],
  targetFrameMs: number,
  droppedMultiplier: number = 1.5
): FrameTimeMetrics {
  const valid = deltasMs.filter((v) => Number.isFinite(v) && v >= 0);
  const droppedThresholdMs = roundMetric(targetFrameMs * droppedMultiplier, 3);

  if (valid.length === 0) {
    return {
      sampleCount: 0,
      p50Ms: 0,
      p95Ms: 0,
      maxMs: 0,
      meanMs: 0,
      droppedFrames: 0,
      droppedPct: 0,
      targetFrameMs: roundMetric(targetFrameMs, 3),
      droppedThresholdMs,
    };
  }

  let sum = 0;
  let maxMs = 0;
  let droppedFrames = 0;
  for (let i = 0; i < valid.length; i++) {
    const dt = valid[i];
    sum += dt;
    if (dt > maxMs) maxMs = dt;
    if (dt > droppedThresholdMs) droppedFrames++;
  }

  return {
    sampleCount: valid.length,
    p50Ms: computePercentile(valid, 50),
    p95Ms: computePercentile(valid, 95),
    maxMs: roundMetric(maxMs, 3),
    meanMs: roundMetric(sum / valid.length, 3),
    droppedFrames,
    droppedPct: roundMetric((droppedFrames / valid.length) * 100, 2),
    targetFrameMs: roundMetric(targetFrameMs, 3),
    droppedThresholdMs,
  };
}

export function summarizeReportRuns(runs: readonly MapDprMeasurement[]): PerfReportSummary {
  let failedRuns = 0;
  let worstP50Ms = 0;
  let worstP95Ms = 0;
  let totalDroppedFrames = 0;
  let maxDecodedParallaxMB = 0;
  let maxDecodedImagesTotalMB = 0;
  let maxJsHeapUsedMB: number | null = null;
  let maxFirstParallaxFrameMs: number | null = null;

  for (const run of runs) {
    if (run.error || run.frameTime.sampleCount === 0) {
      failedRuns++;
    }
    if (run.frameTime.p50Ms > worstP50Ms) worstP50Ms = run.frameTime.p50Ms;
    if (run.frameTime.p95Ms > worstP95Ms) worstP95Ms = run.frameTime.p95Ms;
    totalDroppedFrames += run.frameTime.droppedFrames;

    if (run.memory.decodedParallaxMB > maxDecodedParallaxMB) {
      maxDecodedParallaxMB = run.memory.decodedParallaxMB;
    }
    if (run.memory.decodedImagesTotalMB > maxDecodedImagesTotalMB) {
      maxDecodedImagesTotalMB = run.memory.decodedImagesTotalMB;
    }
    if (run.memory.jsHeapUsedMB !== null) {
      maxJsHeapUsedMB =
        maxJsHeapUsedMB === null
          ? run.memory.jsHeapUsedMB
          : Math.max(maxJsHeapUsedMB, run.memory.jsHeapUsedMB);
    }
    if (run.timeToFirstParallaxFrameMs !== null) {
      maxFirstParallaxFrameMs =
        maxFirstParallaxFrameMs === null
          ? run.timeToFirstParallaxFrameMs
          : Math.max(maxFirstParallaxFrameMs, run.timeToFirstParallaxFrameMs);
    }
  }

  return {
    totalRuns: runs.length,
    failedRuns,
    worstP50Ms: roundMetric(worstP50Ms, 3),
    worstP95Ms: roundMetric(worstP95Ms, 3),
    totalDroppedFrames,
    maxDecodedParallaxMB: roundMetric(maxDecodedParallaxMB, 3),
    maxDecodedImagesTotalMB: roundMetric(maxDecodedImagesTotalMB, 3),
    maxJsHeapUsedMB: maxJsHeapUsedMB === null ? null : roundMetric(maxJsHeapUsedMB, 3),
    maxFirstParallaxFrameMs:
      maxFirstParallaxFrameMs === null ? null : roundMetric(maxFirstParallaxFrameMs, 2),
  };
}

export function aggregatePerfReport(
  runs: readonly MapDprMeasurement[],
  environment: PerfEnvironmentInfo,
  config: PerfRunConfig,
  generatedAt: string = new Date().toISOString()
): PerfReport {
  return {
    schemaVersion: 1,
    generatedAt,
    environment,
    config,
    runs: [...runs],
    summary: summarizeReportRuns(runs),
  };
}
