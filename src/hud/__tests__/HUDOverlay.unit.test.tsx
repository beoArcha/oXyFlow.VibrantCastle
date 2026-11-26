import { describe, it, expect, mock, spyOn, beforeEach, afterEach } from "bun:test";
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

  it("renders clean single-player HUD with viewport, P1 lore status, slim top strip, and bottom dock without flank clutter", async () => {
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

    // Canvas viewport is mounted
    expect(container.querySelector("#game-viewport-canvas")).not.toBeNull();

    // Slim Top Strip (no duplicated help/menu/creation buttons)
    expect(container.querySelector('[role="toolbar"]')).not.toBeNull();
    expect(container.querySelector("#top-pause-btn")).not.toBeNull();
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

  it("dispatches pause action when top pause button is clicked", async () => {
    const onTogglePause = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDOverlay
          onOpenInventory={() => {}}
          onOpenSkillTree={() => {}}
          onOpenHelp={() => {}}
          onOpenMenu={() => {}}
          onTogglePause={onTogglePause}
        />
      </TestProviders>
    );

    await click(container.querySelector("#top-pause-btn")!);
    expect(onTogglePause).toHaveBeenCalledTimes(1);

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
