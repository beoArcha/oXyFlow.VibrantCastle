import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { HUDStatusOverlay } from "../HUDStatusOverlay";

describe("HUDStatusOverlay Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("returns null when no status overlay condition is active", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDStatusOverlay
          isPaused={false}
          isVictory={false}
          isDefeat={false}
          onResume={() => {}}
          onOpenHelp={() => {}}
          onOpenMenu={() => {}}
          onNextLocation={() => {}}
          onRestart={() => {}}
        />
      </TestProviders>
    );

    expect(container.innerHTML).toBe("");
    await unmount();
  });

  it("renders Pause modal with Dialog semantics and triggers actions", async () => {
    const onResume = mock(() => {});
    const onOpenHelp = mock(() => {});
    const onOpenMenu = mock(() => {});
    const onOpenInventory = mock(() => {});
    const onOpenSkillTree = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDStatusOverlay
          isPaused={true}
          isVictory={false}
          isDefeat={false}
          onResume={onResume}
          onOpenHelp={onOpenHelp}
          onOpenMenu={onOpenMenu}
          onOpenInventory={onOpenInventory}
          onOpenSkillTree={onOpenSkillTree}
          onNextLocation={() => {}}
          onRestart={() => {}}
        />
      </TestProviders>
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(container.textContent).toContain("Gra Wstrzymana");

    await click(container.querySelector("#pause-resume-btn")!);
    expect(onResume).toHaveBeenCalledTimes(1);

    await click(container.querySelector("#pause-help-btn")!);
    expect(onOpenHelp).toHaveBeenCalledTimes(1);

    await click(container.querySelector("#pause-menu-btn")!);
    expect(onOpenMenu).toHaveBeenCalledTimes(1);

    await click(container.querySelector("#pause-inventory-btn")!);
    expect(onOpenInventory).toHaveBeenCalledTimes(1);

    await click(container.querySelector("#pause-skills-btn")!);
    expect(onOpenSkillTree).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("renders Victory modal and triggers advance, restart, and menu", async () => {
    const onNextLocation = mock(() => {});
    const onRestart = mock(() => {});
    const onOpenMenu = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDStatusOverlay
          isPaused={false}
          isVictory={true}
          isDefeat={false}
          onResume={() => {}}
          onOpenHelp={() => {}}
          onOpenMenu={onOpenMenu}
          onNextLocation={onNextLocation}
          onRestart={onRestart}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Zwycięstwo");
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();

    await click(container.querySelector("#advance-location-btn")!);
    expect(onNextLocation).toHaveBeenCalledTimes(1);

    await click(container.querySelector("#victory-restart-btn")!);
    expect(onRestart).toHaveBeenCalledTimes(1);

    await click(container.querySelector("#victory-menu-btn")!);
    expect(onOpenMenu).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("renders Defeat modal and triggers restart and menu", async () => {
    const onRestart = mock(() => {});
    const onOpenMenu = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDStatusOverlay
          isPaused={false}
          isVictory={false}
          isDefeat={true}
          onResume={() => {}}
          onOpenHelp={() => {}}
          onOpenMenu={onOpenMenu}
          onNextLocation={() => {}}
          onRestart={onRestart}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Spróbuj ponownie");
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();

    await click(container.querySelector("#defeat-restart-btn")!);
    expect(onRestart).toHaveBeenCalledTimes(1);

    await click(container.querySelector("#defeat-menu-btn")!);
    expect(onOpenMenu).toHaveBeenCalledTimes(1);

    await unmount();
  });
});
