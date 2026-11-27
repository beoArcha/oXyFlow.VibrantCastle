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

  it("renders single-player HUD with full-height viewport, P1 lore status and the default controls hint and RPG buttons", async () => {
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

    // Defaults: controls hint and RPG buttons are on
    expect(container.textContent).toContain("Tryb 1P");
    expect(container.querySelector("#flank-inventory-btn")).not.toBeNull();
    expect(container.querySelector("#flank-skilltree-btn")).not.toBeNull();

    await unmount();
  });

  describe("HUD toggles (showControlsHint / showRpgButtons)", () => {
    const SETTINGS_KEY = "vibrant_castle_full_settings";

    const seedHud = (hud: Record<string, boolean>) => {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hud }));
    };

    afterEach(() => {
      window.localStorage.removeItem(SETTINGS_KEY);
    });

    const renderOverlay = () =>
      renderIntoDom(
        <TestProviders>
          <HUDOverlay
            onOpenInventory={() => {}}
            onOpenSkillTree={() => {}}
            onOpenHelp={() => {}}
            onOpenMenu={() => {}}
          />
        </TestProviders>
      );

    it("unmounts the controls hint when showControlsHint is off", async () => {
      seedHud({ showControlsHint: false });
      const { container, unmount } = await renderOverlay();

      expect(container.textContent).not.toContain("Tryb 1P");

      await unmount();
    });

    it("mounts the controls hint when showControlsHint is on", async () => {
      seedHud({ showControlsHint: true });
      const { container, unmount } = await renderOverlay();

      expect(container.textContent).toContain("Tryb 1P");

      await unmount();
    });

    it("unmounts the RPG buttons on the quick belt when showRpgButtons is off", async () => {
      seedHud({ showRpgButtons: false });
      const { container, unmount } = await renderOverlay();

      expect(container.querySelector("#flank-inventory-btn")).toBeNull();
      expect(container.querySelector("#flank-skilltree-btn")).toBeNull();

      await unmount();
    });

    it("mounts the RPG buttons on the quick belt when showRpgButtons is on", async () => {
      seedHud({ showRpgButtons: true });
      const { container, unmount } = await renderOverlay();

      expect(container.querySelector("#flank-inventory-btn")).not.toBeNull();
      expect(container.querySelector("#flank-skilltree-btn")).not.toBeNull();

      await unmount();
    });
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
