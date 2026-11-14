import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import { LevelLifecycleManager, ILevelLifecycleContext } from "../levelLifecycleManager";
import { CollisionType, SoundType } from "../../types";
import type { Entity } from "../../types";
import { engineLogger } from "../../logger/gameLogger";

const solid = (id: string, y = 400): Entity => ({
  id,
  type: CollisionType.Solid,
  x: 100,
  y,
  width: 40,
  height: 200,
});

const leverEntities = (
  levers: Array<{ id: string; triggerId: string; targetGateId?: string }>
): Entity[] =>
  levers.map((l) => ({
    ...l,
    type: CollisionType.Lever,
    x: 0,
    y: 0,
    width: 25,
    height: 45,
  }));

describe("LevelLifecycleManager lever -> gate targeting", () => {
  let entities: Entity[];
  let sfx: SoundType[];
  let manager: LevelLifecycleManager;

  beforeEach(() => {
    entities = [];
    sfx = [];
    const noop = () => {};
    const context = {
      getEntities: () => entities,
      playSFX: (t: SoundType) => sfx.push(t),
      triggerNarration: noop,
      spawnBurst: noop,
      notifyReact: noop,
    } as unknown as ILevelLifecycleContext;
    manager = new LevelLifecycleManager(context);
  });

  it("opens only the gate named by targetGateId", () => {
    const levers = leverEntities([
      { id: "lever_a", triggerId: "trig_a", targetGateId: "gate_a" },
      { id: "lever_b", triggerId: "trig_b", targetGateId: "gate_b" },
    ]);
    const gateA = solid("gate_a");
    const gateB = solid("gate_b");
    entities = [...levers, gateA, gateB];

    manager.handleLeverUnlocks("trig_a");

    expect(gateA.animationState).toBe("opening");
    expect(gateB.animationState).toBeUndefined();
    expect(sfx).toEqual([SoundType.SFX_UNLOCK]);
  });

  it("opens the second gate when the second lever is pulled", () => {
    const levers = leverEntities([
      { id: "lever_a", triggerId: "trig_a", targetGateId: "gate_a" },
      { id: "lever_b", triggerId: "trig_b", targetGateId: "gate_b" },
    ]);
    const gateA = solid("gate_a");
    const gateB = solid("gate_b");
    entities = [...levers, gateA, gateB];

    manager.handleLeverUnlocks("trig_b");

    expect(gateA.animationState).toBeUndefined();
    expect(gateB.animationState).toBe("opening");
  });

  it("keeps legacy behaviour and warns for a lever without targetGateId", () => {
    const levers = leverEntities([{ id: "lever_a", triggerId: "trig_a" }]);
    const gate = solid("old_gate");
    const wall = solid("stone_wall");
    const floor = solid("floor");
    entities = [...levers, gate, wall, floor];
    const warn = spyOn(engineLogger, "warn").mockImplementation(() => {});

    manager.handleLeverUnlocks("trig_a");

    expect(gate.animationState).toBe("opening");
    expect(wall.animationState).toBe("opening");
    expect(floor.animationState).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("falls back and warns when the target gate id does not exist", () => {
    const levers = leverEntities([
      { id: "lever_a", triggerId: "trig_a", targetGateId: "missing_gate" },
    ]);
    const gate = solid("some_gate");
    entities = [...levers, gate];
    const warn = spyOn(engineLogger, "warn").mockImplementation(() => {});

    manager.handleLeverUnlocks("trig_a");

    expect(gate.animationState).toBe("opening");
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("opens only the gate of the pulled lever when two levers share a triggerId", () => {
    const levers = leverEntities([
      { id: "lever_a", triggerId: "shared", targetGateId: "gate_a" },
      { id: "lever_b", triggerId: "shared", targetGateId: "gate_b" },
    ]);
    const gateA = solid("gate_a");
    const gateB = solid("gate_b");
    entities = [...levers, gateA, gateB];

    manager.handleLeverUnlocks("shared", levers[1]);

    expect(gateA.animationState).toBeUndefined();
    expect(gateB.animationState).toBe("opening");

    manager.handleLeverUnlocks("shared", levers[0]);

    expect(gateA.animationState).toBe("opening");
  });

  it("keeps the portal cooldown the same simulated time at 30, 60 and 120 Hz", () => {
    const simulateSeconds = (hz: number): number => {
      manager.portalCooldownTimer = 45;
      const stepDt = 60 / hz;
      let ticks = 0;
      while (manager.portalCooldownTimer > 0) {
        manager.decrementCooldowns(stepDt);
        ticks++;
      }
      return ticks / hz;
    };

    // The timer expires on a whole tick, so the result may overshoot by less than one tick.
    for (const hz of [30, 60, 120]) {
      const seconds = simulateSeconds(hz);
      expect(seconds).toBeGreaterThanOrEqual(0.75);
      expect(seconds).toBeLessThan(0.75 + 1 / hz);
    }
  });

  it("advances entity animation clocks through decrementCooldowns", () => {
    const lever: Entity = { ...solid("lever"), type: CollisionType.Lever };
    entities = [lever];
    manager.decrementCooldowns(0.5);
    manager.decrementCooldowns(0.5);
    manager.decrementCooldowns(0.5);
    expect(lever.animationTicks).toBe(1);
  });
});
