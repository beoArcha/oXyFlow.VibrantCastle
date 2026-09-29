import { describe, it, expect } from "bun:test";
import { formatKeyLabel } from "../formatKeyLabel";

describe("formatKeyLabel", () => {
  it("returns empty string for empty input", () => {
    expect(formatKeyLabel("")).toBe("");
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

  it("strips Key prefix from standard alphabet keys", () => {
    expect(formatKeyLabel("KeyW")).toBe("W");
    expect(formatKeyLabel("KeyA")).toBe("A");
    expect(formatKeyLabel("KeyS")).toBe("S");
    expect(formatKeyLabel("KeyD")).toBe("D");
  });

  it("strips Digit prefix from standard digit keys", () => {
    expect(formatKeyLabel("Digit1")).toBe("1");
    expect(formatKeyLabel("Digit9")).toBe("9");
    expect(formatKeyLabel("Digit0")).toBe("0");
  });

  it("formats numpad keys with Num prefix", () => {
    expect(formatKeyLabel("Numpad1")).toBe("Num 1");
    expect(formatKeyLabel("NumpadEnter")).toBe("Num Enter");
  });

  it("formats modifier and control keys", () => {
    expect(formatKeyLabel("ControlLeft")).toBe("Ctrl");
    expect(formatKeyLabel("ControlRight")).toBe("Ctrl");
    expect(formatKeyLabel("ShiftLeft")).toBe("Shift");
    expect(formatKeyLabel("ShiftRight")).toBe("Shift");
    expect(formatKeyLabel("AltLeft")).toBe("Alt");
    expect(formatKeyLabel("Escape")).toBe("Esc");
    expect(formatKeyLabel("Enter")).toBe("Enter");
    expect(formatKeyLabel("Tab")).toBe("Tab");
    expect(formatKeyLabel("Backspace")).toBe("Backspace");
  });

  it("returns original string as fallback for unknown keys", () => {
    expect(formatKeyLabel("F1")).toBe("F1");
    expect(formatKeyLabel("PageUp")).toBe("PageUp");
  });
});
