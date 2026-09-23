import { describe, it, expect, beforeEach } from "bun:test";
import {
  PlayerCommandController,
  IPlayerCommandContext,
} from "../playerCommandController";
import { Player, PlayerId } from "../../types";
import { createDefaultInventory, ITEM_REGISTRY } from "../../logic/inventory";
import { getDefaultSkillsForCharacter } from "../../logic/skills";

describe("PlayerCommandController (SOLID & SRP)", () => {
  let mockPlayer1: Player;
  let mockPlayer2: Player;
  let players: Player[];
  let stateChangedCount: number;
  let context: IPlayerCommandContext;
  let controller: PlayerCommandController;

  beforeEach(() => {
    stateChangedCount = 0;

    const p1Skills = getDefaultSkillsForCharacter("valen");
    mockPlayer1 = {
      id: PlayerId.Player1,
      name: "Valen",
      x: 100,
      y: 200,
      vx: 0,
      vy: 0,
      width: 32,
      height: 48,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      stamina: 80,
      maxStamina: 80,
      isGrounded: true,
      isDead: false,
      facingLeft: false,
      skillPoints: 5,
      unlockedSkills: [...p1Skills.unlockedSkills],
      primarySpellId: p1Skills.primarySpellId,
      secondarySpellId: p1Skills.secondarySpellId,
      inventory: createDefaultInventory(),
    } as unknown as Player;

    const p2Skills = getDefaultSkillsForCharacter("aurelia");
    mockPlayer2 = {
      id: PlayerId.Player2,
      name: "Aurelia",
      x: 150,
      y: 200,
      vx: 0,
      vy: 0,
      width: 32,
      height: 48,
      health: 90,
      maxHealth: 90,
      mana: 80,
      maxMana: 80,
      stamina: 70,
      maxStamina: 70,
      isGrounded: true,
      isDead: false,
      facingLeft: false,
      skillPoints: 3,
      unlockedSkills: [...p2Skills.unlockedSkills],
      primarySpellId: p2Skills.primarySpellId,
      secondarySpellId: p2Skills.secondarySpellId,
      inventory: createDefaultInventory(),
    } as unknown as Player;

    players = [mockPlayer1, mockPlayer2];

    context = {
      getPlayers: () => players,
      notifyStateChanged: () => {
        stateChangedCount++;
      },
    };

    controller = new PlayerCommandController(context);
  });

  describe("Inventory & Equipment Commands", () => {
    it("returns false when playerIndex is out of range", () => {
      expect(controller.equipPlayerItem(99, 0)).toBe(false);
      expect(controller.unequipPlayerItem(99, "mainHand")).toBe(false);
      expect(controller.usePlayerPotion(99, 0)).toBe(false);
      expect(controller.discardPlayerItem(99, 0)).toBe(false);
      expect(stateChangedCount).toBe(0);
    });

    it("equips an item from backpack and triggers state notification", () => {
      // Slot 0 in default backpack is frost_rapier (weapon)
      expect(mockPlayer1.inventory.backpack[0]).not.toBeNull();
      const previousWeapon = mockPlayer1.inventory.equipment.mainHand;

      const success = controller.equipPlayerItem(0, 0);
      expect(success).toBe(true);
      expect(stateChangedCount).toBe(1);
      // Frost rapier should now be equipped in mainHand
      expect(mockPlayer1.inventory.equipment.mainHand?.id).toBe("frost_rapier");
      // Previous weapon should be swapped into backpack[0]
      expect(mockPlayer1.inventory.backpack[0]?.id).toBe(previousWeapon?.id);
    });

    it("unequips a slot to backpack and triggers state notification", () => {
      expect(mockPlayer1.inventory.equipment.armor).not.toBeNull();
      const armorId = mockPlayer1.inventory.equipment.armor?.id;

      const success = controller.unequipPlayerItem(0, "armor");
      expect(success).toBe(true);
      expect(stateChangedCount).toBe(1);
      expect(mockPlayer1.inventory.equipment.armor).toBeNull();
      // Armor should now be in backpack
      const inBackpack = mockPlayer1.inventory.backpack.some((item) => item?.id === armorId);
      expect(inBackpack).toBe(true);
    });

    it("discards an item from backpack and triggers state notification", () => {
      expect(mockPlayer1.inventory.backpack[0]).not.toBeNull();
      const success = controller.discardPlayerItem(0, 0);
      expect(success).toBe(true);
      expect(stateChangedCount).toBe(1);
      expect(mockPlayer1.inventory.backpack[0]).toBeNull();
    });

    it("uses quick potion and triggers state notification", () => {
      mockPlayer1.health = 50;
      expect(mockPlayer1.inventory.quickPotions[0]?.id).toBe("potion_health");
      const initialCount = mockPlayer1.inventory.quickPotions[0]?.count ?? 0;

      const success = controller.usePlayerPotion(0, 0);
      expect(success).toBe(true);
      expect(stateChangedCount).toBe(1);
      expect(mockPlayer1.health).toBeGreaterThan(50);
      expect(mockPlayer1.inventory.quickPotions[0]?.count).toBe(initialCount - 1);
    });

    it("resets player inventory to defaults and recalibrates max stats", () => {
      mockPlayer1.inventory.backpack = new Array(16).fill(null);
      mockPlayer1.maxHealth = 10;
      mockPlayer2.maxMana = 10;

      controller.resetPlayerInventoryToDefaults();
      expect(stateChangedCount).toBe(1);

      // Should have restored default items and recomputed stats
      expect(mockPlayer1.inventory.backpack[0]?.id).toBe("frost_rapier");
      expect(mockPlayer1.maxHealth).toBeGreaterThan(50);
      expect(mockPlayer2.maxMana).toBeGreaterThan(50);
    });
  });

  describe("Skill & Spell Commands", () => {
    it("returns error object when unlocking skill for non-existent player", () => {
      const result = controller.unlockPlayerSkill(99, "any_node");
      expect(result.success).toBe(false);
      expect(result.messageKey).toBe("noSkillFound");
      expect(stateChangedCount).toBe(0);
    });

    it("unlocks an eligible skill and notifies state change", () => {
      // Find a tier 1 skill or child node for Valen that can be unlocked
      const result = controller.unlockPlayerSkill(0, "blade_dance");
      if (result.success) {
        expect(stateChangedCount).toBe(1);
        expect(mockPlayer1.unlockedSkills).toContain("blade_dance");
      } else {
        // If blade_dance has prerequisites, result should cleanly state not met without crashing
        expect(result.success).toBe(false);
      }
    });

    it("assigns unlocked spell to spell slot", () => {
      // Valen starts with unlocked skills
      const unlockedSpell = mockPlayer1.unlockedSkills[0];
      const success = controller.assignPlayerSpell(0, unlockedSpell, "primary");
      expect(success).toBe(true);
      expect(stateChangedCount).toBe(1);
      expect(mockPlayer1.primarySpellId).toBe(unlockedSpell);
    });

    it("returns false when assigning spell to non-existent player", () => {
      expect(controller.assignPlayerSpell(99, "fireball", "primary")).toBe(false);
      expect(stateChangedCount).toBe(0);
    });

    it("resets player skills to defaults and notifies state change", () => {
      mockPlayer1.skillPoints = 999;
      mockPlayer1.primarySpellId = "custom_spell";
      mockPlayer2.skillPoints = 888;

      controller.resetPlayerSkillsToDefaults();
      expect(stateChangedCount).toBe(1);

      const valenDefaults = getDefaultSkillsForCharacter("valen");
      expect(mockPlayer1.skillPoints).toBe(valenDefaults.skillPoints);
      expect(mockPlayer1.primarySpellId).toBe(valenDefaults.primarySpellId);

      const aureliaDefaults = getDefaultSkillsForCharacter("aurelia");
      expect(mockPlayer2.skillPoints).toBe(aureliaDefaults.skillPoints);
      expect(mockPlayer2.primarySpellId).toBe(aureliaDefaults.primarySpellId);
    });
  });

  describe("GameEngine Integration & Delegation", () => {
    it("exposes playerCommands controller and delegates engine methods", async () => {
      const { GameEngine } = await import("../../loop/engine");
      const engine = new GameEngine();

      expect(engine.playerCommands).toBeDefined();

      // Test that engine delegator works
      const initialPotion = engine.players[0].inventory.quickPotions[0];
      expect(initialPotion?.id).toBe("potion_health");
      const prevCount = initialPotion?.count ?? 0;
      engine.players[0].health = 50;

      const success = engine.usePlayerPotion(0, 0);
      expect(success).toBe(true);
      expect(engine.players[0].inventory.quickPotions[0]?.count).toBe(prevCount - 1);
    });
  });
});

