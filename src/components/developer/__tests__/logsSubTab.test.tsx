import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderToString } from "react-dom/server";
import { LogsSubTab } from "../subtabs/LogsSubTab";
import {
  LogsHeaderToolbar,
  LogsFilterControls,
  LogsTerminalList,
  LogItemDrawer,
} from "../subtabs/logs";
import { LoggerManager, LogLevel, LogRecord } from "@/lib/logger";
import { TestProviders, setupDomEnvironment, renderIntoDom, cleanupDom } from "@test-utils";

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

  describe("LogsSubTab Orchestrator Rendering", () => {
    it("renders the logs subtab terminal workspace without crashing", () => {
      const html = renderToString(
        <TestProviders>
          <LogsSubTab />
        </TestProviders>
      );

      expect(html).toContain("subtab-content-logs");
    });
  });

  describe("Individual Logs Components Verification", () => {
    it("renders LogsHeaderToolbar with log counter and action controls", () => {
      const html = renderToString(
        <TestProviders>
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
            onToggleExpand={() => { }}
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
            onToggleExpand={() => { }}
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

  describe("Interactive Logs Behaviors & Callbacks", () => {
    it("handles toolbar clicks for autoscroll, copy, and clear logs", async () => {
      let autoScrollToggled = false;
      let logsCleared = false;
      let logsCopied = false;

      const { container, click } = await renderIntoDom(
        <LogsHeaderToolbar
          totalCount={50}
          filteredCount={25}
          autoScroll={true}
          copied={false}
          onToggleAutoScroll={() => { autoScrollToggled = true; }}
          onCopyLogs={() => { logsCopied = true; }}
          onDownloadLogs={() => { }}
          onClearLogs={() => { logsCleared = true; }}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));

      const autoScrollBtn = buttons.find((b) => b.textContent?.includes("Auto") || b.title?.includes("Auto"));
      expect(autoScrollBtn).toBeDefined();
      if (autoScrollBtn) await click(autoScrollBtn);
      expect(autoScrollToggled).toBe(true);

      const copyBtn = buttons.find((b) => b.textContent?.includes("Kopiuj") || b.textContent?.includes("Copy"));
      expect(copyBtn).toBeDefined();
      if (copyBtn) await click(copyBtn);
      expect(logsCopied).toBe(true);

      const clearBtn = buttons.find((b) => b.textContent?.includes("Wyczyść") || b.textContent?.includes("Clear"));
      expect(clearBtn).toBeDefined();
      if (clearBtn) await click(clearBtn);
      expect(logsCleared).toBe(true);
    });

    it("triggers filter callbacks when user switches level filters or types search query", async () => {
      let changedLevel: string | null = null;
      let searchedQuery: string | null = null;

      const { container, click, changeInput } = await renderIntoDom(
        <LogsFilterControls
          searchQuery=""
          onSearchQueryChange={(q) => { searchedQuery = q; }}
          levelFilter="all"
          onLevelFilterChange={(lvl) => { changedLevel = lvl; }}
          categoryFilter="all"
          onCategoryFilterChange={() => { }}
          counts={{ fatal: 0, error: 3, warn: 5, info: 12, debug: 15, total: 35 }}
          availableCategories={["Engine", "Physics"]}
          globalLogLevel={LogLevel.DEBUG}
          onChangeGlobalLevel={() => { }}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));

      const warnBtn = buttons.find((b) => b.textContent?.includes("WARNS"));
      expect(warnBtn).toBeDefined();
      if (warnBtn) await click(warnBtn);
      expect(changedLevel).toBe("warn");

      const input = container.querySelector("input");
      expect(input).toBeDefined();
      if (input) {
        await changeInput(input as HTMLInputElement, "critical crash");
      }
      expect(searchedQuery).toBe("critical crash");
    });

    it("toggles item expansion when clicking on expandable log entry", async () => {
      let toggledId: string | null = null;

      const mockLogs: LogRecord[] = [
        {
          id: "log_expandable",
          level: LogLevel.ERROR,
          levelName: "ERROR",
          timeFormatted: "12:00:00.000",
          category: "Engine",
          message: "Unhandled exception in entity loop",
          context: { entityId: "boss_dragon", health: 0 },
          timestamp: 1700000000000,
        },
      ];

      const { container, click } = await renderIntoDom(
        <LogsTerminalList
          logs={mockLogs}
          expandedLogIds={new Set()}
          onToggleExpand={(id) => { toggledId = id; }}
          scrollContainerRef={{ current: null }}
          hasSearchQuery={false}
        />
      );

      const logRow = container.querySelector(".cursor-pointer");
      expect(logRow).toBeDefined();
      if (logRow) await click(logRow);
      expect(toggledId).toBe("log_expandable");
    });
  });
});
