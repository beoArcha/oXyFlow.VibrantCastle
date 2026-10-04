import { describe, it, expect } from "bun:test";
import {
  LOCATION_IDS,
  MONSTER_ID_LIST,
  TIME_SCALE_OPTIONS,
  MUSIC_INTENSITY_PRESETS,
  PARALLAX_TIERS,
  GOLD_PRESETS,
  QUICK_HP_PRESETS,
} from "../subtabs/tester";
import { LOCATION_REGISTRY } from "@game/locations/registry";
import enemiesData from "@data/enemies/enemies.json";

describe("Tester Module Constants & Domain Integrity", () => {
  it("verifies that all LOCATION_IDS exist in game LOCATION_REGISTRY", () => {
    expect(LOCATION_IDS.length).toBeGreaterThan(0);
    for (const locationId of LOCATION_IDS) {
      expect(LOCATION_REGISTRY[locationId]).toBeDefined();
      expect(LOCATION_REGISTRY[locationId].id).toBe(locationId);
      expect(LOCATION_REGISTRY[locationId].nameKey).toBeDefined();
    }
  });

  it("verifies that all MONSTER_ID_LIST entries have valid IDs and translation keys", () => {
    expect(MONSTER_ID_LIST.length).toBeGreaterThan(0);
    const registeredEnemyIds = Object.keys(enemiesData.enemies);

    for (const monster of MONSTER_ID_LIST) {
      expect(monster.id).toBeString();
      expect(monster.id.length).toBeGreaterThan(0);
      expect(monster.translationKey).toBeString();
      expect(monster.translationKey.startsWith("enemy")).toBe(true);
    }

    expect(registeredEnemyIds).toContain("training_dummy");
    expect(registeredEnemyIds).toContain("court_sentinel");
  });

  it("verifies simulation speed and audio presets boundary validity", () => {
    expect(TIME_SCALE_OPTIONS).toContain(1.0);
    expect(TIME_SCALE_OPTIONS.every((scale) => scale > 0)).toBe(true);

    for (const preset of MUSIC_INTENSITY_PRESETS) {
      expect(preset.val).toBeGreaterThanOrEqual(0);
      expect(preset.val).toBeLessThanOrEqual(1.0);
      expect(preset.labelKey).toBeString();
    }
  });

  it("verifies parallax tiers and currency presets consistency", () => {
    expect(PARALLAX_TIERS).toEqual(["far", "mid_far", "mid", "mid_close", "close"]);
    expect(GOLD_PRESETS.every((g) => g > 0)).toBe(true);
    expect(QUICK_HP_PRESETS.every((hp) => hp > 0)).toBe(true);
  });
});
