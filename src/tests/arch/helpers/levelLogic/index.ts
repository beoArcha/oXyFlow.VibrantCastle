import type { LocationJsonSchema } from "@game/locations/schema/locationSchema";
import { createContext, type Rule } from "./context";
import { enemyPlacement } from "./rules/enemies";
import { gateUsefulness, leverReachability, leverTargets } from "./rules/levers";
import { duplicateIds, outOfBounds, overlappingSolids } from "./rules/layout";
import { portalLinks } from "./rules/portals";
import { platformReachability, touchableReachability } from "./rules/reachability";
import { spawnPlacement } from "./rules/spawns";
import type { EnemyRegistry, LocationCatalog, Severity, Violation } from "./types";

export type { EnemyRegistry, EnemyTemplateLike, LocationCatalog, Severity, Violation } from "./types";

const RULES: readonly Rule[] = [
  duplicateIds,
  outOfBounds,
  overlappingSolids,
  spawnPlacement,
  portalLinks,
  leverTargets,
  platformReachability,
  touchableReachability,
  leverReachability,
  gateUsefulness,
  enemyPlacement,
];

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warn: 1, info: 2 };

/**
 * Checks one location blueprint for logical playability.
 * Cross-map rules (portal targets, unused entries) only run when `catalog` is given.
 */
export function validateLocation(
  blueprint: LocationJsonSchema,
  enemyRegistry: EnemyRegistry,
  catalog?: LocationCatalog
): Violation[] {
  const ctx = createContext(blueprint, enemyRegistry, catalog);
  return RULES.flatMap((rule) => rule(ctx)).sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.code.localeCompare(b.code) || a.subject.localeCompare(b.subject)
  );
}
