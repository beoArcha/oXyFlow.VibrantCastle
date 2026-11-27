export const ALL_WORLD_LOCATION_IDS = [
  "courtyard",
  "thorn_chasm",
  "ashen_catacombs",
  "clocktower",
  "alchemist_library",
  "aether_sanctuary",
  "grand_bastion",
  "eclipse_crown",
] as const;

export type WorldLocationId = (typeof ALL_WORLD_LOCATION_IDS)[number];
export type DprValue = 1 | 2;
export type ProfileName = "desktop" | "tablet" | "low-power-laptop";
export type ProfileSelection = ProfileName | "all";
export type ServerMode = "build" | "dev" | "external";
export type LongFrameObserverType = "long-animation-frame" | "longtask" | "none";

export interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

export interface BudgetProfileSpec {
  readonly profile: ProfileName;
  readonly viewport: ViewportSize;
  readonly dprs: readonly DprValue[];
  readonly cpuThrottlingRate: number;
  readonly targetHz: number;
  readonly targetFrameMs: number;
  readonly frameBudgetMs: number;
  readonly maxP95Ms: number;
  readonly droppedMultiplier: number;
}

export const PARALLAX_BUDGET_PROFILES: Readonly<Record<ProfileName, BudgetProfileSpec>> = {
  desktop: {
    profile: "desktop",
    viewport: { width: 1280, height: 720 },
    dprs: [1, 2],
    cpuThrottlingRate: 1,
    targetHz: 120,
    targetFrameMs: 1000 / 120,
    frameBudgetMs: 8.3,
    maxP95Ms: 8.3,
    droppedMultiplier: 1.5,
  },
  tablet: {
    profile: "tablet",
    viewport: { width: 1024, height: 768 },
    dprs: [2],
    cpuThrottlingRate: 4,
    targetHz: 60,
    targetFrameMs: 1000 / 60,
    frameBudgetMs: 16.6,
    maxP95Ms: 16.6,
    droppedMultiplier: 1.5,
  },
  "low-power-laptop": {
    profile: "low-power-laptop",
    viewport: { width: 1280, height: 720 },
    dprs: [1],
    cpuThrottlingRate: 6,
    targetHz: 60,
    targetFrameMs: 1000 / 60,
    frameBudgetMs: 16.6,
    maxP95Ms: 16.6,
    droppedMultiplier: 1.5,
  },
};

export const DEFAULT_HOLD_RIGHT_MS = 2500;
export const DEFAULT_JUMP_AT_MS = 1000;
export const DEFAULT_WARMUP_MS = 150;
export const DEFAULT_PROFILES: readonly ProfileName[] = ["desktop", "tablet", "low-power-laptop"];

export interface WorkTimeMetrics {
  readonly sampleCount: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly maxMs: number;
  readonly meanMs: number;
  readonly overBudgetFrames: number;
  readonly overBudgetPct: number;
  readonly frameBudgetMs: number;
}

export interface FrameTimeMetrics {
  readonly sampleCount: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly maxMs: number;
  readonly meanMs: number;
  readonly droppedFrames: number;
  readonly droppedPct: number;
  readonly targetFrameMs: number;
  readonly droppedThresholdMs: number;
}

export interface LongFrameMetrics {
  readonly observerType: LongFrameObserverType;
  readonly count: number;
  readonly totalBlockingTimeMs: number;
  readonly maxDurationMs: number;
}

export interface MemoryMetrics {
  readonly jsHeapUsedMB: number | null;
  readonly jsHeapTotalMB: number | null;
  readonly decodedImagesCount: number;
  readonly decodedImagesTotalMB: number;
  readonly decodedParallaxCount: number;
  readonly decodedParallaxMB: number;
}

export interface MapDprMeasurement {
  readonly profile: ProfileName;
  readonly locationId: string;
  readonly dpr: number;
  readonly viewport: ViewportSize;
  readonly cpuThrottlingRate: number;
  readonly work: WorkTimeMetrics;
  readonly cadence: FrameTimeMetrics;
  readonly longFrames: LongFrameMetrics;
  readonly memory: MemoryMetrics;
  readonly timeToFirstParallaxFrameMs: number | null;
  readonly error?: string;
}

export interface PerfEnvironmentInfo {
  readonly machine: string;
  readonly os: string;
  readonly cpu: string;
  readonly cpuCores: number;
  readonly browser: string;
  readonly userAgent: string;
  readonly bunVersion: string;
}

export interface PerfRunProfileConfig {
  readonly profile: ProfileName;
  readonly viewport: ViewportSize;
  readonly dprs: readonly number[];
  readonly cpuThrottlingRate: number;
  readonly targetHz: number;
  readonly targetFrameMs: number;
  readonly frameBudgetMs: number;
  readonly droppedMultiplier: number;
}

export interface PerfRunConfig {
  readonly serverMode: ServerMode;
  readonly holdRightMs: number;
  readonly jumpAtMs: number;
  readonly warmupMs: number;
  readonly profiles: readonly PerfRunProfileConfig[];
  readonly locations: readonly string[];
}

export interface PerfReportSummary {
  readonly totalRuns: number;
  readonly failedRuns: number;
  readonly worstWorkP50Ms: number;
  readonly worstWorkP95Ms: number;
  readonly worstWorkP99Ms: number;
  readonly worstWorkMaxMs: number;
  readonly worstOverBudgetPct: number;
  readonly totalOverBudgetFrames: number;
  readonly totalDroppedFrames: number;
  readonly totalLongFrames: number;
  readonly totalBlockingTimeMs: number;
  readonly maxDecodedParallaxMB: number;
  readonly maxDecodedImagesTotalMB: number;
  readonly maxJsHeapUsedMB: number | null;
  readonly maxFirstParallaxFrameMs: number | null;
}

export interface PerfReport {
  readonly schemaVersion: 2;
  readonly generatedAt: string;
  readonly environment: PerfEnvironmentInfo;
  readonly config: PerfRunConfig;
  readonly runs: readonly MapDprMeasurement[];
  readonly summary: PerfReportSummary;
}

export interface RunBudgetComparison {
  readonly profile: ProfileName;
  readonly locationId: string;
  readonly dpr: number;
  readonly workP50Ms: number;
  readonly workP95Ms: number;
  readonly workP99Ms: number;
  readonly workMaxMs: number;
  readonly overBudgetPct: number;
  readonly droppedFrames: number;
  readonly longFrameCount: number;
  readonly totalBlockingTimeMs: number;
  readonly decodedParallaxMB: number;
  readonly jsHeapUsedMB: number | null;
  readonly timeToFirstParallaxFrameMs: number | null;
  readonly baselineWorkP50Ms: number | null;
  readonly baselineWorkP95Ms: number | null;
  readonly deltaWorkP50Ms: number | null;
  readonly deltaWorkP95Ms: number | null;
  readonly deltaOverBudgetPct: number | null;
  readonly deltaDroppedFrames: number | null;
  readonly deltaLongFrameCount: number | null;
  readonly deltaDecodedParallaxMB: number | null;
  readonly withinBudget: boolean;
  readonly reason: string | null;
}

export interface BudgetCheckResult {
  readonly profile: ProfileSelection;
  readonly strict: boolean;
  readonly baselineGeneratedAt: string | null;
  readonly comparisons: readonly RunBudgetComparison[];
  readonly passedCount: number;
  readonly failedCount: number;
  readonly passed: boolean;
  readonly exitCode: 0 | 1;
}
