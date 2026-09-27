import { describe, it, expect, beforeEach } from "bun:test";
import {
  StatsStorage,
  sanitizeSessionStats,
} from "../statsStorage";
import { StatsManager } from "../StatsManager";
import {
  createInitialSessionStats,
  IStatsStorageProvider,
  IStatsStorage,
  GameSessionStats,
} from "../statsTypes";
import { createMockStorageProvider, MockStorageProvider } from "../../../../test-utils";

describe("StatsStorage & StatsManager", () => {
  let mockStorage: MockStorageProvider;
  let statsStorage: StatsStorage;

  beforeEach(() => {
    mockStorage = createMockStorageProvider();
    statsStorage = new StatsStorage(mockStorage);
  });

  describe("StatsStorage - Loading & Sanitization", () => {
    it("returns null when storage is empty", () => {
      const result = statsStorage.load();
      expect(result).toBeNull();
    });

    it("loads and parses valid stored session statistics", () => {
      const sampleStats = createInitialSessionStats();
      sampleStats.p1.kills = 15;
      sampleStats.p1.damageDealt = 1250;
      sampleStats.levelsCompleted = 2;

      mockStorage.store[StatsStorage.STORAGE_KEY] = JSON.stringify(sampleStats);

      const loaded = statsStorage.load();
      expect(loaded).not.toBeNull();
      expect(loaded?.p1.kills).toBe(15);
      expect(loaded?.p1.damageDealt).toBe(1250);
      expect(loaded?.levelsCompleted).toBe(2);
    });

    it("sanitizes NaN and Infinity to safe finite numbers", () => {
      const corruptedJson = JSON.stringify({
        sessionStartTime: "not_a_number",
        totalPlayTimeSeconds: null,
        levelsCompleted: 99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999, // very large number or Infinity
        leversPulled: 3,
        p1: {
          kills: "three",
          damageDealt: NaN,
          damageTaken: 100,
          potionsByType: {
            health: null,
            mana: 2,
          },
        },
      });

      mockStorage.store[StatsStorage.STORAGE_KEY] = corruptedJson;

      const loaded = statsStorage.load();
      expect(loaded).not.toBeNull();
      expect(Number.isFinite(loaded!.sessionStartTime)).toBe(true);
      expect(loaded!.totalPlayTimeSeconds).toBe(0);
      expect(loaded!.leversPulled).toBe(3);
      expect(loaded!.p1.kills).toBe(0);
      expect(loaded!.p1.damageDealt).toBe(0);
      expect(loaded!.p1.damageTaken).toBe(100);
      expect(loaded!.p1.potionsByType.health).toBe(0);
      expect(loaded!.p1.potionsByType.mana).toBe(2);
    });

    it("returns null gracefully on malformed JSON without crashing", () => {
      mockStorage.store[StatsStorage.STORAGE_KEY] = "{{ corrupted_json";
      const loaded = statsStorage.load();
      expect(loaded).toBeNull();
    });
  });

  describe("StatsStorage - Saving & Debouncing", () => {
    it("immediately saves stats and writes to storage key", () => {
      const stats = createInitialSessionStats();
      stats.p1.kills = 5;

      const success = statsStorage.save(stats);
      expect(success).toBe(true);

      const inStore = JSON.parse(mockStorage.store[StatsStorage.STORAGE_KEY]);
      expect(inStore.p1.kills).toBe(5);
    });

    it("schedules debounced save and flushes on demand", () => {
      const stats = createInitialSessionStats();
      stats.p1.kills = 5;
      statsStorage.save(stats); // Sets lastSaveTime = Date.now()

      stats.p1.kills = 8;
      statsStorage.scheduleSave(stats, 10000); // 10 second debounce

      // Memory store still has previous value (5) because debounce is active
      const inStoreBeforeFlush = JSON.parse(mockStorage.store[StatsStorage.STORAGE_KEY]);
      expect(inStoreBeforeFlush.p1.kills).toBe(5);

      statsStorage.flush();
      const inStoreAfterFlush = JSON.parse(mockStorage.store[StatsStorage.STORAGE_KEY]);
      expect(inStoreAfterFlush.p1.kills).toBe(8);
    });

    it("clears storage and pending timers", () => {
      const stats = createInitialSessionStats();
      statsStorage.save(stats);
      expect(mockStorage.store[StatsStorage.STORAGE_KEY]).toBeDefined();

      const cleared = statsStorage.clear();
      expect(cleared).toBe(true);
      expect(mockStorage.store[StatsStorage.STORAGE_KEY]).toBeUndefined();
    });

    it("handles storage exceptions gracefully", () => {
      const failingProvider: IStatsStorageProvider = {
        getItem: () => null,
        setItem: () => {
          throw new Error("QuotaExceeded");
        },
        removeItem: () => {
          throw new Error("SecurityError");
        },
      };

      const failingStorage = new StatsStorage(failingProvider);
      expect(failingStorage.save(createInitialSessionStats())).toBe(false);
      expect(failingStorage.clear()).toBe(false);
    });
  });

  describe("StatsManager - Dependency Inversion & Domain Orchestration", () => {
    let mockIStatsStorage: IStatsStorage;
    let savedInMock: GameSessionStats | null = null;
    let clearedMock = false;

    beforeEach(() => {
      savedInMock = null;
      clearedMock = false;
      mockIStatsStorage = {
        load: () => null,
        save: (stats) => {
          savedInMock = stats;
          return true;
        },
        scheduleSave: (stats) => {
          savedInMock = stats;
        },
        clear: () => {
          clearedMock = true;
          return true;
        },
        flush: () => true,
      };
    });

    it("initializes with clean session stats when storage is empty", () => {
      const manager = new StatsManager(mockIStatsStorage);
      const stats = manager.getStats();
      expect(stats.p1.kills).toBe(0);
      expect(stats.levelsCompleted).toBe(0);
    });

    it("records damage, kills and xp, triggering observer notifications", () => {
      const manager = new StatsManager(mockIStatsStorage);
      let notifiedCount = 0;
      const unsubscribe = manager.subscribe(() => {
        notifiedCount++;
      });

      manager.recordDamageDealt("player1", 45, "solar_rapier");
      expect(manager.getStats().p1.damageDealt).toBe(45);
      expect(manager.getStats().p1.damageByWeaponOrSpell.solar_rapier).toBe(45);

      manager.recordKill("player1", "crawler_1");
      expect(manager.getStats().p1.kills).toBe(1);
      expect(manager.getStats().p1.xpEarned).toBe(150);
      expect(manager.getStats().p1.killsByEnemyType.crawler).toBe(1);
      expect(notifiedCount).toBe(1); // recordKill notifies

      manager.addXp("player1", 100);
      expect(manager.getStats().p1.xpEarned).toBe(250);
      expect(notifiedCount).toBe(2);

      unsubscribe();
      manager.addXp("player1", 50);
      expect(notifiedCount).toBe(2); // no notification after unsubscribe
    });

    it("records player 2 statistics accurately", () => {
      const manager = new StatsManager(mockIStatsStorage);

      manager.recordDamageDealt("player2", 80, "frost_rapier");
      manager.recordDamageTaken("player2", 30);
      manager.recordKill("player2", "gargoyle_1");

      const stats = manager.getStats();
      expect(stats.p2.damageDealt).toBe(80);
      expect(stats.p2.damageByWeaponOrSpell.frost_rapier).toBe(80);
      expect(stats.p2.damageTaken).toBe(30);
      expect(stats.p2.kills).toBe(1);
      expect(stats.p2.killsByEnemyType.gargoyle).toBe(1);

      // P1 remains unaffected
      expect(stats.p1.damageDealt).toBe(0);
      expect(stats.p1.kills).toBe(0);
    });

    it("records potion consumption by type", () => {
      const manager = new StatsManager(mockIStatsStorage);

      manager.recordPotionUsed("player1", "health");
      manager.recordPotionUsed("player1", "health");
      manager.recordPotionUsed("player1", "mana");

      const p1 = manager.getStats().p1;
      expect(p1.potionsDrunkTotal).toBe(3);
      expect(p1.potionsByType.health).toBe(2);
      expect(p1.potionsByType.mana).toBe(1);
      expect(p1.potionsByType.stamina).toBe(0);
    });

    it("clears stats and resets storage on reset()", () => {
      const manager = new StatsManager(mockIStatsStorage);
      manager.recordKill("player1", "automaton_1");
      expect(manager.getStats().p1.kills).toBe(1);

      manager.reset();
      expect(clearedMock).toBe(true);
      expect(manager.getStats().p1.kills).toBe(0);
    });
  });
});
