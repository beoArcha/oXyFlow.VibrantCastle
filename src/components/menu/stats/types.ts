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
