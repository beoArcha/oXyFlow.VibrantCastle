import type {
  FrameTimeMetrics,
  LongFrameMetrics,
  LongFrameObserverType,
  MapDprMeasurement,
  PerfEnvironmentInfo,
  PerfReport,
  PerfReportSummary,
  PerfRunConfig,
  WorkTimeMetrics,
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
 * Computes a linear-interpolated percentile (0..100) from sorted timing samples.
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
 * Summarizes per-frame requestAnimationFrame callback work durations against a frame budget.
 */
export function summarizeWorkDurations(
  durationsMs: readonly number[],
  frameBudgetMs: number
): WorkTimeMetrics {
  const valid = durationsMs.filter((v) => Number.isFinite(v) && v >= 0);
  const roundedBudgetMs = roundMetric(frameBudgetMs, 3);

  if (valid.length === 0) {
    return {
      sampleCount: 0,
      p50Ms: 0,
      p95Ms: 0,
      p99Ms: 0,
      maxMs: 0,
      meanMs: 0,
      overBudgetFrames: 0,
      overBudgetPct: 0,
      frameBudgetMs: roundedBudgetMs,
    };
  }

  let sum = 0;
  let maxMs = 0;
  let overBudgetFrames = 0;
  for (let i = 0; i < valid.length; i++) {
    const dt = valid[i];
    sum += dt;
    if (dt > maxMs) maxMs = dt;
    if (dt > frameBudgetMs) overBudgetFrames++;
  }

  return {
    sampleCount: valid.length,
    p50Ms: computePercentile(valid, 50),
    p95Ms: computePercentile(valid, 95),
    p99Ms: computePercentile(valid, 99),
    maxMs: roundMetric(maxMs, 3),
    meanMs: roundMetric(sum / valid.length, 3),
    overBudgetFrames,
    overBudgetPct: roundMetric((overBudgetFrames / valid.length) * 100, 2),
    frameBudgetMs: roundedBudgetMs,
  };
}

/**
 * Summarizes raw requestAnimationFrame cadence intervals against a target frame interval.
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

export function summarizeLongFrames(
  observerType: LongFrameObserverType,
  count: number,
  totalBlockingTimeMs: number,
  maxDurationMs: number
): LongFrameMetrics {
  return {
    observerType,
    count: Math.max(0, Math.round(count)),
    totalBlockingTimeMs: roundMetric(Math.max(0, totalBlockingTimeMs), 2),
    maxDurationMs: roundMetric(Math.max(0, maxDurationMs), 2),
  };
}

export function summarizeReportRuns(runs: readonly MapDprMeasurement[]): PerfReportSummary {
  let failedRuns = 0;
  let worstWorkP50Ms = 0;
  let worstWorkP95Ms = 0;
  let worstWorkP99Ms = 0;
  let worstWorkMaxMs = 0;
  let worstOverBudgetPct = 0;
  let totalOverBudgetFrames = 0;
  let totalDroppedFrames = 0;
  let totalLongFrames = 0;
  let totalBlockingTimeMs = 0;
  let maxDecodedParallaxMB = 0;
  let maxDecodedImagesTotalMB = 0;
  let maxJsHeapUsedMB: number | null = null;
  let maxFirstParallaxFrameMs: number | null = null;

  for (const run of runs) {
    if (run.error || run.work.sampleCount === 0) {
      failedRuns++;
    }
    if (run.work.p50Ms > worstWorkP50Ms) worstWorkP50Ms = run.work.p50Ms;
    if (run.work.p95Ms > worstWorkP95Ms) worstWorkP95Ms = run.work.p95Ms;
    if (run.work.p99Ms > worstWorkP99Ms) worstWorkP99Ms = run.work.p99Ms;
    if (run.work.maxMs > worstWorkMaxMs) worstWorkMaxMs = run.work.maxMs;
    if (run.work.overBudgetPct > worstOverBudgetPct) worstOverBudgetPct = run.work.overBudgetPct;
    totalOverBudgetFrames += run.work.overBudgetFrames;
    totalDroppedFrames += run.cadence.droppedFrames;
    totalLongFrames += run.longFrames.count;
    totalBlockingTimeMs += run.longFrames.totalBlockingTimeMs;

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
    worstWorkP50Ms: roundMetric(worstWorkP50Ms, 3),
    worstWorkP95Ms: roundMetric(worstWorkP95Ms, 3),
    worstWorkP99Ms: roundMetric(worstWorkP99Ms, 3),
    worstWorkMaxMs: roundMetric(worstWorkMaxMs, 3),
    worstOverBudgetPct: roundMetric(worstOverBudgetPct, 2),
    totalOverBudgetFrames,
    totalDroppedFrames,
    totalLongFrames,
    totalBlockingTimeMs: roundMetric(totalBlockingTimeMs, 2),
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
    schemaVersion: 2,
    generatedAt,
    environment,
    config,
    runs: [...runs],
    summary: summarizeReportRuns(runs),
  };
}
