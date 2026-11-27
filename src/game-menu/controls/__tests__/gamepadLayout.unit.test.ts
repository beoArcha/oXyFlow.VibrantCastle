import { describe, it, expect } from "bun:test";
import {
  isBindableGamepadButton,
  readPressedButtons,
  resolveGamepadCapture,
} from "../gamepadLayout";

describe("gamepadLayout restricted pad layout", () => {
  it("allows face buttons, bumpers and triggers only", () => {
    for (const index of [0, 1, 2, 3, 4, 5, 6, 7]) {
      expect(isBindableGamepadButton(index)).toBe(true);
    }
    for (const index of [8, 9, 10, 11, 12, 13, 14, 15, 16]) {
      expect(isBindableGamepadButton(index)).toBe(false);
    }
  });

  it("reads pressed button indices in ascending order", () => {
    const buttons = [{ pressed: false }, { pressed: true }, { pressed: false }, { pressed: true }];
    expect(readPressedButtons(buttons)).toEqual([1, 3]);
  });

  it("binds a newly pressed allowed button", () => {
    expect(resolveGamepadCapture([2], new Set())).toEqual({ kind: "bind", buttonIndex: 2 });
  });

  it("rejects a newly pressed button outside the restricted layout", () => {
    expect(resolveGamepadCapture([9], new Set())).toEqual({ kind: "reject", buttonIndex: 9 });
  });

  it("ignores buttons that were already held on the previous poll", () => {
    expect(resolveGamepadCapture([9], new Set([9]))).toEqual({ kind: "none" });
  });

  it("judges the lowest newly pressed button when several go down together", () => {
    expect(resolveGamepadCapture([9, 5], new Set())).toEqual({ kind: "bind", buttonIndex: 5 });
  });
});
