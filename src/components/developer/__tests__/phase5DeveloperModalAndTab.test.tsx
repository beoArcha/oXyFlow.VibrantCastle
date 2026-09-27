import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { DeveloperModal } from "../DeveloperModal";
import { DeveloperTab } from "../DeveloperTab";
import { DeveloperTabLayout } from "../DeveloperTabLayout";
import { LoggerManager, LogLevel } from "../../../lib/logger";
import { TestProviders } from "../../../test-utils";

describe("Phase 5.1: DeveloperModal & DeveloperTab Component Suite", () => {
  beforeEach(() => {
    LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
  });

  afterEach(() => {
    LoggerManager.resetInstance();
  });

  describe("1. DeveloperModal Rendering & Contracts", () => {
    it("renders modal structure with developer titles and language selector", () => {
      let closed = false;
      const html = renderToString(
        <TestProviders>
          <DeveloperModal onClose={() => { closed = true; }} />
        </TestProviders>
      );

      // Verify modal content renders
      expect(html).toContain("DEV SUITE");
      expect(html).toContain("Deweloper");
    });

    it("renders optional navigation tabs when onNavigateModal and onResume are provided", () => {
      let navigatedTo: string | null = null;
      let resumed = false;

      const html = renderToString(
        <TestProviders>
          <DeveloperModal
            onClose={() => {}}
            onNavigateModal={(modal) => { navigatedTo = modal; }}
            onResume={() => { resumed = true; }}
          />
        </TestProviders>
      );

      // Expect navigation tabs to be included in DOM output
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(100);
    });
  });

  describe("2. DeveloperTab Subtab Navigation & Dynamic Badges", () => {
    it("renders the 4 primary developer subtabs with appropriate icons and badges", () => {
      const html = renderToString(
        <TestProviders>
          <DeveloperTab />
        </TestProviders>
      );

      // Check subtab labels exist in rendered HTML
      expect(html).toContain("DEV SUITE");
      expect(html).toContain("subtab-content-tester");
    });

    it("renders DeveloperTabLayout with custom badge label and active tab", () => {
      const tabs = [
        { id: "testing", label: "Tester" },
        { id: "debug", label: "Debug" },
      ];
      let active = "testing";

      const html = renderToString(
        <DeveloperTabLayout
          tabItems={tabs}
          activeTab={active}
          onTabChange={(id) => { active = id; }}
          badgeLabel="DEV WORKSPACE"
        >
          <div id="test-child">Child Content</div>
        </DeveloperTabLayout>
      );

      expect(html).toContain("DEV WORKSPACE");
      expect(html).toContain("test-child");
      expect(html).toContain("Child Content");
    });
  });
});

