#!/usr/bin/env bun
/**
 * Vibrant Castle — Level Logic CLI Validator
 * Reuses the canonical architectural level-logic rule engine (SSOT) to verify
 * reachability, lever/gate solvability, enemy placement, and portal integrity.
 *
 * Usage:
 *   bun scripts/validate-level.ts --all
 *   bun scripts/validate-level.ts courtyard
 */

import { CANONICAL_ENEMY_REGISTRY } from "../src/game/locations/parser/locationParser";
import { validateLocation, type Violation } from "../src/tests/arch/helpers/levelLogic";
import { loadLocationCatalog } from "../src/tests/arch/helpers/levelLogic/catalog";
import { KNOWN_LEVEL_DEFECTS } from "../src/tests/arch/helpers/levelLogic/knownLevelDefects";

export interface LocationValidationReport {
  readonly locationId: string;
  readonly freshErrors: readonly Violation[];
  readonly staleKnownDefects: readonly string[];
  readonly warnings: readonly Violation[];
}

export interface LevelValidationSummary {
  readonly checkedCount: number;
  readonly reports: readonly LocationValidationReport[];
  readonly unknownIds: readonly string[];
  readonly passed: boolean;
}

const keyOf = (v: { code: string; subject: string }): string => `${v.code} ${v.subject}`;

export function runLevelValidation(requestedIds?: readonly string[]): LevelValidationSummary {
  const catalog = loadLocationCatalog();
  const allIds = Object.keys(catalog).sort();

  const idsToCheck =
    !requestedIds || requestedIds.length === 0 || requestedIds.includes("--all")
      ? allIds
      : [...requestedIds];

  const unknownIds = idsToCheck.filter((id) => !catalog[id]);
  const validIds = idsToCheck.filter((id) => Boolean(catalog[id]));

  const reports: LocationValidationReport[] = validIds.map((locationId) => {
    const violations = validateLocation(catalog[locationId], CANONICAL_ENEMY_REGISTRY, catalog);
    const known = new Set((KNOWN_LEVEL_DEFECTS[locationId] ?? []).map(keyOf));
    const errors = violations.filter((v) => v.severity === "error");
    const warnings = violations.filter((v) => v.severity === "warn");

    const freshErrors = errors.filter((v) => !known.has(keyOf(v)));
    const occurring = new Set(errors.map(keyOf));
    const staleKnownDefects = [...known].filter((entry) => !occurring.has(entry));

    return {
      locationId,
      freshErrors,
      staleKnownDefects,
      warnings,
    };
  });

  const passed =
    unknownIds.length === 0 &&
    reports.every((r) => r.freshErrors.length === 0 && r.staleKnownDefects.length === 0);

  return {
    checkedCount: validIds.length,
    reports,
    unknownIds,
    passed,
  };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const summary = runLevelValidation(args);

  if (summary.unknownIds.length > 0) {
    console.error(`Unknown location id(s): ${summary.unknownIds.join(", ")}`);
    process.exit(1);
  }

  for (const report of summary.reports) {
    const status =
      report.freshErrors.length === 0 && report.staleKnownDefects.length === 0 ? "PASS" : "FAIL";
    console.log(
      `[${status}] ${report.locationId} (errors: ${report.freshErrors.length}, warnings: ${report.warnings.length})`
    );
    for (const err of report.freshErrors) {
      console.error(`  ERROR [${err.code}] ${err.subject}: ${err.message}`);
    }
    for (const warn of report.warnings) {
      console.warn(`  WARN [${warn.code}] ${warn.subject}: ${warn.message}`);
    }
    for (const stale of report.staleKnownDefects) {
      console.error(`  STALE KNOWN DEFECT: ${stale} (remove from knownLevelDefects.ts)`);
    }
  }

  console.log(
    `\nValidated ${summary.checkedCount} location(s): ${summary.passed ? "ALL PASSED" : "FAILED"}`
  );
  process.exit(summary.passed ? 0 : 1);
}
