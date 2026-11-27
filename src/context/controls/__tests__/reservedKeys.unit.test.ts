import { describe, it, expect, beforeEach } from "bun:test";
import { PlayerId } from "@game/types";
import gameInputs from "@game/loop/input";
import {
  isReservedSystemKey,
  isRebindCancelKey,
  RESERVED_REBIND_KEYS,
} from "../reservedKeys";
import {
  rebindKeyboardAction,
  resetKeyboardBindings,
} from "@context/ControlsContext";

describe("reservedKeys helpers", () => {
  it("flags system keys by code or key", () => {
    expect(isReservedSystemKey("F1", "F1")).toBe(true);
    expect(isReservedSystemKey("F12", "F12")).toBe(true);
    expect(isReservedSystemKey("Tab", "Tab")).toBe(true);
    expect(isReservedSystemKey("MetaLeft", "Meta")).toBe(true);
    expect(isReservedSystemKey("ContextMenu", "ContextMenu")).toBe(true);
    expect(isReservedSystemKey("KeyQ", "q")).toBe(false);
    expect(RESERVED_REBIND_KEYS.has("Escape")).toBe(false);
  });

  it("treats Escape as the rebind cancel key", () => {
    expect(isRebindCancelKey("Escape", "Escape")).toBe(true);
    expect(isRebindCancelKey("KeyQ", "q")).toBe(false);
  });
});

describe("rebindKeyboardAction reserved-key guard", () => {
  const player = PlayerId.Player1;
  const action = "jump" as const;

  beforeEach(() => {
    resetKeyboardBindings(player);
  });

  it.each([
    ["F1", "F1"],
    ["F12", "F12"],
    ["Tab", "Tab"],
    ["MetaLeft", "Meta"],
    ["ContextMenu", "ContextMenu"],
    ["Escape", "Escape"],
  ])("rejects %s and leaves bindings unchanged", (code, key) => {
    const before = [...gameInputs.getKeyboardBindings(player)[action]];

    const result = rebindKeyboardAction(player, action, code, key);

    expect(result).toBe(false);
    expect(gameInputs.getKeyboardBindings(player)[action]).toEqual(before);
  });

  it("accepts a normal key and binds it", () => {
    const result = rebindKeyboardAction(player, action, "KeyQ", "q");

    expect(result).toBe(true);
    expect(gameInputs.getKeyboardBindings(player)[action]).toContain("KeyQ");
  });
});
