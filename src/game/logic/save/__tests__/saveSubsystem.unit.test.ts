import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  SaveValidator,
  SaveCompiler,
  SaveApplicator,
  SaveStorage,
  SaveExporter,
  GameSaveSystem,
} from "../index";
import { Player, Enemy, Entity, SaveState, PlayerId } from "@game/types";
import { ErrorCode } from "@lib/errors";
import { createMockPlayer } from "@test-utils";

describe("Save Subsystem (Decomposed Architecture)", () => {
  describe("SaveValidator (SRP: JSON validation & normalization)", () => {
    const validator = new SaveValidator();

    it("rejects non-string or empty input", () => {
      expect(validator.parseSaveJson("").ok).toBe(false);
      expect(validator.parseSaveJson(null as any).ok).toBe(false);
    });

    it("rejects non-object or array input", () => {
      expect(validator.parseSaveJson("[]").ok).toBe(false);
      expect(validator.parseSaveJson('"string"').ok).toBe(false);
    });

    it("rejects NaN in coordinates or health", () => {
      const invalidState = JSON.stringify({
        levelId: "courtyard",
        p1Health: NaN,
        checkpointX: 100,
        checkpointY: 200,
      });
      const res = validator.parseSaveJson(invalidState);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe(ErrorCode.SAVE_CORRUPTED_JSON);
      }
    });

    it("parses and normalizes valid minimal state", () => {
      const valid = JSON.stringify({
        levelId: "catacombs",
        p1Health: 80,
        checkpointX: 150,
        checkpointY: 300,
      });
      const res = validator.parseSaveJson(valid);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.levelId).toBe("catacombs");
        expect(res.value.p1Health).toBe(80);
        expect(res.value.p1Mana).toBe(100);
        expect(res.value.activatedLevers).toEqual([]);
      }
    });
  });

  describe("SaveCompiler (SRP: Pure compilation of game entities)", () => {
    const compiler = new SaveCompiler();

    it("purely compiles Player and entity state into SaveState DTO", () => {
      const p1 = createMockPlayer({ health: 75, score: 250, characterId: "aurelia", characterName: "Aurelia" });
      const p2 = createMockPlayer({ id: PlayerId.Player2, health: 50, score: 100, characterId: "valen", characterName: "Valen" });
      const enemies: Enemy[] = [
        { id: "bat1", type: "bat", x: 0, y: 0, vx: 0, vy: 0, width: 16, height: 16, health: 0, maxHealth: 20, isDead: true } as any,
        { id: "bat2", type: "bat", x: 0, y: 0, vx: 0, vy: 0, width: 16, height: 16, health: 20, maxHealth: 20, isDead: false } as any,
      ];
      const entities: Entity[] = [
        { id: "lever_1", type: "lever", x: 0, y: 0, width: 32, height: 32, isActivated: true } as any,
        { id: "lever_2", type: "lever", x: 0, y: 0, width: 32, height: 32, isActivated: false } as any,
      ];

      const res = compiler.createSaveState([p1, p2], enemies, entities, "chasm");
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.levelId).toBe("chasm");
        expect(res.value.p1Health).toBe(75);
        expect(res.value.p1Score).toBe(250);
        expect(res.value.p1CharacterId).toBe("aurelia");
        expect(res.value.p2CharacterId).toBe("valen");
        expect(res.value.defeatedEnemies).toEqual(["bat1"]);
        expect(res.value.activatedLevers).toEqual(["lever_1"]);
      }
    });

    it("returns Err with SAVE_WRITE_FAILED if player1 is absent", () => {
      const res = compiler.createSaveState([], [], [], "chasm");
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe(ErrorCode.SAVE_WRITE_FAILED);
      }
    });
  });

  describe("SaveApplicator (SRP: Mutating active session objects)", () => {
    const applicator = new SaveApplicator();

    it("applies SaveState DTO onto player and entities", () => {
      const p1 = createMockPlayer({ health: 10, mana: 5 });
      const enemies: Enemy[] = [
        { id: "crawler1", type: "crawler", x: 0, y: 0, vx: 0, vy: 0, width: 20, height: 20, health: 50, maxHealth: 50, isDead: false } as any,
      ];
      const entities: Entity[] = [
        { id: "leverA", type: "lever", x: 0, y: 0, width: 32, height: 32, isActivated: false } as any,
      ];

      const state: SaveState = {
        timestamp: new Date().toISOString(),
        p1Health: 90,
        p1Mana: 80,
        p1Stamina: 85,
        p1Score: 1200,
        p1SkillPoints: 2,
        p1UnlockedSkills: [],
        p1CharacterId: "aurelia",
        p2Health: 0,
        p2Mana: 0,
        p2Stamina: 0,
        p2Score: 0,
        levelId: "courtyard",
        activatedLevers: ["leverA"],
        defeatedEnemies: ["crawler1"],
        checkpointX: 340,
        checkpointY: 450,
      };

      const res = applicator.applySaveState(state, [p1], enemies, entities);
      expect(res.ok).toBe(true);
      expect(p1.health).toBe(90);
      expect(p1.mana).toBe(80);
      expect(p1.x).toBe(340);
      expect(p1.y).toBe(450);
      expect(p1.characterId).toBe("aurelia");
      expect(p1.characterName).toBe("Aurelia");
      expect(entities[0].isActivated).toBe(true);
      expect(enemies[0].isDead).toBe(true);
    });
  });

  describe("SaveStorage (SRP & DIP: Storage persistence)", () => {
    it("handles storage operations with custom storage provider", () => {
      const store: Record<string, string> = {};
      const mockStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
      };

      const storage = new SaveStorage("slot_1", () => mockStorage);
      const testState: SaveState = {
        timestamp: new Date().toISOString(),
        p1Health: 100,
        p1Mana: 100,
        p1Stamina: 100,
        p1Score: 0,
        p1SkillPoints: 0,
        p1UnlockedSkills: [],
        p2Health: 0,
        p2Mana: 0,
        p2Stamina: 0,
        p2Score: 0,
        levelId: "hall",
        activatedLevers: [],
        defeatedEnemies: [],
        checkpointX: 10,
        checkpointY: 20,
      };

      const saveRes = storage.saveStateToStorage(testState);
      expect(saveRes.ok).toBe(true);
      expect(store["slot_1"]).toBeDefined();

      const loadRes = storage.loadSaveResult();
      expect(loadRes.ok).toBe(true);
      if (loadRes.ok) {
        expect(loadRes.value.levelId).toBe("hall");
      }

      const clearRes = storage.clearSave();
      expect(clearRes.ok).toBe(true);
      expect(storage.loadSaveResult().ok).toBe(false);
    });

    it("handles storage quota errors gracefully", () => {
      const quotaStorage = {
        getItem: () => null,
        setItem: () => {
          const quotaErr = new Error("Quota exceeded");
          quotaErr.name = "QuotaExceededError";
          throw quotaErr;
        },
        removeItem: () => { },
      };

      const storage = new SaveStorage("slot_quota", () => quotaStorage);
      const saveRes = storage.saveStateToStorage({} as any);
      expect(saveRes.ok).toBe(false);
      if (!saveRes.ok) {
        expect(saveRes.error.code).toBe(ErrorCode.SAVE_STORAGE_QUOTA_EXCEEDED);
      }
    });
  });

  describe("SaveExporter (SRP: DOM/Blob isolation)", () => {
    const exporter = new SaveExporter();

    it("returns Err with SAVE_WRITE_FAILED in headless/non-DOM environment without throwing", () => {
      const origDoc = (globalThis as any).document;
      try {
        delete (globalThis as any).document;
        const res = exporter.exportToFile({} as any);
        expect(res.ok).toBe(false);
        if (!res.ok) {
          expect(res.error.code).toBe(ErrorCode.SAVE_WRITE_FAILED);
        }
      } finally {
        (globalThis as any).document = origDoc;
      }
    });
  });

  describe("GameSaveSystem", () => {
    it("coordinates all services via unified facade with custom storage", () => {
      const store: Record<string, string> = {};
      const mockStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
      };

      const facade = new GameSaveSystem("facade_slot", () => mockStorage);
      const p1 = createMockPlayer();

      const saveRes = facade.saveGameResult([p1], [], [], "throne");
      expect(saveRes.ok).toBe(true);

      const loadRes = facade.loadSaveResult();
      expect(loadRes.ok).toBe(true);
      if (loadRes.ok) {
        expect(loadRes.value.levelId).toBe("throne");
      }
    });
  });
});
