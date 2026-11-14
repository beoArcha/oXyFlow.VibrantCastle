import { describe, it, expect } from "bun:test";
import { gateLiftOffset, hazardTileCount, planPortcullis, type PortcullisLayout } from "../structurePlans";

describe("hazardTileCount", () => {
  it("tiles the width with the sheet's body aspect", () => {
    // 3.68 aspect at 50 px tall is 184 px per tile
    expect(hazardTileCount(368, 50, 3.68)).toBe(2);
    expect(hazardTileCount(369, 50, 3.68)).toBe(3);
  });

  it("always draws at least one tile for a narrow hazard", () => {
    expect(hazardTileCount(20, 150, 3.68)).toBe(1);
  });

  it("returns 0 when the atlas or the rect is unusable", () => {
    expect(hazardTileCount(100, 50, 0)).toBe(0);
    expect(hazardTileCount(0, 50, 3.68)).toBe(0);
    expect(hazardTileCount(100, 0, 3.68)).toBe(0);
  });
});

describe("planPortcullis", () => {
  const out = (): PortcullisLayout => ({ lintelH: 0, spikesH: 0, postW: 0, bayH: 0 });

  it("derives pixel sizes from the gate width and body aspect", () => {
    const layout = planPortcullis(36, 0.456, out());

    expect(layout.postW).toBe(4);
    expect(layout.lintelH).toBeGreaterThanOrEqual(8);
    expect(layout.bayH).toBeGreaterThanOrEqual(8);
    expect(layout.spikesH).toBeGreaterThanOrEqual(6);
  });

  it("writes into the supplied object without allocating a new one", () => {
    const target = out();

    expect(planPortcullis(38, 0.456, target)).toBe(target);
  });
});

describe("gateLiftOffset", () => {
  it("maps progress to a pixel lift clamped to the gate height", () => {
    expect(gateLiftOffset(0, 300)).toBe(0);
    expect(gateLiftOffset(0.5, 300)).toBe(150);
    expect(gateLiftOffset(1, 300)).toBe(300);
    expect(gateLiftOffset(2, 300)).toBe(300);
    expect(gateLiftOffset(-1, 300)).toBe(0);
  });
});
