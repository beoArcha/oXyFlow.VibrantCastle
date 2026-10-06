import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { gameSave, GameSaveSystem } from "../save";
import { attemptCastSpell, castMagicSpell } from "../magic";
import {
  createDefaultInventory,
  equipItem,
  unequipItem,
  consumePotion,
  discardItem,
  ITEM_REGISTRY,
} from "../inventory";
import { Player, ItemType, SaveState } from "../../types";
import { ErrorCode, GameplayError, SaveError } from "@lib/errors";

function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "player1",
    name: "Valen",
    x: 100,
    y: 200,
    vx: 0,
    vy: 0,
    width: 32,
    height: 48,
    health: 100,
    maxHealth: 100,
    mana: 100,
    maxMana: 100,
    stamina: 100,
    maxStamina: 100,
    score: 0,
    skillPoints: 2,
    unlockedSkills: [],
    primarySpellId: "solar_flare",
    facingLeft: false,
    isGrounded: true,
    isCrouching: false,
    isAttacking: false,
    isCasting: false,
    castTime: 0,
    magicCooldown: 0,
    shieldActiveTime: 0,
    inventory: createDefaultInventory(),
    characterClass: "spellblade",
    ...overrides,
  } as Player;
}

describe("Domain & Gameplay Result", () => {
  let memoryStore: Record<string, string> = {};
  const origStorage = (globalThis as any).localStorage;

  beforeEach(() => {
    memoryStore = {};
    const mockStorage = {
      getItem: (key: string) => memoryStore[key] ?? null,
      setItem: (key: string, val: string) => {
        memoryStore[key] = val;
      },
      removeItem: (key: string) => {
        delete memoryStore[key];
      },
      clear: () => {
        memoryStore = {};
      },
    };
    (globalThis as any).localStorage = mockStorage;
  });

  afterEach(() => {
    (globalThis as any).localStorage = origStorage;
  });

  describe("Save System (Result-based Outcomes)", () => {
    it("returns Err with SAVE_SLOT_EMPTY when no save exists in storage", () => {
      const result = gameSave.loadSaveResult();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SaveError);
        expect(result.error.code).toBe(ErrorCode.SAVE_SLOT_EMPTY);
      }
    });

    it("returns Err with SAVE_CORRUPTED_JSON when storage contains corrupted data", () => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("vibrant_castle_save_state", "invalid{corrupted_json");
      }
      const result = gameSave.loadSaveResult();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.SAVE_CORRUPTED_JSON);
      }
    });

    it("successfully compiles, saves, and loads SaveState using Result", () => {
      const p1 = createMockPlayer();
      const saveRes = gameSave.saveGameResult([p1], [], [], "courtyard");
      expect(saveRes.ok).toBe(true);

      const loadRes = gameSave.loadSaveResult();
      expect(loadRes.ok).toBe(true);
      if (loadRes.ok) {
        expect(loadRes.value.levelId).toBe("courtyard");
        expect(loadRes.value.p1Health).toBe(100);
      }
    });

    it("returns Err with SAVE_WRITE_FAILED if primary player is missing on save", () => {
      const res = gameSave.saveGameResult([], [], [], "courtyard");
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe(ErrorCode.SAVE_WRITE_FAILED);
      }
    });

    it("applies save state using applySaveStateResult", () => {
      const p1 = createMockPlayer({ health: 10, mana: 20 });
      const savedState: SaveState = {
        timestamp: new Date().toISOString(),
        p1Health: 95,
        p1Mana: 80,
        p1Stamina: 90,
        p1Score: 500,
        p1SkillPoints: 3,
        p1UnlockedSkills: ["mana_font"],
        p2Health: 0,
        p2Mana: 0,
        p2Stamina: 0,
        p2Score: 0,
        levelId: "thorn_chasm",
        activatedLevers: [],
        defeatedEnemies: [],
        checkpointX: 450,
        checkpointY: 300,
      };

      const result = gameSave.applySaveStateResult(savedState, [p1], [], []);
      expect(result.ok).toBe(true);
      expect(p1.health).toBe(95);
      expect(p1.mana).toBe(80);
      expect(p1.x).toBe(450);
      expect(p1.y).toBe(300);
    });

    it("parses valid save JSON and rejects corrupted strings with parseSaveJson", () => {
      const validJson = JSON.stringify({
        levelId: "courtyard",
        p1Health: 100,
        checkpointX: 50,
        checkpointY: 100,
      });
      const validRes = gameSave.parseSaveJson(validJson);
      expect(validRes.ok).toBe(true);
      if (validRes.ok) {
        expect(validRes.value.levelId).toBe("courtyard");
        expect(validRes.value.activatedLevers).toEqual([]);
      }

      const invalidRes = gameSave.parseSaveJson("{not valid json");
      expect(invalidRes.ok).toBe(false);
      if (!invalidRes.ok) {
        expect(invalidRes.error.code).toBe(ErrorCode.SAVE_CORRUPTED_JSON);
      }
    });

    it("clears save state from storage with clearSave", () => {
      const p1 = createMockPlayer();
      gameSave.saveGameResult([p1], [], [], "courtyard");
      expect(gameSave.loadSaveResult().ok).toBe(true);

      const clearRes = gameSave.clearSave();
      expect(clearRes.ok).toBe(true);
      expect(gameSave.loadSaveResult().ok).toBe(false);
    });

    it("purely compiles state without storage side-effects via createSaveState", () => {
      const p1 = createMockPlayer({ health: 85, score: 320 });
      const res = gameSave.createSaveState([p1], [], [], "throne_room");
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.p1Health).toBe(85);
        expect(res.value.levelId).toBe("throne_room");
      }
      // Verify storage was NOT modified
      expect(gameSave.loadSaveResult().ok).toBe(false);
    });

    it("supports custom storage provider injection", () => {
      const memoryStore: Record<string, string> = {};
      const customStorage = {
        getItem: (k: string) => memoryStore[k] ?? null,
        setItem: (k: string, v: string) => { memoryStore[k] = v; },
        removeItem: (k: string) => { delete memoryStore[k]; },
      };

      const customSaveSystem = new GameSaveSystem("custom_key", () => customStorage);
      const p1 = createMockPlayer();
      const saveRes = customSaveSystem.saveGameResult([p1], [], [], "dungeon");
      expect(saveRes.ok).toBe(true);
      expect(memoryStore["custom_key"]).toBeDefined();

      const loadRes = customSaveSystem.loadSaveResult();
      expect(loadRes.ok).toBe(true);
      if (loadRes.ok) {
        expect(loadRes.value.levelId).toBe("dungeon");
      }
    });

    it("rejects NaN and non-finite values in parseSaveJson", () => {
      const nanJson = JSON.stringify({
        levelId: "courtyard",
        p1Health: NaN,
        checkpointX: 10,
        checkpointY: 20,
      });
      const res = gameSave.parseSaveJson(nanJson);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe(ErrorCode.SAVE_CORRUPTED_JSON);
      }
    });

    it("safely handles storage exceptions during loadSaveResult without throwing", () => {
      const brokenStorage = {
        getItem: () => {
          throw new Error("SecurityError: Access Denied");
        },
        setItem: () => {},
        removeItem: () => {},
      };
      const brokenSystem = new GameSaveSystem("broken_key", () => brokenStorage);
      const loadRes = brokenSystem.loadSaveResult();
      expect(loadRes.ok).toBe(false);
      if (!loadRes.ok) {
        expect(loadRes.error.code).toBe(ErrorCode.SAVE_WRITE_FAILED);
        expect(loadRes.error.message).toContain("Failed to read save from storage");
      }
    });
  });

  describe("Magic System (attemptCastSpell)", () => {
    const mockInputs = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      action1: false,
      action2: false,
      magic1: false,
      magic2: false,
      potion1: false,
      potion2: false,
      potion3: false,
    };
    const mockAudio = { playSFX: () => {} };

    it("returns Err with GAMEPLAY_INVALID_ACTION when spellId is unregistered", () => {
      const player = createMockPlayer();
      const res = attemptCastSpell(player, "non_existent_spell", mockInputs, mockAudio);

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBeInstanceOf(GameplayError);
        expect(res.error.code).toBe(ErrorCode.GAMEPLAY_INVALID_ACTION);
      }
    });

    it("returns Err with GAMEPLAY_COOLDOWN_ACTIVE when player is on magic cooldown", () => {
      const player = createMockPlayer({ magicCooldown: 15 });
      const res = attemptCastSpell(player, "solar_flare", mockInputs, mockAudio);

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe(ErrorCode.GAMEPLAY_COOLDOWN_ACTIVE);
        expect(res.error.details?.cooldownFrames).toBe(15);
      }
    });

    it("returns Err with GAMEPLAY_INSUFFICIENT_MANA when mana is too low", () => {
      const player = createMockPlayer({ mana: 5 }); // solar_flare costs 15
      const res = attemptCastSpell(player, "solar_flare", mockInputs, mockAudio);

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe(ErrorCode.GAMEPLAY_INSUFFICIENT_MANA);
        expect(res.error.details?.current).toBe(5);
      }
    });

    it("successfully casts offensive spell and returns Ok with projectiles and resource deductions", () => {
      const player = createMockPlayer({ mana: 50, stamina: 50 });
      const res = attemptCastSpell(player, "solar_flare", mockInputs, mockAudio);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.isDefensive).toBe(false);
        expect(res.value.projectiles.length).toBeGreaterThan(0);
        expect(res.value.spellId).toBe("solar_flare");
        expect(player.mana).toBeLessThan(50);
        expect(player.magicCooldown).toBeGreaterThan(0);
      }
    });

    it("successfully casts defensive shield spell and returns Ok without projectiles", () => {
      const player = createMockPlayer({ mana: 50, stamina: 50 });
      const res = attemptCastSpell(player, "prismatic_shield", mockInputs, mockAudio);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.isDefensive).toBe(true);
        expect(res.value.projectiles.length).toBe(0);
        expect(player.shieldActiveTime).toBeGreaterThan(0);
      }
    });

    it("preserves backwards compatibility in castMagicSpell", () => {
      const player = createMockPlayer({ mana: 50 });
      const projectiles = castMagicSpell(player, "solar_flare", mockInputs, mockAudio);
      expect(Array.isArray(projectiles)).toBe(true);
      expect(projectiles.length).toBeGreaterThan(0);
    });
  });

  describe("Inventory System (equipItem, unequipItem, consumePotion)", () => {
    it("returns Err with GAMEPLAY_ITEM_NOT_FOUND when equipping from empty backpack slot", () => {
      const player = createMockPlayer();
      const res = equipItem(player, 15); // slot 15 is empty

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe(ErrorCode.GAMEPLAY_ITEM_NOT_FOUND);
      }
    });

    it("successfully equips weapon from backpack and updates player stats", () => {
      const player = createMockPlayer();
      // backpack[0] is frost_rapier (Weapon)
      const res = equipItem(player, 0);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.targetSlot).toBe("mainHand");
        expect(res.value.equipped.id).toBe("frost_rapier");
      }
    });

    it("returns Err with GAMEPLAY_SLOT_LOCKED when adding potion and belt is full", () => {
      const player = createMockPlayer();
      // Put a potion in backpack[5]
      player.inventory.backpack[5] = { ...ITEM_REGISTRY.potion_health, type: ItemType.Potion };
      // Make sure belt is full
      player.inventory.quickPotions = [
        { ...ITEM_REGISTRY.potion_health },
        { ...ITEM_REGISTRY.potion_mana },
        { ...ITEM_REGISTRY.potion_elixir },
      ];

      const res = equipItem(player, 5);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe(ErrorCode.GAMEPLAY_SLOT_LOCKED);
      }
    });

    it("returns Err with GAMEPLAY_SLOT_LOCKED when unequipping into a full backpack", () => {
      const player = createMockPlayer();
      // Fill entire backpack
      player.inventory.backpack = new Array(16).fill({ ...ITEM_REGISTRY.potion_health });

      const res = unequipItem(player, "mainHand");
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe(ErrorCode.GAMEPLAY_SLOT_LOCKED);
      }
    });

    it("consumes potion and returns Ok with healed stats", () => {
      const player = createMockPlayer({ health: 50, maxHealth: 100 });
      player.inventory.quickPotions[0] = { ...ITEM_REGISTRY.potion_health, count: 2, healHp: 40 };

      const res = consumePotion(player, 0);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.healedType).toBe("health");
        expect(res.value.remainingCount).toBe(1);
        expect(player.health).toBe(90);
      }
    });

    it("discards item from backpack returning Ok with discarded item", () => {
      const player = createMockPlayer();
      const res = discardItem(player, 0);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.id).toBe("frost_rapier");
        expect(player.inventory.backpack[0]).toBeNull();
      }
    });
  });
});
