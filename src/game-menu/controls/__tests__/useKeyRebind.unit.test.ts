import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { act } from "react";
import { renderCustomHook, setupDomEnvironment, cleanupDom, TestProviders } from "@test-utils";
import { gameInputs } from "@game/loop/input";
import { PlayerId } from "@game/types";
import { useKeyRebind } from "../useKeyRebind";

function dispatchKey(code: string, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { code, key, bubbles: true, cancelable: true });
  window.dispatchEvent(event);
  return event;
}

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

  it("captures the next keydown, binds both code and key, and fires onSuccess", async () => {
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

      await act(async () => {
        dispatchKey("KeyZ", "z");
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

  it("reports the localized space label in the success message", async () => {
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

      await act(async () => {
        dispatchKey("Space", " ");
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
      const callArgs = onSuccess.mock.calls as unknown as string[][];
      expect(callArgs[0]?.[0]).toContain("Skok");

      await unmount();
    } finally {
      gameInputs.setKeyboardBinding = originalSetKeyboardBinding;
    }
  });

  it("cancels rebinding without modifying bindings when Escape is pressed", async () => {
    const onSuccess = mock((_msg: string) => {});
    const originalSetKeyboardBinding = gameInputs.setKeyboardBinding;
    const mockSetKeyboardBinding = mock(() => {});
    gameInputs.setKeyboardBinding = mockSetKeyboardBinding as unknown as typeof gameInputs.setKeyboardBinding;

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

      expect(result.current.isRebinding).toBe(true);

      await act(async () => {
        dispatchKey("Escape", "Escape");
      });

      expect(mockSetKeyboardBinding).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(result.current.bindingTarget).toBeNull();
      expect(result.current.isRebinding).toBe(false);

      await unmount();
    } finally {
      gameInputs.setKeyboardBinding = originalSetKeyboardBinding;
    }
  });

  it("ignores reserved system keys and keeps listening for a valid key", async () => {
    const onSuccess = mock((_msg: string) => {});
    const originalSetKeyboardBinding = gameInputs.setKeyboardBinding;
    const mockSetKeyboardBinding = mock(() => {});
    gameInputs.setKeyboardBinding = mockSetKeyboardBinding as unknown as typeof gameInputs.setKeyboardBinding;

    try {
      const { result, unmount } = await renderCustomHook(() => useKeyRebind({ onSuccess }), {
        wrapper: TestProviders,
      });

      await act(async () => {
        result.current.startRebind({
          player: PlayerId.Player1,
          action: "action1",
          label: "Atak",
        });
      });

      await act(async () => {
        dispatchKey("Tab", "Tab");
      });
      await act(async () => {
        dispatchKey("F5", "F5");
      });
      await act(async () => {
        dispatchKey("MetaLeft", "Meta");
      });

      expect(mockSetKeyboardBinding).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(result.current.isRebinding).toBe(true);

      await act(async () => {
        dispatchKey("KeyX", "x");
      });

      expect(mockSetKeyboardBinding).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(result.current.isRebinding).toBe(false);

      await unmount();
    } finally {
      gameInputs.setKeyboardBinding = originalSetKeyboardBinding;
    }
  });

  it("does not listen to keydown events when no rebind is in progress", async () => {
    const onSuccess = mock((_msg: string) => {});
    const originalSetKeyboardBinding = gameInputs.setKeyboardBinding;
    const mockSetKeyboardBinding = mock(() => {});
    gameInputs.setKeyboardBinding = mockSetKeyboardBinding as unknown as typeof gameInputs.setKeyboardBinding;

    try {
      const { unmount } = await renderCustomHook(() => useKeyRebind({ onSuccess }), {
        wrapper: TestProviders,
      });

      const event = dispatchKey("KeyQ", "q");

      expect(event.defaultPrevented).toBe(false);
      expect(mockSetKeyboardBinding).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();

      await unmount();
    } finally {
      gameInputs.setKeyboardBinding = originalSetKeyboardBinding;
    }
  });
});
