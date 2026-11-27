import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { AssetError } from "@lib/errors";

/**
 * VC-010: every entity must ship all three quality tiers.
 *
 * - `hi8bit`: `<id>_hi8bit.svg` or `<id>_hi8bit.png` (simple placeholder)
 * - `hi16bit`: `<id>_hi16bit.svg` or `<id>_hi16bit.png`
 * - `high`: any painted `*_high.png` sheet in the entity folder
 *
 * Known gaps live in `assetTierAllowlist.json` (key `<category>/<id>`, value = missing tiers).
 * The test fails on a new gap that is not allowlisted and on an allowlisted gap that has been filled
 * (or whose entity no longer exists), so the allowlist only shrinks.
 */

const CATEGORIES = ["characters", "enemies", "structures", "props", "tiles"] as const;
const TIERS = ["hi8bit", "hi16bit", "high"] as const;

type Category = (typeof CATEGORIES)[number];
type Tier = (typeof TIERS)[number];
type GapMap = Record<string, Tier[]>;

const ASSETS_DIR = path.join(process.cwd(), "src", "assets");
const ALLOWLIST_PATH = path.join(process.cwd(), "src", "tests", "arch", "assetTierAllowlist.json");

function isTier(value: string): value is Tier {
  return (TIERS as readonly string[]).includes(value);
}

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

function presentTiers(entityDir: string, id: string): Set<Tier> {
  const files = new Set(fs.readdirSync(entityDir));
  const present = new Set<Tier>();
  for (const tier of ["hi8bit", "hi16bit"] as const) {
    if (files.has(`${id}_${tier}.svg`) || files.has(`${id}_${tier}.png`)) present.add(tier);
  }
  if ([...files].some((file) => file.endsWith("_high.png"))) present.add("high");
  return present;
}

interface CategoryReport {
  entities: number;
  incomplete: number;
  missingTiers: number;
}

/** Scans every entity folder and returns the missing tiers keyed by `<category>/<id>`. */
function scanGaps(): { gaps: GapMap; reports: Record<Category, CategoryReport> } {
  const gaps: GapMap = {};
  const reports = {} as Record<Category, CategoryReport>;
  for (const category of CATEGORIES) {
    const categoryDir = path.join(ASSETS_DIR, category);
    const ids = fs
      .readdirSync(categoryDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const report: CategoryReport = { entities: ids.length, incomplete: 0, missingTiers: 0 };
    for (const id of ids) {
      const present = presentTiers(path.join(categoryDir, id), id);
      const missing = TIERS.filter((tier) => !present.has(tier));
      if (missing.length > 0) {
        gaps[`${category}/${id}`] = missing;
        report.incomplete += 1;
        report.missingTiers += missing.length;
      }
    }
    reports[category] = report;
  }
  return { gaps, reports };
}

function readAllowlist(): GapMap {
  const parsed: unknown = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, "utf-8"));
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AssetError("assetTierAllowlist.json must be a JSON object");
  }
  return parsed as GapMap;
}

describe("Asset tier completeness (VC-010)", () => {
  it("allowlist is well-formed: known category keys, known tiers, no duplicates", () => {
    const allowlist = readAllowlist();
    const malformed: string[] = [];
    for (const [key, tiers] of Object.entries(allowlist)) {
      const [category, id, ...rest] = key.split("/");
      if (!category || !isCategory(category) || !id || rest.length > 0) {
        malformed.push(`bad key "${key}" (expected <category>/<id>)`);
        continue;
      }
      if (!Array.isArray(tiers) || tiers.length === 0) {
        malformed.push(`"${key}" must list at least one missing tier`);
        continue;
      }
      const unknown = tiers.filter((tier) => !isTier(tier));
      if (unknown.length > 0) malformed.push(`"${key}" has unknown tiers: ${unknown.join(", ")}`);
      if (new Set(tiers).size !== tiers.length) malformed.push(`"${key}" has duplicate tiers`);
    }
    expect(malformed).toEqual([]);
  });

  it("every entity has all tiers or is an allowlisted gap, and allowlisted gaps are still open", () => {
    const { gaps } = scanGaps();
    const allowlist = readAllowlist();
    const failures: string[] = [];

    for (const [key, missing] of Object.entries(gaps)) {
      const allowed = allowlist[key] ?? [];
      const unlisted = missing.filter((tier) => !allowed.includes(tier));
      if (unlisted.length > 0) {
        failures.push(`NEW GAP ${key}: missing ${unlisted.join(", ")} (not in assetTierAllowlist.json)`);
      }
    }

    for (const [key, allowed] of Object.entries(allowlist)) {
      const stillMissing = gaps[key] ?? [];
      const filled = allowed.filter((tier) => !stillMissing.includes(tier));
      if (filled.length > 0) {
        failures.push(
          `FILLED GAP ${key}: ${filled.join(", ")} now present (or entity removed); remove it from assetTierAllowlist.json`,
        );
      }
    }

    expect(failures).toEqual([]);
  });

  it("reports tier gaps per category", () => {
    const { reports } = scanGaps();
    for (const category of CATEGORIES) {
      const report = reports[category];
      console.info(
        `[asset tiers] ${category}: ${report.incomplete}/${report.entities} entities incomplete, ${report.missingTiers} missing tiers`,
      );
    }
    expect(Object.keys(reports)).toHaveLength(CATEGORIES.length);
  });
});
