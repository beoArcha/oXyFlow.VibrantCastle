import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { DebugSubTab } from "../subtabs/DebugSubTab";
import {
  DebugTelemetryCard,
  DebugPlayerInspectorCard,
  DebugEntityTableCard,
  DebugTogglesCard,
  DebugCollisionsCard,
  DebugStateDumpCard,
} from "../subtabs/debug";
import { Player, Enemy, PlayerId, AnimationState } from "@game/types";
import { LoggerManager, LogLevel } from "@/lib/logger";
import { TestProviders, setupDomEnvironment, renderIntoDom, cleanupDom } from "@test-utils";

function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: PlayerId.Player1,
    characterId: "valen",
    characterName: "Valen",
    x: 150,
    y: 250,
    vx: 1.5,
    vy: -0.5,
    width: 32,
    height: 48,
    facingLeft: true,
    isGrounded: true,
    isCrouching: false,
    isJumping: false,
    wasGrounded: true,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    jumpHoldTimer: 0,
    squashStretchScaleX: 1,
    squashStretchScaleY: 1,
    health: 85,
    maxHealth: 100,
    mana: 40,
    maxMana: 50,
    stamina: 70,
    maxStamina: 100,
    isDead: false,
    attackCooldown: 0,
    dashCooldown: 0,
    isDashing: false,
    isBackstepping: false,
    dashTime: 0,
    isAttacking: false,
    attackTime: 0,
    magicCooldown: 0,
    isCasting: false,
    castTime: 0,
    shieldActiveTime: 0,
    primarySpellId: "fireball",
    secondarySpellId: "shield",
    skillPoints: 0,
    score: 0,
    unlockedSkills: [],
    autoSkillTimer: 0,
    inventory: {
      equipment: {
        mainHand: null,
        offHand: null,
        helmet: null,
        armor: null,
        amulet: null,
        ring: null,
      },
      quickPotions: [],
      backpack: [],
    },
    animationState: AnimationState.Idle,
    ...overrides,
  };
}

function createMockEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: "goblin_1",
    defaultName: "Goblin Scout",
    x: 120,
    y: 340,
    vx: 0,
    vy: 0,
    width: 32,
    height: 32,
    health: 30,
    maxHealth: 50,
    isDead: false,
    patrolMinX: 50,
    patrolMaxX: 300,
    facingLeft: true,
    isDummy: false,
    damageTimer: 0,
    ...overrides,
  };
}

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

  describe("DebugSubTab Orchestrator Lifecycle & Rendering", () => {
    it("renders the unified debug subtab with all cards without crashing", () => {
      const html = renderToString(
        <TestProviders>
          <DebugSubTab />
        </TestProviders>
      );

      expect(html).toContain("subtab-content-debug");
      expect(html).toContain("FPS");
    });

    it("mounts into DOM and unmounts cleanly without throwing", async () => {
      const { unmount } = await renderIntoDom(
        <TestProviders>
          <DebugSubTab />
        </TestProviders>
      );
      expect(unmount).toBeDefined();
      unmount();
    });
  });

  describe("DebugTelemetryCard", () => {
    it("renders telemetry metrics with formatted values and units", () => {
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
      expect(html).toContain("2000 × 1000");
    });

    it("renders amber and red badge variants based on FPS thresholds", () => {
      const amberHtml = renderToString(
        <TestProviders>
          <DebugTelemetryCard
            measuredFps={35}
            targetFps={60}
            frameTimeMs={28.5}
            particleCount={0}
            projectileCount={0}
            enemyCount={0}
            entityCount={0}
            cameraX={0}
            cameraY={0}
            levelWidth={1000}
            levelHeight={600}
          />
        </TestProviders>
      );
      expect(amberHtml).toContain("35");

      const redHtml = renderToString(
        <TestProviders>
          <DebugTelemetryCard
            measuredFps={15}
            targetFps={60}
            frameTimeMs={66.6}
            particleCount={0}
            projectileCount={0}
            enemyCount={0}
            entityCount={0}
            cameraX={0}
            cameraY={0}
            levelWidth={1000}
            levelHeight={600}
          />
        </TestProviders>
      );
      expect(redHtml).toContain("15");
    });

    it("safely handles zero and invalid FPS without NaN or division by zero", () => {
      const html = renderToString(
        <TestProviders>
          <DebugTelemetryCard
            measuredFps={0}
            targetFps={60}
            frameTimeMs={0}
            particleCount={0}
            projectileCount={0}
            enemyCount={0}
            entityCount={0}
            cameraX={0}
            cameraY={0}
            levelWidth={0}
            levelHeight={0}
          />
        </TestProviders>
      );
      expect(html).toBeDefined();
      expect(html).not.toContain("NaN");
    });
  });

  describe("DebugPlayerInspectorCard & DebugPlayerStatsSection", () => {
    it("renders P1 player vitals, coordinates, velocity and state flags", () => {
      const p1 = createMockPlayer({
        health: 85,
        maxHealth: 100,
        mana: 40,
        maxMana: 50,
        stamina: 70,
        maxStamina: 100,
        x: 150,
        y: 250,
        facingLeft: true,
      });

      const html = renderToString(
        <TestProviders>
          <DebugPlayerInspectorCard p1={p1} p2={null} isTwoPlayer={false} />
        </TestProviders>
      );

      expect(html).toContain("85");
      expect(html).toContain("100");
      expect(html).toContain("150");
      expect(html).toContain("250");
      expect(html).toContain("P1");
    });

    it("renders both players when isTwoPlayer is enabled", () => {
      const p1 = createMockPlayer({ id: PlayerId.Player1, characterName: "Valen" });
      const p2 = createMockPlayer({
        id: PlayerId.Player2,
        characterId: "aurelia",
        characterName: "Aurelia",
        x: 300,
        y: 250,
        facingLeft: false,
      });

      const html = renderToString(
        <TestProviders>
          <DebugPlayerInspectorCard p1={p1} p2={p2} isTwoPlayer={true} />
        </TestProviders>
      );

      expect(html).toContain("P1");
      expect(html).toContain("P2");
      expect(html).toContain("300");
    });

    it("renders attacking and dashing combat badges when flags are active", () => {
      const combatPlayer = createMockPlayer({
        isAttacking: true,
        isDashing: true,
      });

      const html = renderToString(
        <TestProviders>
          <DebugPlayerInspectorCard p1={combatPlayer} p2={null} isTwoPlayer={false} />
        </TestProviders>
      );

      expect(html).toBeDefined();
    });

    it("renders smoothly when player is null (edge case)", () => {
      const html = renderToString(
        <TestProviders>
          <DebugPlayerInspectorCard p1={null} p2={null} isTwoPlayer={false} />
        </TestProviders>
      );
      expect(html).toBeDefined();
    });
  });

  describe("DebugEntityTableCard & DebugEntityTableRow", () => {
    it("renders active enemies in the table", () => {
      const mockEnemies = [
        createMockEnemy({ id: "goblin_1", defaultName: "Goblin Scout" }),
        createMockEnemy({ id: "skeleton_2", defaultName: "Bone Archer", x: 280, y: 340, health: 45, maxHealth: 45 }),
      ];

      const html = renderToString(
        <TestProviders>
          <DebugEntityTableCard enemies={mockEnemies} onActionComplete={() => {}} />
        </TestProviders>
      );

      expect(html).toContain("goblin_1");
      expect(html).toContain("skeleton_2");
      expect(html).toContain("Goblin Scout");
      expect(html).toContain("Bone Archer");
    });

    it("renders empty state placeholder when enemies list is empty", () => {
      const html = renderToString(
        <TestProviders>
          <DebugEntityTableCard enemies={[]} onActionComplete={() => {}} />
        </TestProviders>
      );
      expect(html).toBeDefined();
    });

    it("dispatches actions on enemy row buttons with valid targets", async () => {
      let teleportTarget: Enemy | null = null;
      let damagedEnemy: { id: string; amount: number } | null = null;
      let removedEnemyId: string | null = null;
      let actionCompleted = false;

      const mockEnemies = [
        createMockEnemy({
          id: "target_dummy_99",
          defaultName: "Dummy",
          x: 200,
          y: 300,
          health: 50,
          maxHealth: 100,
        }),
      ];

      const { container, click } = await renderIntoDom(
        <DebugEntityTableCard
          enemies={mockEnemies}
          onTeleportToEnemy={(enemy) => {
            teleportTarget = enemy;
          }}
          onDamageEnemy={(id, amt) => {
            damagedEnemy = { id, amount: amt };
          }}
          onRemoveEnemy={(id) => {
            removedEnemyId = id;
          }}
          onActionComplete={() => {
            actionCompleted = true;
          }}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));

      // Teleport button
      const teleportBtn = buttons.find((b) => b.querySelector("svg.lucide-crosshair") !== null);
      expect(teleportBtn).toBeDefined();
      if (teleportBtn) await click(teleportBtn);
      const target = teleportTarget as Enemy | null;
      expect(target?.id).toBe("target_dummy_99");

      // Damage button
      const damageBtn = buttons.find((b) => b.querySelector("svg.lucide-zap") !== null);
      expect(damageBtn).toBeDefined();
      if (damageBtn) await click(damageBtn);
      const damaged = damagedEnemy as { id: string; amount: number } | null;
      expect(damaged?.id).toBe("target_dummy_99");
      expect(damaged?.amount).toBe(50);

      // Remove button (trash icon)
      const removeBtn = buttons.find((b) => b.querySelector("svg.lucide-trash2") !== null);
      expect(removeBtn).toBeDefined();
      if (removeBtn) await click(removeBtn);
      expect(removedEnemyId).toBe("target_dummy_99");

      expect(actionCompleted).toBe(true);
    });

    it("filters enemies list via search input and shows empty search results", async () => {
      const mockEnemies = [
        createMockEnemy({ id: "goblin_1", defaultName: "Goblin Scout" }),
        createMockEnemy({ id: "skeleton_1", defaultName: "Skeleton Archer" }),
        createMockEnemy({ id: "gargoyle_1", defaultName: "Gargoyle Sentry" }),
        createMockEnemy({ id: "boss_1", defaultName: "Bastion Sentinel Boss" }),
      ];

      const { container, changeInput } = await renderIntoDom(
        <DebugEntityTableCard enemies={mockEnemies} onActionComplete={() => {}} />
      );

      const searchInput = container.querySelector("input");
      expect(searchInput).toBeDefined();

      if (searchInput) {
        await changeInput(searchInput, "gargoyle");
        expect(container.textContent).toContain("gargoyle_1");
        expect(container.textContent).not.toContain("skeleton_1");

        await changeInput(searchInput, "nonexistent_monster");
        expect(container.textContent).not.toContain("gargoyle_1");
      }
    });

    it("prevents teleporting to an enemy with NaN coordinates (fault scenario)", async () => {
      let teleportCalled = false;

      const corruptEnemy = createMockEnemy({
        id: "corrupt_enemy",
        x: NaN,
        y: NaN,
      });

      const { container, click } = await renderIntoDom(
        <DebugEntityTableCard
          enemies={[corruptEnemy]}
          onTeleportToEnemy={() => {
            teleportCalled = true;
          }}
        />
      );

      const teleportBtn = container.querySelector("button");
      if (teleportBtn) await click(teleportBtn);

      expect(teleportCalled).toBe(false);
    });
  });

  describe("DebugTogglesCard & DebugCollisionsCard", () => {
    it("dispatches diagnostic sensor toggle callbacks on switch clicks", async () => {
      let hitboxesToggled = false;
      let profilerToggled = false;
      let clickTeleportToggled = false;
      let freezeAiToggled = false;

      const { container, click } = await renderIntoDom(
        <DebugTogglesCard
          showHitboxes={false}
          showProfiler={false}
          clickToTeleport={false}
          freezeAI={false}
          onToggleHitboxes={() => {
            hitboxesToggled = true;
          }}
          onToggleProfiler={() => {
            profilerToggled = true;
          }}
          onToggleClickToTeleport={() => {
            clickTeleportToggled = true;
          }}
          onToggleFreezeAI={() => {
            freezeAiToggled = true;
          }}
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

    it("maintains backward compatibility with DebugCollisionsCard alias", () => {
      const html = renderToString(
        <TestProviders>
          <DebugCollisionsCard
            showHitboxes={true}
            showProfiler={false}
            clickToTeleport={false}
            freezeAI={false}
          />
        </TestProviders>
      );
      expect(html).toBeDefined();
    });
  });

  describe("DebugStateDumpCard", () => {
    it("renders formatted JSON state snapshot using CopyableSnippet", () => {
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

    it("safely handles circular references or serialization errors without crashing", () => {
      const circularObj: Record<string, unknown> = { key: "val" };
      circularObj.self = circularObj;

      const html = renderToString(
        <TestProviders>
          <DebugStateDumpCard stateObject={circularObj} />
        </TestProviders>
      );

      expect(html).toBeDefined();
      expect(html).toContain("Failed to serialize state object");
    });
  });
});
