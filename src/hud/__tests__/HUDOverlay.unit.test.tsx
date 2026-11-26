import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import gameEngine from "@game/loop/engine";
import { HUDOverlay } from "../HUDOverlay";

describe("HUDOverlay Orchestrator Component", () => {
  let attachSpy: ReturnType<typeof spyOn> | undefined;
  let startSpy: ReturnType<typeof spyOn> | undefined;
  let stopSpy: ReturnType<typeof spyOn> | undefined;

  beforeEach(() => {
    setupDomEnvironment();
    attachSpy = spyOn(gameEngine, "attachCanvas").mockImplementation(() => {});
    startSpy = spyOn(gameEngine, "start").mockImplementation(() => {});
    stopSpy = spyOn(gameEngine, "stop").mockImplementation(() => {});
  });

  afterEach(async () => {
    await cleanupDom();
    attachSpy?.mockRestore();
    startSpy?.mockRestore();
    stopSpy?.mockRestore();
    gameEngine.stop();
  });

  it("renders clean single-player HUD with full-height viewport, P1 lore status, and bottom dock without floating top-center toolbar or flank clutter", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDOverlay
          onOpenInventory={() => {}}
          onOpenSkillTree={() => {}}
          onOpenHelp={() => {}}
          onOpenMenu={() => {}}
        />
      </TestProviders>
    );

    // Canvas viewport is mounted inside a full-height flex container
    expect(container.querySelector("#canvas-container-viewport")).not.toBeNull();
    expect(container.querySelector("#game-viewport-canvas")).not.toBeNull();

    // Floating top-center toolbar was merged into the top app header
    expect(container.querySelector('[role="toolbar"]')).toBeNull();
    expect(container.querySelector("#top-pause-btn")).toBeNull();
    expect(container.querySelector("#top-help-btn")).toBeNull();
    expect(container.querySelector("#top-menu-btn")).toBeNull();

    // Player 1 Status Card with Valen lore title
    expect(container.textContent).toContain("P1");
    expect(container.textContent).toContain("Słoneczny Rycerz");

    // No permanent controls hint panel cluttering the right flank
    expect(container.textContent).not.toContain("Tryb 1P");

    // No redundant RPG buttons on the quick belt dock
    expect(container.querySelector("#flank-inventory-btn")).toBeNull();
    expect(container.querySelector("#flank-skilltree-btn")).toBeNull();

    await unmount();
  });

  it("handles quick potion consumption click cleanly without errors", async () => {
    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDOverlay
          onOpenInventory={() => {}}
          onOpenSkillTree={() => {}}
          onOpenHelp={() => {}}
          onOpenMenu={() => {}}
        />
      </TestProviders>
    );

    const potionButtons = container.querySelectorAll('[aria-label*="Eliksir"], [aria-label*="slot"], [aria-label*="Mikstura"]');
    if (potionButtons.length > 0) {
      await click(potionButtons[0]);
    }

    await unmount();
  });
});
