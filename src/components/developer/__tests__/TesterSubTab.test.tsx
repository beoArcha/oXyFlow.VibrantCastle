import { describe, it, expect, beforeEach, afterEach } from "bun:test";
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
import { LoggerManager, LogLevel } from "@lib/logger";
import { TestProviders, setupDomEnvironment, renderIntoDom, cleanupDom } from "@test-utils";

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
      const onLoadLocation = () => { };
      const onToggleClickToTeleport = () => { };

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
            onToggleGodMode={() => { }}
            onToggleInfiniteMana={() => { }}
            onToggleInfiniteStamina={() => { }}
            onToggleNoClip={() => { }}
            onSetPlayerHp={() => { }}
            onRefillVitals={() => { }}
          />
        </TestProviders>
      );

      // Verify cheats card renders structure with options
      expect(html).toContain("God Mode");
      expect(html).toContain("No-Clip");
    });

    it("renders TesterInventoryCard with economy and equipment actions", () => {
      const html = renderToString(
        <TestProviders>
          <TesterInventoryCard
            onGiveAllWeapons={() => { }}
            onUnlockAllSkills={() => { }}
            onGivePotions={() => { }}
            onClearInventory={() => { }}
            onAddGold={() => { }}
          />
        </TestProviders>
      );

      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(100);
    });

    it("renders TesterCombatCard with monster spawn options and kill button", () => {
      const onKillAllEnemies = () => { };
      const onSpawnMonster = () => { };

      const html = renderToString(
        <TestProviders>
          <TesterCombatCard
            freezeAI={false}
            onToggleFreezeAI={() => { }}
            onKillAllEnemies={onKillAllEnemies}
            onForceVictory={() => { }}
            onForceDefeat={() => { }}
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
            onSetTimeScale={() => { }}
            onStepSingleFrame={() => { }}
            onToggleHitboxes={() => { }}
            onToggleProfiler={() => { }}
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
            onToggleParallaxTier={() => { }}
            onSetMusicIntensity={() => { }}
            onTriggerParticleBurst={() => { }}
          />
        </TestProviders>
      );

      expect(html).toContain("FAR");
      expect(html).toContain("MID");
      expect(html).toBeDefined();
    });
  });

  describe("Interactive Card Behaviors & Callbacks", () => {
    it("dispatches teleport callback when clicking preset button in TesterTeleportCard", async () => {
      let teleportedX: number | null = null;
      let teleportedY: number | null = null;

      const { container, click } = await renderIntoDom(
        <TesterTeleportCard
          currentLocationId="courtyard"
          playerX={100}
          playerY={200}
          onLoadLocation={() => { }}
          onTeleportPlayer={(x, y) => {
            teleportedX = x;
            teleportedY = y;
          }}
          clickToTeleport={false}
          onToggleClickToTeleport={() => { }}
          presets={[
            { id: "test_gate", name: "Gate", namePl: "Brama", x: 350, y: 550 },
          ]}
        />
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
          onToggleInfiniteMana={() => { }}
          onToggleInfiniteStamina={() => { }}
          onToggleNoClip={() => { }}
          onSetPlayerHp={(val) => { hpSet = val; }}
          onRefillVitals={() => { vitalsRefilled = true; }}
        />
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

      const refillBtn = buttons.find((b) => b.querySelector("svg.lucide-heart") !== null);
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
          onForceVictory={() => { }}
          onForceDefeat={() => { }}
          onSpawnEnemy={(enemyId) => { spawnedMonster = enemyId; }}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));

      const killBtn = buttons.find((b) => b.querySelector("svg.lucide-skull") !== null);
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

      const spawnBtn = buttons.find((b) => b.querySelector("svg.lucide-plus") !== null);
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
          onToggleHitboxes={() => { }}
          onToggleProfiler={() => { }}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));

      const twoXBtn = buttons.find((b) => b.textContent?.trim() === "2x");
      expect(twoXBtn).toBeDefined();
      if (twoXBtn) await click(twoXBtn);
      expect(selectedScale).toBe(2.0);

      const stepBtn = buttons.find(
        (b) => b.querySelector("svg.lucide-step-forward") !== null || b.textContent?.includes("Step") || b.textContent?.includes("Klatka")
      );
      expect(stepBtn).toBeDefined();
      if (stepBtn) await click(stepBtn);
      expect(frameStepped).toBe(true);
    });
  });
});
