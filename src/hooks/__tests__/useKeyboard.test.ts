import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { act } from "react";
import { useKeyboard } from "../useKeyboard";
import { PlayerId } from "@game/types";
import gameInputs from "@game/loop/input";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";

describe("useKeyboard Hook", () => {
  beforeEach(() => {
    gameInputs.resetToDefaults();
  });

  afterEach(async () => {
    await cleanupDom();
    gameInputs.resetToDefaults();
  });

  it("initializes with default keyboard bindings for Player 1", async () => {
    const { result, unmount } = await renderCustomHook(() => useKeyboard(PlayerId.Player1));

    expect(result.current.bindings).toBeDefined();
    expect(result.current.bindings.jump).toBeDefined();
    expect(Array.isArray(result.current.bindings.jump)).toBe(true);
    expect(result.current.bindings.jump).toContain("Space");

    await unmount();
  });

  it("initializes with default keyboard bindings for Player 2", async () => {
    const { result, unmount } = await renderCustomHook(() => useKeyboard(PlayerId.Player2));

    expect(result.current.bindings).toBeDefined();
    expect(result.current.bindings.jump).toBeDefined();
    expect(Array.isArray(result.current.bindings.jump)).toBe(true);

    await unmount();
  });

  it("updates bindings when selectedPlayer changes via rerender", async () => {
    const { result, rerender, unmount } = await renderCustomHook<
      ReturnType<typeof useKeyboard>,
      PlayerId
    >((player: PlayerId) => useKeyboard(player), PlayerId.Player1);

    const p1Jump = result.current.bindings.jump;
    expect(p1Jump).toContain("Space");

    await rerender(PlayerId.Player2);
    const p2Jump = result.current.bindings.jump;
    expect(p2Jump).toBeDefined();

    await unmount();
  });

  it("restores default bindings when resetDefaults is called", async () => {
    const { result, unmount } = await renderCustomHook(() => useKeyboard(PlayerId.Player1));

    // Manually mutate binding in gameInputs
    gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyZ"]);
    expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).toEqual(["KeyZ"]);

    // Call resetDefaults through hook
    await act(async () => {
      result.current.resetDefaults();
    });

    expect(result.current.bindings.jump).toContain("Space");
    expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).toContain("Space");

    await unmount();
  });
});
