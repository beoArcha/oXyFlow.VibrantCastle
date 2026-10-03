import { describe, it, expect } from "bun:test";
import {
  formatPlayTime,
  resolveWeaponOrSpellName,
  createStatsViewModel,
  getCurrentStats,
  resetGameStats,
} from "../statsAdapter";
import { createInitialPlayerStats, type GameSessionStats } from "@game/logic/stats";

describe("statsAdapter Unit Tests", () => {
  const mockTranslate = (key: string): string => {
    const dict: Record<string, string> = {
      hoursUnit: "godz.",
      minutesUnit: "min",
      secondsUnit: "s",
      itemSolarRapierName: "Słoneczny Rapier",
      itemFrostRapierName: "Mroźny Rapier",
      itemAetherStaffName: "Laska Aetheru",
      spellFireballName: "Kula Ognia",
    };
    return dict[key] || key;
  };

  describe("formatPlayTime", () => {
    it("formats seconds only when duration < 60s", () => {
      expect(formatPlayTime(42, mockTranslate)).toBe("42 s");
    });

    it("formats minutes and seconds when 60s <= duration < 3600s", () => {
      expect(formatPlayTime(125, mockTranslate)).toBe("2 min 5 s");
    });

    it("formats hours, minutes, and seconds when duration >= 3600s", () => {
      expect(formatPlayTime(3665, mockTranslate)).toBe("1 godz. 1 min 5 s");
    });

    it("handles zero and negative values safely", () => {
      expect(formatPlayTime(0, mockTranslate)).toBe("0 s");
      expect(formatPlayTime(-10, mockTranslate)).toBe("0 s");
    });
  });

  describe("resolveWeaponOrSpellName", () => {
    it("resolves hardcoded fallback keys", () => {
      expect(resolveWeaponOrSpellName("solar_rapier", mockTranslate)).toBe(
        "Słoneczny Rapier"
      );
      expect(resolveWeaponOrSpellName("frost_rapier", mockTranslate)).toBe(
        "Mroźny Rapier"
      );
      expect(resolveWeaponOrSpellName("aether_staff", mockTranslate)).toBe(
        "Laska Aetheru"
      );
    });

    it("returns raw key if not registered", () => {
      expect(resolveWeaponOrSpellName("mysterious_wand", mockTranslate)).toBe(
        "mysterious_wand"
      );
    });
  });

  describe("createStatsViewModel", () => {
    const createMockSessionStats = (): GameSessionStats => {
      const p1 = createInitialPlayerStats();
      p1.kills = 12;
      p1.damageDealt = 1200;
      p1.damageTaken = 300;
      p1.swordStrikes = 45;
      p1.spellsCast = 10;
      p1.potionsDrunkTotal = 4;
      p1.potionsByType = { health: 2, mana: 1, stamina: 1 };
      p1.killsByEnemyType = { dummy: 5, automaton: 3, gargoyle: 2, crawler: 2, other: 0 };
      p1.damageByWeaponOrSpell = {
        solar_rapier: 800,
        solar_fireball: 400,
        frost_rapier: 0,
        aether_staff: 0,
        aether_bolt: 0,
        emerald_barrage: 0,
        sentinel_spark: 0,
        other: 0,
      };

      const p2 = createInitialPlayerStats();
      p2.kills = 8;
      p2.damageDealt = 800;
      p2.damageTaken = 150;
      p2.swordStrikes = 20;
      p2.spellsCast = 30;
      p2.potionsDrunkTotal = 2;
      p2.potionsByType = { health: 1, mana: 1, stamina: 0 };
      p2.killsByEnemyType = { dummy: 2, automaton: 2, gargoyle: 2, crawler: 2, other: 0 };
      p2.damageByWeaponOrSpell = {
        aether_staff: 800,
        solar_rapier: 0,
        frost_rapier: 0,
        aether_bolt: 0,
        solar_fireball: 0,
        emerald_barrage: 0,
        sentinel_spark: 0,
        other: 0,
      };

      return {
        sessionStartTime: Date.now() - 50000,
        totalPlayTimeSeconds: 50,
        levelsCompleted: 1,
        leversPulled: 3,
        p1,
        p2,
      };
    };

    it("creates accurate ViewModel in 1P mode", () => {
      const stats = createMockSessionStats();
      const vm = createStatsViewModel(stats, false, 250, 0, mockTranslate);

      expect(vm.sessionSummary.totalKills).toBe(12);
      expect(vm.sessionSummary.totalDamageDealt).toBe(1200);
      expect(vm.sessionSummary.totalPotionsConsumed).toBe(4);
      expect(vm.sessionSummary.leversPulled).toBe(3);
      expect(vm.p1Stats.score).toBe(250);
      expect(vm.p2Stats).toBeUndefined();

      expect(vm.killsBreakdown.dummy).toBe(5);
      expect(vm.killsBreakdown.automaton).toBe(3);
      expect(vm.killsBreakdown.gargoyle).toBe(2);
      expect(vm.killsBreakdown.crawler).toBe(2);

      expect(vm.potionsBreakdown.health).toBe(2);
      expect(vm.potionsBreakdown.mana).toBe(1);
      expect(vm.potionsBreakdown.stamina).toBe(1);

      expect(vm.weaponsEfficacy.items.length).toBe(2);
      expect(vm.weaponsEfficacy.bestWeaponName).toBe("Słoneczny Rapier");
    });

    it("aggregates P1 and P2 metrics accurately in 2P mode", () => {
      const stats = createMockSessionStats();
      const vm = createStatsViewModel(stats, true, 250, 180, mockTranslate);

      expect(vm.sessionSummary.totalKills).toBe(20);
      expect(vm.sessionSummary.totalDamageDealt).toBe(2000);
      expect(vm.sessionSummary.totalPotionsConsumed).toBe(6);
      expect(vm.p1Stats.score).toBe(250);
      expect(vm.p2Stats).toBeDefined();
      expect(vm.p2Stats?.score).toBe(180);
      expect(vm.p2Stats?.kills).toBe(8);

      expect(vm.killsBreakdown.dummy).toBe(7);
      expect(vm.killsBreakdown.automaton).toBe(5);
      expect(vm.killsBreakdown.gargoyle).toBe(4);
      expect(vm.killsBreakdown.crawler).toBe(4);

      expect(vm.potionsBreakdown.health).toBe(3);
      expect(vm.potionsBreakdown.mana).toBe(2);
      expect(vm.potionsBreakdown.stamina).toBe(1);

      expect(vm.weaponsEfficacy.items.length).toBe(3);
    });

    it("safely handles zero damage without NaN in percentage calculations", () => {
      const stats = createMockSessionStats();
      stats.p1.damageDealt = 0;
      stats.p1.damageByWeaponOrSpell = {
        solar_rapier: 0,
        frost_rapier: 0,
        aether_staff: 0,
        aether_bolt: 0,
        solar_fireball: 0,
        emerald_barrage: 0,
        sentinel_spark: 0,
        other: 0,
      };

      const vm = createStatsViewModel(stats, false, 0, 0, mockTranslate);
      expect(vm.sessionSummary.totalDamageDealt).toBe(0);
      expect(vm.weaponsEfficacy.items.length).toBe(0);
      expect(vm.weaponsEfficacy.bestWeaponName).toBeUndefined();
    });
  });

  describe("Lifecycle and persistence helpers", () => {
    it("retrieves current stats and resets stats safely", () => {
      const stats = getCurrentStats();
      expect(stats).toBeDefined();
      expect(stats.p1).toBeDefined();

      const resetStats = resetGameStats();
      expect(resetStats).toBeDefined();
    });
  });
});
