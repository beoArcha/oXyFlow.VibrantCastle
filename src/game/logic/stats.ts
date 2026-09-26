import { PlayerId } from "../types";
import { statsLogger } from "../logger/gameLogger";

/**
 * Detailed per-player combat and gameplay performance metrics.
 */
export interface PlayerPerformanceStats {
  kills: number;
  damageDealt: number;
  damageTaken: number;
  xpEarned: number; // Skill points & score progression
  swordStrikes: number;
  spellsCast: number;
  potionsDrunkTotal: number;
  potionsByType: {
    health: number;
    mana: number;
    stamina: number;
  };
  killsByEnemyType: {
    dummy: number;
    automaton: number;
    gargoyle: number;
    crawler: number;
    other: number;
  };
  damageByWeaponOrSpell: {
    solar_rapier: number;
    frost_rapier: number;
    aether_staff: number;
    aether_bolt: number;
    solar_fireball: number;
    emerald_barrage: number;
    sentinel_spark: number;
    other: number;
  };
}

/**
 * Global game session analytics and lifetime tracking.
 */
export interface GameSessionStats {
  sessionStartTime: number; // timestamp in ms
  totalPlayTimeSeconds: number; // active gameplay seconds
  levelsCompleted: number;
  leversPulled: number;
  p1: PlayerPerformanceStats;
  p2: PlayerPerformanceStats;
}

export function createInitialPlayerStats(): PlayerPerformanceStats {
  return {
    kills: 0,
    damageDealt: 0,
    damageTaken: 0,
    xpEarned: 0,
    swordStrikes: 0,
    spellsCast: 0,
    potionsDrunkTotal: 0,
    potionsByType: {
      health: 0,
      mana: 0,
      stamina: 0,
    },
    killsByEnemyType: {
      dummy: 0,
      automaton: 0,
      gargoyle: 0,
      crawler: 0,
      other: 0,
    },
    damageByWeaponOrSpell: {
      solar_rapier: 0,
      frost_rapier: 0,
      aether_staff: 0,
      aether_bolt: 0,
      solar_fireball: 0,
      emerald_barrage: 0,
      sentinel_spark: 0,
      other: 0,
    },
  };
}

export function createInitialSessionStats(): GameSessionStats {
  return {
    sessionStartTime: Date.now(),
    totalPlayTimeSeconds: 0,
    levelsCompleted: 0,
    leversPulled: 0,
    p1: createInitialPlayerStats(),
    p2: createInitialPlayerStats(),
  };
}

/**
 * Class to manage, record, persist (via localStorage), and query game session statistics.
 */
export class StatsManager {
  public static readonly STORAGE_KEY = "vibrant_castle_stats_v1";

  private stats: GameSessionStats = createInitialSessionStats();
  private lastSaveTime: number = 0;
  private saveTimeout: number | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Subscribe to statistics state changes.
   */
  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        statsLogger.error("Error in stats subscriber:", { subscriberCount: this.listeners.size }, err);
      }
    });
  }

  /**
   * Load statistics from persistent browser localStorage.
   */
  public loadFromLocalStorage(): boolean {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }

    try {
      const raw = localStorage.getItem(StatsManager.STORAGE_KEY);
      if (!raw) return false;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        this.loadStats(parsed);
        return true;
      }
    } catch (e) {
      statsLogger.warn("Failed to load game statistics from localStorage:", { storageKey: StatsManager.STORAGE_KEY }, e);
    }
    return false;
  }

  /**
   * Immediately save statistics to persistent browser localStorage.
   */
  public saveToLocalStorage(): boolean {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }

    try {
      localStorage.setItem(StatsManager.STORAGE_KEY, JSON.stringify(this.stats));
      this.lastSaveTime = Date.now();
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      return true;
    } catch (e) {
      statsLogger.error("Failed to save game statistics to localStorage:", { storageKey: StatsManager.STORAGE_KEY }, e);
      return false;
    }
  }

  /**
   * Throttled save to prevent serialization overhead on high-frequency combat ticks.
   */
  private scheduleAutoSave(throttleMs: number = 2000) {
    const now = Date.now();
    if (now - this.lastSaveTime >= throttleMs) {
      this.saveToLocalStorage();
    } else if (!this.saveTimeout) {
      this.saveTimeout = window.setTimeout(() => {
        this.saveToLocalStorage();
      }, throttleMs);
    }
  }

  /**
   * Reset all statistics and clear persistent storage.
   */
  public clearLocalStorage() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.removeItem(StatsManager.STORAGE_KEY);
      } catch (e) {
        statsLogger.error("Failed to remove game statistics from localStorage:", { storageKey: StatsManager.STORAGE_KEY }, e);
      }
    }
    this.stats = createInitialSessionStats();
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  public getStats(): GameSessionStats {
    return this.stats;
  }

  public setStats(newStats: GameSessionStats) {
    this.stats = newStats;
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  public loadStats(savedStats: Partial<GameSessionStats>) {
    if (!savedStats) return;
    this.stats = {
      ...createInitialSessionStats(),
      ...savedStats,
      p1: {
        ...createInitialPlayerStats(),
        ...(savedStats.p1 || {}),
        potionsByType: {
          ...createInitialPlayerStats().potionsByType,
          ...(savedStats.p1?.potionsByType || {}),
        },
        killsByEnemyType: {
          ...createInitialPlayerStats().killsByEnemyType,
          ...(savedStats.p1?.killsByEnemyType || {}),
        },
        damageByWeaponOrSpell: {
          ...createInitialPlayerStats().damageByWeaponOrSpell,
          ...(savedStats.p1?.damageByWeaponOrSpell || {}),
        },
      },
      p2: {
        ...createInitialPlayerStats(),
        ...(savedStats.p2 || {}),
        potionsByType: {
          ...createInitialPlayerStats().potionsByType,
          ...(savedStats.p2?.potionsByType || {}),
        },
        killsByEnemyType: {
          ...createInitialPlayerStats().killsByEnemyType,
          ...(savedStats.p2?.killsByEnemyType || {}),
        },
        damageByWeaponOrSpell: {
          ...createInitialPlayerStats().damageByWeaponOrSpell,
          ...(savedStats.p2?.damageByWeaponOrSpell || {}),
        },
      },
    };
    this.notifyListeners();
  }

  public reset() {
    this.clearLocalStorage();
  }

  public addPlayTime(seconds: number) {
    this.stats.totalPlayTimeSeconds += seconds;
    this.scheduleAutoSave(5000);
  }

  public recordLevelCompleted() {
    this.stats.levelsCompleted += 1;
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  public recordLeverPulled() {
    this.stats.leversPulled += 1;
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  public addXp(playerId: PlayerId | string, xp: number) {
    const p = this.getPlayerStats(playerId);
    p.xpEarned += xp;
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  private getPlayerStats(playerId: PlayerId | string): PlayerPerformanceStats {
    return playerId === PlayerId.Player2 || playerId === "player2" ? this.stats.p2 : this.stats.p1;
  }

  public recordDamageDealt(
    playerId: PlayerId | string,
    damage: number,
    sourceKey: keyof PlayerPerformanceStats["damageByWeaponOrSpell"] | string = "other"
  ) {
    const p = this.getPlayerStats(playerId);
    p.damageDealt += damage;
    const typedKey = sourceKey as keyof PlayerPerformanceStats["damageByWeaponOrSpell"];
    if (p.damageByWeaponOrSpell[typedKey] !== undefined) {
      p.damageByWeaponOrSpell[typedKey] += damage;
    } else {
      p.damageByWeaponOrSpell.other += damage;
    }
    this.scheduleAutoSave(2500);
  }

  public recordDamageTaken(playerId: PlayerId | string, damage: number) {
    const p = this.getPlayerStats(playerId);
    p.damageTaken += damage;
    this.scheduleAutoSave(2500);
  }

  public recordKill(playerId: PlayerId | string, enemyId: string) {
    const p = this.getPlayerStats(playerId);
    p.kills += 1;
    p.xpEarned += 150;

    let category: "dummy" | "automaton" | "gargoyle" | "crawler" | "other" = "other";
    if (enemyId.includes("dummy")) category = "dummy";
    else if (enemyId.includes("automaton")) category = "automaton";
    else if (enemyId.includes("gargoyle")) category = "gargoyle";
    else if (enemyId.includes("crawler")) category = "crawler";

    p.killsByEnemyType[category] = (p.killsByEnemyType[category] || 0) + 1;
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  public recordSwordStrike(playerId: PlayerId | string) {
    const p = this.getPlayerStats(playerId);
    p.swordStrikes += 1;
    this.scheduleAutoSave(3000);
  }

  public recordSpellCast(playerId: PlayerId | string) {
    const p = this.getPlayerStats(playerId);
    p.spellsCast += 1;
    this.scheduleAutoSave(3000);
  }

  public recordPotionUsed(playerId: PlayerId | string, potionType: "health" | "mana" | "stamina") {
    const p = this.getPlayerStats(playerId);
    p.potionsDrunkTotal += 1;
    if (p.potionsByType[potionType] !== undefined) {
      p.potionsByType[potionType] += 1;
    }
    this.saveToLocalStorage();
    this.notifyListeners();
  }
}

export const statsManager = new StatsManager();
