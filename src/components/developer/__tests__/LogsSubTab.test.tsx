import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderToString } from "react-dom/server";
import { LogsSubTab } from "../subtabs/LogsSubTab";
import {
  LogsHeaderToolbar,
  LogsFilterControls,
  LogsTerminalList,
  LogsItemDrawer,
  LogItemDrawer,
  safeStringify,
} from "../subtabs/logs";
import { LoggerManager, LogLevel, LogRecord } from "@/lib/logger";
import { I18nProvider } from "@context/I18nContext";
import { setupDomEnvironment, renderIntoDom, cleanupDom } from "@test-utils";

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nProvider>{children}</I18nProvider>
);

describe("LogsSubTab & Terminal Subcomponents", () => {
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

  describe("LogsSubTab Orchestrator Rendering & Initial State", () => {
    it("renders the logs subtab terminal workspace without crashing", () => {
      const html = renderToString(
        <TestWrapper>
          <LogsSubTab />
        </TestWrapper>
      );

      expect(html).toContain("subtab-content-logs");
    });
  });

  describe("LogsSubTab Live Integration Tests", () => {
    it("interactively filters logs in real time via search query, level filters and clear action", async () => {
      const logger = LoggerManager.getInstance().getLogger("Engine");
      const audioLogger = LoggerManager.getInstance().getLogger("Audio");

      logger.info("Simulation initialized smoothly", { mode: "sandbox" });
      logger.warn("Physics step took too long");
      logger.error("Collision resolution crash detected", { bodyId: "rigid_12" });
      audioLogger.info("Background gothic soundtrack playing");

      const { container, changeInput, click, unmount } = await renderIntoDom(
        <LogsSubTab />,
        { wrapper: TestWrapper }
      );

      expect(container.textContent).toContain("Simulation initialized smoothly");
      expect(container.textContent).toContain("Physics step took too long");
      expect(container.textContent).toContain("Collision resolution crash detected");
      expect(container.textContent).toContain("Background gothic soundtrack playing");

      // 1. Full-text search
      const searchInput = container.querySelector("input");
      expect(searchInput).toBeDefined();
      if (searchInput) {
        await changeInput(searchInput as HTMLInputElement, "crash");
      }
      expect(container.textContent).toContain("Collision resolution crash detected");
      expect(container.textContent).not.toContain("Simulation initialized smoothly");

      // Clear search
      if (searchInput) {
        await changeInput(searchInput as HTMLInputElement, "");
      }
      expect(container.textContent).toContain("Simulation initialized smoothly");

      // 2. Filter by Level (WARNS)
      const buttons = Array.from(container.querySelectorAll("button"));
      const warnBtn = buttons.find((b) => b.textContent?.includes("WARNS"));
      expect(warnBtn).toBeDefined();
      if (warnBtn) await click(warnBtn);

      expect(container.textContent).toContain("Physics step took too long");
      expect(container.textContent).not.toContain("Simulation initialized smoothly");
      expect(container.textContent).not.toContain("Collision resolution crash detected");

      // Restore to ALL
      const allBtn = buttons.find((b) => b.textContent?.includes("ALL"));
      if (allBtn) await click(allBtn);
      expect(container.textContent).toContain("Simulation initialized smoothly");

      // 3. Clear logs
      const clearBtn = buttons.find(
        (b) =>
          b.textContent?.toLowerCase().includes("clear") ||
          b.textContent?.includes("Wyczyść") ||
          b.title?.toLowerCase().includes("clear") ||
          b.title?.includes("Wyczyść")
      );
      expect(clearBtn).toBeDefined();
      if (clearBtn) await click(clearBtn);

      expect(container.textContent).not.toContain("Simulation initialized smoothly");
      expect(container.textContent).not.toContain("Physics step took too long");

      await unmount();
    });

    it("toggles item expansion via click and keyboard (Enter/Space)", async () => {
      const logger = LoggerManager.getInstance().getLogger("Combat");
      logger.error("Spell cast failed", { spellId: "fireball", manaCost: 25 });

      const { container, click, keyDown, unmount } = await renderIntoDom(
        <LogsSubTab />,
        { wrapper: TestWrapper }
      );

      const logRow = container.querySelector('[data-testid="log-entry-row"].cursor-pointer');
      expect(logRow).toBeDefined();

      // Click to expand
      if (logRow) await click(logRow);
      expect(container.textContent).toContain("fireball");

      // Click to collapse
      if (logRow) await click(logRow);
      expect(container.textContent).not.toContain("fireball");

      // Keyboard navigation (Enter to expand)
      if (logRow) await keyDown(logRow, "Enter");
      expect(container.textContent).toContain("fireball");

      // Keyboard navigation (Space to collapse)
      if (logRow) await keyDown(logRow, " ");
      expect(container.textContent).not.toContain("fireball");

      await unmount();
    });
  });

  describe("Fault Tolerance & Edge Cases", () => {
    it("handles circular references in context without crashing (safeStringify)", async () => {
      const circularObj: Record<string, unknown> = { name: "ouroboros" };
      circularObj.self = circularObj;

      const serialized = safeStringify(circularObj);
      expect(serialized).toContain("[Circular]");
      expect(serialized).toContain("ouroboros");

      const logger = LoggerManager.getInstance().getLogger("Engine");
      logger.error("Recursive loop caught", circularObj);

      const { container, click, unmount } = await renderIntoDom(
        <LogsSubTab />,
        { wrapper: TestWrapper }
      );

      expect(container.textContent).toContain("Recursive loop caught");

      const logRow = container.querySelector('[data-testid="log-entry-row"].cursor-pointer');
      expect(logRow).toBeDefined();
      if (logRow) await click(logRow);

      expect(container.textContent).toContain("[Circular]");
      await unmount();
    });

    it("renders empty or broken log entries gracefully", async () => {
      const brokenRecord: LogRecord = {
        id: "broken_1",
        level: LogLevel.DEBUG,
        levelName: "DEBUG",
        timeFormatted: "00:00:00.000",
        category: "",
        message: "",
        timestamp: Date.now(),
      };

      const html = renderToString(
        <TestWrapper>
          <LogsTerminalList
            logs={[brokenRecord]}
            expandedLogIds={new Set()}
            onToggleExpand={() => { }}
            scrollContainerRef={{ current: null }}
            hasSearchQuery={false}
          />
        </TestWrapper>
      );

      expect(html).toContain("DEBUG");
    });

    it("safely handles special regex characters in search query", async () => {
      const logger = LoggerManager.getInstance().getLogger("Engine");
      logger.info("Normal message with (bracket) and [array]*");

      const { container, changeInput, unmount } = await renderIntoDom(
        <LogsSubTab />,
        { wrapper: TestWrapper }
      );

      const searchInput = container.querySelector("input");
      if (searchInput) {
        await changeInput(searchInput as HTMLInputElement, "([*\\");
      }

      // Should not throw error and should display empty state for unmatched regex query
      expect(container.textContent).toContain("0 / 1");
      await unmount();
    });
  });

  describe("Individual Logs Components Verification", () => {
    it("renders LogsHeaderToolbar with log counter and action controls", () => {
      const html = renderToString(
        <TestWrapper>
          <LogsHeaderToolbar
            totalCount={128}
            filteredCount={42}
            autoScroll={true}
            copied={false}
            onToggleAutoScroll={() => { }}
            onCopyLogs={() => { }}
            onDownloadLogs={() => { }}
            onClearLogs={() => { }}
          />
        </TestWrapper>
      );

      expect(html).toContain("42");
      expect(html).toContain("128");
    });

    it("renders LogsFilterControls with log levels and category selector", () => {
      const html = renderToString(
        <TestWrapper>
          <LogsFilterControls
            searchQuery="player"
            onSearchQueryChange={() => { }}
            levelFilter="all"
            onLevelFilterChange={() => { }}
            categoryFilter="all"
            onCategoryFilterChange={() => { }}
            counts={{ fatal: 0, error: 2, warn: 3, info: 10, debug: 20, total: 35 }}
            availableCategories={["Engine", "Physics", "Combat", "Audio"]}
            globalLogLevel={LogLevel.DEBUG}
            onChangeGlobalLevel={() => { }}
          />
        </TestWrapper>
      );

      expect(html).toContain("player");
      expect(html).toContain("Engine");
      expect(html).toContain("Combat");
    });

    it("renders LogsTerminalList with colored entries and handles empty state smoothly", () => {
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
        <TestWrapper>
          <LogsTerminalList
            logs={mockRecords}
            expandedLogIds={new Set(["log_1"])}
            onToggleExpand={() => { }}
            scrollContainerRef={{ current: null }}
            hasSearchQuery={false}
          />
        </TestWrapper>
      );

      expect(htmlWithLogs).toContain("Game simulation started successfully");
      expect(htmlWithLogs).toContain("Sound buffer underrun detected");

      const htmlEmpty = renderToString(
        <TestWrapper>
          <LogsTerminalList
            logs={[]}
            expandedLogIds={new Set()}
            onToggleExpand={() => { }}
            scrollContainerRef={{ current: null }}
            hasSearchQuery={false}
          />
        </TestWrapper>
      );

      expect(htmlEmpty).toBeDefined();
    });

    it("renders LogsItemDrawer and LogItemDrawer alias with structured metadata and details", () => {
      const htmlNew = renderToString(
        <TestWrapper>
          <LogsItemDrawer
            context={{
              entityId: "enemy_goblin_12",
              coords: { x: 100, y: 200 },
            }}
          />
        </TestWrapper>
      );
      expect(htmlNew).toContain("enemy_goblin_12");
      expect(htmlNew).toContain("coords");

      const htmlAlias = renderToString(
        <TestWrapper>
          <LogItemDrawer
            context={{
              entityId: "enemy_goblin_12",
              coords: { x: 100, y: 200 },
            }}
          />
        </TestWrapper>
      );
      expect(htmlAlias).toContain("enemy_goblin_12");
    });
  });
});
