import React, { Suspense, lazy, useMemo } from "react";
import { isDevToolsEnabled } from "./appConfig";

export interface DeveloperSuiteModule {
  readonly default: React.ComponentType;
}

export type DeveloperSuiteLoader = () => Promise<DeveloperSuiteModule>;

/**
 * Dev-build loader for the Creation & Developer Suite.
 * In production builds `import.meta.env.DEV` is a literal `false`, so Vite drops the
 * `import()` and no developer-suite chunk is emitted.
 */
export const loadDeveloperSuite: DeveloperSuiteLoader | undefined = import.meta.env.DEV
  ? () => import("@developer").then((mod) => ({ default: mod.DeveloperSuite }))
  : undefined;

export interface DeveloperSuiteSlotProps {
  /** Defaults to the developer-tools flag; tests pass an explicit value. */
  readonly enabled?: boolean;
  /** Defaults to the dev-build loader; tests inject a stub. */
  readonly loader?: DeveloperSuiteLoader;
}

/**
 * Renders the lazily loaded Developer Suite only when the dev-tools flag is on.
 * With the flag off the loader is never called, so the suite is never requested.
 */
export const DeveloperSuiteSlot: React.FC<DeveloperSuiteSlotProps> = ({
  enabled = isDevToolsEnabled(),
  loader = loadDeveloperSuite,
}) => {
  const LazySuite = useMemo(
    () => (enabled && loader ? lazy(loader) : null),
    [enabled, loader]
  );

  if (!LazySuite) return null;

  return (
    <Suspense fallback={null}>
      <LazySuite />
    </Suspense>
  );
};

DeveloperSuiteSlot.displayName = "DeveloperSuiteSlot";
