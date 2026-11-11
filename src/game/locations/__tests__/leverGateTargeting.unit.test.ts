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

    expect(gateA.y).toBe(-1000);
    expect(gateA.animationState).toBe("open");
    expect(gateA.animationTicks).toBe(0);
    expect(gateB.y).toBe(400);
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

    expect(gateA.y).toBe(400);
    expect(gateB.y).toBe(-1000);
  });

  it("keeps legacy behaviour and warns for a lever without targetGateId", () => {
    const levers = leverEntities([{ id: "lever_a", triggerId: "trig_a" }]);
    const gate = solid("old_gate");
    const wall = solid("stone_wall");
    const floor = solid("floor");
    entities = [...levers, gate, wall, floor];
    const warn = spyOn(engineLogger, "warn").mockImplementation(() => {});

    manager.handleLeverUnlocks("trig_a");

    expect(gate.y).toBe(-1000);
    expect(wall.y).toBe(-1000);
    expect(floor.y).toBe(400);
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

    expect(gate.y).toBe(-1000);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
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
