import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { PlayerId } from "@game/types";
import { PlayerTabSelector } from "../PlayerTabSelector";

describe("PlayerTabSelector Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders tabs for Player 1 and Player 2", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <PlayerTabSelector
          selectedPlayer={PlayerId.Player1}
          onSelectPlayer={() => {}}
        />
      </TestProviders>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(2);

    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("false");

    await unmount();
  });

  it("fires onSelectPlayer when player 2 tab is clicked", async () => {
    const handleSelect = mock((_p: PlayerId) => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <PlayerTabSelector
          selectedPlayer={PlayerId.Player1}
          onSelectPlayer={handleSelect}
        />
      </TestProviders>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    const p2Tab = tabs[1] as HTMLElement;
    expect(p2Tab).not.toBeNull();

    if (p2Tab) {
      await click(p2Tab);
      expect(handleSelect).toHaveBeenCalledWith(PlayerId.Player2);
    }

    await unmount();
  });
});
