import {
  GameSessionStats,
  PlayerPerformanceStats,
  IStatsStorage,
  IStatsStorageProvider,
  createInitialSessionStats,
} from "./statsTypes";
import { statsLogger } from "@game/logger/gameLogger";
import { ILogger } from "@lib/logger";

function sanitizeNumber(val: unknown, fallback: number = 0): number {
  return typeof val === "number" && Number.isFinite(val) ? val : fallback;
}

function sanitizePlayerStats(
  saved: Partial<PlayerPerformanceStats> | undefined,
  initial: PlayerPerformanceStats
): PlayerPerformanceStats {
  if (!saved || typeof saved !== "object") return initial;

  return {
    kills: sanitizeNumber(saved.kills, initial.kills),
    damageDealt: sanitizeNumber(saved.damageDealt, initial.damageDealt),
    damageTaken: sanitizeNumber(saved.damageTaken, initial.damageTaken),
    xpEarned: sanitizeNumber(saved.xpEarned, initial.xpEarned),
    swordStrikes: sanitizeNumber(saved.swordStrikes, initial.swordStrikes),
    spellsCast: sanitizeNumber(saved.spellsCast, initial.spellsCast),
    potionsDrunkTotal: sanitizeNumber(saved.potionsDrunkTotal, initial.potionsDrunkTotal),
    potionsByType: {
      health: sanitizeNumber(saved.potionsByType?.health, initial.potionsByType.health),
      mana: sanitizeNumber(saved.potionsByType?.mana, initial.potionsByType.mana),
      stamina: sanitizeNumber(saved.potionsByType?.stamina, initial.potionsByType.stamina),
    },
    killsByEnemyType: {
      dummy: sanitizeNumber(saved.killsByEnemyType?.dummy, initial.killsByEnemyType.dummy),
      automaton: sanitizeNumber(saved.killsByEnemyType?.automaton, initial.killsByEnemyType.automaton),
      gargoyle: sanitizeNumber(saved.killsByEnemyType?.gargoyle, initial.killsByEnemyType.gargoyle),
      crawler: sanitizeNumber(saved.killsByEnemyType?.crawler, initial.killsByEnemyType.crawler),
      other: sanitizeNumber(saved.killsByEnemyType?.other, initial.killsByEnemyType.other),
    },
    damageByWeaponOrSpell: {
      solar_rapier: sanitizeNumber(saved.damageByWeaponOrSpell?.solar_rapier, initial.damageByWeaponOrSpell.solar_rapier),
      frost_rapier: sanitizeNumber(saved.damageByWeaponOrSpell?.frost_rapier, initial.damageByWeaponOrSpell.frost_rapier),
      aether_staff: sanitizeNumber(saved.damageByWeaponOrSpell?.aether_staff, initial.damageByWeaponOrSpell.aether_staff),
      aether_bolt: sanitizeNumber(saved.damageByWeaponOrSpell?.aether_bolt, initial.damageByWeaponOrSpell.aether_bolt),
      solar_fireball: sanitizeNumber(saved.damageByWeaponOrSpell?.solar_fireball, initial.damageByWeaponOrSpell.solar_fireball),
      emerald_barrage: sanitizeNumber(saved.damageByWeaponOrSpell?.emerald_barrage, initial.damageByWeaponOrSpell.emerald_barrage),
      sentinel_spark: sanitizeNumber(saved.damageByWeaponOrSpell?.sentinel_spark, initial.damageByWeaponOrSpell.sentinel_spark),
      other: sanitizeNumber(saved.damageByWeaponOrSpell?.other, initial.damageByWeaponOrSpell.other),
    },
  };
}

export function sanitizeSessionStats(saved: Partial<GameSessionStats> | undefined): GameSessionStats {
  const initial = createInitialSessionStats();
  if (!saved || typeof saved !== "object") return initial;

  return {
    sessionStartTime: sanitizeNumber(saved.sessionStartTime, initial.sessionStartTime),
    totalPlayTimeSeconds: sanitizeNumber(saved.totalPlayTimeSeconds, initial.totalPlayTimeSeconds),
    levelsCompleted: sanitizeNumber(saved.levelsCompleted, initial.levelsCompleted),
    leversPulled: sanitizeNumber(saved.leversPulled, initial.leversPulled),
    p1: sanitizePlayerStats(saved.p1, initial.p1),
    p2: sanitizePlayerStats(saved.p2, initial.p2),
  };
}

export class StatsStorage implements IStatsStorage {
  public static readonly STORAGE_KEY = "vibrant_castle_stats_v1";

  private lastSaveTime: number = 0;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingStats: GameSessionStats | null = null;
  private readonly customStorage?: IStatsStorageProvider;

  constructor(
    storage?: IStatsStorageProvider,
    private readonly logger: ILogger = statsLogger
  ) {
    this.customStorage = storage;
  }

  private getStorage(): IStatsStorageProvider {
    if (this.customStorage) {
      return this.customStorage;
    }
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
    return { getItem: () => null, setItem: () => { }, removeItem: () => { } };
  }

  public load(): GameSessionStats | null {
    try {
      const raw = this.getStorage().getItem(StatsStorage.STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return sanitizeSessionStats(parsed);
      }
    } catch (e) {
      this.logger.warn(
        "Failed to load game statistics from localStorage:",
        { storageKey: StatsStorage.STORAGE_KEY },
        e
      );
    }
    return null;
  }

  public save(stats: GameSessionStats): boolean {
    try {
      this.getStorage().setItem(StatsStorage.STORAGE_KEY, JSON.stringify(stats));
      this.lastSaveTime = Date.now();
      if (this.saveTimeout !== null) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      this.pendingStats = null;
      return true;
    } catch (e) {
      this.logger.error(
        "Failed to save game statistics to localStorage:",
        { storageKey: StatsStorage.STORAGE_KEY },
        e
      );
      return false;
    }
  }

  public scheduleSave(stats: GameSessionStats, throttleMs: number = 2000): void {
    this.pendingStats = stats;
    const now = Date.now();
    if (now - this.lastSaveTime >= throttleMs) {
      this.save(stats);
    } else if (this.saveTimeout === null) {
      this.saveTimeout = setTimeout(() => {
        this.flush();
      }, throttleMs);
    }
  }

  public flush(): boolean {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    if (this.pendingStats) {
      return this.save(this.pendingStats);
    }
    return true;
  }

  public clear(): boolean {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.pendingStats = null;
    try {
      this.getStorage().removeItem(StatsStorage.STORAGE_KEY);
      return true;
    } catch (e) {
      this.logger.error(
        "Failed to remove game statistics from localStorage:",
        { storageKey: StatsStorage.STORAGE_KEY },
        e
      );
      return false;
    }
  }
}

export const defaultStatsStorage: IStatsStorage = new StatsStorage();
