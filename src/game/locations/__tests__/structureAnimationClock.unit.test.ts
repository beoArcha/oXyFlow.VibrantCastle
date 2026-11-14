import { describe, it, expect } from "bun:test";
import { CollisionType } from "../../types";
import type { Entity } from "../../types";
import {
  advanceStructureAnimations,
  LEVER_ACTIVATING_TICKS,
  setStructureAnimationState,
} from "../structureAnimationClock";

const makeEntity = (type: CollisionType, extra: Partial<Entity> = {}): Entity => ({
  id: "e",
  type,
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  ...extra,
});

describe("structureAnimationClock", () => {
  it("initialises lever state to inactive at tick 0", () => {
    const lever = makeEntity(CollisionType.Lever);
    advanceStructureAnimations([lever], 1);
    expect(lever.animationState).toBe("inactive");
    expect(lever.animationTicks).toBe(0);
  });

  it("accumulates simulation time per step", () => {
    const portal = makeEntity(CollisionType.Goal);
    advanceStructureAnimations([portal], 1);
    advanceStructureAnimations([portal], 0.5);
    advanceStructureAnimations([portal], 0.5);
    expect(portal.animationTicks).toBe(1);
  });

  it("yields 60 units per second at any tick rate", () => {
    for (const hz of [30, 60, 120]) {
      const lever = makeEntity(CollisionType.Lever);
      advanceStructureAnimations([lever], 60 / hz);
      for (let i = 0; i < hz; i++) advanceStructureAnimations([lever], 60 / hz);
      expect(lever.animationTicks).toBeCloseTo(60, 6);
    }
  });

  it("resets to 0 on state change and plays from the first frame", () => {
    const lever = makeEntity(CollisionType.Lever);
    advanceStructureAnimations([lever], 1);
    advanceStructureAnimations([lever], 10);
    lever.isActivated = true;
    advanceStructureAnimations([lever], 10);
    expect(lever.animationState).toBe("activating");
    expect(lever.animationTicks).toBe(0);
    advanceStructureAnimations([lever], 2);
    expect(lever.animationTicks).toBe(2);
  });

  it("plays a pulled lever's activating animation once, then settles on active", () => {
    const lever = makeEntity(CollisionType.Lever, { isActivated: true });
    advanceStructureAnimations([lever], 1);
    expect(lever.animationState).toBe("activating");
    for (let i = 0; i < LEVER_ACTIVATING_TICKS; i++) advanceStructureAnimations([lever], 1);
    advanceStructureAnimations([lever], 1);
    expect(lever.animationState).toBe("active");
    expect(lever.animationTicks).toBe(0);
    advanceStructureAnimations([lever], 100);
    expect(lever.animationState).toBe("active");
  });

  it("only advances an already-started clock on other structures", () => {
    const idle = makeEntity(CollisionType.Solid);
    const gate = makeEntity(CollisionType.Solid);
    setStructureAnimationState(gate, "open");
    advanceStructureAnimations([idle, gate], 3);
    expect(idle.animationTicks).toBeUndefined();
    expect(gate.animationState).toBe("open");
    expect(gate.animationTicks).toBe(3);
  });

  it("setStructureAnimationState restarts only when the state changes", () => {
    const gate = makeEntity(CollisionType.Solid);
    setStructureAnimationState(gate, "open");
    advanceStructureAnimations([gate], 5);
    setStructureAnimationState(gate, "open");
    expect(gate.animationTicks).toBe(5);
    setStructureAnimationState(gate, "closed");
    expect(gate.animationTicks).toBe(0);
  });
});
