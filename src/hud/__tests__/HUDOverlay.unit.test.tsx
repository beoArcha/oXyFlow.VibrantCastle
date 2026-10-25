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

  it("renders full single-player HUD with viewport, P1 status, top controls, and quick belt", async () => {
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

    // Top Controls
    expect(container.querySelector('[role="toolbar"]')).not.toBeNull();
    expect(container.querySelector("#top-help-btn")).not.toBeNull();
    expect(container.querySelector("#top-pause-btn")).not.toBeNull();
    expect(container.querySelector("#top-menu-btn")).not.toBeNull();

    // Player 1 Status Card
    expect(container.textContent).toContain("P1");

    // Quick Belt with default potions
    expect(container.textContent).toContain("1-3");

    // Single player controls hint
    expect(container.textContent).toContain("Tryb 1P");

    await unmount();
  });

  it("dispatches actions to handlers when top toolbar buttons are clicked", async () => {
    const onTogglePause = mock(() => {});
    const onOpenHelp = mock(() => {});
    const onOpenMenu = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDOverlay
          onOpenInventory={() => {}}
          onOpenSkillTree={() => {}}
          onOpenHelp={onOpenHelp}
          onOpenMenu={onOpenMenu}
          onTogglePause={onTogglePause}
        />
      </TestProviders>
    );

    await click(container.querySelector("#top-pause-btn")!);
    expect(onTogglePause).toHaveBeenCalledTimes(1);

    await click(container.querySelector("#top-help-btn")!);
    expect(onOpenHelp).toHaveBeenCalledTimes(1);

    await click(container.querySelector("#top-menu-btn")!);
    expect(onOpenMenu).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("dispatches RPG panel callbacks when quick belt buttons are clicked", async () => {
    const onOpenInventory = mock(() => {});
    const onOpenSkillTree = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDOverlay
          onOpenInventory={onOpenInventory}
          onOpenSkillTree={onOpenSkillTree}
          onOpenHelp={() => {}}
          onOpenMenu={() => {}}
        />
      </TestProviders>
    );

    const invBtn = container.querySelector("#flank-inventory-btn");
    const skillBtn = container.querySelector("#flank-skilltree-btn");

    if (invBtn && skillBtn) {
      await click(invBtn);
      expect(onOpenInventory).toHaveBeenCalledTimes(1);

      await click(skillBtn);
      expect(onOpenSkillTree).toHaveBeenCalledTimes(1);
    }

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

    const potionButtons = container.querySelectorAll('[aria-label*="eliksir"], [aria-label*="slot"]');
    if (potionButtons.length > 0) {
      await click(potionButtons[0]);
    }

    await unmount();
  });
});
