import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import fs from "fs";
import path from "path";
import { DebugSubTab } from "../subtabs/DebugSubTab";
import { DebugTelemetryCard } from "../subtabs/debug/DebugTelemetryCard";
import { DebugPlayerInspectorCard } from "../subtabs/debug/DebugPlayerInspectorCard";
import { DebugEntityTableCard } from "../subtabs/debug/DebugEntityTableCard";
import { DebugStateDumpCard } from "../subtabs/debug/DebugStateDumpCard";
import { I18nProvider } from "../../../context/I18nContext";
import { GameProvider } from "../../../context/GameContext";
import { LoggerManager, LogLevel } from "../../../lib/logger";

const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nProvider>
    <GameProvider>
      {children}
    </GameProvider>
  </I18nProvider>
);

describe("Phase 5.2: DebugSubTab & Telemetry Cards Suite", () => {
  beforeEach(() => {
    LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
  });

  afterEach(() => {
    LoggerManager.resetInstance();
  });

  describe("1. DebugSubTab Orchestrator Rendering", () => {
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

  describe("2. Individual Debug Cards Verification", () => {
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

    it("renders DebugEntityTableCard with active enemies", () => {
      const mockEnemies = [
        { id: "goblin_1", type: "goblin", x: 120, y: 340, health: 30, maxHealth: 50 },
        { id: "skeleton_2", type: "skeleton", x: 280, y: 340, health: 45, maxHealth: 45 },
      ];

      const html = renderToString(
        <TestProviders>
          <DebugEntityTableCard
            enemies={mockEnemies as any}
            onActionComplete={() => {}}
          />
        </TestProviders>
      );

      expect(html).toContain("goblin_1");
      expect(html).toContain("skeleton_2");
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

  describe("3. Architecture & File Length Verification", () => {
    it("verifies Debug cards and orchestrators are clean and modular (< 170 lines)", () => {
      const checkLines = (relPath: string, maxLines: number) => {
        const content = fs.readFileSync(path.resolve(__dirname, "..", relPath), "utf-8");
        expect(content.split("\n").length).toBeLessThanOrEqual(maxLines);
      };

      checkLines("subtabs/DebugSubTab.tsx", 170);
      checkLines("subtabs/debug/DebugTelemetryCard.tsx", 170);
      checkLines("subtabs/debug/DebugPlayerInspectorCard.tsx", 170);
      checkLines("subtabs/debug/DebugEntityTableCard.tsx", 170);
      checkLines("subtabs/debug/DebugStateDumpCard.tsx", 170);
    });
  });
});
