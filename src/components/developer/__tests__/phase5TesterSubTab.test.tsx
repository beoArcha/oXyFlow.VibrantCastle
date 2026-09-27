import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { TesterSubTab } from "../subtabs/TesterSubTab";
import {
  TesterTeleportCard,
  TesterCheatsCard,
  TesterInventoryCard,
  TesterCombatCard,
  TesterTimeAndDiagnosticsCard,
  TesterParallaxCard,
  LOCATION_IDS,
  MONSTER_ID_LIST,
} from "../subtabs/tester";
import { LoggerManager, LogLevel } from "../../../lib/logger";
import { TestProviders } from "../../../test-utils";

describe("Phase 5.3: TesterSubTab & Interaction Domain Cards Suite", () => {
  beforeEach(() => {
    LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
  });

  afterEach(() => {
    LoggerManager.resetInstance();
  });

  describe("1. TesterSubTab Orchestrator Rendering", () => {
    it("renders the tester subtab container with all domain cards without crashing", () => {
      const html = renderToString(
        <TestProviders>
          <TesterSubTab />
        </TestProviders>
      );

      expect(html).toContain("subtab-content-tester");
    });
  });

  describe("2. Individual Tester Cards Verification", () => {
    it("renders TesterTeleportCard with predefined location options", () => {
      const onLoadLocation = () => {};
      const onToggleClickToTeleport = () => {};

      const html = renderToString(
        <TestProviders>
          <TesterTeleportCard
            currentLocationId="courtyard"
            playerX={150}
            playerY={250}
            onLoadLocation={onLoadLocation}
            clickToTeleport={false}
            onToggleClickToTeleport={onToggleClickToTeleport}
          />
        </TestProviders>
      );

      expect(html).toContain("courtyard");
      expect(html).toContain("150");
      expect(html).toContain("250");
      expect(LOCATION_IDS.length).toBe(5);
    });

    it("renders TesterCheatsCard with toggleable cheat statuses", () => {
      const html = renderToString(
        <TestProviders>
          <TesterCheatsCard
            godMode={true}
            infiniteMana={true}
            infiniteStamina={false}
            noClip={false}
            onToggleGodMode={() => {}}
            onToggleInfiniteMana={() => {}}
            onToggleInfiniteStamina={() => {}}
            onToggleNoClip={() => {}}
            onSetPlayerHp={() => {}}
            onRefillVitals={() => {}}
          />
        </TestProviders>
      );

      expect(html).toContain("God Mode");
      expect(html).toContain("Niesk. Mana");
      expect(html).toContain("No-Clip");
    });

    it("renders TesterInventoryCard with economy and equipment actions", () => {
      const html = renderToString(
        <TestProviders>
          <TesterInventoryCard
            onGiveAllWeapons={() => {}}
            onUnlockAllSkills={() => {}}
            onGivePotions={() => {}}
            onClearInventory={() => {}}
            onAddGold={() => {}}
          />
        </TestProviders>
      );

      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(100);
    });

    it("renders TesterCombatCard with monster spawn options and kill button", () => {
      const onKillAllEnemies = () => {};
      const onSpawnMonster = () => {};

      const html = renderToString(
        <TestProviders>
          <TesterCombatCard
            freezeAI={false}
            onToggleFreezeAI={() => {}}
            onKillAllEnemies={onKillAllEnemies}
            onForceVictory={() => {}}
            onForceDefeat={() => {}}
            onSpawnEnemy={onSpawnMonster}
          />
        </TestProviders>
      );

      for (const item of MONSTER_ID_LIST) {
        expect(html).toContain(item.id);
      }
    });

    it("renders TesterTimeAndDiagnosticsCard with simulation rate multipliers", () => {
      const html = renderToString(
        <TestProviders>
          <TesterTimeAndDiagnosticsCard
            timeScale={1.0}
            showHitboxes={true}
            showProfiler={false}
            onSetTimeScale={() => {}}
            onStepSingleFrame={() => {}}
            onToggleHitboxes={() => {}}
            onToggleProfiler={() => {}}
          />
        </TestProviders>
      );

      expect(html).toContain("0.5x");
      expect(html).toContain("2x");
      expect(html).toContain("4x");
    });

    it("renders TesterParallaxCard with parallax layers and toggles", () => {
      const html = renderToString(
        <TestProviders>
          <TesterParallaxCard
            parallaxTiers={{
              far: true,
              mid_far: true,
              mid: true,
              mid_close: false,
              close: true,
            }}
            onToggleParallaxTier={() => {}}
            onSetMusicIntensity={() => {}}
            onTriggerParticleBurst={() => {}}
          />
        </TestProviders>
      );

      expect(html).toContain("FAR");
      expect(html).toContain("MID");
      expect(html).toBeDefined();
    });
  });
});

