import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { PlayerId } from "@game/types";
import { resetKeyboardBindings, rebindKeyboardAction } from "@components/adapters";
import { HUDControlsHint } from "../HUDControlsHint";

describe("HUDControlsHint Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
    resetKeyboardBindings(PlayerId.Player1);
  });

  afterEach(async () => {
    await cleanupDom();
    resetKeyboardBindings(PlayerId.Player1);
  });

  it("renders single player badge and default attack/dash key reminders", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDControlsHint
          isAudioInitialized={true}
          onInitializeAudio={() => {}}
        />
      </TestProviders>
    );

    // Polish translation in default TestProviders
    expect(container.textContent).toContain("Tryb 1P");
    expect(container.textContent).toContain("Cięcie Miecza");
    expect(container.textContent).toContain("[J]");
    expect(container.textContent).toContain("[L]");

    await unmount();
  });

  it("shows audio enablement button when audio is not initialized and handles click", async () => {
    const onInitializeAudio = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDControlsHint
          isAudioInitialized={false}
          onInitializeAudio={onInitializeAudio}
        />
      </TestProviders>
    );

    const audioButton = container.querySelector("button");
    expect(audioButton).not.toBeNull();

    await click(audioButton!);
    expect(onInitializeAudio).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("hides audio button when isAudioInitialized is true", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDControlsHint
          isAudioInitialized={true}
          onInitializeAudio={() => {}}
        />
      </TestProviders>
    );

    const audioButton = container.querySelector("button");
    expect(audioButton).toBeNull();

    await unmount();
  });

  it("reactively updates key hints when action1 or action2 keys are rebound", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDControlsHint
          isAudioInitialized={true}
          onInitializeAudio={() => {}}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("[J]");

    await act(async () => {
      rebindKeyboardAction(PlayerId.Player1, "action1", "KeyX", "x");
    });

    expect(container.textContent).toContain("[X]");

    await unmount();
  });
});
