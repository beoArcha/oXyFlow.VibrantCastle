import { statsManager, type GameSessionStats } from "@game/logic/stats";
import { ITEM_REGISTRY } from "@game/logic/inventory";
import { SPELL_REGISTRY } from "@game/logic/magic";

export interface SessionSummaryVM {
  readonly formattedPlayTime: string;
  readonly totalKills: number;
  readonly totalDamageDealt: number;
  readonly totalPotionsConsumed: number;
  readonly leversPulled: number;
}

export interface PlayerStatsVM {
  readonly score: number;
  readonly kills: number;
  readonly damageDealt: number;
  readonly damageTaken: number;
  readonly swordStrikes: number;
  readonly spellsCast: number;
  readonly potionsDrunkTotal: number;
}

export interface KillsBreakdownVM {
  readonly dummy: number;
  readonly automaton: number;
  readonly gargoyle: number;
  readonly crawler: number;
  readonly totalKills: number;
}

export interface PotionsBreakdownVM {
  readonly health: number;
  readonly mana: number;
  readonly stamina: number;
  readonly totalPotions: number;
}

export interface WeaponEfficacyItemVM {
  readonly key: string;
  readonly name: string;
  readonly damage: number;
  readonly percentage: number;
}

export interface WeaponEfficacyVM {
  readonly items: readonly WeaponEfficacyItemVM[];
  readonly bestWeaponName?: string;
  readonly totalDamageDealt: number;
}

export interface StatsViewModel {
  readonly sessionSummary: SessionSummaryVM;
  readonly p1Stats: PlayerStatsVM;
  readonly p2Stats?: PlayerStatsVM;
  readonly killsBreakdown: KillsBreakdownVM;
  readonly potionsBreakdown: PotionsBreakdownVM;
  readonly weaponsEfficacy: WeaponEfficacyVM;
}

/**
 * Formats play duration in seconds into localized human-readable time string.
 */
export function formatPlayTime(
  totalSeconds: number,
  t: (key: string) => string
): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours} ${t("hoursUnit")} ${minutes} ${t("minutesUnit")} ${seconds} ${t("secondsUnit")}`;
  }
  if (minutes > 0) {
    return `${minutes} ${t("minutesUnit")} ${seconds} ${t("secondsUnit")}`;
  }
  return `${seconds} ${t("secondsUnit")}`;
}

/**
 * Resolves item or spell registry display name safely with fallback.
 */
export function resolveWeaponOrSpellName(
  key: string,
  t: (key: string) => string
): string {
  if (ITEM_REGISTRY[key]) {
    return t(ITEM_REGISTRY[key].nameKey);
  }
  if (SPELL_REGISTRY[key]) {
    return t(SPELL_REGISTRY[key].nameKey);
  }
  if (key === "solar_rapier") return t("itemSolarRapierName");
  if (key === "frost_rapier") return t("itemFrostRapierName");
  if (key === "aether_staff") return t("itemAetherStaffName");
  return key;
}

/**
 * Transforms raw GameSessionStats snapshot into a pure UI StatsViewModel.
 */
export function createStatsViewModel(
  stats: GameSessionStats,
  isTwoPlayer: boolean,
  p1Score: number,
  p2Score: number,
  t: (key: string) => string
): StatsViewModel {
  const p1 = stats.p1;
  const p2 = stats.p2;

  const totalKills = p1.kills + (isTwoPlayer ? p2.kills : 0);
  const totalDamageDealt = p1.damageDealt + (isTwoPlayer ? p2.damageDealt : 0);
  const totalPotionsConsumed =
    p1.potionsDrunkTotal + (isTwoPlayer ? p2.potionsDrunkTotal : 0);

  const sessionSummary: SessionSummaryVM = {
    formattedPlayTime: formatPlayTime(stats.totalPlayTimeSeconds, t),
    totalKills,
    totalDamageDealt: Math.round(totalDamageDealt),
    totalPotionsConsumed,
    leversPulled: stats.leversPulled,
  };

  const p1Stats: PlayerStatsVM = {
    score: p1Score,
    kills: p1.kills,
    damageDealt: Math.round(p1.damageDealt),
    damageTaken: Math.round(p1.damageTaken),
    swordStrikes: p1.swordStrikes,
    spellsCast: p1.spellsCast,
    potionsDrunkTotal: p1.potionsDrunkTotal,
  };

  const p2Stats: PlayerStatsVM | undefined = isTwoPlayer
    ? {
        score: p2Score,
        kills: p2.kills,
        damageDealt: Math.round(p2.damageDealt),
        damageTaken: Math.round(p2.damageTaken),
        swordStrikes: p2.swordStrikes,
        spellsCast: p2.spellsCast,
        potionsDrunkTotal: p2.potionsDrunkTotal,
      }
    : undefined;

  const killsBreakdown: KillsBreakdownVM = {
    dummy: p1.killsByEnemyType.dummy + (isTwoPlayer ? p2.killsByEnemyType.dummy : 0),
    automaton:
      p1.killsByEnemyType.automaton + (isTwoPlayer ? p2.killsByEnemyType.automaton : 0),
    gargoyle:
      p1.killsByEnemyType.gargoyle + (isTwoPlayer ? p2.killsByEnemyType.gargoyle : 0),
    crawler:
      p1.killsByEnemyType.crawler + (isTwoPlayer ? p2.killsByEnemyType.crawler : 0),
    totalKills,
  };

  const potionsBreakdown: PotionsBreakdownVM = {
    health:
      p1.potionsByType.health + (isTwoPlayer ? p2.potionsByType.health : 0),
    mana: p1.potionsByType.mana + (isTwoPlayer ? p2.potionsByType.mana : 0),
    stamina:
      p1.potionsByType.stamina + (isTwoPlayer ? p2.potionsByType.stamina : 0),
    totalPotions: totalPotionsConsumed,
  };

  // Combine damage by source across players
  const combinedDamageBySource: Record<string, number> = {};
  const activePlayers = isTwoPlayer ? [p1, p2] : [p1];

  activePlayers.forEach((player) => {
    Object.entries(player.damageByWeaponOrSpell || {}).forEach(([src, dmg]) => {
      const numDmg = typeof dmg === "number" && !isNaN(dmg) ? dmg : 0;
      if (numDmg > 0) {
        combinedDamageBySource[src] = (combinedDamageBySource[src] || 0) + numDmg;
      }
    });
  });

  const damageEntries = Object.entries(combinedDamageBySource).sort(
    (a, b) => b[1] - a[1]
  );

  const bestEntry = damageEntries[0];
  const bestWeaponName = bestEntry
    ? resolveWeaponOrSpellName(bestEntry[0], t)
    : undefined;

  const safeTotalDamage = Math.max(1, totalDamageDealt);
  const items: WeaponEfficacyItemVM[] = damageEntries.map(([key, dmg]) => ({
    key,
    name: resolveWeaponOrSpellName(key, t),
    damage: Math.round(dmg),
    percentage: Math.min(100, Math.round((dmg / safeTotalDamage) * 100)),
  }));

  const weaponsEfficacy: WeaponEfficacyVM = {
    items,
    bestWeaponName,
    totalDamageDealt: Math.round(totalDamageDealt),
  };

  return {
    sessionSummary,
    p1Stats,
    p2Stats,
    killsBreakdown,
    potionsBreakdown,
    weaponsEfficacy,
  };
}

/**
 * Reads current stats from domain singleton without exposing domain directly to UI.
 */
export function getCurrentStats(): GameSessionStats {
  return statsManager.getStats();
}

/**
 * Subscribes to live stats changes.
 */
export function subscribeToStats(callback: () => void): () => void {
  return statsManager.subscribe(callback);
}

/**
 * Clears local storage stats and returns refreshed initial state.
 */
export function resetGameStats(): GameSessionStats {
  statsManager.clearLocalStorage();
  return statsManager.getStats();
}
