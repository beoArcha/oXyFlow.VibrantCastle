import type { ParallaxQuality, ResolvedParallaxQuality } from "@game/types";

export interface DeviceParallaxSignals {
  devicePixelRatio?: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  screenWidth?: number;
  screenHeight?: number;
  prefersReducedMotion?: boolean;
}

export type AutoParallaxQuality = Exclude<ResolvedParallaxQuality, "off">;

export interface ParallaxQualityCapabilities {
  readonly renderImages: boolean;
  readonly farOnly: boolean;
  readonly renderAtmosphere: boolean;
  readonly renderFx: boolean;
  readonly renderBossOverlays: boolean;
  readonly renderZoneCrossfade: boolean;
}

const CAPABILITIES_BY_QUALITY: Readonly<Record<ResolvedParallaxQuality, ParallaxQualityCapabilities>> = {
  high: {
    renderImages: true,
    farOnly: false,
    renderAtmosphere: true,
    renderFx: true,
    renderBossOverlays: true,
    renderZoneCrossfade: true,
  },
  mid: {
    renderImages: true,
    farOnly: false,
    renderAtmosphere: true,
    renderFx: true,
    renderBossOverlays: true,
    renderZoneCrossfade: true,
  },
  low: {
    renderImages: true,
    farOnly: false,
    renderAtmosphere: false,
    renderFx: false,
    renderBossOverlays: false,
    renderZoneCrossfade: false,
  },
  simplified: {
    renderImages: true,
    farOnly: true,
    renderAtmosphere: false,
    renderFx: false,
    renderBossOverlays: false,
    renderZoneCrossfade: false,
  },
  off: {
    renderImages: false,
    farOnly: false,
    renderAtmosphere: false,
    renderFx: false,
    renderBossOverlays: false,
    renderZoneCrossfade: false,
  },
};

const DEFAULT_CORES = 4;
const DEFAULT_DPR = 1;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

const DEFAULT_PROBE_WARMUP_MS = 800;
const DEFAULT_PROBE_WINDOW_MS = 1500;
const DEFAULT_PROBE_MIN_SAMPLES = 30;
const DEFAULT_PROBE_MAX_SAMPLES = 240;

/**
 * Returns the rendering passes enabled for a resolved parallax quality level.
 * Low-power modes (`low`, `simplified`, `off`) skip non-essential atmosphere, fx, and boss overlays.
 */
export function getParallaxQualityCapabilities(
  quality: ResolvedParallaxQuality
): ParallaxQualityCapabilities {
  return CAPABILITIES_BY_QUALITY[quality];
}

const MIN_CORES = 1;
const MIN_DPR = 0.5;

function readPositiveNumber(value: number | undefined, fallback: number, min: number): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.max(min, value);
}

/**
 * Pure heuristic selecting a concrete parallax tier from injected device signals when `parallaxQuality` is `"auto"`.
 */
export function detectAutoParallaxQuality(
  signals: DeviceParallaxSignals = {}
): AutoParallaxQuality {
  if (signals.prefersReducedMotion) {
    return "simplified";
  }

  const cores =
    signals.hardwareConcurrency !== undefined && Number.isFinite(signals.hardwareConcurrency)
      ? Math.max(MIN_CORES, Math.floor(signals.hardwareConcurrency))
      : DEFAULT_CORES;
  const memory =
    signals.deviceMemory !== undefined && Number.isFinite(signals.deviceMemory) && signals.deviceMemory > 0
      ? signals.deviceMemory
      : undefined;
  const dpr = readPositiveNumber(signals.devicePixelRatio, DEFAULT_DPR, MIN_DPR);
  const width = readPositiveNumber(signals.screenWidth, DEFAULT_WIDTH, 1);
  const height = readPositiveNumber(signals.screenHeight, DEFAULT_HEIGHT, 1);
  const maxDim = Math.max(width, height);

  const veryLowCores = cores <= 1;
  const veryLowMemory = memory !== undefined && memory <= 1;
  const weakDualCore = cores <= 2 && ((memory !== undefined && memory <= 2) || dpr >= 2);
  if (veryLowCores || veryLowMemory || weakDualCore) {
    return "simplified";
  }

  if (cores <= 2 || (memory !== undefined && memory <= 2)) {
    return "low";
  }

  // Tablets and low-memory 4-core devices at high DPR land on `low` (hi8bit + reduced passes).
  if (cores <= 4 && (dpr >= 2 || (memory !== undefined && memory <= 4))) {
    return "low";
  }

  if (maxDim < 768) {
    return cores >= 6 && (memory === undefined || memory >= 4) && dpr <= 2 ? "mid" : "low";
  }

  const hasHighMemory = memory === undefined || memory >= 8;
  const hasHighCores = cores >= 8 && (dpr <= 2 || cores >= 10);
  if (hasHighCores && hasHighMemory && maxDim >= 1280) {
    return "high";
  }

  if (cores >= 4 && (memory === undefined || memory >= 4)) {
    return "mid";
  }

  return "low";
}

/**
 * Resolves a configured `ParallaxQuality` setting to a concrete rendering mode from injected signals.
 */
export function resolveParallaxQuality(
  setting: ParallaxQuality,
  signals: DeviceParallaxSignals = {}
): ResolvedParallaxQuality {
  if (setting !== "auto") {
    return setting;
  }
  return detectAutoParallaxQuality(signals);
}

/**
 * Steps a resolved quality down by one tier; `"simplified"` is the floor for automatic downgrade.
 */
export function downgradeParallaxQualityOnce(
  quality: ResolvedParallaxQuality
): ResolvedParallaxQuality {
  if (quality === "high") return "mid";
  if (quality === "mid") return "low";
  if (quality === "low") return "simplified";
  return quality;
}

/**
 * Derives the per-frame work budget (in ms) from a target refresh rate.
 */
export function resolveFrameBudgetMsForFps(targetFps: number): number {
  if (targetFps >= 120) return 8.3;
  if (targetFps >= 90) return 11.1;
  if (targetFps <= 30) return 33.3;
  return 16.6;
}

export interface ParallaxFrameTimeProbeOptions {
  readonly budgetMs?: number;
  readonly warmupMs?: number;
  readonly sampleWindowMs?: number;
  readonly minSamples?: number;
  readonly maxSamples?: number;
}

/**
 * Short startup frame-time probe that observes per-frame work durations after warmup and
 * requests a single downgrade when the measured p95 exceeds the frame budget.
 * Uses fixed pre-allocated typed arrays so recording frames allocates zero heap memory.
 */
export class ParallaxFrameTimeProbe {
  private budgetMs: number;
  private readonly warmupMs: number;
  private readonly sampleWindowMs: number;
  private readonly minSamples: number;
  private readonly maxSamples: number;
  private readonly samples: Float64Array;
  private readonly scratchSorted: Float64Array;

  private enabled = true;
  private finished = false;
  private startMs = Number.NaN;
  private sampleCount = 0;
  private lastP95Ms: number | null = null;

  constructor(options: ParallaxFrameTimeProbeOptions = {}) {
    this.budgetMs = Math.max(1, options.budgetMs ?? resolveFrameBudgetMsForFps(60));
    this.warmupMs = Math.max(0, options.warmupMs ?? DEFAULT_PROBE_WARMUP_MS);
    this.sampleWindowMs = Math.max(100, options.sampleWindowMs ?? DEFAULT_PROBE_WINDOW_MS);
    this.minSamples = Math.max(1, Math.floor(options.minSamples ?? DEFAULT_PROBE_MIN_SAMPLES));
    this.maxSamples = Math.max(this.minSamples, Math.floor(options.maxSamples ?? DEFAULT_PROBE_MAX_SAMPLES));
    this.samples = new Float64Array(this.maxSamples);
    this.scratchSorted = new Float64Array(this.maxSamples);
  }

  public setBudgetMs(budgetMs: number): void {
    if (Number.isFinite(budgetMs) && budgetMs > 0) {
      this.budgetMs = budgetMs;
    }
  }

  public getBudgetMs(): number {
    return this.budgetMs;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public isFinished(): boolean {
    return this.finished;
  }

  public getSampleCount(): number {
    return this.sampleCount;
  }

  public getLastP95Ms(): number | null {
    return this.lastP95Ms;
  }

  public reset(nowMs: number = Number.NaN): void {
    this.finished = false;
    this.startMs = nowMs;
    this.sampleCount = 0;
    this.lastP95Ms = null;
  }

  /**
   * Records one frame's work duration in milliseconds at timestamp `nowMs`.
   * Returns `true` exactly once if the probe completes and p95 exceeds `budgetMs`.
   */
  public recordFrame(workMs: number, nowMs: number): boolean {
    if (!this.enabled || this.finished) return false;
    if (!Number.isFinite(workMs) || workMs < 0 || !Number.isFinite(nowMs)) return false;

    if (Number.isNaN(this.startMs)) {
      this.startMs = nowMs;
      return false;
    }

    const elapsed = nowMs - this.startMs;
    if (elapsed < 0) {
      this.startMs = nowMs;
      this.sampleCount = 0;
      return false;
    }

    if (elapsed < this.warmupMs) {
      return false;
    }

    if (this.sampleCount < this.maxSamples) {
      this.samples[this.sampleCount++] = workMs;
    }

    const windowDone = elapsed >= this.warmupMs + this.sampleWindowMs && this.sampleCount >= this.minSamples;
    const bufferFull = this.sampleCount >= this.maxSamples;
    if (!windowDone && !bufferFull) {
      return false;
    }

    const p95 = this.computeP95();
    this.lastP95Ms = p95;
    this.finished = true;
    return p95 > this.budgetMs;
  }

  private computeP95(): number {
    const count = this.sampleCount;
    if (count <= 0) return 0;
    for (let i = 0; i < count; i++) {
      this.scratchSorted[i] = this.samples[i];
    }
    const view = this.scratchSorted.subarray(0, count);
    view.sort();
    const pos = 0.95 * (count - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi) return view[lo];
    const frac = pos - lo;
    return view[lo] * (1 - frac) + view[hi] * frac;
  }
}
