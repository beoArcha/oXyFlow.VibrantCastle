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
import { TestProviders, setupDomEnvironment, renderIntoDom, cleanupDom } from "../../../test-utils";

describe("TesterSubTab & Interaction Domain Cards", () => {
  beforeEach(() => {
    setupDomEnvironment();
    LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
  });

  afterEach(async () => {
    await cleanupDom();
    LoggerManager.resetInstance();
  });

  describe("TesterSubTab Orchestrator Rendering", () => {
    it("renders the tester subtab container with all domain cards without crashing", () => {
      const html = renderToString(
        <TestProviders>
          <TesterSubTab />
        </TestProviders>
      );

      expect(html).toContain("subtab-content-tester");
    });
  });

  describe("Individual Tester Cards Verification", () => {
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

  describe("Interactive Card Behaviors & Callbacks", () => {
    it("dispatches cheat toggle and vitals callbacks on user clicks", async () => {
      let godModeToggled = false;
      let hpSet: number | null = null;
      let vitalsRefilled = false;

      const { container, click } = await renderIntoDom(
        <TesterCheatsCard
          godMode={false}
          infiniteMana={false}
          infiniteStamina={false}
          noClip={false}
          onToggleGodMode={() => { godModeToggled = true; }}
          onToggleInfiniteMana={() => {}}
          onToggleInfiniteStamina={() => {}}
          onToggleNoClip={() => {}}
          onSetPlayerHp={(val) => { hpSet = val; }}
          onRefillVitals={() => { vitalsRefilled = true; }}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));

      const godModeBtn = buttons.find((b) => b.textContent?.includes("God Mode"));
      expect(godModeBtn).toBeDefined();
      if (godModeBtn) await click(godModeBtn);
      expect(godModeToggled).toBe(true);

      const hp1Btn = buttons.find((b) => b.textContent?.includes("1 HP"));
      expect(hp1Btn).toBeDefined();
      if (hp1Btn) await click(hp1Btn);
      expect(hpSet).toBe(1);

      const refillBtn = buttons.find((b) => b.textContent?.includes("100%") || b.textContent?.includes("HP/MP/SP"));
      expect(refillBtn).toBeDefined();
      if (refillBtn) await click(refillBtn);
      expect(vitalsRefilled).toBe(true);
    });

    it("dispatches combat actions and spawns selected monster type", async () => {
      let enemiesKilled = false;
      let aiFrozen = false;
      let spawnedMonster: string | null = null;

      const { container, click, changeSelect } = await renderIntoDom(
        <TesterCombatCard
          freezeAI={false}
          onToggleFreezeAI={() => { aiFrozen = true; }}
          onKillAllEnemies={() => { enemiesKilled = true; }}
          onForceVictory={() => {}}
          onForceDefeat={() => {}}
          onSpawnEnemy={(enemyId) => { spawnedMonster = enemyId; }}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));

      const killBtn = buttons.find((b) => b.textContent?.includes("Zabij") || b.textContent?.includes("Kill"));
      expect(killBtn).toBeDefined();
      if (killBtn) await click(killBtn);
      expect(enemiesKilled).toBe(true);

      const freezeBtn = buttons.find((b) => b.textContent?.includes("Zamroź") || b.textContent?.includes("Freeze"));
      expect(freezeBtn).toBeDefined();
      if (freezeBtn) await click(freezeBtn);
      expect(aiFrozen).toBe(true);

      const select = container.querySelector("select");
      expect(select).toBeDefined();
      if (select) {
        await changeSelect(select as HTMLSelectElement, "training_dummy");
      }

      const spawnBtn = buttons.find((b) => b.textContent?.includes("Przywołaj") || b.textContent?.includes("Spawn"));
      expect(spawnBtn).toBeDefined();
      if (spawnBtn) await click(spawnBtn);
      expect(spawnedMonster).toBe("training_dummy");
    });

    it("dispatches simulation speed changes on button click", async () => {
      let selectedScale: number | null = null;
      let frameStepped = false;

      const { container, click } = await renderIntoDom(
        <TesterTimeAndDiagnosticsCard
          timeScale={1.0}
          showHitboxes={false}
          showProfiler={false}
          onSetTimeScale={(s) => { selectedScale = s; }}
          onStepSingleFrame={() => { frameStepped = true; }}
          onToggleHitboxes={() => {}}
          onToggleProfiler={() => {}}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));

      const twoXBtn = buttons.find((b) => b.textContent?.trim() === "2x");
      expect(twoXBtn).toBeDefined();
      if (twoXBtn) await click(twoXBtn);
      expect(selectedScale).toBe(2.0);

      const stepBtn = buttons.find((b) => b.textContent?.includes("Klatka") || b.textContent?.includes("Step"));
      expect(stepBtn).toBeDefined();
      if (stepBtn) await click(stepBtn);
      expect(frameStepped).toBe(true);
    });
  });
});
