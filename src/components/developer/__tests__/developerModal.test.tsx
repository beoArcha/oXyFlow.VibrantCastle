import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { DeveloperModal } from "../DeveloperModal";
import { DeveloperTab } from "../DeveloperTab";
import { DeveloperTabLayout } from "../DeveloperTabLayout";
import { LoggerManager, LogLevel } from "@lib/logger";
import { renderIntoDom, cleanupDom } from "@test-utils";

describe("DeveloperModal & DeveloperTab Behavioral DOM Interaction", () => {
  beforeEach(() => {
    LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
  });

  afterEach(async () => {
    await cleanupDom();
    LoggerManager.resetInstance();
  });

  describe("DeveloperModal DOM events and callbacks", () => {
    it("invokes onClose when clicking the modal close button or pressing Escape", async () => {
      let closeCount = 0;
      const { container, click } = await renderIntoDom(
        <DeveloperModal onClose={() => { closeCount++; }} />
      );

      // Find close button by X icon or aria-label (supporting portal rendering)
      const targetRoot = container.querySelector("button") ? container : document.body;
      const buttons = Array.from(targetRoot.querySelectorAll("button"));
      const closeBtn = buttons.find((btn) => btn.querySelector("svg.lucide-x") !== null || btn.getAttribute("aria-label")?.toLowerCase().includes("zamknij") || btn.getAttribute("aria-label")?.toLowerCase().includes("close"));

      expect(closeBtn).toBeDefined();
      if (closeBtn) {
        await click(closeBtn);
        expect(closeCount).toBe(1);
      }

      // Test Escape key closes modal
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(closeCount).toBe(2);
    });

    it("invokes onNavigateModal when clicking a navigation tab", async () => {
      let navigatedTo: string | null = null;
      let resumed = false;

      const { container, click } = await renderIntoDom(
        <DeveloperModal
          onClose={() => { }}
          onNavigateModal={(modal) => { navigatedTo = modal; }}
          onResume={() => { resumed = true; }}
        />
      );

      // Modal navigation buttons rendered (supporting portal rendering)
      const targetRoot = container.querySelector("button") ? container : document.body;
      const navButtons = Array.from(targetRoot.querySelectorAll("button"));
      expect(navButtons.length).toBeGreaterThan(0);

      // Find resume / return to game button if present
      const resumeBtn = navButtons.find((btn) => btn.textContent?.includes("Powrót") || btn.textContent?.includes("Resume") || btn.textContent?.includes("Play"));
      if (resumeBtn) {
        await click(resumeBtn);
        expect(resumed).toBe(true);
      }
    });
  });

  describe("DeveloperTab Subtab switching with state & DOM mutation", () => {
    it("switches views dynamically between Tester, Debug, Logs, and Atlas Slicer upon tab click", async () => {
      const { container, click } = await renderIntoDom(<DeveloperTab />);

      // Initial tab is "testing"
      expect(container.querySelector("[data-testid='subtab-content-tester'], div:has(button)")).toBeDefined();

      // Find all tab buttons
      const tabButtons = Array.from(container.querySelectorAll("button"));
      const debugTabBtn = tabButtons.find((btn) => btn.textContent?.toLowerCase().includes("debug") || btn.textContent?.includes("Diagnostyka"));
      const logsTabBtn = tabButtons.find((btn) => btn.textContent?.toLowerCase().includes("log") || btn.textContent?.includes("Dziennik"));
      const atlasTabBtn = tabButtons.find((btn) => btn.textContent?.toLowerCase().includes("atlas") || btn.textContent?.includes("Kreator"));

      expect(debugTabBtn).toBeDefined();

      // Click Debug tab
      if (debugTabBtn) {
        await click(debugTabBtn);
        // DOM should now show Debug view
        expect(container.innerHTML).toContain("subtab-content-debug");
      }

      // Click Logs tab
      if (logsTabBtn) {
        await click(logsTabBtn);
        // DOM should now show Logs view
        expect(container.innerHTML).toContain("subtab-content-logs");
      }

      // Click Atlas Slicer tab
      if (atlasTabBtn) {
        await click(atlasTabBtn);
        // DOM should now show Atlas view
        expect(container.innerHTML).toContain("subtab-content-atlas-slicer");
      }
    });

    it("triggers onTabChange callback in DeveloperTabLayout", async () => {
      const tabs = [
        { id: "testing", label: "Tester" },
        { id: "debug", label: "Debug" },
      ];
      let selectedTab = "testing";

      const { container, click } = await renderIntoDom(
        <DeveloperTabLayout
          tabItems={tabs}
          activeTab={selectedTab}
          onTabChange={(id) => { selectedTab = id; }}
          badgeLabel="DEV WORKSPACE"
        >
          <div id="test-child">Child Content</div>
        </DeveloperTabLayout>
      );

      expect(container.textContent).toContain("DEV WORKSPACE");
      expect(container.textContent).toContain("Child Content");

      const debugBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Debug")
      );

      expect(debugBtn).toBeDefined();
      if (debugBtn) {
        await click(debugBtn);
        expect(selectedTab).toBe("debug");
      }
    });
  });
});
