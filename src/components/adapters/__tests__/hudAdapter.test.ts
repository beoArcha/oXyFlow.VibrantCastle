import { describe, it, expect, mock, spyOn } from "bun:test";
import {
  resolvePlayerStatusVM,
  resolveSpellVM,
  resolvePotionSlotsVM,
  resolveQuickBeltVM,
  resolveViewportCameraProjection,
  executeQuickPotionUse,
  resolvePlayerDerivedStats,
  attachViewportCanvas,
  resizeViewportCanvas,
  executeCanvasClickTeleport,
} from "../hudAdapter";
import gameEngine from "@game/loop/engine";
import { debugManager } from "@game/debug/debugManager";
import type { InventoryState, Item } from "@game/types";

describe("hudAdapter - Engine to UI Data Transformation", () => {
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
      expect(vm?.maxStamina).toBe(100);
      expect(vm?.attackPower).toBe(25);
      expect(vm?.skillPoints).toBe(3);
    });

    it("applies fallback characterId and attackFallback when missing", () => {
      const mockPlayer = {
        isDead: false,
        health: 50,
        maxHealth: 100,
        mana: 20,
        maxMana: 50,
        stamina: 30,
        maxStamina: 100,
      };

      const vmP1 = resolvePlayerStatusVM(mockPlayer, null, {
        characterName: "Valen",
        theme: "crimson",
        playerNumber: 1,
        attackFallback: 15,
      });

      expect(vmP1?.characterId).toBe("valen");
      expect(vmP1?.attackPower).toBe(15);
      expect(vmP1?.skillPoints).toBe(0);

      const vmP2 = resolvePlayerStatusVM(mockPlayer, null, {
        characterName: "Aurelia",
        theme: "cyan",
        playerNumber: 2,
      });

      expect(vmP2?.characterId).toBe("aurelia");
      expect(vmP2?.attackPower).toBe(10);

      const vmRed = resolvePlayerStatusVM(mockPlayer, null, {
        characterName: "Valen",
        theme: "red",
        playerNumber: 1,
      });
      expect(vmRed?.theme).toBe("crimson");
      expect(vmRed?.characterId).toBe("valen");
    });
  });

  describe("resolveSpellVM", () => {
    it("returns null when spellId is missing or unknown", () => {
      expect(resolveSpellVM(null, "U", "cyan")).toBeNull();
      expect(resolveSpellVM(undefined, "U", "cyan")).toBeNull();
      expect(resolveSpellVM("", "U", "cyan")).toBeNull();
      expect(resolveSpellVM("non_existent_spell", "U", "cyan")).toBeNull();
    });

    it("maps existing spell definition from SPELL_REGISTRY", () => {
      const spell = resolveSpellVM("solar_flare", "U", "cyan");

      expect(spell).not.toBeNull();
      expect(spell?.id).toBe("solar_flare");
      expect(spell?.nameKey).toBe("spellSolarFlareName");
      expect(spell?.manaCost).toBe(12);
      expect(spell?.keyLabel).toBe("U");
      expect(spell?.variant).toBe("cyan");
    });
  });

  describe("resolvePotionSlotsVM", () => {
    it("generates 3 slots even when quickPotions array is undefined", () => {
      const slots = resolvePotionSlotsVM(undefined, true);

      expect(slots.length).toBe(3);
      expect(slots[0].isEmpty).toBe(true);
      expect(slots[0].keyLabel).toBe("1");
      expect(slots[1].keyLabel).toBe("2");
      expect(slots[2].keyLabel).toBe("3");
    });

    it("formats Player 2 key labels with +7 offset", () => {
      const slots = resolvePotionSlotsVM(undefined, false);

      expect(slots[0].keyLabel).toBe("7");
      expect(slots[1].keyLabel).toBe("8");
      expect(slots[2].keyLabel).toBe("9");
    });

    it("maps existing potion items with heal attributes and count", () => {
      const mockPotions: (Item | null)[] = [
        {
          id: "pot_hp",
          nameKey: "potionHp",
          count: 2,
          healHp: 50,
          healMana: 0,
        } as any,
        null,
        {
          id: "pot_mana",
          nameKey: "potionMana",
          count: 5,
          healHp: 0,
          healMana: 30,
        } as any,
      ];

      const slots = resolvePotionSlotsVM(mockPotions, true);

      expect(slots[0].isEmpty).toBe(false);
      expect(slots[0].count).toBe(2);
      expect(slots[0].healHp).toBe(50);
      expect(slots[0].nameKey).toBe("potionHp");

      expect(slots[1].isEmpty).toBe(true);
      expect(slots[1].count).toBe(0);

      expect(slots[2].isEmpty).toBe(false);
      expect(slots[2].count).toBe(5);
      expect(slots[2].healMana).toBe(30);
    });
  });

  describe("resolveQuickBeltVM", () => {
    it("returns null when player is missing", () => {
      expect(
        resolveQuickBeltVM(null, {
          playerNumber: 1,
          primaryKeyLabel: "U",
          secondaryKeyLabel: "O",
          potionKeyRangeLabel: "1-3",
        })
      ).toBeNull();
    });

    it("resolves complete QuickBeltVM with spells and potions", () => {
      const mockPlayer = {
        inventory: {
          quickPotions: [
            { id: "pot_hp", nameKey: "potionHp", count: 1, healHp: 50 } as any,
            null,
            null,
          ],
        } as InventoryState,
        primarySpellId: "solar_flare",
        secondarySpellId: "non_existent",
      };

      const belt = resolveQuickBeltVM(mockPlayer, {
        playerNumber: 1,
        primaryKeyLabel: "U",
        secondaryKeyLabel: "O",
        potionKeyRangeLabel: "1-3",
      });

      expect(belt).not.toBeNull();
      expect(belt?.playerNumber).toBe(1);
      expect(belt?.primarySpell?.id).toBe("solar_flare");
      expect(belt?.secondarySpell).toBeNull();
      expect(belt?.primaryKeyLabel).toBe("U");
      expect(belt?.secondaryKeyLabel).toBe("O");
      expect(belt?.potionKeyRangeLabel).toBe("1-3");
      expect(belt?.potions.length).toBe(3);
      expect(belt?.potions[0].isEmpty).toBe(false);
    });
  });

  describe("resolveViewportCameraProjection", () => {
    it("calculates world coordinates from screen click", () => {
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
        350, // clientX: 250px inside rect -> 250 * (1000/500) = 500 canvas px
        200, // clientY: 150px inside rect -> 150 * (600/300) = 300 canvas px
        { x: 1000, y: 500 }, // camera
        2.0 // scaleFactor
      );

      // canvasPxX = (350 - 100) * 2 = 500
      // canvasPxY = (200 - 50) * 2 = 300
      // worldX = Math.round(1000 + 500 / 2 - 16) = 1000 + 250 - 16 = 1234
      // worldY = Math.round(500 + 300 / 2 - 24) = 500 + 150 - 24 = 626
      expect(result.worldX).toBe(1234);
      expect(result.worldY).toBe(626);
    });
  });

  describe("executeQuickPotionUse", () => {
    it("returns false if player or inventory is absent", () => {
      expect(executeQuickPotionUse(null, 0)).toBe(false);
      expect(executeQuickPotionUse({} as any, 0)).toBe(false);
    });

    it("executes potion consumption and invokes onNotify callback", () => {
      const onNotify = mock(() => {});
      const mockPlayer = {
        health: 20,
        maxHealth: 100,
        inventory: {
          quickPotions: [
            {
              id: "potion_health_1",
              nameKey: "potionHp",
              count: 1,
              healHp: 50,
              healMana: 0,
            },
            null,
            null,
          ],
          backpack: [],
          gold: 0,
          equippedWeapon: null,
          equippedArmor: null,
          equippedAccessory: null,
          maxBackpackSlots: 20,
        },
      };

      const success = executeQuickPotionUse(mockPlayer as any, 0, onNotify);

      expect(success).toBe(true);
      expect(onNotify).toHaveBeenCalledTimes(1);
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

  describe("attachViewportCanvas & resizeViewportCanvas", () => {
    it("attaches canvas, starts engine, and returns cleanup that stops engine", () => {
      const mockCanvas = {} as HTMLCanvasElement;
      const attachSpy = spyOn(gameEngine, "attachCanvas").mockImplementation(() => {});
      const startSpy = spyOn(gameEngine, "start").mockImplementation(() => {});
      const stopSpy = spyOn(gameEngine, "stop").mockImplementation(() => {});

      const cleanup = attachViewportCanvas(mockCanvas);

      expect(attachSpy).toHaveBeenCalledWith(mockCanvas);
      expect(startSpy).toHaveBeenCalledTimes(1);

      cleanup();
      expect(stopSpy).toHaveBeenCalledTimes(1);

      attachSpy.mockRestore();
      startSpy.mockRestore();
      stopSpy.mockRestore();
    });

    it("resizes viewport canvas via gameEngine.setCanvasDimensions", () => {
      const resizeSpy = spyOn(gameEngine, "setCanvasDimensions").mockImplementation(() => {});

      resizeViewportCanvas(1280, 720, 2, "pixel");
      expect(resizeSpy).toHaveBeenCalledWith(1280, 720, 2, "pixel");

      resizeSpy.mockRestore();
    });
  });

  describe("executeCanvasClickTeleport", () => {
    it("returns false if debug clickToTeleport is disabled", () => {
      debugManager.state.clickToTeleport = false;
      const mockCanvas = {} as HTMLCanvasElement;
      expect(executeCanvasClickTeleport(mockCanvas, 100, 100)).toBe(false);
    });

    it("teleports player when debug clickToTeleport is enabled", () => {
      debugManager.state.clickToTeleport = true;
      const teleportSpy = spyOn(gameEngine, "teleportPlayer").mockImplementation(() => {});
      const origCamera = gameEngine.cameraManager;
      const scaleSpy = spyOn(gameEngine, "getRendererScaleFactor").mockReturnValue(1);
      (gameEngine as any).cameraManager = { x: 500, y: 300 } as any;

      const mockCanvas = {
        width: 800,
        height: 600,
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
          bottom: 600,
          right: 800,
          x: 0,
          y: 0,
          toJSON: () => {},
        }),
      } as unknown as HTMLCanvasElement;

      try {
        const success = executeCanvasClickTeleport(mockCanvas, 400, 300);
        expect(success).toBe(true);
        expect(teleportSpy).toHaveBeenCalled();
      } finally {
        (gameEngine as any).cameraManager = origCamera;
        teleportSpy.mockRestore();
        scaleSpy.mockRestore();
        debugManager.state.clickToTeleport = false;
      }
    });
  });
});

