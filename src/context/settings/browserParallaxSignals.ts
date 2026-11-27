import type { DeviceParallaxSignals } from "@game/parallax/parallaxQualityHeuristic";

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number;
}

/**
 * Reads browser device capability signals outside the pure simulation core (`src/game/`)
 * so parallax auto-quality heuristics remain deterministic and free of direct `navigator` access.
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
