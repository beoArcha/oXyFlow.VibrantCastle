import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React, { useState } from "react";
import { Keyboard } from "lucide-react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { PlayerId } from "@game/types";
import { ControlsMapperCard } from "../ControlsMapperCard";

describe("ControlsMapperCard Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders title, titleIcon, reset button, and children inside the grid", async () => {
    const onResetDefaults = mock(() => {});
    const onSelectPlayer = mock(() => {});

    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <ControlsMapperCard
          title="Test Controls"
          titleIcon={<Keyboard className="w-5 h-5 test-icon" />}
          resetBtnId="test-reset-btn"
          onResetDefaults={onResetDefaults}
          selectedPlayer={PlayerId.Player1}
          onSelectPlayer={onSelectPlayer}
          gridId="test-grid"
        >
          <div data-testid="child-item">Action 1</div>
        </ControlsMapperCard>
      </TestProviders>
    );

    // Title and icon
    expect(container.textContent).toContain("Test Controls");
    expect(container.querySelector(".test-icon")).not.toBeNull();

    // Reset button
    const resetBtn = container.querySelector("#test-reset-btn");
    expect(resetBtn).not.toBeNull();

    // Grid and children
    const grid = container.querySelector("#test-grid");
    expect(grid).not.toBeNull();
    expect(container.querySelector('[data-testid="child-item"]')).not.toBeNull();

    await unmount();
  });

  it("renders optional beforeGrid element when provided", async () => {
    const onResetDefaults = mock(() => {});
    const onSelectPlayer = mock(() => {});

    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <ControlsMapperCard
          title="Test Controls"
          titleIcon={<Keyboard />}
          resetBtnId="test-reset-btn"
          onResetDefaults={onResetDefaults}
          selectedPlayer={PlayerId.Player1}
          onSelectPlayer={onSelectPlayer}
          beforeGrid={<div id="test-banner">Banner Content</div>}
        >
          <div>Child</div>
        </ControlsMapperCard>
      </TestProviders>
    );

    expect(container.querySelector("#test-banner")).not.toBeNull();
    expect(container.querySelector("#test-banner")?.textContent).toBe("Banner Content");

    await unmount();
  });

  it("calls onSelectPlayer when player tab is clicked", async () => {
    const onResetDefaults = mock(() => {});
    const onSelectPlayer = mock((_p: PlayerId) => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <ControlsMapperCard
          title="Test Controls"
          titleIcon={<Keyboard />}
          resetBtnId="test-reset-btn"
          onResetDefaults={onResetDefaults}
          selectedPlayer={PlayerId.Player1}
          onSelectPlayer={onSelectPlayer}
        >
          <div>Child</div>
        </ControlsMapperCard>
      </TestProviders>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(2);

    const p2Tab = tabs[1] as HTMLElement;
    await click(p2Tab);

    expect(onSelectPlayer).toHaveBeenCalledTimes(1);
    expect(onSelectPlayer.mock.calls[0]?.[0]).toBe(PlayerId.Player2);

    await unmount();
  });

  it("opens ConfirmDialog on reset click and executes onResetDefaults on confirmation", async () => {
    const onResetDefaults = mock(() => {});
    const onSelectPlayer = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <ControlsMapperCard
          title="Test Controls"
          titleIcon={<Keyboard />}
          resetBtnId="test-reset-btn"
          onResetDefaults={onResetDefaults}
          selectedPlayer={PlayerId.Player1}
          onSelectPlayer={onSelectPlayer}
        >
          <div>Child</div>
        </ControlsMapperCard>
      </TestProviders>
    );

    // Initial state: dialog closed
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    // Click reset button
    const resetBtn = container.querySelector("#test-reset-btn") as HTMLElement;
    await click(resetBtn);

    // Dialog is open
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();

    // Find confirm button
    const allButtons = Array.from(dialog?.querySelectorAll("button") || []);
    const confirmBtn = allButtons.find(
      (btn) =>
        btn.textContent?.includes("Przywróć") ||
        btn.textContent?.includes("Reset")
    );
    expect(confirmBtn).toBeDefined();

    if (confirmBtn) {
      await click(confirmBtn);
      expect(onResetDefaults).toHaveBeenCalledTimes(1);
    }

    await unmount();
  });

  it("closes ConfirmDialog when cancelled without calling onResetDefaults", async () => {
    const onResetDefaults = mock(() => {});
    const onSelectPlayer = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <ControlsMapperCard
          title="Test Controls"
          titleIcon={<Keyboard />}
          resetBtnId="test-reset-btn"
          onResetDefaults={onResetDefaults}
          selectedPlayer={PlayerId.Player1}
          onSelectPlayer={onSelectPlayer}
        >
          <div>Child</div>
        </ControlsMapperCard>
      </TestProviders>
    );

    const resetBtn = container.querySelector("#test-reset-btn") as HTMLElement;
    await click(resetBtn);

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();

    const allButtons = Array.from(dialog?.querySelectorAll("button") || []);
    const cancelBtn = allButtons.find(
      (btn) =>
        btn.textContent?.includes("Anuluj") ||
        btn.textContent?.includes("Cancel")
    );
    expect(cancelBtn).toBeDefined();

    if (cancelBtn) {
      await click(cancelBtn);
      expect(onResetDefaults).not.toHaveBeenCalled();
    }

    await unmount();
  });
});
