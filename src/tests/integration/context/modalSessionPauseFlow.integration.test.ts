import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { GameInputEngine } from "@game/loop/input";
import { PlayerId, InputMap } from "@game/types";

class MockGameInput extends GameInputEngine {
  private activeInputs: Record<PlayerId, Partial<InputMap>> = {
    [PlayerId.Player1]: {},
    [PlayerId.Player2]: {},
  };

  public setPressed(id: PlayerId, action: keyof InputMap, pressed: boolean) {
    this.activeInputs[id][action] = pressed;
  }

  public override getInputs(id: PlayerId): InputMap {
    const custom = this.activeInputs[id];
    return {
      left: !!custom.left,
      right: !!custom.right,
      up: !!custom.up,
      down: !!custom.down,
      jump: !!custom.jump,
      action1: !!custom.action1,
      action2: !!custom.action2,
      magic1: !!custom.magic1,
      magic2: !!custom.magic2,
      potion1: !!custom.potion1,
      potion2: !!custom.potion2,
      potion3: !!custom.potion3,
    };
  }
}

describe("Modal Session Pause & Input Coordination Integration Tests", () => {
  let engine: GameEngine;
  let testInputs: MockGameInput;

  beforeEach(() => {
    testInputs = new MockGameInput();
    engine = new GameEngine({ inputs: testInputs });
    engine.resetLevel("courtyard");
  });

  afterEach(() => {
    engine.stop();
  });

  it("freezes player position and physics simulation ticks when paused during active movement input", () => {
    const p1 = engine.players[0];
    expect(p1).toBeDefined();

    // 1. Move player rightwards for 5 ticks in unpaused state
    testInputs.setPressed(PlayerId.Player1, "right", true);
    for (let i = 0; i < 5; i++) {
      engine.tick(1.0);
    }
    const movedX = p1.x;
    expect(movedX).toBeGreaterThan(0);

    // 2. Open modal -> Engine enters paused state
    engine.setPaused(true);
    expect(engine.isPaused).toBe(true);

    // 3. Attempt sustained movement while modal is open
    for (let i = 0; i < 10; i++) {
      engine.tick(1.0);
    }

    // Player position remains completely frozen while paused
    expect(p1.x).toBe(movedX);

    // 4. Close modal -> Resume game
    engine.setPaused(false);
    expect(engine.isPaused).toBe(false);

    engine.tick(1.0);
    expect(p1.x).toBeGreaterThan(movedX);
  });

  it("prevents spell casting and projectile spawning while paused", () => {
    const p1 = engine.players[0];
    p1.mana = 100;
    p1.primarySpellId = "solar_flare";
    p1.magicCooldown = 0;

    const initialProjectiles = engine.projectiles.length;
    const initialMana = p1.mana;

    // Pause the game (simulating opened modal like Inventory or Help)
    engine.setPaused(true);

    // Attempt to cast spell while modal is open
    testInputs.setPressed(PlayerId.Player1, "magic1", true);
    engine.tick(1.0);
    testInputs.setPressed(PlayerId.Player1, "magic1", false);

    expect(engine.projectiles.length).toBe(initialProjectiles);
    expect(p1.mana).toBe(initialMana);

    // Unpause and verify casting succeeds
    engine.setPaused(false);
    testInputs.setPressed(PlayerId.Player1, "magic1", true);
    engine.tick(1.0);
    testInputs.setPressed(PlayerId.Player1, "magic1", false);

    expect(engine.projectiles.length).toBeGreaterThan(initialProjectiles);
  });

  it("dispatches STATE_SNAPSHOT domain events with accurate isPaused state", () => {
    const receivedEvents: boolean[] = [];

    const unsubscribe = engine.eventBus.on("STATE_SNAPSHOT", (data) => {
      receivedEvents.push(data.isPaused);
    });

    engine.setPaused(true);
    engine.setPaused(false);

    unsubscribe();

    expect(receivedEvents).toContain(true);
    expect(receivedEvents).toContain(false);
  });
});
