import { PlayerId } from "@game/types";

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

export interface IStatsStorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface IStatsStorage {
  load(): GameSessionStats | null;
  save(stats: GameSessionStats): boolean;
  scheduleSave(stats: GameSessionStats, throttleMs?: number): void;
  clear(): boolean;
  flush(): boolean;
}
