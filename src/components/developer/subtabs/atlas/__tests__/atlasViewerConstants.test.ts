import { describe, it, expect } from "bun:test";
import { TRACK_COLORS } from "../viewer";

describe("Atlas Viewer Palette & Visual Contrast Validation", () => {
  it("verifies track colors palette is uniquely identifiable and formatted validly", () => {
    expect(Array.isArray(TRACK_COLORS)).toBe(true);
    expect(TRACK_COLORS.length).toBeGreaterThanOrEqual(6);

    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    const rgbaRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0?\.\d+\s*\)$/;

    const uniqueStrokes = new Set<string>();

    TRACK_COLORS.forEach((color, idx) => {
      expect(color.stroke).toMatch(hexRegex);
      expect(color.fill).toMatch(rgbaRegex);
      expect(uniqueStrokes.has(color.stroke)).toBe(false);
      uniqueStrokes.add(color.stroke);
    });
  });
});
