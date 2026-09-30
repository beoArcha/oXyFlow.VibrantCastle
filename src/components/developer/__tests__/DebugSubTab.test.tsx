import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { DebugSubTab } from "../subtabs/DebugSubTab";
import { DebugTelemetryCard } from "../subtabs/debug/DebugTelemetryCard";
import { DebugPlayerInspectorCard } from "../subtabs/debug/DebugPlayerInspectorCard";
import { DebugEntityTableCard } from "../subtabs/debug/DebugEntityTableCard";
import { DebugCollisionsCard } from "../subtabs/debug/DebugCollisionsCard";
import { DebugStateDumpCard } from "../subtabs/debug/DebugStateDumpCard";
import { LoggerManager, LogLevel } from "@/lib/logger";
import { TestProviders, setupDomEnvironment, renderIntoDom, cleanupDom } from "@test-utils";

describe("DebugSubTab & Telemetry Cards", () => {
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

  describe("DebugSubTab Orchestrator Rendering", () => {
    it("renders the unified debug subtab with all cards without crashing", () => {
      const html = renderToString(
        <TestProviders>
          <DebugSubTab />
        </TestProviders>
      );

      expect(html).toContain("subtab-content-debug");
      expect(html).toContain("FPS");
    });
  });

  describe("Individual Debug Cards Verification", () => {
    it("renders DebugTelemetryCard with formatted performance metrics", () => {
      const html = renderToString(
        <TestProviders>
          <DebugTelemetryCard
            measuredFps={60}
            targetFps={60}
            frameTimeMs={16.6}
            particleCount={42}
            projectileCount={3}
            enemyCount={5}
            entityCount={8}
            cameraX={320}
            cameraY={240}
            levelWidth={2000}
            levelHeight={1000}
          />
        </TestProviders>
      );

      expect(html).toContain("60");
      expect(html).toContain("16.6");
      expect(html).toContain("ms");
      expect(html).toContain("42");
      expect(html).toContain("320");
    });

    it("renders DebugPlayerInspectorCard with player status and vitals", () => {
      const mockPlayer = {
        id: "p1",
        name: "Test Warrior",
        level: 5,
        x: 150,
        y: 250,
        vx: 1.5,
        vy: 0,
        health: 85,
        maxHealth: 100,
        mana: 40,
        maxMana: 50,
        stamina: 70,
        maxStamina: 100,
        coins: 250,
        isGrounded: true,
      };

      const html = renderToString(
        <TestProviders>
          <DebugPlayerInspectorCard p1={mockPlayer as any} p2={null} isTwoPlayer={false} />
        </TestProviders>
      );

      expect(html).toContain("85");
      expect(html).toContain("100");
      expect(html).toContain("150");
      expect(html).toContain("250");
    });

    it("renders DebugPlayerInspectorCard smoothly when player is null (edge case)", () => {
      const html = renderToString(
        <TestProviders>
          <DebugPlayerInspectorCard p1={null} p2={null} isTwoPlayer={false} />
        </TestProviders>
      );
      expect(html).toBeDefined();
    });

    it("renders DebugEntityTableCard with active enemies", () => {
      const mockEnemies = [
        { id: "goblin_1", type: "goblin", x: 120, y: 340, health: 30, maxHealth: 50 },
        { id: "skeleton_2", type: "skeleton", x: 280, y: 340, health: 45, maxHealth: 45 },
      ];

      const html = renderToString(
        <TestProviders>
          <DebugEntityTableCard
            enemies={mockEnemies as any}
            onActionComplete={() => { }}
          />
        </TestProviders>
      );

      expect(html).toContain("goblin_1");
      expect(html).toContain("skeleton_2");
    });

    it("renders DebugEntityTableCard with empty enemies array (edge case)", () => {
      const html = renderToString(
        <TestProviders>
          <DebugEntityTableCard enemies={[]} onActionComplete={() => { }} />
        </TestProviders>
      );
      expect(html).toBeDefined();
    });

    it("renders DebugStateDumpCard with formatted JSON state snapshot", () => {
      const snapshot = {
        currentLocationId: "courtyard",
        godMode: false,
        timeScale: 1.0,
      };

      const html = renderToString(
        <TestProviders>
          <DebugStateDumpCard stateObject={snapshot} />
        </TestProviders>
      );

      expect(html).toContain("courtyard");
      expect(html).toContain("godMode");
    });
  });

  describe("Interactive Debug Card Behaviors & Callbacks", () => {
    it("dispatches actions on enemy row buttons in DebugEntityTableCard", async () => {
      let teleportTarget: any = null;
      let damagedEnemy: { id: string; amount: number } | null = null;
      let removedEnemyId: string | null = null;
      let actionCompleted = false;

      const mockEnemies = [
        { id: "target_dummy_99", defaultName: "Dummy", type: "dummy", x: 200, y: 300, health: 50, maxHealth: 100 },
      ];

      const { container, click } = await renderIntoDom(
        <DebugEntityTableCard
          enemies={mockEnemies as any}
          onTeleportToEnemy={(enemy) => { teleportTarget = enemy; }}
          onDamageEnemy={(id, amt) => { damagedEnemy = { id, amount: amt }; }}
          onRemoveEnemy={(id) => { removedEnemyId = id; }}
          onActionComplete={() => { actionCompleted = true; }}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));

      // Teleport button
      const teleportBtn = buttons.find((b) => b.querySelector("svg.lucide-crosshair") !== null);
      expect(teleportBtn).toBeDefined();
      if (teleportBtn) await click(teleportBtn);
      expect(teleportTarget?.id).toBe("target_dummy_99");

      // Damage button (-50)
      const damageBtn = buttons.find((b) => b.textContent?.includes("-50"));
      expect(damageBtn).toBeDefined();
      if (damageBtn) await click(damageBtn);
      expect((damagedEnemy as { id: string; amount: number } | null)?.id).toBe("target_dummy_99");
      expect((damagedEnemy as { id: string; amount: number } | null)?.amount).toBe(50);

      // Remove button (trash icon)
      const removeBtn = buttons.find((b) => b.querySelector("svg.lucide-trash2") !== null);
      expect(removeBtn).toBeDefined();
      if (removeBtn) await click(removeBtn);
      expect(removedEnemyId).toBe("target_dummy_99");

      expect(actionCompleted).toBe(true);
    });

    it("dispatches collision sensor callbacks on button clicks in DebugCollisionsCard", async () => {
      let hitboxesToggled = false;
      let profilerToggled = false;
      let clickTeleportToggled = false;
      let freezeAiToggled = false;

      const { container, click } = await renderIntoDom(
        <DebugCollisionsCard
          showHitboxes={false}
          showProfiler={false}
          clickToTeleport={false}
          freezeAI={false}
          onToggleHitboxes={() => { hitboxesToggled = true; }}
          onToggleProfiler={() => { profilerToggled = true; }}
          onToggleClickToTeleport={() => { clickTeleportToggled = true; }}
          onToggleFreezeAI={() => { freezeAiToggled = true; }}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));
      expect(buttons.length).toBe(4);

      await click(buttons[0]);
      expect(hitboxesToggled).toBe(true);

      await click(buttons[1]);
      expect(profilerToggled).toBe(true);

      await click(buttons[2]);
      expect(clickTeleportToggled).toBe(true);

      await click(buttons[3]);
      expect(freezeAiToggled).toBe(true);
    });
  });
});
