import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { act } from "react";
import { useKeyboard } from "../useKeyboard";
import { PlayerId } from "@game/types";
import gameInputs from "@game/loop/input";
import { renderCustomHook, cleanupDom, TestProviders } from "@test-utils";

describe("useKeyboard Hook", () => {
  beforeEach(() => {
    gameInputs.resetToDefaults();
  });

  afterEach(async () => {
    await cleanupDom();
    gameInputs.resetToDefaults();
  });

  it("exposes default keyboard bindings for Player 1", async () => {
    const { result, unmount } = await renderCustomHook(() => useKeyboard(PlayerId.Player1), {
      wrapper: TestProviders,
    });

    expect(Array.isArray(result.current.bindings.jump)).toBe(true);
    expect(result.current.bindings.jump).toContain("Space");

    await unmount();
  });

  it("exposes default keyboard bindings for Player 2", async () => {
    const { result, unmount } = await renderCustomHook(() => useKeyboard(PlayerId.Player2), {
      wrapper: TestProviders,
    });

    expect(Array.isArray(result.current.bindings.jump)).toBe(true);
    expect(result.current.bindings.jump.length).toBeGreaterThan(0);

    await unmount();
  });

  it("switches to the other player's bindings when the player argument changes", async () => {
    gameInputs.setKeyboardBinding(PlayerId.Player2, "jump", ["KeyU"]);

    const { result, rerender, unmount } = await renderCustomHook<
      ReturnType<typeof useKeyboard>,
      PlayerId
    >((player: PlayerId) => useKeyboard(player), {
      wrapper: TestProviders,
      initialProps: PlayerId.Player1,
    });

    expect(result.current.bindings.jump).toContain("Space");

    await rerender(PlayerId.Player2);
    expect(result.current.bindings.jump).toEqual(["KeyU"]);

    await unmount();
  });

  it("setBinding rebinds the action for the hook's player", async () => {
    const { result, unmount } = await renderCustomHook(() => useKeyboard(PlayerId.Player1), {
      wrapper: TestProviders,
    });

    await act(async () => {
      result.current.setBinding("jump", "KeyZ", "z");
    });

    expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).toContain("KeyZ");
    expect(result.current.bindings.jump).toContain("KeyZ");

    await unmount();
  });

  it("resetBindings restores the default bindings for the hook's player", async () => {
    const { result, unmount } = await renderCustomHook(() => useKeyboard(PlayerId.Player1), {
      wrapper: TestProviders,
    });

    await act(async () => {
      gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyZ"]);
    });
    expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).toEqual(["KeyZ"]);

    await act(async () => {
      result.current.resetBindings();
    });

    expect(result.current.bindings.jump).toContain("Space");
    expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).toContain("Space");

    await unmount();
  });

  it("reactively updates when gameInputs.setKeyboardBinding is called externally", async () => {
    const { result, unmount } = await renderCustomHook(() => useKeyboard(PlayerId.Player1), {
      wrapper: TestProviders,
    });

    expect(result.current.bindings.jump).toContain("Space");

    await act(async () => {
      gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyW", "KeyK"]);
    });

    expect(result.current.bindings.jump).toEqual(["KeyW", "KeyK"]);

    await unmount();
  });
});
