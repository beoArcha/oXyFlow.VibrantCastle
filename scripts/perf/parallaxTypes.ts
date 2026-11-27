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
export type ProfileName = "desktop" | "tablet";
export type ServerMode = "build" | "dev" | "external";

export interface BudgetProfileSpec {
  readonly profile: ProfileName;
  readonly targetHz: number;
  readonly targetFrameMs: number;
  readonly maxP95Ms: number;
  readonly droppedMultiplier: number;
}

export const PARALLAX_BUDGET_PROFILES: Readonly<Record<ProfileName, BudgetProfileSpec>> = {
  desktop: {
    profile: "desktop",
    targetHz: 120,
    targetFrameMs: 1000 / 120,
    maxP95Ms: 8.3,
    droppedMultiplier: 1.5,
  },
  tablet: {
    profile: "tablet",
    targetHz: 60,
    targetFrameMs: 1000 / 60,
    maxP95Ms: 16.6,
    droppedMultiplier: 1.5,
  },
};

export const DEFAULT_HOLD_RIGHT_MS = 2500;
export const DEFAULT_JUMP_AT_MS = 1000;
export const DEFAULT_WARMUP_MS = 150;
export const DEFAULT_DPRS: readonly DprValue[] = [1, 2];

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

export interface MemoryMetrics {
  readonly jsHeapUsedMB: number | null;
  readonly jsHeapTotalMB: number | null;
  readonly decodedImagesCount: number;
  readonly decodedImagesTotalMB: number;
  readonly decodedParallaxCount: number;
  readonly decodedParallaxMB: number;
}

export interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

export interface MapDprMeasurement {
  readonly locationId: string;
  readonly dpr: number;
  readonly viewport: ViewportSize;
  readonly frameTime: FrameTimeMetrics;
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

export interface PerfRunConfig {
  readonly serverMode: ServerMode;
  readonly holdRightMs: number;
  readonly jumpAtMs: number;
  readonly warmupMs: number;
  readonly targetHz: number;
  readonly targetFrameMs: number;
  readonly droppedMultiplier: number;
  readonly dprs: readonly number[];
  readonly locations: readonly string[];
}

export interface PerfReportSummary {
  readonly totalRuns: number;
  readonly failedRuns: number;
  readonly worstP50Ms: number;
  readonly worstP95Ms: number;
  readonly totalDroppedFrames: number;
  readonly maxDecodedParallaxMB: number;
  readonly maxDecodedImagesTotalMB: number;
  readonly maxJsHeapUsedMB: number | null;
  readonly maxFirstParallaxFrameMs: number | null;
}

export interface PerfReport {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly environment: PerfEnvironmentInfo;
  readonly config: PerfRunConfig;
  readonly runs: readonly MapDprMeasurement[];
  readonly summary: PerfReportSummary;
}

export interface RunBudgetComparison {
  readonly locationId: string;
  readonly dpr: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly droppedFrames: number;
  readonly decodedParallaxMB: number;
  readonly jsHeapUsedMB: number | null;
  readonly timeToFirstParallaxFrameMs: number | null;
  readonly baselineP50Ms: number | null;
  readonly baselineP95Ms: number | null;
  readonly deltaP50Ms: number | null;
  readonly deltaP95Ms: number | null;
  readonly deltaDroppedFrames: number | null;
  readonly deltaDecodedParallaxMB: number | null;
  readonly withinBudget: boolean;
  readonly reason: string | null;
}

export interface BudgetCheckResult {
  readonly profile: ProfileName;
  readonly strict: boolean;
  readonly budget: BudgetProfileSpec;
  readonly baselineGeneratedAt: string | null;
  readonly comparisons: readonly RunBudgetComparison[];
  readonly passedCount: number;
  readonly failedCount: number;
  readonly passed: boolean;
  readonly exitCode: 0 | 1;
}
