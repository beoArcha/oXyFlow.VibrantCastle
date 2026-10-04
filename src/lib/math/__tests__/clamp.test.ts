import { describe, it, expect } from "bun:test";
import { clamp, clampPositiveInt } from "../clamp";

describe("lib/math/clamp", () => {
  it("clamps values within range [min, max]", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles NaN by returning min", () => {
    expect(clamp(NaN, 0, 10)).toBe(0);
  });

  it("clamps to non-negative integer via clampPositiveInt", () => {
    expect(clampPositiveInt(12.7)).toBe(13);
    expect(clampPositiveInt(-5)).toBe(0);
    expect(clampPositiveInt(undefined, 10)).toBe(10);
    expect(clampPositiveInt(null, 5)).toBe(5);
    expect(clampPositiveInt(NaN, 0)).toBe(0);
  });
});
