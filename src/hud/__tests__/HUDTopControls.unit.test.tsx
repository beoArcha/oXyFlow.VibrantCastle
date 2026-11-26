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

  it("renders slim toolbar with location name and pause toggle without duplicated modal buttons", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDTopControls
          isPaused={false}
          onTogglePause={() => {}}
          locationName="Bastion Courtyard"
        />
      </TestProviders>
    );

    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar).not.toBeNull();
    expect(container.querySelector("#top-pause-btn")).not.toBeNull();
    expect(container.textContent).toContain("Bastion Courtyard");
    expect(container.querySelector("#top-help-btn")).toBeNull();
    expect(container.querySelector("#top-menu-btn")).toBeNull();
    expect(container.querySelector("#top-creation-btn")).toBeNull();

    await unmount();
  });

  it("dispatches pause action when pause button is clicked", async () => {
    const onTogglePause = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDTopControls
          isPaused={false}
          onTogglePause={onTogglePause}
          locationName=""
        />
      </TestProviders>
    );

    await click(container.querySelector("#top-pause-btn")!);
    expect(onTogglePause).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("reflects paused state with aria-pressed='true'", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDTopControls
          isPaused={true}
          onTogglePause={() => {}}
          locationName=""
        />
      </TestProviders>
    );

    const pauseBtn = container.querySelector("#top-pause-btn");
    expect(pauseBtn?.getAttribute("aria-pressed")).toBe("true");

    await unmount();
  });

  it("renders audio unlock button only when audio is not initialized", async () => {
    const onInitializeAudio = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDTopControls
          isPaused={false}
          onTogglePause={() => {}}
          locationName="Dziedziniec"
          isAudioInitialized={false}
          onInitializeAudio={onInitializeAudio}
        />
      </TestProviders>
    );

    const audioBtn = container.querySelector("#top-audio-btn");
    expect(audioBtn).not.toBeNull();
    await click(audioBtn!);
    expect(onInitializeAudio).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("hides audio unlock button once audio is initialized", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDTopControls
          isPaused={false}
          onTogglePause={() => {}}
          locationName="Dziedziniec"
          isAudioInitialized={true}
          onInitializeAudio={() => {}}
        />
      </TestProviders>
    );

    expect(container.querySelector("#top-audio-btn")).toBeNull();

    await unmount();
  });
});
