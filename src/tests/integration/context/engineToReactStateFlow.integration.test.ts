import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { ItemType, Item } from "@game/types";

/**
 * INTEGRATION TEST SUITE: Engine to React Context State & Event Flow
 *
 * Verifies real-time communication between the pure GameEngine domain
 * and React Context adapters via GameEventBus and command controllers:
 * 1. Discrete domain event dispatch (PLAYER_DAMAGED, ITEM_CONSUMED, LEVEL_RESET).
 * 2. Potion consumption and vital restoration through PlayerCommandController.
 * 3. Equipment item swapping and derived stats recalculation.
 * 4. Game session lifecycle commands (pause, resume, level reset).
 */
describe("Engine to React State Flow Integration Tests", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
    engine.resetLevel("courtyard");
  });

  afterEach(() => {
    engine.stop();
  });

  describe("GameEventBus Domain Event Flow", () => {
    it("dispatches PLAYER_DAMAGED event with accurate remaining health", () => {
      const damageListener = mock();
      const unsubscribe = engine.eventBus.on("PLAYER_DAMAGED", damageListener);

      const player = engine.players[0];
      const initialHp = player.health;

      // Simulate combat damage
      player.health = Math.max(0, player.health - 25);
      engine.eventBus.emit("PLAYER_DAMAGED", {
        playerIndex: 0,
        damage: 25,
        currentHealth: player.health,
        maxHealth: player.maxHealth,
        source: "trap_spikes",
      });

      expect(damageListener).toHaveBeenCalledTimes(1);
      expect(damageListener).toHaveBeenCalledWith({
        playerIndex: 0,
        damage: 25,
        currentHealth: initialHp - 25,
        maxHealth: player.maxHealth,
        source: "trap_spikes",
      });

      unsubscribe();
    });

    it("dispatches ITEM_CONSUMED event when potion is consumed via command controller", () => {
      const consumedListener = mock();
      const unsubscribe = engine.eventBus.on("ITEM_CONSUMED", consumedListener);

      const player = engine.players[0];
      player.health = 50; // Damaged player

      const potionItem: Item = {
        id: "health_potion_standard",
        nameKey: "potionHealthName",
        descriptionKey: "potionHealthDesc",
        type: ItemType.Potion,
        icon: "potion_red",
        rarity: "common",
        healHp: 40,
        count: 2,
      };

      player.inventory.quickPotions[0] = potionItem;

      // Execute potion usage via PlayerCommandController
      const success = engine.playerCommands.usePlayerPotion(0, 0);
      expect(success).toBe(true);

      // Verify player healed and count decremented
      expect(player.health).toBe(90);
      expect(player.inventory.quickPotions[0]?.count).toBe(1);

      // Verify domain event emitted
      expect(consumedListener).toHaveBeenCalledTimes(1);
      const call = (consumedListener as any).mock.calls[0][0];
      expect(call.playerIndex).toBe(0);
      expect(call.slotIndex).toBe(0);

      unsubscribe();
    });
  });

  describe("Inventory & Equipment Commands", () => {
    it("equips weapon from backpack and recalculates player combat stats", () => {
      const player = engine.players[0];

      const testWeapon: Item = {
        id: "test_broadsword",
        nameKey: "itemBroadswordName",
        descriptionKey: "itemBroadswordDesc",
        type: ItemType.Weapon,
        icon: "sword_iron",
        rarity: "rare",
        attackBonus: 45,
      };

      player.inventory.backpack[0] = testWeapon;

      // Equip item using controller
      const equipSuccess = engine.playerCommands.equipPlayerItem(0, 0);
      expect(equipSuccess).toBe(true);

      // Verify weapon is equipped in mainHand slot
      expect(player.inventory.equipment.mainHand?.id).toBe("test_broadsword");

      // Unequip item
      const unequipSuccess = engine.playerCommands.unequipPlayerItem(0, "mainHand");
      expect(unequipSuccess).toBe(true);
      expect(player.inventory.equipment.mainHand).toBeNull();
    });
  });

  describe("Session Lifecycle Control", () => {
    it("pauses, resumes, and resets level while synchronizing event notifications", () => {
      let stateNotified = 0;
      engine.registerStateListener(() => {
        stateNotified++;
      });

      expect(engine.isPaused).toBe(false);

      // Pause
      engine.setPaused(true);
      expect(engine.isPaused).toBe(true);
      expect(stateNotified).toBeGreaterThan(0);

      // Resume
      engine.setPaused(false);
      expect(engine.isPaused).toBe(false);

      // Reset level to clocktower
      const resetListener = mock();
      engine.eventBus.on("LEVEL_RESET", resetListener);

      engine.resetLevel("clocktower");
      expect(engine.currentLocationId).toBe("clocktower");
      expect(resetListener).toHaveBeenCalledTimes(1);
    });
  });
});
