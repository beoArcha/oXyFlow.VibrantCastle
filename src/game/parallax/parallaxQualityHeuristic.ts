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

const DEFAULT_CORES = 4;
const DEFAULT_DPR = 1;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number;
}

/**
 * Safely reads device capability signals in browser environments without throwing in headless runtimes.
 */
export function readBrowserParallaxSignals(): DeviceParallaxSignals {
  const hasWindow = typeof window !== "undefined";
  const hasNavigator = typeof navigator !== "undefined";
  const nav = hasNavigator ? (navigator as NavigatorWithDeviceMemory) : undefined;

  const prefersReducedMotion =
    hasWindow && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const screenWidth = hasWindow ? (window.screen?.width ?? window.innerWidth) : undefined;
  const screenHeight = hasWindow ? (window.screen?.height ?? window.innerHeight) : undefined;

  return {
    devicePixelRatio: hasWindow ? window.devicePixelRatio : undefined,
    hardwareConcurrency: nav?.hardwareConcurrency,
    deviceMemory: nav?.deviceMemory,
    screenWidth,
    screenHeight,
    prefersReducedMotion,
  };
}

/**
 * Pure heuristic selecting a concrete parallax tier from device signals when `parallaxQuality` is `"auto"`.
 */
export function detectAutoParallaxQuality(signals: DeviceParallaxSignals): AutoParallaxQuality {
  if (signals.prefersReducedMotion) {
    return "simplified";
  }

  const cores = signals.hardwareConcurrency ?? DEFAULT_CORES;
  const memory = signals.deviceMemory;
  const dpr = signals.devicePixelRatio ?? DEFAULT_DPR;
  const maxDim = Math.max(signals.screenWidth ?? DEFAULT_WIDTH, signals.screenHeight ?? DEFAULT_HEIGHT);

  if (cores <= 2 || (memory !== undefined && memory <= 2)) {
    return "low";
  }

  if (maxDim < 768) {
    return cores >= 6 && (memory === undefined || memory >= 4) ? "mid" : "low";
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
 * Resolves a configured `ParallaxQuality` setting to a concrete rendering mode.
 */
export function resolveParallaxQuality(
  setting: ParallaxQuality,
  signals?: DeviceParallaxSignals
): ResolvedParallaxQuality {
  if (setting !== "auto") {
    return setting;
  }
  return detectAutoParallaxQuality(signals ?? readBrowserParallaxSignals());
}
