import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { GameInputEngine } from "@game/loop/input";
import { PlayerId, InputMap } from "@game/types";

class ControllableInputEngine extends GameInputEngine {
  private customInputs: Record<PlayerId, Partial<InputMap>> = {
    [PlayerId.Player1]: {},
    [PlayerId.Player2]: {},
  };

  public setAction(id: PlayerId, action: keyof InputMap, pressed: boolean) {
    this.customInputs[id][action] = pressed;
  }

  public resetActions() {
    this.customInputs[PlayerId.Player1] = {};
    this.customInputs[PlayerId.Player2] = {};
  }

  public override getInputs(id: PlayerId): InputMap {
    const custom = this.customInputs[id];
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

/**
 * INTEGRATION TEST SUITE: Multi-Tick Game Loop Simulation
 *
 * Verifies real-time simulation invariants across multiple ticks (60Hz fixed update):
 * 1. Player input capture -> horizontal acceleration -> position update.
 * 2. Vertical jump impulse -> gravity trajectory -> ground collision restitution.
 * 3. Combat melee attack cooldown cycle.
 * 4. Spell casting -> projectile spawning -> projectile trajectory update.
 */
describe("Game Loop Simulation Integration Tests", () => {
  let engine: GameEngine;
  let testInputs: ControllableInputEngine;

  beforeEach(() => {
    testInputs = new ControllableInputEngine();
    engine = new GameEngine({ inputs: testInputs });
    engine.resetLevel("courtyard");
  });

  afterEach(() => {
    engine.stop();
  });

  it("advances player horizontal position upon sustained rightward movement input", () => {
    const player = engine.players[0];
    expect(player).toBeDefined();

    const startX = player.x;

    // Simulate pressing and holding "right"
    testInputs.setAction(PlayerId.Player1, "right", true);

    // Simulate 30 ticks (half a second of gameplay)
    for (let tick = 0; tick < 30; tick++) {
      engine.fixedUpdate(1.0);
    }

    testInputs.setAction(PlayerId.Player1, "right", false);

    expect(player.x).toBeGreaterThan(startX);
    expect(player.facingLeft).toBe(false);
  });

  it("simulates jump arc: upward impulse, airborne state, and landing restitution on platform", () => {
    const player = engine.players[0];
    expect(player).toBeDefined();

    // Settle player on ground platform
    for (let tick = 0; tick < 10; tick++) {
      engine.fixedUpdate(1.0);
    }

    expect(player.isGrounded).toBe(true);
    const groundY = player.y;

    // Trigger jump
    testInputs.setAction(PlayerId.Player1, "jump", true);
    engine.fixedUpdate(1.0);

    expect(player.isGrounded).toBe(false);
    expect(player.vy).toBeLessThan(0); // Upward velocity

    testInputs.setAction(PlayerId.Player1, "jump", false);

    // Run peak of jump
    for (let tick = 0; tick < 15; tick++) {
      engine.fixedUpdate(1.0);
    }
    expect(player.y).toBeLessThan(groundY); // Higher up on screen

    // Run gravity descent back to ground (60 ticks)
    for (let tick = 0; tick < 60; tick++) {
      engine.fixedUpdate(1.0);
    }

    // Player should have landed safely on the solid ground platform
    expect(player.isGrounded).toBe(true);
    expect(player.vy).toBe(0);
    expect(Math.abs(player.y - groundY)).toBeLessThanOrEqual(5);
  });

  it("executes melee attack lifecycle: initiation, hitbox duration, and cooldown reset", () => {
    const player = engine.players[0];
    expect(player).toBeDefined();

    expect(player.isAttacking).toBe(false);

    // Trigger attack (action1)
    testInputs.setAction(PlayerId.Player1, "action1", true);
    engine.fixedUpdate(1.0);

    expect(player.isAttacking).toBe(true);
    testInputs.setAction(PlayerId.Player1, "action1", false);

    // Advance beyond attack cooldown frames (typically ~25 frames)
    for (let tick = 0; tick < 40; tick++) {
      engine.fixedUpdate(1.0);
    }

    expect(player.isAttacking).toBe(false);
  });

  it("spawns projectile when casting spell and updates trajectory across simulation frames", () => {
    const player = engine.players[0];
    expect(player).toBeDefined();

    player.mana = 50;
    player.primarySpellId = "solar_flare";
    player.magicCooldown = 0;
    player.facingLeft = false;

    const initialProjectilesCount = engine.projectiles.length;

    // Trigger spell cast via magic1 input
    testInputs.setAction(PlayerId.Player1, "magic1", true);
    engine.fixedUpdate(1.0);
    testInputs.setAction(PlayerId.Player1, "magic1", false);

    expect(engine.projectiles.length).toBeGreaterThan(initialProjectilesCount);
    const projectile = engine.projectiles[engine.projectiles.length - 1];
    expect(projectile.ownerId).toBe(player.id);
    const startProjX = projectile.x;

    // Simulate 10 ticks
    for (let tick = 0; tick < 10; tick++) {
      engine.fixedUpdate(1.0);
    }

    // Solar flare moves rightwards
    expect(projectile.x).toBeGreaterThan(startProjX);
  });
});
