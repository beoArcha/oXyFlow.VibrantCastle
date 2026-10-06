import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { PlayerId } from "@game/types";
import { debugManager } from "@game/debug/debugManager";

/**
 * INTEGRATION TEST SUITE: Developer Studio & Cheat Controller Integration
 *
 * Verifies live developer cheat commands applied against a running GameEngine:
 * 1. Player spatial manipulation (teleportation, bounds clamping, momentum reset).
 * 2. Vitals overrides (refillVitals, setPlayerStat).
 * 3. Combat debugging (spawnEnemy, damageEnemy, killAllEnemies, removeEnemy).
 * 4. Progression debugging (unlockAllSkills, giveAllWeapons, givePotions).
 * 5. Global simulation tuning (timeScale via debugManager).
 */
describe("Developer Cheat Engine Application Integration Tests", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
    engine.resetLevel("courtyard");
    debugManager.setTimeScale(1.0);
  });

  afterEach(() => {
    engine.stop();
    debugManager.setTimeScale(1.0);
  });

  describe("Spatial Manipulation & Teleportation", () => {
    it("teleports player to exact target coordinates and resets physical momentum", () => {
      const p1 = engine.players[0];
      expect(p1).toBeDefined();

      p1.vx = 8;
      p1.vy = -12;

      engine.debugController.teleportPlayer(PlayerId.Player1, 400, 250);

      expect(p1.x).toBe(400);
      expect(p1.y).toBe(250);
      expect(p1.vx).toBe(0);
      expect(p1.vy).toBe(0);
      expect(p1.isGrounded).toBe(false);
    });

    it("clamps teleport target coordinates to level geometric boundaries", () => {
      const p1 = engine.players[0];
      const levelWidth = engine.currentLocation!.width;
      const levelHeight = engine.currentLocation!.height;

      // Teleport way beyond right boundary
      engine.debugController.teleportPlayer(PlayerId.Player1, 99999, 99999);

      expect(p1.x).toBeLessThanOrEqual(levelWidth - p1.width);
      expect(p1.y).toBeLessThanOrEqual(levelHeight - p1.height);
    });
  });

  describe("Vitals & Progression Cheats", () => {
    it("refills player health, mana, and stamina to maximum and updates UI snapshot hash", () => {
      const p1 = engine.players[0];
      p1.health = 15;
      p1.mana = 5;
      p1.stamina = 10;
      engine.checkAndUpdateVitalsSnapshot();

      engine.debugController.refillVitals(0);

      expect(p1.health).toBe(p1.maxHealth);
      expect(p1.mana).toBe(p1.maxMana);
      expect(p1.stamina).toBe(p1.maxStamina);
      expect(p1.isDead).toBe(false);
      // Confirms the change triggers snapshot difference for React UI update
      expect(engine.checkAndUpdateVitalsSnapshot()).toBe(true);
    });

    it("unlocks all spells and grants bonus skill points", () => {
      const p1 = engine.players[0];
      p1.unlockedSkills = [];
      p1.skillPoints = 0;

      engine.debugController.unlockAllSkills(0);

      expect(p1.unlockedSkills.length).toBeGreaterThan(5);
      expect(p1.skillPoints).toBeGreaterThanOrEqual(10);
    });

    it("populates player backpack with available weapons and potions", () => {
      const p1 = engine.players[0];
      p1.inventory.backpack = Array(16).fill(null);

      engine.debugController.giveAllWeapons(0);
      const equippedWeapons = p1.inventory.backpack.filter((item) => item?.type === "weapon");
      expect(equippedWeapons.length).toBeGreaterThan(0);

      engine.debugController.givePotions(0);
      expect(p1.inventory.quickPotions[0]).not.toBeNull();
    });
  });

  describe("Combat & Enemy Debugging", () => {
    it("spawns custom enemy, damages it, and removes it cleanly from engine", () => {
      const initialCount = engine.enemies.length;

      // Spawn crawler enemy
      const spawned = engine.debugController.spawnEnemy("crawler", 350, 420);
      expect(spawned).toBeDefined();
      expect(engine.enemies.length).toBe(initialCount + 1);
      expect(spawned.x).toBe(350);

      // Damage spawned enemy
      const initialHp = spawned.health;
      const damageSuccess = engine.debugController.damageEnemy(spawned.id, 30);
      expect(damageSuccess).toBe(true);
      expect(spawned.health).toBe(initialHp - 30);

      // Remove enemy
      const removeSuccess = engine.debugController.removeEnemy(spawned.id);
      expect(removeSuccess).toBe(true);
      expect(engine.enemies.find((e) => e.id === spawned.id)).toBeUndefined();
    });

    it("eliminates all active enemies via killAllEnemies", () => {
      expect(engine.enemies.length).toBeGreaterThan(0);

      engine.debugController.killAllEnemies();

      for (const enemy of engine.enemies) {
        expect(enemy.health).toBe(0);
        expect(enemy.isDead).toBe(true);
      }
    });
  });

  describe("Simulation Time Scale Tuning", () => {
    it("modulates engine simulation step rate via debugManager timeScale", () => {
      const p1 = engine.players[0];
      p1.x = 100;
      p1.y = 200;
      p1.vx = 10;
      p1.vy = 0;

      // At normal 1.0x scale
      debugManager.setTimeScale(1.0);
      engine.fixedUpdate(1.0);
      const deltaNormal = p1.x - 100;

      // Reset and simulate at 2.0x scale
      p1.x = 100;
      p1.y = 200;
      p1.vx = 10;
      p1.vy = 0;
      debugManager.setTimeScale(2.0);
      engine.fixedUpdate(1.0);
      const deltaFast = p1.x - 100;

      expect(deltaFast).toBeGreaterThan(deltaNormal);
    });
  });
});
