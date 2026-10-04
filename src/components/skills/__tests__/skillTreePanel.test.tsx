import { describe, it, expect, mock } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { SkillTreePanel } from "../SkillTreePanel";

describe("SkillTreePanel", () => {
  it("renders modal header, constellation tree, and character tabs", async () => {
    await cleanupDom();
    const onClose = mock();

    const { unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <SkillTreePanel onClose={onClose} />
      </IntegrationTestProviders>
    );

    // Modal renders title and subtitles into document.body portal
    expect(document.body.textContent).toMatch(/Grimuar|Grimoire|Magii|Skills/);
    expect(document.body.textContent).toContain("Valen (P1)");
    expect(document.body.textContent).toContain("Aurelia (P2)");

    // Verify presence of skill tree constellation
    const nodes = document.body.querySelectorAll('[id^="skill-node-"]');
    expect(nodes.length).toBeGreaterThan(0);

    await unmount();
  });

  it("renders modal navigation tabs when navigation props are passed", async () => {
    await cleanupDom();
    const onClose = mock();
    const onNavigateModal = mock();
    const onResume = mock();

    const { unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <SkillTreePanel
          onClose={onClose}
          onNavigateModal={onNavigateModal}
          onResume={onResume}
        />
      </IntegrationTestProviders>
    );

    expect(document.body.textContent).toMatch(/Wznów|Resume/);
    await unmount();
  });

  it("calls onClose when close button is clicked", async () => {
    await cleanupDom();
    const onClose = mock();

    const { unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <SkillTreePanel onClose={onClose} />
      </IntegrationTestProviders>
    );

    const allButtons = Array.from(document.body.querySelectorAll("button"));
    const closeBtn = allButtons.find(
      (btn) =>
        btn.getAttribute("aria-label")?.toLowerCase().includes("close") ||
        btn.getAttribute("aria-label")?.toLowerCase().includes("zamknij") ||
        btn.querySelector("svg.lucide-x") !== null
    );

    expect(closeBtn).toBeDefined();
    if (closeBtn) {
      closeBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(onClose).toHaveBeenCalled();
    }

    await unmount();
  });
});
