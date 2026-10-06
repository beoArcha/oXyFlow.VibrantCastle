import { describe, it, expect } from "bun:test";
import {
  resolvePlayerStatusVM,
  resolveSpellVM,
  resolvePotionSlotsVM,
  resolveQuickBeltVM,
  resolveViewportCameraProjection,
  resolvePlayerDerivedStats,
} from "../hud.mapper";
import type { InventoryState, Item } from "@game/types";

describe("hud.mapper - Engine to UI Presentation Mapping", () => {
  describe("resolvePlayerStatusVM", () => {
    it("returns null when player is null or undefined", () => {
      expect(
        resolvePlayerStatusVM(null, null, {
          characterName: "Valen",
          theme: "crimson",
          playerNumber: 1,
        })
      ).toBeNull();

      expect(
        resolvePlayerStatusVM(undefined, null, {
          characterName: "Aurelia",
          theme: "cyan",
          playerNumber: 2,
        })
      ).toBeNull();
    });

    it("maps valid player data into PlayerStatusVM for Player 1", () => {
      const mockPlayer = {
        characterId: "valen" as const,
        isDead: false,
        health: 95.4,
        maxHealth: 100,
        mana: 45.2,
        maxMana: 50,
        stamina: 80.8,
        maxStamina: 100,
        skillPoints: 3,
      };

      const vm = resolvePlayerStatusVM(
        mockPlayer,
        { totalAttack: 24.6 } as any,
        {
          characterName: "Valen",
          theme: "crimson",
          playerNumber: 1,
        }
      );

      expect(vm).not.toBeNull();
      expect(vm?.characterId).toBe("valen");
      expect(vm?.characterName).toBe("Valen");
      expect(vm?.playerNumber).toBe(1);
      expect(vm?.theme).toBe("crimson");
      expect(vm?.health).toBe(95);
      expect(vm?.maxHealth).toBe(100);
      expect(vm?.mana).toBe(45);
      expect(vm?.maxMana).toBe(50);
      expect(vm?.stamina).toBe(81);
      expect(vm?.attackPower).toBe(25);
      expect(vm?.skillPoints).toBe(3);
    });

    it("maps valid player data into PlayerStatusVM for Player 2", () => {
      const mockPlayer = {
        characterId: "aurelia" as const,
        isDead: false,
        health: 70,
        maxHealth: 80,
        mana: 90,
        maxMana: 100,
        stamina: 60,
        maxStamina: 60,
        skillPoints: 0,
      };

      const vm = resolvePlayerStatusVM(
        mockPlayer,
        null,
        {
          characterName: "Aurelia",
          theme: "cyan",
          playerNumber: 2,
          attackFallback: 15,
        }
      );

      expect(vm).not.toBeNull();
      expect(vm?.characterId).toBe("aurelia");
      expect(vm?.characterName).toBe("Aurelia");
      expect(vm?.playerNumber).toBe(2);
      expect(vm?.theme).toBe("cyan");
      expect(vm?.attackPower).toBe(15);
    });
  });

  describe("resolveSpellVM", () => {
    it("returns null when spellId is undefined or not found in registry", () => {
      expect(resolveSpellVM(undefined, "Q", "cyan")).toBeNull();
      expect(resolveSpellVM("unknown_spell_xyz", "Q", "cyan")).toBeNull();
    });

    it("resolves registered spell definition into SpellItemVM", () => {
      const vm = resolveSpellVM("solar_flare", "E", "cyan");
      expect(vm).not.toBeNull();
      expect(vm?.id).toBe("solar_flare");
      expect(vm?.keyLabel).toBe("E");
      expect(vm?.variant).toBe("cyan");
      expect(typeof vm?.manaCost).toBe("number");
      expect(typeof vm?.nameKey).toBe("string");
    });
  });

  describe("resolvePotionSlotsVM", () => {
    it("resolves P1 potion slots with keys 1, 2, 3", () => {
      const quickPotions: (Item | null)[] = [
        {
          id: "potion_hp",
          nameKey: "itemPotionHpName",
          descriptionKey: "itemPotionHpDesc",
          icon: "FlaskConical",
          type: "potion" as any,
          rarity: "common",
          count: 2,
          healHp: 50,
        },
        null,
        null,
      ];

      const slots = resolvePotionSlotsVM(quickPotions, true);
      expect(slots).toHaveLength(3);

      expect(slots[0].keyLabel).toBe("1");
      expect(slots[0].count).toBe(2);
      expect(slots[0].isEmpty).toBe(false);
      expect(slots[0].healHp).toBe(50);

      expect(slots[1].keyLabel).toBe("2");
      expect(slots[1].isEmpty).toBe(true);

      expect(slots[2].keyLabel).toBe("3");
      expect(slots[2].isEmpty).toBe(true);
    });

    it("resolves P2 potion slots with keys 7, 8, 9", () => {
      const slots = resolvePotionSlotsVM(undefined, false);
      expect(slots).toHaveLength(3);
      expect(slots[0].keyLabel).toBe("7");
      expect(slots[1].keyLabel).toBe("8");
      expect(slots[2].keyLabel).toBe("9");
      expect(slots.every((s) => s.isEmpty)).toBe(true);
    });
  });

  describe("resolveQuickBeltVM", () => {
    it("returns null if player is null or undefined", () => {
      expect(
        resolveQuickBeltVM(null, {
          playerNumber: 1,
          primaryKeyLabel: "Q",
          secondaryKeyLabel: "E",
          potionKeyRangeLabel: "1-3",
        })
      ).toBeNull();
    });

    it("transforms player quick belt state into QuickBeltVM", () => {
      const mockPlayer = {
        inventory: {
          quickPotions: [null, null, null],
          backpack: [],
          gold: 0,
          equipment: {} as any,
        } as unknown as InventoryState,
        primarySpellId: "spell_arcane_bolt",
        secondarySpellId: "spell_barrier",
      };

      const vm = resolveQuickBeltVM(mockPlayer, {
        playerNumber: 1,
        primaryKeyLabel: "Q",
        secondaryKeyLabel: "E",
        potionKeyRangeLabel: "1-3",
      });

      expect(vm).not.toBeNull();
      expect(vm?.playerNumber).toBe(1);
      expect(vm?.primaryKeyLabel).toBe("Q");
      expect(vm?.secondaryKeyLabel).toBe("E");
      expect(vm?.potionKeyRangeLabel).toBe("1-3");
      expect(vm?.potions).toHaveLength(3);
    });
  });

  describe("resolveViewportCameraProjection", () => {
    it("projects canvas click coordinates accurately to world coordinates", () => {
      const mockCanvas = {
        width: 1000,
        height: 600,
        getBoundingClientRect: () => ({
          left: 100,
          top: 50,
          width: 500,
          height: 300,
        }),
      };

      const result = resolveViewportCameraProjection(
        mockCanvas,
        350,
        200,
        { x: 1000, y: 500 },
        2.0
      );

      expect(result.worldX).toBe(1234);
      expect(result.worldY).toBe(626);
    });
  });

  describe("resolvePlayerDerivedStats", () => {
    it("returns null if player is null or undefined or missing inventory.equipment", () => {
      expect(resolvePlayerDerivedStats(null)).toBeNull();
      expect(resolvePlayerDerivedStats(undefined)).toBeNull();
      expect(resolvePlayerDerivedStats({} as any)).toBeNull();
    });

    it("returns derived stats for valid player", () => {
      const mockPlayer = {
        inventory: {
          equipment: {
            mainHand: null,
            offHand: null,
            helmet: null,
            armor: null,
            amulet: null,
            ring: null,
          },
        },
        unlockedSkills: [],
      };

      const stats = resolvePlayerDerivedStats(mockPlayer);
      expect(stats).not.toBeNull();
      expect(typeof stats?.totalAttack).toBe("number");
    });
  });
});
