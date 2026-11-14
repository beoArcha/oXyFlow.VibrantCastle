import { describe, it, expect } from "bun:test";
import { CollisionType } from "../../types";
import type { Entity } from "../../types";
import { CollisionEngine } from "../collisions";
import { advanceStructureAnimations } from "../../locations/structureAnimationClock";
import { GATE_OPEN_TICKS, beginOpeningGate, gateOpenProgress, isGateOpen } from "../gateState";

const makeGate = (): Entity => ({
  id: "gate",
  type: CollisionType.Solid,
  x: 100,
  y: 300,
  width: 36,
  height: 200,
});

const runSeconds = (gate: Entity, seconds: number, hz: number): void => {
  const steps = Math.round(seconds * hz);
  for (let i = 0; i < steps; i++) advanceStructureAnimations([gate], 60 / hz);
};

describe("gate opening", () => {
  it("starts closed with full collision height and no state", () => {
    const gate = makeGate();

    advanceStructureAnimations([gate], 10);

    expect(gate.height).toBe(200);
    expect(gateOpenProgress(gate)).toBe(0);
    expect(isGateOpen(gate)).toBe(false);
  });

  it("shrinks the collision height from the bottom while the top stays fixed", () => {
    const gate = makeGate();
    beginOpeningGate(gate);

    runSeconds(gate, 0.6, 60);

    expect(gate.y).toBe(300);
    expect(gate.height).toBe(100);
    expect(gateOpenProgress(gate)).toBeCloseTo(0.5, 6);
    expect(isGateOpen(gate)).toBe(false);
  });

  it("is fully open with no collision after 1.2 s at any tick rate", () => {
    for (const hz of [30, 60, 120]) {
      const gate = makeGate();
      beginOpeningGate(gate);

      runSeconds(gate, 1.2, hz);

      expect(isGateOpen(gate)).toBe(true);
      expect(gate.height).toBe(0);
      expect(gate.gateBaseHeight).toBe(200);
    }
  });

  it("never lets the collision height grow while opening", () => {
    const gate = makeGate();
    beginOpeningGate(gate);
    let previous = gate.height;

    for (let i = 0; i < GATE_OPEN_TICKS + 10; i++) {
      advanceStructureAnimations([gate], 1);
      expect(gate.height).toBeLessThanOrEqual(previous);
      previous = gate.height;
    }
  });

  it("freezes while the clock is not advanced (paused simulation)", () => {
    const gate = makeGate();
    beginOpeningGate(gate);
    runSeconds(gate, 0.3, 60);
    const heightBefore = gate.height;
    const ticksBefore = gate.animationTicks;

    advanceStructureAnimations([gate], 0);

    expect(gate.height).toBe(heightBefore);
    expect(gate.animationTicks).toBe(ticksBefore);
  });

  it("is idempotent: pulling the lever again does not restart the animation", () => {
    const gate = makeGate();
    expect(beginOpeningGate(gate)).toBe(true);
    runSeconds(gate, 0.5, 60);
    const ticks = gate.animationTicks;

    expect(beginOpeningGate(gate)).toBe(false);

    expect(gate.animationTicks).toBe(ticks);
    expect(gate.gateBaseHeight).toBe(200);
  });

  it("ignores non-solid entities", () => {
    const lever: Entity = { id: "l", type: CollisionType.Lever, x: 0, y: 0, width: 10, height: 10 };

    expect(beginOpeningGate(lever)).toBe(false);
    expect(lever.gateBaseHeight).toBeUndefined();
  });

  it("releases the floor below the lifting grid but still blocks the part above the gap", () => {
    const engine = new CollisionEngine();
    const gate = makeGate();
    beginOpeningGate(gate);
    runSeconds(gate, 0.6, 60);
    const standingBelow = { x: 100, y: 440, width: 30, height: 56 };
    const walkingInAtTop = { x: 100, y: 320, width: 30, height: 56 };

    expect(engine.checkIntersection(standingBelow, gate)).toBe(false);
    expect(engine.checkIntersection(walkingInAtTop, gate)).toBe(true);
  });
});
