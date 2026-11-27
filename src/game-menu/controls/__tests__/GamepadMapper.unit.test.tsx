import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import {
  setupDomEnvironment,
  cleanupDom,
  renderIntoDom,
  dispatchKeyDown,
  TestProviders,
} from "@test-utils";
import { gameInputs } from "@game/loop/input";
import { PlayerId } from "@game/types";
import { GamepadMapper } from "../GamepadMapper";

/** Bun exposes navigator.getGamepads as read-only, so tests redefine it. */
function setGetGamepads(fn: () => (Gamepad | null)[]): void {
  Object.defineProperty(navigator, "getGamepads", { value: fn, configurable: true, writable: true });
}

describe("GamepadMapper Component", () => {
  const originalGetGamepads = navigator.getGamepads;

  beforeEach(() => {
    setupDomEnvironment();
    gameInputs.resetToDefaults();
    setGetGamepads(() => [] as unknown as Gamepad[]);
  });

  afterEach(async () => {
    await cleanupDom();
    gameInputs.resetToDefaults();
    setGetGamepads(originalGetGamepads);
  });

  it("shows the disconnected state and disables remap buttons without a pad", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <GamepadMapper />
      </TestProviders>
    );

    expect(container.querySelector("#reset-gamepad-bindings-btn")).not.toBeNull();
    expect(container.querySelector("#gamepad-status-card")?.textContent).toContain(
      "Brak aktywnego pada"
    );

    const remapBtn = container.querySelector("#gamepad-binding-player1-jump button") as HTMLButtonElement | null;
    expect(remapBtn).not.toBeNull();
    expect(remapBtn?.disabled).toBe(true);

    await unmount();
  });

  it("shows the connected pad name and enables remap buttons", async () => {
    setGetGamepads(() =>
      [
        {
          id: "Xbox Controller 2026",
          index: 0,
          connected: true,
          mapping: "standard",
          axes: [0, 0],
          buttons: [{ pressed: false, touched: false, value: 0 }],
        },
      ] as unknown as Gamepad[]
    );

    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <GamepadMapper />
      </TestProviders>
    );

    expect(container.querySelector("#gamepad-status-card")?.textContent).toContain(
      "Xbox Controller 2026"
    );
    const remapBtn = container.querySelector("#gamepad-binding-player1-jump button") as HTMLButtonElement | null;
    expect(remapBtn?.disabled).toBe(false);

    await unmount();
  });

  it("enters listening mode and cancels it from the banner", async () => {
    setGetGamepads(() =>
      [{ id: "Pad", index: 0, connected: true, mapping: "standard", axes: [], buttons: [] }] as unknown as Gamepad[]
    );

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <GamepadMapper />
      </TestProviders>
    );

    expect(container.querySelector("#gamepad-listening-banner")).toBeNull();

    const remapBtn = container.querySelector("#gamepad-binding-player1-jump button") as HTMLElement;
    await click(remapBtn);
    expect(container.querySelector("#gamepad-listening-banner")).not.toBeNull();

    const cancelBtn = container.querySelector("#cancel-gamepad-rebind-btn") as HTMLElement;
    await click(cancelBtn);
    expect(container.querySelector("#gamepad-listening-banner")).toBeNull();

    await unmount();
  });

  it("switches the edited player between Player 1 and Player 2", async () => {
    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <GamepadMapper />
      </TestProviders>
    );

    expect(container.querySelector("#gamepad-binding-player1-jump")).not.toBeNull();

    const p2Button = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.getAttribute("aria-pressed") === "false" && btn.closest('[role="group"]')
    ) as HTMLElement;
    await click(p2Button);

    expect(container.querySelector("#gamepad-binding-player2-jump")).not.toBeNull();

    await unmount();
  });

  it("resets the selected player's gamepad bindings to defaults", async () => {
    gameInputs.setGamepadBinding(PlayerId.Player1, "jump", 7);
    expect(gameInputs.getGamepadBindings(PlayerId.Player1).jump).toBe(7);

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <GamepadMapper />
      </TestProviders>
    );

    const resetBtn = container.querySelector("#reset-gamepad-bindings-btn") as HTMLElement;
    await click(resetBtn);

    expect(gameInputs.getGamepadBindings(PlayerId.Player1).jump).toBe(7);

    const confirmBtn = findDialogButton("Przywróć");
    expect(confirmBtn).toBeDefined();
    await click(confirmBtn as HTMLElement);

    expect(gameInputs.getGamepadBindings(PlayerId.Player1).jump).toBe(0);
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await unmount();
  });

  it("keeps bindings unchanged when the reset confirm is cancelled with Esc", async () => {
    gameInputs.setGamepadBinding(PlayerId.Player1, "jump", 7);

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <GamepadMapper />
      </TestProviders>
    );

    await click(container.querySelector("#reset-gamepad-bindings-btn") as HTMLElement);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    await dispatchKeyDown(document.activeElement ?? document.body, "Escape");

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(gameInputs.getGamepadBindings(PlayerId.Player1).jump).toBe(7);

    await unmount();
  });

  it("focuses Anuluj by default in the reset confirm", async () => {
    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <GamepadMapper />
      </TestProviders>
    );

    await click(container.querySelector("#reset-gamepad-bindings-btn") as HTMLElement);

    const cancelBtn = findDialogButton("Anuluj");
    expect(cancelBtn).toBeDefined();
    expect(document.activeElement).toBe(cancelBtn);

    await unmount();
  });
});

function findDialogButton(label: string): HTMLElement | undefined {
  const dialog = document.querySelector('[role="dialog"]');
  return Array.from(dialog?.querySelectorAll("button") ?? []).find(
    (btn) => btn.textContent?.trim() === label
  ) as HTMLElement | undefined;
}
