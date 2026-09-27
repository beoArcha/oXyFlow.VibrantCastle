import { describe, it, expect } from "bun:test";
import { TRACK_COLORS } from "../subtabs/atlas/viewer";

describe("Atlas Viewer Configurations", () => {
  it("verifies track colors palette is defined and non-empty", () => {
    expect(Array.isArray(TRACK_COLORS)).toBe(true);
    expect(TRACK_COLORS.length).toBeGreaterThan(0);
  });
});
