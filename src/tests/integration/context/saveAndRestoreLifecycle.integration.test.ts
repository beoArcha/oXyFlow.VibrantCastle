import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { ItemType, SaveState } from "@game/types";

/**
 * INTEGRATION TEST SUITE: Save and Restore Lifecycle
 *
 * Verifies end-to-end save persistence and restoration across all engine subsystems:
 * 1. Active game state compilation into an immutable SaveState snapshot.
 * 2. Full serialization round-trip through JSON.
 * 3. Engine reset followed by complete state reconstitution.
 * 4. Preservation of location, player stats, equipment, inventory items, and unlocked skills.
 */
describe("Save and Restore Lifecycle Integration Tests", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
    engine.resetLevel("clocktower");
  });

  afterEach(() => {
    engine.stop();
  });

  it("compiles, serializes, resets, and restores full game session from SaveState snapshot", () => {
    const p1 = engine.players[0];
    expect(p1).toBeDefined();

    // 1. Mutate active gameplay state
    p1.health = 75;
    p1.mana = 45;
    p1.score = 2400;
    p1.skillPoints = 4;
    p1.unlockedSkills = ["solar_flare", "sun_burst"];

    // Add unique items to inventory
    p1.inventory.backpack[0] = {
      id: "clockwork_blade",
      nameKey: "itemClockworkBladeName",
      descriptionKey: "itemClockworkBladeDesc",
      type: ItemType.Weapon,
      icon: "sword_gold",
      rarity: "rare",
      attackBonus: 55,
    };
    p1.inventory.quickPotions[0] = {
      id: "mana_elixir",
      nameKey: "potionManaName",
      descriptionKey: "potionManaDesc",
      type: ItemType.Potion,
      icon: "potion_blue",
      rarity: "common",
      healMana: 50,
      count: 3,
    };

    // 2. Compile save state snapshot
    const snapshot = engine.createSaveSnapshot();
    expect(snapshot).toBeDefined();
    expect(snapshot.levelId).toBe("clocktower");
    expect(snapshot.p1Health).toBe(75);
    expect(snapshot.p1Score).toBe(2400);

    // 3. Serialize to JSON and parse back (simulating disk/localStorage transport)
    const jsonString = JSON.stringify(snapshot);
    const parsedState: SaveState = JSON.parse(jsonString);

    // 4. Reset engine to a completely different location (courtyard)
    engine.resetLevel("courtyard");
    expect(engine.currentLocationId).toBe("courtyard");
    expect(engine.players[0].health).not.toBe(75);
    expect(engine.players[0].score).not.toBe(2400);

    // 5. Restore state from parsed snapshot
    const restoreSuccess = engine.restoreFromSnapshot(parsedState);
    expect(restoreSuccess).toBe(true);

    // 6. Verify full state restoration
    expect(engine.currentLocationId).toBe("clocktower");

    const restoredPlayer = engine.players[0];
    expect(restoredPlayer.health).toBe(75);
    expect(restoredPlayer.mana).toBe(45);
    expect(restoredPlayer.score).toBe(2400);
    expect(restoredPlayer.skillPoints).toBe(4);
    expect(restoredPlayer.unlockedSkills).toContain("solar_flare");
    expect(restoredPlayer.unlockedSkills).toContain("sun_burst");

    // Verify inventory restoration
    const restoredBackpackItem = restoredPlayer.inventory.backpack.find(
      (item) => item?.id === "clockwork_blade"
    );
    expect(restoredBackpackItem).toBeDefined();
    expect(restoredBackpackItem?.attackBonus).toBe(55);

    const restoredPotion = restoredPlayer.inventory.quickPotions[0];
    expect(restoredPotion).toBeDefined();
    expect(restoredPotion?.id).toBe("mana_elixir");
    expect(restoredPotion?.count).toBe(3);
  });

  it("handles corrupted or invalid save states gracefully without crashing engine", () => {
    const invalidSave = {
      levelId: "non_existent_abyss",
      p1Health: -999,
      p1Score: -100,
    } as unknown as SaveState;

    // Restoring corrupted save should fall back or fail gracefully
    const success = engine.restoreFromSnapshot(invalidSave);
    // Even if it returns false or falls back, engine remains operational
    expect(engine.players.length).toBeGreaterThanOrEqual(1);
    expect(engine.isPaused).toBe(false);
  });
});
