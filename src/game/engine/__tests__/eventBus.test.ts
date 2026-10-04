import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GameEventBus } from "../eventBus";

describe("GameEventBus", () => {
  let bus: GameEventBus;

  beforeEach(() => {
    bus = new GameEventBus();
  });

  it("subscribes and receives emitted events", () => {
    const fn = mock(() => {});
    const unsubscribe = bus.on("PLAYER_DAMAGED", fn);

    bus.emit("PLAYER_DAMAGED", {
      playerIndex: 0,
      damage: 25,
      currentHealth: 75,
      maxHealth: 100,
      source: "spike_trap",
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({
      playerIndex: 0,
      damage: 25,
      currentHealth: 75,
      maxHealth: 100,
      source: "spike_trap",
    });

    unsubscribe();
    bus.emit("PLAYER_DAMAGED", {
      playerIndex: 0,
      damage: 10,
      currentHealth: 65,
      maxHealth: 100,
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("handles multiple listeners for the same event", () => {
    const fn1 = mock(() => {});
    const fn2 = mock(() => {});

    bus.on("ITEM_CONSUMED", fn1);
    bus.on("ITEM_CONSUMED", fn2);

    expect(bus.listenerCount("ITEM_CONSUMED")).toBe(2);

    bus.emit("ITEM_CONSUMED", {
      playerIndex: 1,
      slotIndex: 0,
      itemId: "health_potion",
    });

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it("safely isolates throwing listener without affecting subsequent listeners", () => {
    const errorListener = () => {
      throw new Error("Explosion in listener");
    };
    const healthyListener = mock(() => {});

    bus.on("STATE_SNAPSHOT", errorListener);
    bus.on("STATE_SNAPSHOT", healthyListener);

    expect(() => {
      bus.emit("STATE_SNAPSHOT", {
        isPaused: true,
        isVictory: false,
        isDefeat: false,
      });
    }).not.toThrow();

    expect(healthyListener).toHaveBeenCalledTimes(1);
  });

  it("clears all listeners correctly", () => {
    bus.on("LOCATION_CHANGED", () => {});
    bus.on("NARRATION_TRIGGERED", () => {});

    expect(bus.listenerCount("LOCATION_CHANGED")).toBe(1);
    expect(bus.listenerCount("NARRATION_TRIGGERED")).toBe(1);

    bus.clear();

    expect(bus.listenerCount("LOCATION_CHANGED")).toBe(0);
    expect(bus.listenerCount("NARRATION_TRIGGERED")).toBe(0);
  });
});
