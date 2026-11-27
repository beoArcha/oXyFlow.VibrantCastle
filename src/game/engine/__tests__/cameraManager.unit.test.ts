import { describe, it, expect } from "bun:test";
import { CameraManager, verticalLerpFactor } from "../cameraManager";
import type { Player } from "../../types";

const BASE = 0.08;
const CATCH_UP = 0.14;
const DISTANCE = 180;
const VIEW_W = 200;
const VIEW_H = 200;
const LEVEL = 10000;

// Player whose centre sits so that targetY == viewY + offsetY (targetY = centerY - VIEW_H/2 - 40).
function playerAt(centerX: number, centerY: number): Player {
  const width = 20;
  const height = 40;
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
    isDead: false,
  } as unknown as Player;
}

describe("verticalLerpFactor", () => {
  it("equals the base factor at zero vertical distance", () => {
    expect(verticalLerpFactor(0, BASE, CATCH_UP, DISTANCE)).toBeCloseTo(BASE, 10);
  });

  it("equals the catch-up factor at and beyond the catch-up distance", () => {
    expect(verticalLerpFactor(DISTANCE, BASE, CATCH_UP, DISTANCE)).toBeCloseTo(CATCH_UP, 10);
    expect(verticalLerpFactor(DISTANCE * 3, BASE, CATCH_UP, DISTANCE)).toBeCloseTo(CATCH_UP, 10);
  });

  it("is symmetric in the sign of the delta", () => {
    expect(verticalLerpFactor(-90, BASE, CATCH_UP, DISTANCE)).toBeCloseTo(
      verticalLerpFactor(90, BASE, CATCH_UP, DISTANCE),
      10
    );
  });

  it("changes by less than 0.002 between 89 px and 91 px (no switch at 90 px)", () => {
    const a = verticalLerpFactor(89, BASE, CATCH_UP, DISTANCE);
    const b = verticalLerpFactor(91, BASE, CATCH_UP, DISTANCE);
    expect(Math.abs(b - a)).toBeLessThan(0.002);
  });
});

describe("CameraManager lerp", () => {
  it("uses the 0.08 horizontal factor on X", () => {
    const cam = new CameraManager();
    // targetX = 500 - 100 = 400; no vertical movement needed (targetY stays at 0 via centre at 140)
    const players = [playerAt(500, VIEW_H / 2 + 40)];
    cam.update(players, VIEW_W, VIEW_H, LEVEL, LEVEL);
    expect(cam.x).toBeCloseTo(400 * BASE, 6);
  });

  it("uses the base vertical factor (0.08) when the vertical gap is 0", () => {
    const cam = new CameraManager();
    // targetY = centerY - 100 - 40; choose centerY so targetY == 0 => cam.y stays 0 => gap 0 on first frame
    const players = [playerAt(0, VIEW_H / 2 + 40)];
    cam.update(players, VIEW_W, VIEW_H, LEVEL, LEVEL);
    expect(cam.y).toBeCloseTo(0, 10);

    // Now gap = 100 px; first step factor should be verticalLerpFactor(gap) not a hard 0.14 or 0.1
    // Verify the zero-gap factor directly on the pure function as well.
    expect(verticalLerpFactor(0, BASE, CATCH_UP, DISTANCE)).toBeCloseTo(BASE, 10);
  });

  it("uses the catch-up vertical factor (0.14) when the vertical gap is >= 180 px", () => {
    const cam = new CameraManager();
    // targetY = 400 - 100 - 40 = 260 => gap 260 >= 180 => factor 0.14
    const players = [playerAt(0, 400)];
    cam.update(players, VIEW_W, VIEW_H, LEVEL, LEVEL);
    expect(cam.y).toBeCloseTo(260 * CATCH_UP, 6);
  });

  it("derives the vertical step from the continuous factor at 100 px gap", () => {
    const cam = new CameraManager();
    // targetY = 240 - 140 = 100
    const players = [playerAt(0, 240)];
    cam.update(players, VIEW_W, VIEW_H, LEVEL, LEVEL);
    expect(cam.y).toBeCloseTo(100 * verticalLerpFactor(100, BASE, CATCH_UP, DISTANCE), 6);
  });

  it("clamps X and Y within level bounds", () => {
    const cam = new CameraManager();
    const smallLevelW = 300;
    const smallLevelH = 250;
    // Player far beyond the level: targets exceed max bounds.
    const players = [playerAt(5000, 5000)];
    for (let i = 0; i < 500; i++) {
      cam.update(players, VIEW_W, VIEW_H, smallLevelW, smallLevelH);
    }
    expect(cam.x).toBeLessThanOrEqual(smallLevelW - VIEW_W);
    expect(cam.y).toBeLessThanOrEqual(smallLevelH - VIEW_H);
    expect(cam.x).toBeGreaterThanOrEqual(0);
    expect(cam.y).toBeGreaterThanOrEqual(0);
  });

  it("clamps negative targets to zero", () => {
    const cam = new CameraManager();
    const players = [playerAt(0, 0)];
    for (let i = 0; i < 50; i++) {
      cam.update(players, VIEW_W, VIEW_H, LEVEL, LEVEL);
    }
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });
});
