import { PlayerId } from "../../types";
import { statsLogger } from "../../logger/gameLogger";
import {
  GameSessionStats,
  PlayerPerformanceStats,
  IStatsStorage,
  createInitialSessionStats,
} from "./statsTypes";
import {
  StatsStorage,
  defaultStatsStorage,
  sanitizeSessionStats,
} from "./statsStorage";

/**
 * Domain Service managing combat metrics, player performance, and session analytics.
 * Delegates storage persistence and debouncing to IStatsStorage via Dependency Injection.
 */
export class StatsManager {
  public static readonly STORAGE_KEY = StatsStorage.STORAGE_KEY;

  private stats: GameSessionStats;
  private readonly listeners: Set<() => void> = new Set();
  private readonly storage: IStatsStorage;

  constructor(storage: IStatsStorage = defaultStatsStorage) {
    this.storage = storage;
    const loaded = this.storage.load();
    this.stats = loaded ?? createInitialSessionStats();
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
   * Load statistics from persistent storage.
   */
  public loadFromLocalStorage(): boolean {
    const loaded = this.storage.load();
    if (loaded) {
      this.stats = loaded;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Immediately save statistics to persistent storage.
   */
  public saveToLocalStorage(): boolean {
    return this.storage.save(this.stats);
  }

  /**
   * Throttled save to prevent serialization overhead on high-frequency combat ticks.
   */
  private scheduleAutoSave(throttleMs: number = 2000) {
    this.storage.scheduleSave(this.stats, throttleMs);
  }

  /**
   * Reset all statistics and clear persistent storage.
   */
  public clearLocalStorage() {
    this.storage.clear();
    this.stats = createInitialSessionStats();
    this.storage.save(this.stats);
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
    this.stats = sanitizeSessionStats(savedStats);
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
