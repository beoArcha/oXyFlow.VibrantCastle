import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { act } from "react";
import { renderCustomHook, setupDomEnvironment, cleanupDom, TestProviders } from "@test-utils";
import { gameInputs } from "@game/loop/input";
import { PlayerId } from "@game/types";
import { useKeyRebind } from "../useKeyRebind";

describe("useKeyRebind Hook", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("initializes with null bindingTarget and isRebinding false", async () => {
    const { result, unmount } = await renderCustomHook(() => useKeyRebind(), {
      wrapper: TestProviders,
    });

    expect(result.current.bindingTarget).toBeNull();
    expect(result.current.isRebinding).toBe(false);

    await unmount();
  });

  it("updates state on startRebind and cancelRebind", async () => {
    const { result, unmount } = await renderCustomHook(() => useKeyRebind(), {
      wrapper: TestProviders,
    });

    await act(async () => {
      result.current.startRebind({
        player: PlayerId.Player1,
        action: "jump",
        label: "Jump Action",
      });
    });

    expect(result.current.isRebinding).toBe(true);
    expect(result.current.bindingTarget?.action).toBe("jump");
    expect(result.current.bindingTarget?.player).toBe(PlayerId.Player1);
    expect(result.current.bindingTarget?.label).toBe("Jump Action");

    await act(async () => {
      result.current.cancelRebind();
    });

    expect(result.current.isRebinding).toBe(false);
    expect(result.current.bindingTarget).toBeNull();

    await unmount();
  });

  it("intercepts keydown event, binds key in gameInputs, and triggers onSuccess callback", async () => {
    const onSuccess = mock((_msg: string) => {});
    const originalSetKeyboardBinding = gameInputs.setKeyboardBinding;
    let boundPlayer: PlayerId | null = null;
    let boundAction = "";
    let boundKeys: string[] = [];

    gameInputs.setKeyboardBinding = (player, action, keys) => {
      boundPlayer = player;
      boundAction = action;
      boundKeys = keys;
    };

    try {
      const { result, unmount } = await renderCustomHook(() => useKeyRebind({ onSuccess }), {
        wrapper: TestProviders,
      });

      await act(async () => {
        result.current.startRebind({
          player: PlayerId.Player1,
          action: "action1",
          label: "Strike Attack",
        });
      });

      const event = new KeyboardEvent("keydown", {
        code: "KeyZ",
        key: "z",
        bubbles: true,
        cancelable: true,
      });

      await act(async () => {
        window.dispatchEvent(event);
      });

      expect(boundPlayer).toBe(PlayerId.Player1);
      expect(boundAction).toBe("action1");
      expect(boundKeys).toContain("KeyZ");
      expect(boundKeys).toContain("z");

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(result.current.bindingTarget).toBeNull();
      expect(result.current.isRebinding).toBe(false);

      await unmount();
    } finally {
      gameInputs.setKeyboardBinding = originalSetKeyboardBinding;
    }
  });

  it("formats space key cleanly", async () => {
    const onSuccess = mock((_msg: string) => {});
    const originalSetKeyboardBinding = gameInputs.setKeyboardBinding;
    gameInputs.setKeyboardBinding = () => {};

    try {
      const { result, unmount } = await renderCustomHook(() => useKeyRebind({ onSuccess }), {
        wrapper: TestProviders,
      });

      await act(async () => {
        result.current.startRebind({
          player: PlayerId.Player1,
          action: "jump",
          label: "Skok",
        });
      });

      const event = new KeyboardEvent("keydown", {
        code: "Space",
        key: " ",
        bubbles: true,
        cancelable: true,
      });

      await act(async () => {
        window.dispatchEvent(event);
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
      const callArgs = onSuccess.mock.calls as string[][];
      expect(callArgs[0]?.[0]).toContain("Skok");

      await unmount();
    } finally {
      gameInputs.setKeyboardBinding = originalSetKeyboardBinding;
    }
  });
});
