/**
 * Logical-map validator CLI.
 *
 *   bun scripts/validate-level.ts <locationId | path-to-json> [--json]
 *
 * Exits with code 1 when any ERROR is found. The known-defects ratchet used by the
 * architecture test is deliberately not applied here.
 */
import fs from "node:fs";
import path from "node:path";
import { CANONICAL_ENEMY_REGISTRY } from "@game/locations/parser/locationParser";
import { loadBlueprintFile, loadLocationCatalog, LOCATIONS_DIR } from "../src/tests/arch/helpers/levelLogic/catalog";
import { validateLocation, type Severity, type Violation } from "../src/tests/arch/helpers/levelLogic";

const SEVERITIES: readonly Severity[] = ["error", "warn", "info"];

function resolveBlueprintPath(target: string): string | undefined {
  const byId = path.join(LOCATIONS_DIR, `${target}.json`);
  if (fs.existsSync(byId)) return byId;
  return fs.existsSync(target) ? path.resolve(target) : undefined;
}

function countBySeverity(violations: Violation[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { error: 0, warn: 0, info: 0 };
  for (const v of violations) counts[v.severity]++;
  return counts;
}

function printReport(id: string, violations: Violation[]): void {
  for (const severity of SEVERITIES) {
    const group = violations.filter((v) => v.severity === severity);
    if (!group.length) continue;
    console.log(`\n${severity.toUpperCase()} (${group.length})`);
    for (const v of group) console.log(`  ${v.code.padEnd(24)} ${v.subject.padEnd(28)} ${v.message}`);
  }
  const c = countBySeverity(violations);
  console.log(`\n${id}: ${c.error} error(s), ${c.warn} warning(s), ${c.info} info`);
}

function main(): number {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const target = args.find((a) => !a.startsWith("--"));
  if (!target) {
    console.error("usage: bun scripts/validate-level.ts <locationId | path-to-json> [--json]");
    return 2;
  }
  const file = resolveBlueprintPath(target);
  if (!file) {
    console.error(`no location '${target}' (looked for ${path.join(LOCATIONS_DIR, `${target}.json`)} and a file at that path)`);
    return 2;
  }
  const blueprint = loadBlueprintFile(file);
  const violations = validateLocation(blueprint, CANONICAL_ENEMY_REGISTRY, loadLocationCatalog());
  const counts = countBySeverity(violations);
  if (asJson) console.log(JSON.stringify({ location: blueprint.id, summary: counts, violations }, null, 2));
  else printReport(blueprint.id, violations);
  return counts.error > 0 ? 1 : 0;
}

process.exit(main());
