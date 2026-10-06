import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { act } from "react";
import { useGamepad } from "../useGamepad";
import { PlayerId } from "@game/types";
import gameInputs from "@game/loop/input";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";

describe("useGamepad Hook", () => {
  beforeEach(() => {
    gameInputs.resetToDefaults();
  });

  afterEach(async () => {
    await cleanupDom();
    gameInputs.resetToDefaults();
  });

  it("initializes with default bindings and no active listening action", async () => {
    const { result, unmount } = await renderCustomHook(() => useGamepad(PlayerId.Player1));

    expect(result.current.bindings).toBeDefined();
    expect(result.current.bindings.jump).toBeDefined();
    expect(result.current.listeningAction).toBeNull();
    expect(result.current.lastPressedButton).toBeNull();

    await unmount();
  });

  it("allows setting and clearing listeningAction", async () => {
    const { result, unmount } = await renderCustomHook(() => useGamepad(PlayerId.Player1));

    await act(async () => {
      result.current.setListeningAction("jump");
    });
    expect(result.current.listeningAction).toBe("jump");

    await act(async () => {
      result.current.setListeningAction(null);
    });
    expect(result.current.listeningAction).toBeNull();

    await unmount();
  });

  it("rebinds button when gamepad button is pressed while listening", async () => {
    // Mock navigator.getGamepads
    const mockGamepad = {
      id: "Mock Controller",
      index: 0,
      connected: true,
      timestamp: Date.now(),
      mapping: "standard",
      axes: [0, 0],
      buttons: [
        { pressed: false, touched: false, value: 0 },
        { pressed: false, touched: false, value: 0 },
        { pressed: true, touched: true, value: 1.0 }, // Button 2 pressed
      ],
      vibrationActuator: null as any,
    } as unknown as Gamepad;

    const originalGetGamepads = navigator.getGamepads;
    (navigator as any).getGamepads = () => [mockGamepad];

    const { result, unmount } = await renderCustomHook(() => useGamepad(PlayerId.Player1));

    await act(async () => {
      result.current.setListeningAction("jump");
    });

    // Wait for the on-demand polling interval (50ms) to trigger inside act
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    expect(result.current.lastPressedButton).toBe(2);
    expect(result.current.bindings.jump).toBe(2);
    expect(result.current.listeningAction).toBeNull();

    (navigator as any).getGamepads = originalGetGamepads;
    await unmount();
  });

  it("restores default gamepad bindings via resetDefaults", async () => {
    const { result, unmount } = await renderCustomHook(() => useGamepad(PlayerId.Player1));

    await act(async () => {
      gameInputs.setGamepadBinding(PlayerId.Player1, "jump", 99);
    });
    expect(gameInputs.getGamepadBindings(PlayerId.Player1).jump).toBe(99);

    await act(async () => {
      result.current.resetDefaults();
    });

    expect(result.current.bindings.jump).not.toBe(99);
    expect(gameInputs.getGamepadBindings(PlayerId.Player1).jump).not.toBe(99);

    await unmount();
  });

  it("automatically cancels listeningAction when active gamepad disconnects", async () => {
    const mockGamepad = {
      id: "Active Gamepad",
      index: 0,
      connected: true,
      timestamp: Date.now(),
      mapping: "standard",
      axes: [0, 0],
      buttons: [
        { pressed: false, touched: false, value: 0 },
      ],
      vibrationActuator: null as any,
    } as unknown as Gamepad;

    const originalGetGamepads = navigator.getGamepads;
    (navigator as any).getGamepads = () => [mockGamepad];

    const { result, unmount } = await renderCustomHook(() => useGamepad(PlayerId.Player1));

    await act(async () => {
      result.current.setListeningAction("jump");
    });
    expect(result.current.listeningAction).toBe("jump");

    // Trigger gamepad disconnect event on active pad (index 0)
    (navigator as any).getGamepads = () => [];

    await act(async () => {
      gameInputs.notifyGamepadListeners(false, {
        index: 0,
        id: "Active Gamepad",
        buttonsCount: 1,
        axesCount: 0,
      });
    });

    expect(result.current.listeningAction).toBeNull();

    (navigator as any).getGamepads = originalGetGamepads;
    await unmount();
  });

  it("reactively updates bindings when gameInputs.setGamepadBinding is called externally", async () => {
    const { result, unmount } = await renderCustomHook(() => useGamepad(PlayerId.Player1));

    const initialJump = result.current.bindings.jump;

    await act(async () => {
      gameInputs.setGamepadBinding(PlayerId.Player1, "jump", 7);
    });

    expect(result.current.bindings.jump).toBe(7);
    expect(result.current.bindings.jump).not.toBe(initialJump);

    await unmount();
  });
});
