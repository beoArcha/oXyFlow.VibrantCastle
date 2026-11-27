import { describe, it, expect } from "bun:test";
import { formatKeyLabel } from "../formatKeyLabel";

describe("formatKeyLabel", () => {
  it("returns a placeholder for empty input", () => {
    expect(formatKeyLabel("")).toBe("?");
  });

  it("formats arrow keys to unicode arrow symbols", () => {
    expect(formatKeyLabel("ArrowUp")).toBe("↑");
    expect(formatKeyLabel("ArrowDown")).toBe("↓");
    expect(formatKeyLabel("ArrowLeft")).toBe("←");
    expect(formatKeyLabel("ArrowRight")).toBe("→");
  });

  it("formats Space with default and localized labels", () => {
    expect(formatKeyLabel("Space")).toBe("Space");
    expect(formatKeyLabel(" ")).toBe("Space");
    expect(formatKeyLabel("Space", "Spacja")).toBe("Spacja");
    expect(formatKeyLabel(" ", "Spacja")).toBe("Spacja");
  });

  it("strips the Key prefix from alphabet keys", () => {
    expect(formatKeyLabel("KeyW")).toBe("W");
    expect(formatKeyLabel("KeyA")).toBe("A");
    expect(formatKeyLabel("KeyS")).toBe("S");
    expect(formatKeyLabel("KeyD")).toBe("D");
  });

  it("strips the Digit prefix from digit keys", () => {
    expect(formatKeyLabel("Digit1")).toBe("1");
    expect(formatKeyLabel("Digit9")).toBe("9");
    expect(formatKeyLabel("Digit0")).toBe("0");
  });

  it("formats numpad keys with a Num prefix", () => {
    expect(formatKeyLabel("Numpad1")).toBe("Num 1");
    expect(formatKeyLabel("NumpadEnter")).toBe("Num Enter");
  });

  it("formats modifier keys with side-aware labels", () => {
    expect(formatKeyLabel("ControlLeft")).toBe("L-Ctrl");
    expect(formatKeyLabel("ControlRight")).toBe("R-Ctrl");
    expect(formatKeyLabel("ShiftLeft")).toBe("L-Shift");
    expect(formatKeyLabel("ShiftRight")).toBe("R-Shift");
    expect(formatKeyLabel("AltLeft")).toBe("L-Alt");
    expect(formatKeyLabel("AltRight")).toBe("R-Alt");
  });

  it("formats Escape, Enter, Tab and Backspace with short labels", () => {
    expect(formatKeyLabel("Escape")).toBe("Esc");
    expect(formatKeyLabel("Enter")).toBe("Enter");
    expect(formatKeyLabel("Tab")).toBe("Tab");
    expect(formatKeyLabel("Backspace")).toBe("Bksp");
  });

  it("uppercases single-character fallbacks", () => {
    expect(formatKeyLabel("z")).toBe("Z");
  });

  it("returns the original code for unmapped multi-character codes", () => {
    expect(formatKeyLabel("F1")).toBe("F1");
    expect(formatKeyLabel("PageUp")).toBe("PageUp");
    expect(formatKeyLabel("Slash")).toBe("Slash");
  });
});
