import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { gameInputs } from "@game/loop/input";
import { PlayerId } from "@game/types";
import { KeyboardMapper } from "../KeyboardMapper";

describe("KeyboardMapper Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
    gameInputs.resetToDefaults();
  });

  afterEach(async () => {
    await cleanupDom();
    gameInputs.resetToDefaults();
  });

  it("renders keyboard mapper header, player tabs, and action binding rows", async () => {
    const onStartRebind = mock(() => {});

    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <KeyboardMapper onStartRebind={onStartRebind} />
      </TestProviders>
    );

    // Header and Reset button
    expect(container.querySelector("#reset-keyboard-bindings-btn")).not.toBeNull();

    // Player tabs
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(2);

    // Action binding rows grid
    const bindingsGrid = container.querySelector("#keyboard-bindings-grid");
    expect(bindingsGrid).not.toBeNull();

    // Key binding elements exist (e.g. Jump action)
    const jumpBinding = container.querySelector("#key-binding-player1-jump");
    expect(jumpBinding).not.toBeNull();
    expect(jumpBinding?.textContent).toContain("Spacja");

    await unmount();
  });

  it("switches selected player between Player 1 and Player 2", async () => {
    const onStartRebind = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <KeyboardMapper onStartRebind={onStartRebind} />
      </TestProviders>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");

    // Click Player 2 tab
    const p2Tab = tabs[1] as HTMLElement;
    await click(p2Tab);

    // Player 2 bindings are now displayed
    expect(p2Tab.getAttribute("aria-selected")).toBe("true");
    const p2Jump = container.querySelector("#key-binding-player2-jump");
    expect(p2Jump).not.toBeNull();

    await unmount();
  });

  it("invokes onStartRebind callback when remap button is clicked", async () => {
    const onStartRebind = mock((_action: any, _player: any, _label: any) => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <KeyboardMapper onStartRebind={onStartRebind} />
      </TestProviders>
    );

    const jumpRow = container.querySelector("#key-binding-player1-jump");
    expect(jumpRow).not.toBeNull();

    const remapBtn = jumpRow?.querySelector("button");
    expect(remapBtn).not.toBeNull();

    if (remapBtn) {
      await click(remapBtn);
      expect(onStartRebind).toHaveBeenCalledTimes(1);
      expect(onStartRebind.mock.calls[0]?.[0]).toBe("jump");
      expect(onStartRebind.mock.calls[0]?.[1]).toBe(PlayerId.Player1);
    }

    await unmount();
  });

  it("opens confirmation dialog before resetting default bindings", async () => {
    // Custom binding first
    gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyZ"]);
    expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).toEqual(["KeyZ"]);

    const onStartRebind = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <KeyboardMapper onStartRebind={onStartRebind} />
      </TestProviders>
    );

    // Initial state: dialog is not open
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    // Click reset defaults button
    const resetBtn = container.querySelector("#reset-keyboard-bindings-btn") as HTMLElement;
    expect(resetBtn).not.toBeNull();
    await click(resetBtn);

    // Dialog is now open
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();

    // Confirm button has the confirm label text (Przywróć / Reset)
    const allButtons = Array.from(dialog?.querySelectorAll("button") || []);
    const confirmBtn = allButtons.find(
      (btn) =>
        btn.textContent?.includes("Przywróć") ||
        btn.textContent?.includes("Reset")
    );

    expect(confirmBtn).toBeDefined();
    if (confirmBtn) {
      await click(confirmBtn);
    }

    // Default binding restored in gameInputs
    expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).toContain("Space");

    await unmount();
  });
});
