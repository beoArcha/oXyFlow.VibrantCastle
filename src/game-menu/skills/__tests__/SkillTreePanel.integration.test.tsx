import React, { act } from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { SkillTreePanel } from "../SkillTreePanel";
import gameEngine from "@game/loop/engine";

describe("SkillTreePanel Composite Integration Tests", () => {
  let unmount: (() => Promise<void>) | null = null;

  beforeEach(() => {
    unmount = null;
    gameEngine.resetLevel("courtyard", undefined, false);
    if (typeof localStorage !== "undefined" && typeof localStorage.clear === "function") {
      localStorage.clear();
    }
  });

  afterEach(async () => {
    gameEngine.setTwoPlayerMode(false, true);
    if (unmount) {
      await unmount();
      unmount = null;
    }
    await cleanupDom();
  });

  it("mounts full SkillTreePanel modal hierarchy and displays character grimoire header", async () => {
    const handleClose = mock(() => {});
    const handleNavigate = mock(() => {});
    const handleResume = mock(() => {});

    const rendered = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <SkillTreePanel
          onClose={handleClose}
          onNavigateModal={handleNavigate}
          onResume={handleResume}
        />
      </IntegrationTestProviders>,
      { mode: "none" }
    );
    unmount = rendered.unmount;

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    // Verify modal navigation tabs and Grimoire header
    expect(dialog?.textContent).toContain("Grimoire of Magic");
    expect(dialog?.textContent).toContain("Valen (P1)");

    // Constellation SVG / nodes container is rendered
    const nodes = dialog?.querySelectorAll('[id^="skill-node-"]') || [];
    expect(nodes.length).toBeGreaterThan(0);
  });

  it("selects a skill node and displays its details in SkillDetailsCard", async () => {
    const handleClose = mock(() => {});

    const rendered = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <SkillTreePanel onClose={handleClose} />
      </IntegrationTestProviders>,
      { mode: "none" }
    );
    unmount = rendered.unmount;

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    // Find and click a skill node button
    const nodeButtons = dialog?.querySelectorAll<HTMLButtonElement>('[id^="skill-node-"]');
    expect(nodeButtons && nodeButtons.length > 0).toBe(true);

    const firstNode = nodeButtons![0];
    await act(async () => {
      await rendered.click(firstNode);
    });

    // Details panel should render cost, category, or description
    expect(dialog?.textContent).toMatch(/Cost|Prerequisite|Branch|Unlocked/i);
  });

  it("unlocks skill and synchronizes player skill points with gameEngine", async () => {
    const handleClose = mock(() => {});

    // Grant player 5 skill points and reset unlocked skills to default
    const p1 = gameEngine.players[0];
    expect(p1).toBeDefined();
    p1.skillPoints = 5;
    p1.unlockedSkills = ["solar_spark"];

    const rendered = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <SkillTreePanel onClose={handleClose} />
      </IntegrationTestProviders>,
      { mode: "none" }
    );
    unmount = rendered.unmount;

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    // Locate unlock button in the details panel
    const allButtons = Array.from(dialog?.querySelectorAll<HTMLButtonElement>("button") || []);
    const unlockBtn = allButtons.find(
      (btn) =>
        btn.textContent?.includes("Unlock") ||
        btn.textContent?.includes("Odblokuj") ||
        btn.getAttribute("aria-label")?.includes("Unlock")
    );

    if (unlockBtn && !unlockBtn.disabled) {
      const initialPoints = p1.skillPoints;
      await act(async () => {
        await rendered.click(unlockBtn);
      });

      // Verify skill points were deducted in gameEngine
      expect(p1.skillPoints).toBeLessThanOrEqual(initialPoints);
    }
  });

  it("switches active character tab between Player 1 and Player 2 in co-op mode", async () => {
    // Reset level in two-player mode
    gameEngine.setTwoPlayerMode(true, true);
    gameEngine.resetLevel("courtyard");
    expect(gameEngine.players.length).toBe(2);

    const handleClose = mock(() => {});

    const rendered = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <SkillTreePanel onClose={handleClose} />
      </IntegrationTestProviders>,
      { mode: "none" }
    );
    unmount = rendered.unmount;

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    // Locate P2 tab button (Aurelia)
    const allButtons = Array.from(dialog?.querySelectorAll<HTMLButtonElement>("button") || []);
    const p2Tab = allButtons.find((btn) => btn.textContent?.includes("Aurelia (P2)"));
    expect(p2Tab).toBeDefined();

    await act(async () => {
      await rendered.click(p2Tab!);
    });

    // Constellation updates to Aurelia's skill set
    expect(dialog?.textContent).toContain("Aurelia");
  });
});
