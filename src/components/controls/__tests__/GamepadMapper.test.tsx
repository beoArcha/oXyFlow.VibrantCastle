import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { gameInputs } from "@game/loop/input";
import { PlayerId } from "@game/types";
import { GamepadMapper } from "../GamepadMapper";

describe("GamepadMapper Component", () => {
  const originalGetGamepads = navigator.getGamepads;

  beforeEach(() => {
    setupDomEnvironment();
    gameInputs.resetToDefaults();
    navigator.getGamepads = () => [] as any;
  });

  afterEach(async () => {
    await cleanupDom();
    gameInputs.resetToDefaults();
    navigator.getGamepads = originalGetGamepads;
  });

  it("renders disconnected state when no gamepad is plugged in", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <GamepadMapper />
      </TestProviders>
    );

    // Header and Reset button
    expect(container.querySelector("#reset-gamepad-bindings-btn")).not.toBeNull();

    // Gamepad status card
    const statusCard = container.querySelector("#gamepad-status-card");
    expect(statusCard).not.toBeNull();
    expect(statusCard?.textContent).toContain("Brak aktywnego pada");

    // Action binding rows exist
    const jumpRow = container.querySelector("#gamepad-binding-player1-jump");
    expect(jumpRow).not.toBeNull();

    // Rebind button is disabled when no gamepad is connected
    const remapBtn = jumpRow?.querySelector("button");
    expect(remapBtn).not.toBeNull();
    expect(remapBtn?.disabled).toBe(true);

    await unmount();
  });

  it("renders connected gamepad name and enables rebind buttons", async () => {
    const mockGamepad = {
      id: "Xbox Controller 2026",
      index: 0,
      connected: true,
      timestamp: Date.now(),
      mapping: "standard",
      axes: [0, 0],
      buttons: [
        { pressed: false, touched: false, value: 0 },
        { pressed: false, touched: false, value: 0 },
      ],
      vibrationActuator: null as any,
    } as unknown as Gamepad;

    navigator.getGamepads = () => [mockGamepad] as any;

    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <GamepadMapper />
      </TestProviders>
    );

    const statusCard = container.querySelector("#gamepad-status-card");
    expect(statusCard?.textContent).toContain("Xbox Controller 2026");

    const jumpRow = container.querySelector("#gamepad-binding-player1-jump");
    const remapBtn = jumpRow?.querySelector("button");
    expect(remapBtn).not.toBeNull();
    expect(remapBtn?.disabled).toBe(false);

    await unmount();
  });

  it("allows entering listening mode and cancelling it", async () => {
    const mockGamepad = {
      id: "Gothic DualSense Controller",
      index: 0,
      connected: true,
      timestamp: Date.now(),
      mapping: "standard",
      axes: [0, 0],
      buttons: [],
      vibrationActuator: null as any,
    } as unknown as Gamepad;

    navigator.getGamepads = () => [mockGamepad] as any;

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <GamepadMapper />
      </TestProviders>
    );

    // Initial state: listening banner is not visible
    expect(container.querySelector("#gamepad-listening-banner")).toBeNull();

    // Click remap on jump action
    const jumpRow = container.querySelector("#gamepad-binding-player1-jump");
    const remapBtn = jumpRow?.querySelector("button");
    expect(remapBtn).not.toBeNull();

    if (remapBtn) {
      await click(remapBtn);
    }

    // Listening banner is now displayed
    const banner = container.querySelector("#gamepad-listening-banner");
    expect(banner).not.toBeNull();

    // Click cancel in banner
    const cancelBtn = container.querySelector("#cancel-gamepad-rebind-btn") as HTMLElement;
    expect(cancelBtn).not.toBeNull();
    await click(cancelBtn);

    // Banner is removed
    expect(container.querySelector("#gamepad-listening-banner")).toBeNull();

    await unmount();
  });

  it("switches selected player between Player 1 and Player 2", async () => {
    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <GamepadMapper />
      </TestProviders>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(2);
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");

    const p2Tab = tabs[1] as HTMLElement;
    await click(p2Tab);

    expect(p2Tab.getAttribute("aria-selected")).toBe("true");
    expect(container.querySelector("#gamepad-binding-player2-jump")).not.toBeNull();

    await unmount();
  });

  it("opens confirmation dialog before resetting default gamepad bindings", async () => {
    gameInputs.setGamepadBinding(PlayerId.Player1, "jump", 15);
    expect(gameInputs.getGamepadBindings(PlayerId.Player1).jump).toBe(15);

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <GamepadMapper />
      </TestProviders>
    );

    expect(document.querySelector('[role="dialog"]')).toBeNull();

    const resetBtn = container.querySelector("#reset-gamepad-bindings-btn") as HTMLElement;
    expect(resetBtn).not.toBeNull();
    await click(resetBtn);

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();

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

    // Default binding restored in gameInputs (default jump button for P1 is 0)
    expect(gameInputs.getGamepadBindings(PlayerId.Player1).jump).toBe(0);

    await unmount();
  });
});
