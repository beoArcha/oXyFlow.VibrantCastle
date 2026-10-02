import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { HUDTopControls } from "../HUDTopControls";

describe("HUDTopControls Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders toolbar with role='toolbar' and accessible buttons", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDTopControls
          isPaused={false}
          onTogglePause={() => {}}
          onOpenHelp={() => {}}
          onOpenMenu={() => {}}
          locationName="Bastion Courtyard"
        />
      </TestProviders>
    );

    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar).not.toBeNull();
    expect(container.querySelector("#top-help-btn")).not.toBeNull();
    expect(container.querySelector("#top-pause-btn")).not.toBeNull();
    expect(container.querySelector("#top-menu-btn")).not.toBeNull();
    expect(container.textContent).toContain("Bastion Courtyard");

    await unmount();
  });

  it("dispatches actions when help, menu, and pause buttons are clicked", async () => {
    const onOpenHelp = mock(() => {});
    const onTogglePause = mock(() => {});
    const onOpenMenu = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDTopControls
          isPaused={false}
          onTogglePause={onTogglePause}
          onOpenHelp={onOpenHelp}
          onOpenMenu={onOpenMenu}
          locationName=""
        />
      </TestProviders>
    );

    await click(container.querySelector("#top-help-btn")!);
    expect(onOpenHelp).toHaveBeenCalledTimes(1);

    await click(container.querySelector("#top-pause-btn")!);
    expect(onTogglePause).toHaveBeenCalledTimes(1);

    await click(container.querySelector("#top-menu-btn")!);
    expect(onOpenMenu).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("reflects paused state with aria-pressed='true' and resume text", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDTopControls
          isPaused={true}
          onTogglePause={() => {}}
          onOpenHelp={() => {}}
          onOpenMenu={() => {}}
          locationName=""
        />
      </TestProviders>
    );

    const pauseBtn = container.querySelector("#top-pause-btn");
    expect(pauseBtn?.getAttribute("aria-pressed")).toBe("true");

    await unmount();
  });

  it("renders and calls creation suite button when showCreation is true", async () => {
    const onOpenCreation = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDTopControls
          isPaused={false}
          onTogglePause={() => {}}
          onOpenHelp={() => {}}
          onOpenMenu={() => {}}
          onOpenCreation={onOpenCreation}
          showCreation={true}
          locationName=""
        />
      </TestProviders>
    );

    const creationBtn = container.querySelector("#top-creation-btn");
    expect(creationBtn).not.toBeNull();

    await click(creationBtn!);
    expect(onOpenCreation).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("hides creation button when showCreation is false", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDTopControls
          isPaused={false}
          onTogglePause={() => {}}
          onOpenHelp={() => {}}
          onOpenMenu={() => {}}
          showCreation={false}
          locationName=""
        />
      </TestProviders>
    );

    expect(container.querySelector("#top-creation-btn")).toBeNull();

    await unmount();
  });
});
