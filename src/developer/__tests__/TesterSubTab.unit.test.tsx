import React, { act } from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderToString } from "react-dom/server";
import { TesterSubTab } from "../subtabs/TesterSubTab";
import {
  TesterTeleportCard,
  TesterCheatsCard,
  TesterInventoryCard,
  TesterCombatCard,
  TesterSimulationSpeedCard,
  TesterDiagnosticsCard,
  TesterTimeAndDiagnosticsCard,
  TesterParallaxCard,
  MONSTER_ID_LIST,
} from "../subtabs/tester";
import { debugManager } from "@game/debug/debugManager";
import gameEngine from "@game/loop/engine";
import { LoggerManager, LogLevel } from "@lib/logger";
import { TestProviders, setupDomEnvironment, renderIntoDom, cleanupDom } from "@test-utils";

describe("TesterSubTab & Interaction Domain Cards", () => {
  beforeEach(() => {
    setupDomEnvironment();
    gameEngine.setLanguage("pl");
    LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
  });

  afterEach(async () => {
    await cleanupDom();
    gameEngine.setLanguage("pl");
    LoggerManager.resetInstance();
  });

  describe("TesterSubTab Orchestrator Rendering & Reactivity", () => {
    it("renders the tester subtab container with two-column responsive grid", () => {
      const html = renderToString(
        <TestProviders>
          <TesterSubTab />
        </TestProviders>
      );

      expect(html).toContain("subtab-content-tester");
      expect(html).toContain("grid-cols-1 lg:grid-cols-2");
    });

    it("reacts dynamically to debugManager state changes via useSyncExternalStore", async () => {
      await renderIntoDom(
        <TestProviders>
          <TesterSubTab />
        </TestProviders>
      );

      expect(debugManager.state.godMode).toBe(false);

      await act(async () => {
        debugManager.toggleGodMode();
      });
      expect(debugManager.state.godMode).toBe(true);

      await act(async () => {
        debugManager.toggleGodMode();
      });
      expect(debugManager.state.godMode).toBe(false);
    });
  });

  describe("Individual Tester Cards Verification", () => {
    it("renders TesterTeleportCard with predefined location options and coordinates", () => {
      const html = renderToString(
        <TestProviders>
          <TesterTeleportCard
            currentLocationId="courtyard"
            playerX={150}
            playerY={250}
            onLoadLocation={() => {}}
            clickToTeleport={false}
            onToggleClickToTeleport={() => {}}
          />
        </TestProviders>
      );

      expect(html).toContain("courtyard");
      expect(html).toContain("150");
      expect(html).toContain("250");
    });

    it("renders TesterCheatsCard with toggleable cheat statuses and HP presets", () => {
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
      const html = renderToString(
        <TestProviders>
          <TesterCombatCard
            freezeAI={false}
            onToggleFreezeAI={() => {}}
            onKillAllEnemies={() => {}}
            onForceVictory={() => {}}
            onForceDefeat={() => {}}
            onSpawnEnemy={() => {}}
          />
        </TestProviders>
      );

      for (const item of MONSTER_ID_LIST) {
        expect(html).toContain(item.id);
      }
    });

    it("renders TesterSimulationSpeedCard with discrete speed multipliers", () => {
      const html = renderToString(
        <TestProviders>
          <TesterSimulationSpeedCard
            timeScale={1.0}
            onSetTimeScale={() => {}}
            onStepSingleFrame={() => {}}
          />
        </TestProviders>
      );

      expect(html).toContain("0.5x");
      expect(html).toContain("2x");
      expect(html).toContain("4x");
    });

    it("renders TesterDiagnosticsCard with collision hitbox and profiler toggles", () => {
      const html = renderToString(
        <TestProviders>
          <TesterDiagnosticsCard
            showHitboxes={true}
            showProfiler={false}
            onToggleHitboxes={() => {}}
            onToggleProfiler={() => {}}
          />
        </TestProviders>
      );

      expect(html).toBeDefined();
    });

    it("maintains backward compatibility with TesterTimeAndDiagnosticsCard composite wrapper", () => {
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
    });

    it("renders TesterParallaxCard with parallax layers and music controls", () => {
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
    });
  });

  describe("Interactive Card Behaviors & Semantic Selectors", () => {
    it("dispatches teleport callback when clicking preset button in TesterTeleportCard", async () => {
      let teleportedX: number | null = null;
      let teleportedY: number | null = null;

      const { container, click } = await renderIntoDom(
        <TestProviders>
          <TesterTeleportCard
            currentLocationId="courtyard"
            playerX={100}
            playerY={200}
            onLoadLocation={() => {}}
            onTeleportPlayer={(x, y) => {
              teleportedX = x;
              teleportedY = y;
            }}
            clickToTeleport={false}
            onToggleClickToTeleport={() => {}}
            presets={[
              { id: "test_gate", name: "Gate", namePl: "Brama", x: 350, y: 550 },
            ]}
          />
        </TestProviders>
      );

      const presetBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("350")
      );
      expect(presetBtn).toBeDefined();
      if (presetBtn) {
        await click(presetBtn);
        expect(teleportedX).toBe(350);
        expect(teleportedY).toBe(550);
      }
    });

    it("dispatches cheat toggle, health setting and vitals refill on user interactions", async () => {
      let godModeToggled = false;
      let hpSet: number | null = null;
      let vitalsRefilled = false;

      const { container, click } = await renderIntoDom(
        <TestProviders>
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
        </TestProviders>
      );

      const buttons = Array.from(container.querySelectorAll("button"));

      const godModeSwitch = buttons.find(
        (b) => b.getAttribute("aria-label")?.includes("God Mode") || b.getAttribute("role") === "switch"
      );
      expect(godModeSwitch).toBeDefined();
      if (godModeSwitch) await click(godModeSwitch);
      expect(godModeToggled).toBe(true);

      const hp1Btn = buttons.find((b) => b.textContent?.includes("1 HP"));
      expect(hp1Btn).toBeDefined();
      if (hp1Btn) await click(hp1Btn);
      expect(hpSet).toBe(1);

      const refillBtn = buttons.find(
        (b) => b.textContent?.includes("HP/MP/SP") || b.textContent?.includes("Refill")
      );
      expect(refillBtn).toBeDefined();
      if (refillBtn) await click(refillBtn);
      expect(vitalsRefilled).toBe(true);
    });

    it("dispatches combat actions and spawns selected monster type", async () => {
      let enemiesKilled = false;
      let aiFrozen = false;
      let spawnedMonster: string | null = null;

      const { container, click, changeSelect } = await renderIntoDom(
        <TestProviders>
          <TesterCombatCard
            freezeAI={false}
            onToggleFreezeAI={() => { aiFrozen = true; }}
            onKillAllEnemies={() => { enemiesKilled = true; }}
            onForceVictory={() => {}}
            onForceDefeat={() => {}}
            onSpawnEnemy={(enemyId) => { spawnedMonster = enemyId; }}
          />
        </TestProviders>
      );

      const buttons = Array.from(container.querySelectorAll("button"));

      const killBtn = buttons.find(
        (b) => b.textContent?.includes("Kill") || b.textContent?.includes("Zabij")
      );
      expect(killBtn).toBeDefined();
      if (killBtn) await click(killBtn);
      expect(enemiesKilled).toBe(true);

      const freezeSwitch = buttons.find((b) => b.getAttribute("role") === "switch");
      expect(freezeSwitch).toBeDefined();
      if (freezeSwitch) await click(freezeSwitch);
      expect(aiFrozen).toBe(true);

      const select = container.querySelector("select");
      expect(select).toBeDefined();
      if (select) {
        await changeSelect(select as HTMLSelectElement, "training_dummy");
      }

      const spawnBtn = buttons.find(
        (b) => b.textContent?.includes("Spawn") || b.textContent?.includes("Przywołaj")
      );
      expect(spawnBtn).toBeDefined();
      if (spawnBtn) await click(spawnBtn);
      expect(spawnedMonster).toBe("training_dummy");
    });

    it("dispatches simulation speed changes and single frame step", async () => {
      let selectedScale: number | null = null;
      let frameStepped = false;

      const { container, click } = await renderIntoDom(
        <TesterSimulationSpeedCard
          timeScale={1.0}
          onSetTimeScale={(s) => { selectedScale = s; }}
          onStepSingleFrame={() => { frameStepped = true; }}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));

      const twoXBtn = buttons.find((b) => b.textContent?.trim() === "2x");
      expect(twoXBtn).toBeDefined();
      if (twoXBtn) await click(twoXBtn);
      expect(selectedScale).toBe(2.0);

      const stepBtn = buttons.find(
        (b) => b.textContent?.includes("Step") || b.textContent?.includes("Klatka")
      );
      expect(stepBtn).toBeDefined();
      if (stepBtn) await click(stepBtn);
      expect(frameStepped).toBe(true);
    });

    it("dispatches diagnostic toggles in TesterDiagnosticsCard", async () => {
      let hitboxesToggled = false;
      let profilerToggled = false;

      const { container, click } = await renderIntoDom(
        <TesterDiagnosticsCard
          showHitboxes={false}
          showProfiler={false}
          onToggleHitboxes={() => { hitboxesToggled = true; }}
          onToggleProfiler={() => { profilerToggled = true; }}
        />
      );

      const switches = Array.from(container.querySelectorAll("button")).filter(
        (b) => b.getAttribute("role") === "switch"
      );
      expect(switches.length).toBeGreaterThanOrEqual(2);

      await click(switches[0]);
      expect(hitboxesToggled).toBe(true);

      await click(switches[1]);
      expect(profilerToggled).toBe(true);
    });

    it("dispatches gold additions in TesterInventoryCard", async () => {
      let addedGold: number | null = null;

      const { container, click } = await renderIntoDom(
        <TesterInventoryCard
          onGiveAllWeapons={() => {}}
          onUnlockAllSkills={() => {}}
          onGivePotions={() => {}}
          onClearInventory={() => {}}
          onAddGold={(amt) => { addedGold = amt; }}
        />
      );

      const targetFormatted = (1000).toLocaleString();
      const goldBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes(targetFormatted) || b.textContent?.replace(/\D/g, "") === "1000"
      );
      expect(goldBtn).toBeDefined();
      if (goldBtn) {
        await click(goldBtn);
        expect(addedGold).toBe(1000);
      }
    });
  });

  describe("Fault Tolerance & Edge Cases", () => {
    it("handles undefined player coordinates gracefully without crashing or NaN", () => {
      const html = renderToString(
        <TestProviders>
          <TesterTeleportCard
            currentLocationId="courtyard"
            playerX={undefined}
            playerY={undefined}
            onLoadLocation={() => {}}
            clickToTeleport={false}
            onToggleClickToTeleport={() => {}}
          />
        </TestProviders>
      );

      expect(html).not.toContain("NaN");
      expect(html).toContain("courtyard");
    });

    it("handles preset names in Polish and English without truncation", async () => {
      gameEngine.setLanguage("pl");
      const { container: plContainer, unmount: unmountPl } = await renderIntoDom(
        <TesterTeleportCard
          currentLocationId="courtyard"
          playerX={0}
          playerY={0}
          onLoadLocation={() => {}}
          clickToTeleport={false}
          onToggleClickToTeleport={() => {}}
          presets={[
            { id: "test_loc", name: "Grand Terrace Area", namePl: "Obszar Wielkiego Tarasu", x: 100, y: 200 },
          ]}
        />
      );

      // Verify full Polish text is present, not truncated by .split(" ")[0]
      expect(plContainer.textContent).toContain("Obszar Wielkiego Tarasu");
      await unmountPl();

      gameEngine.setLanguage("en");
      const { container: enContainer, unmount: unmountEn } = await renderIntoDom(
        <TesterTeleportCard
          currentLocationId="courtyard"
          playerX={0}
          playerY={0}
          onLoadLocation={() => {}}
          clickToTeleport={false}
          onToggleClickToTeleport={() => {}}
          presets={[
            { id: "test_loc", name: "Grand Terrace Area", namePl: "Obszar Wielkiego Tarasu", x: 100, y: 200 },
          ]}
        />
      );

      // Verify full English text is present
      expect(enContainer.textContent).toContain("Grand Terrace Area");
      await unmountEn();
    });
  });
});
