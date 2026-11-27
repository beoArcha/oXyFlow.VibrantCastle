import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { act } from "react";
import { useGamepad } from "../useGamepad";
import { PlayerId } from "@game/types";
import { gameInputs } from "@game/loop/input";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";

function createMockGamepad(id: string, pressed: number[] = [], buttonCount = 16): Gamepad {
  const buttons = Array.from({ length: buttonCount }, (_, index) => ({
    pressed: pressed.includes(index),
    touched: pressed.includes(index),
    value: pressed.includes(index) ? 1 : 0,
  }));
  return { id, index: 0, connected: true, mapping: "standard", axes: [0, 0], buttons } as unknown as Gamepad;
}

const waitForPoll = () => new Promise((resolve) => setTimeout(resolve, 80));

/** Bun exposes navigator.getGamepads as read-only, so tests redefine it. */
function setGetGamepads(fn: () => (Gamepad | null)[]): void {
  Object.defineProperty(navigator, "getGamepads", { value: fn, configurable: true, writable: true });
}

describe("useGamepad Hook", () => {
  const originalGetGamepads = navigator.getGamepads;

  beforeEach(() => {
    gameInputs.resetToDefaults();
  });

  afterEach(async () => {
    await cleanupDom();
    gameInputs.resetToDefaults();
    setGetGamepads(originalGetGamepads);
  });

  it("starts with the stored bindings and no capture in progress", async () => {
    setGetGamepads(() => []);
    const { result, unmount } = await renderCustomHook(() => useGamepad(PlayerId.Player1));

    expect(result.current.bindings.jump).toBe(gameInputs.getGamepadBindings(PlayerId.Player1).jump);
    expect(result.current.listeningAction).toBeNull();
    expect(result.current.lastPressedButton).toBeNull();
    expect(result.current.rejectedButton).toBeNull();

    await unmount();
  });

  it("rebinds through rebindGamepad when an allowed button is pressed while listening", async () => {
    setGetGamepads(() => [createMockGamepad("Mock Pad", [2])]);
    const setSpy = spyOn(gameInputs, "setGamepadBinding");

    const { result, unmount } = await renderCustomHook(() => useGamepad(PlayerId.Player1));

    await act(async () => {
      result.current.setListeningAction("jump");
    });
    await act(async () => {
      await waitForPoll();
    });

    expect(setSpy).toHaveBeenCalledWith(PlayerId.Player1, "jump", 2);
    expect(result.current.bindings.jump).toBe(2);
    expect(result.current.lastPressedButton).toBe(2);
    expect(result.current.listeningAction).toBeNull();

    setSpy.mockRestore();
    await unmount();
  });

  it("rejects a non-allowed button and keeps listening without rebinding", async () => {
    setGetGamepads(() => [createMockGamepad("Mock Pad", [9])]);
    const setSpy = spyOn(gameInputs, "setGamepadBinding");
    const before = gameInputs.getGamepadBindings(PlayerId.Player1).jump;

    const { result, unmount } = await renderCustomHook(() => useGamepad(PlayerId.Player1));

    await act(async () => {
      result.current.setListeningAction("jump");
    });
    await act(async () => {
      await waitForPoll();
    });

    expect(result.current.rejectedButton).toBe(9);
    expect(result.current.listeningAction).toBe("jump");
    expect(result.current.bindings.jump).toBe(before);
    expect(setSpy).not.toHaveBeenCalled();

    setSpy.mockRestore();
    await unmount();
  });

  it("restores the gamepad defaults for the player via resetDefaults", async () => {
    setGetGamepads(() => []);
    const { result, unmount } = await renderCustomHook(() => useGamepad(PlayerId.Player1));
    const defaultJump = result.current.bindings.jump;

    await act(async () => {
      gameInputs.setGamepadBinding(PlayerId.Player1, "jump", 7);
    });
    expect(result.current.bindings.jump).toBe(7);

    await act(async () => {
      result.current.resetDefaults();
    });

    expect(result.current.bindings.jump).toBe(defaultJump);
    expect(result.current.listeningAction).toBeNull();

    await unmount();
  });

  it("cancels a pending capture when the active pad disconnects", async () => {
    setGetGamepads(() => [createMockGamepad("Active Pad")]);
    const { result, unmount } = await renderCustomHook(() => useGamepad(PlayerId.Player1));

    await act(async () => {
      result.current.setListeningAction("jump");
    });
    expect(result.current.listeningAction).toBe("jump");

    setGetGamepads(() => []);
    await act(async () => {
      gameInputs.notifyGamepadListeners(false, { index: 0, id: "Active Pad", buttonsCount: 16, axesCount: 2 });
    });

    expect(result.current.listeningAction).toBeNull();

    await unmount();
  });
});
