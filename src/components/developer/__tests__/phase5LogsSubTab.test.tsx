import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import fs from "fs";
import path from "path";
import { LogsSubTab } from "../subtabs/LogsSubTab";
import {
  LogsHeaderToolbar,
  LogsFilterControls,
  LogsTerminalList,
  LogItemDrawer,
} from "../subtabs/logs";
import { I18nProvider } from "../../../context/I18nContext";
import { GameProvider } from "../../../context/GameContext";
import { LoggerManager, LogLevel, LogRecord } from "../../../lib/logger";

const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nProvider>
    <GameProvider>
      {children}
    </GameProvider>
  </I18nProvider>
);

describe("Phase 5.4: LogsSubTab & Terminal Subcomponents Suite", () => {
  beforeEach(() => {
    LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
  });

  afterEach(() => {
    LoggerManager.resetInstance();
  });

  describe("1. LogsSubTab Orchestrator Rendering", () => {
    it("renders the logs subtab terminal workspace without crashing", () => {
      const html = renderToString(
        <TestProviders>
          <LogsSubTab />
        </TestProviders>
      );

      expect(html).toContain("subtab-content-logs");
    });
  });

  describe("2. Individual Logs Components Verification", () => {
    it("renders LogsHeaderToolbar with log counter and action controls", () => {
      const html = renderToString(
        <TestProviders>
          <LogsHeaderToolbar
            totalCount={128}
            filteredCount={42}
            autoScroll={true}
            copied={false}
            onToggleAutoScroll={() => {}}
            onCopyLogs={() => {}}
            onDownloadLogs={() => {}}
            onClearLogs={() => {}}
          />
        </TestProviders>
      );

      expect(html).toContain("42");
      expect(html).toContain("128");
    });

    it("renders LogsFilterControls with log levels and category selector", () => {
      const html = renderToString(
        <TestProviders>
          <LogsFilterControls
            searchQuery="player"
            onSearchQueryChange={() => {}}
            levelFilter="ALL"
            onLevelFilterChange={() => {}}
            categoryFilter="ALL"
            onCategoryFilterChange={() => {}}
            counts={{ fatal: 0, error: 2, warn: 3, info: 10, debug: 20, total: 35 }}
            availableCategories={["Engine", "Physics", "Combat", "Audio"]}
            globalLogLevel={LogLevel.DEBUG}
            onChangeGlobalLevel={() => {}}
          />
        </TestProviders>
      );

      expect(html).toContain("player");
      expect(html).toContain("Engine");
      expect(html).toContain("Combat");
    });

    it("renders LogsTerminalList with colored entries and handles empty state", () => {
      const mockRecords: LogRecord[] = [
        {
          id: "log_1",
          level: LogLevel.INFO,
          levelName: "INFO",
          timeFormatted: "12:00:00.000",
          category: "Engine",
          message: "Game simulation started successfully",
          timestamp: 1700000000000,
        },
        {
          id: "log_2",
          level: LogLevel.WARN,
          levelName: "WARN",
          timeFormatted: "12:00:01.000",
          category: "Audio",
          message: "Sound buffer underrun detected",
          timestamp: 1700000001000,
        },
      ];

      const htmlWithLogs = renderToString(
        <TestProviders>
          <LogsTerminalList
            logs={mockRecords}
            expandedLogIds={new Set(["log_1"])}
            onToggleExpand={() => {}}
            scrollContainerRef={{ current: null }}
            hasSearchQuery={false}
          />
        </TestProviders>
      );

      expect(htmlWithLogs).toContain("Game simulation started successfully");
      expect(htmlWithLogs).toContain("Sound buffer underrun detected");

      const htmlEmpty = renderToString(
        <TestProviders>
          <LogsTerminalList
            logs={[]}
            expandedLogIds={new Set()}
            onToggleExpand={() => {}}
            scrollContainerRef={{ current: null }}
            hasSearchQuery={false}
          />
        </TestProviders>
      );

      expect(htmlEmpty).toBeDefined();
    });

    it("renders LogItemDrawer with structured metadata and details", () => {
      const html = renderToString(
        <TestProviders>
          <LogItemDrawer
            context={{
              entityId: "enemy_goblin_12",
              coords: { x: 100, y: 200 },
            }}
          />
        </TestProviders>
      );

      expect(html).toContain("enemy_goblin_12");
      expect(html).toContain("coords");
    });
  });

  describe("3. Architecture & File Length Verification", () => {
    it("verifies LogsSubTab and subcomponents are under line limits (< 250 lines)", () => {
      const checkLines = (relPath: string, maxLines: number) => {
        const content = fs.readFileSync(path.resolve(__dirname, "..", relPath), "utf-8");
        expect(content.split("\n").length).toBeLessThanOrEqual(maxLines);
      };

      checkLines("subtabs/LogsSubTab.tsx", 250);
      checkLines("subtabs/logs/LogsHeaderToolbar.tsx", 120);
      checkLines("subtabs/logs/LogsFilterControls.tsx", 150);
      checkLines("subtabs/logs/LogsTerminalList.tsx", 150);
      checkLines("subtabs/logs/LogItemDrawer.tsx", 100);
    });
  });
});

