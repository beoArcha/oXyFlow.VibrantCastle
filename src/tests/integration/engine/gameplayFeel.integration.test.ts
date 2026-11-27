/**
 * Gameplay Feel Metrics (60 Hz fixed-step, courtyard location)
 *
 * | Metric | Measured | Target | Gap / Notes |
 * | :--- | :--- | :--- | :--- |
 * | Tap jump apex height (1 tick) | 45.05 px | > 0 px | Meets target |
 * | Hold jump apex height (20 ticks) | 132.93 px | >= 1.5x tap | Meets target |
 * | Hold / Tap jump height ratio | 2.95x | >= 1.50x | Meets target (+1.45x margin) |
 * | Tap jump air time | 29 ticks (483.3 ms) | > 0 | Meets target |
 * | Hold jump air time | 51 ticks (850.0 ms) | > tap | Meets target |
 * | Run-jump horizontal distance | 259.20 px | > 0 px | Meets target |
 * | Ticks to top speed (4.8 px/tick) | 7 ticks (116.7 ms) | <= 15 ticks | Meets target |
 * | Coyote time window | 6 ticks (100.0 ms) | 80-120 ms | Meets target (maxCoyoteFrames = 6) |
 * | Jump buffer window | 6 ticks (100.0 ms) | 100-150 ms | At lower bound (maxJumpBufferFrames = 6) |
 * | Mid-air direction reversal | 9 ticks (150.0 ms) | responsive | Meets target (airAcceleration = 0.55) |
 * | Player i-frames on hit | Not implemented | > 0 ticks | Gap: Player lacks damageTimer / i-frames |
 * | Enemy contact damage | Not implemented | HP loss + knockback | Gap: EnemyAISystem deals no contact damage |
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { GameInputEngine } from "@game/loop/input";
import { debugManager } from "@game/debug/debugManager";
import { LocationId } from "@game/locations/types";
import { CollisionType, InputMap, PlayerId } from "@game/types";

class ScriptedInputEngine extends GameInputEngine {
  private actions: Record<PlayerId, Partial<InputMap>> = {
    [PlayerId.Player1]: {},
    [PlayerId.Player2]: {},
  };

  public setAction(id: PlayerId, action: keyof InputMap, pressed: boolean): void {
    this.actions[id][action] = pressed;
  }

  public clearAll(): void {
    this.actions[PlayerId.Player1] = {};
    this.actions[PlayerId.Player2] = {};
  }

  public override getInputs(id: PlayerId): InputMap {
    const custom = this.actions[id];
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

interface HeroSnapshot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  isJumping: boolean;
  facingLeft: boolean;
  health: number;
  maxHealth: number;
  isDead: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
}

interface GameplayFeelHarness {
  engine: GameEngine;
  inputs: ScriptedInputEngine;
  placeHero: (x: number, y: number) => void;
  setInput: (action: keyof InputMap, pressed: boolean) => void;
  clearInputs: () => void;
  step: (ticks?: number) => void;
  snapshot: () => HeroSnapshot;
}

function createGameplayFeelHarness(locationId: LocationId = "courtyard"): GameplayFeelHarness {
  const inputs = new ScriptedInputEngine();
  const engine = new GameEngine({ inputs });
  engine.resetLevel(locationId);

  const getHero = () => engine.players[0];

  return {
    engine,
    inputs,
    placeHero(x: number, y: number) {
      const hero = getHero();
      hero.x = x;
      hero.y = y;
      hero.vx = 0;
      hero.vy = 0;
      hero.isGrounded = false;
      hero.wasGrounded = false;
      hero.isJumping = false;
      hero.coyoteTimer = 0;
      hero.jumpBufferTimer = 0;
      hero.jumpHoldTimer = 0;
    },
    setInput(action: keyof InputMap, pressed: boolean) {
      inputs.setAction(PlayerId.Player1, action, pressed);
    },
    clearInputs() {
      inputs.clearAll();
    },
    step(ticks: number = 1) {
      for (let i = 0; i < ticks; i++) {
        engine.fixedUpdate(1.0);
      }
    },
    snapshot(): HeroSnapshot {
      const hero = getHero();
      return {
        x: hero.x,
        y: hero.y,
        vx: hero.vx,
        vy: hero.vy,
        width: hero.width,
        height: hero.height,
        isGrounded: hero.isGrounded,
        isJumping: hero.isJumping,
        facingLeft: hero.facingLeft,
        health: hero.health,
        maxHealth: hero.maxHealth,
        isDead: hero.isDead,
        coyoteTimer: hero.coyoteTimer,
        jumpBufferTimer: hero.jumpBufferTimer,
      };
    },
  };
}

function measureJump(harness: GameplayFeelHarness, holdTicks: number): {
  apexHeight: number;
  airTicks: number;
} {
  harness.placeHero(200, 800);
  harness.step(10);
  const groundY = harness.snapshot().y;

  let minY = groundY;
  let airTicks = 0;

  harness.setInput("jump", true);
  for (let tick = 0; tick < 120; tick++) {
    if (tick === holdTicks) {
      harness.setInput("jump", false);
    }
    harness.step(1);
    const snap = harness.snapshot();
    if (snap.y < minY) {
      minY = snap.y;
    }
    if (!snap.isGrounded) {
      airTicks++;
    } else if (tick > 0) {
      break;
    }
  }
  harness.clearInputs();

  return {
    apexHeight: groundY - minY,
    airTicks,
  };
}

describe("Given the deterministic 60 Hz gameplay simulation harness", () => {
  let harness: GameplayFeelHarness;

  beforeEach(() => {
    debugManager.state.godMode = false;
    debugManager.state.freezeAI = false;
    debugManager.state.noClip = false;
    harness = createGameplayFeelHarness("courtyard");
  });

  afterEach(() => {
    harness.engine.stop();
    debugManager.state.godMode = false;
  });

  describe("When measuring tap vs hold jump height and air time", () => {
    it("Then holding jump produces at least 1.5x the apex height and longer air time than a 1-tick tap", () => {
      // Given
      const tap = measureJump(harness, 1);

      // When
      const hold = measureJump(harness, 20);

      // Then
      const ratio = hold.apexHeight / tap.apexHeight;
      expect(tap.apexHeight).toBeGreaterThan(0);
      expect(hold.apexHeight).toBeGreaterThan(tap.apexHeight);
      expect(ratio).toBeGreaterThanOrEqual(1.5);
      expect(hold.airTicks).toBeGreaterThan(tap.airTicks);
    });
  });

  describe("When performing a full-speed run-jump across flat ground", () => {
    it("Then it covers a deterministic horizontal distance before landing", () => {
      // Given
      harness.placeHero(140, 800);
      harness.step(10);

      // When
      harness.setInput("right", true);
      harness.step(15);
      const jumpStartX = harness.snapshot().x;
      harness.setInput("jump", true);

      let landed = false;
      for (let tick = 0; tick < 90; tick++) {
        harness.step(1);
        if (tick > 2 && harness.snapshot().isGrounded) {
          landed = true;
          break;
        }
      }
      const distance = harness.snapshot().x - jumpStartX;
      harness.clearInputs();

      // Then
      expect(landed).toBe(true);
      expect(distance).toBeGreaterThan(100);
    });
  });

  describe("When accelerating from standstill to top run speed", () => {
    it("Then the hero reaches max horizontal speed within a bounded number of ticks", () => {
      // Given
      harness.placeHero(140, 800);
      harness.step(10);
      expect(harness.snapshot().vx).toBe(0);

      // When
      harness.setInput("right", true);
      let ticksToTopSpeed = -1;
      for (let tick = 1; tick <= 30; tick++) {
        harness.step(1);
        if (harness.snapshot().vx >= 4.8) {
          ticksToTopSpeed = tick;
          break;
        }
      }
      harness.clearInputs();

      // Then
      expect(ticksToTopSpeed).toBeGreaterThan(0);
      expect(ticksToTopSpeed).toBeLessThanOrEqual(15);
    });
  });

  describe("When running off a ledge and pressing jump during coyote time", () => {
    it("Then a jump succeeds within the coyote window and fails after the window expires", () => {
      // Given
      // ground_west ends at x = 1220, y = 860. Place hero right before the ledge.
      harness.placeHero(1190, 800);
      harness.step(10);
      expect(harness.snapshot().isGrounded).toBe(true);

      // Run off the ledge until first airborne tick
      harness.setInput("right", true);
      let airborneTicks = 0;
      for (let tick = 0; tick < 20; tick++) {
        harness.step(1);
        if (!harness.snapshot().isGrounded) {
          airborneTicks++;
          if (airborneTicks === 4) {
            break;
          }
        }
      }

      // When: press jump on the 4th airborne tick (within ~100ms / 6-frame coyote window)
      harness.setInput("jump", true);
      harness.step(1);
      const coyoteJumpVy = harness.snapshot().vy;
      const coyoteJumped = harness.snapshot().isJumping;
      harness.clearInputs();

      // Now test after coyote window expires (wait 7 airborne ticks)
      harness.placeHero(1190, 800);
      harness.step(10);
      harness.setInput("right", true);
      airborneTicks = 0;
      for (let tick = 0; tick < 25; tick++) {
        harness.step(1);
        if (!harness.snapshot().isGrounded) {
          airborneTicks++;
          if (airborneTicks === 7) {
            break;
          }
        }
      }
      harness.setInput("jump", true);
      harness.step(1);
      const lateJumped = harness.snapshot().isJumping;
      harness.clearInputs();

      // Then
      expect(coyoteJumped).toBe(true);
      expect(coyoteJumpVy).toBeLessThan(0);
      expect(lateJumped).toBe(false);
    });
  });

  describe("When pressing jump shortly before landing (jump buffer)", () => {
    it("Then the buffered jump triggers automatically upon touching the ground", () => {
      // Given: hero falling from height toward ground_west (y = 860)
      harness.placeHero(300, 620);
      harness.step(10);
      expect(harness.snapshot().isGrounded).toBe(false);

      // Fall until close to ground, then tap jump for 1 tick while still airborne
      let tappedInAir = false;
      for (let tick = 0; tick < 40; tick++) {
        const snap = harness.snapshot();
        if (!tappedInAir && !snap.isGrounded && snap.y + snap.height >= 835) {
          harness.setInput("jump", true);
          harness.step(1);
          harness.setInput("jump", false);
          tappedInAir = true;
          expect(harness.snapshot().isGrounded).toBe(false);
          continue;
        }
        harness.step(1);
        if (harness.snapshot().isGrounded) {
          // Next tick should fire the buffered jump automatically
          harness.step(1);
          break;
        }
      }

      const afterLandSnap = harness.snapshot();
      harness.clearInputs();

      // Then
      expect(tappedInAir).toBe(true);
      expect(afterLandSnap.isJumping).toBe(true);
      expect(afterLandSnap.vy).toBeLessThan(0);
    });
  });

  describe("When reversing horizontal direction mid-air", () => {
    it("Then the hero decelerates and reverses horizontal velocity while airborne", () => {
      // Given: running right and jumping
      harness.placeHero(400, 800);
      harness.step(10);
      harness.setInput("right", true);
      harness.step(10);
      harness.setInput("jump", true);
      harness.step(3);
      const vxBeforeReverse = harness.snapshot().vx;
      expect(vxBeforeReverse).toBeGreaterThan(0);
      expect(harness.snapshot().isGrounded).toBe(false);

      // When: switch input to left while airborne
      harness.setInput("right", false);
      harness.setInput("left", true);
      let ticksToReverse = -1;
      for (let tick = 1; tick <= 30; tick++) {
        harness.step(1);
        if (harness.snapshot().vx < 0) {
          ticksToReverse = tick;
          break;
        }
      }
      const snapAfterReverse = harness.snapshot();
      harness.clearInputs();

      // Then
      expect(ticksToReverse).toBeGreaterThan(0);
      expect(snapAfterReverse.vx).toBeLessThan(0);
      expect(snapAfterReverse.facingLeft).toBe(true);
    });
  });

  describe("When engaging enemies and hazards in combat", () => {
    it("Then a melee attack reduces enemy HP and triggers hitstun timer", () => {
      // Given
      const targetEnemy = harness.engine.enemies.find((e) => !e.isDead);
      expect(targetEnemy).toBeDefined();
      const enemy = targetEnemy!;
      const initialHealth = enemy.health;
      enemy.vx = 0;

      // Place hero directly to the left of the enemy, facing right within sword reach (40px)
      harness.placeHero(enemy.x - harness.snapshot().width - 10, enemy.y);
      harness.engine.players[0].facingLeft = false;
      harness.engine.players[0].isGrounded = true;

      // When
      harness.setInput("action1", true);
      harness.step(1);
      harness.setInput("action1", false);

      // Then
      expect(enemy.health).toBeLessThan(initialHealth);
      expect(enemy.damageTimer).toBeGreaterThan(0);
    });

    it("Then repeated melee strikes defeat the enemy and mark it dead", () => {
      // Given
      const enemy = harness.engine.spawnEnemy("training_dummy", 400, 810);
      enemy.health = 25;
      enemy.maxHealth = 25;
      enemy.vx = 0;

      harness.placeHero(enemy.x - harness.snapshot().width - 10, enemy.y);
      harness.engine.players[0].facingLeft = false;

      // When
      for (let cycle = 0; cycle < 5 && !enemy.isDead; cycle++) {
        harness.setInput("action1", true);
        harness.step(1);
        harness.setInput("action1", false);
        harness.step(25);
      }

      // Then
      expect(enemy.health).toBe(0);
      expect(enemy.isDead).toBe(true);
    });

    it("Then hazard contact applies knockback and reduces player HP", () => {
      // Given
      const hazard = harness.engine.entities.find((e) => e.type === CollisionType.Hazard);
      expect(hazard).toBeDefined();
      const initialHealth = harness.snapshot().health;

      // Place hero overlapping the left half of the hazard
      harness.placeHero(hazard!.x, hazard!.y - 4);

      // When
      harness.step(1);
      const afterHit = harness.snapshot();

      // Then
      expect(afterHit.health).toBeLessThan(initialHealth);
      expect(Math.abs(afterHit.vx)).toBeGreaterThan(0);
      expect(afterHit.vy).toBeLessThan(0);
    });

    it.todo(
      "Then player receives i-frames (invulnerability window) after taking damage — not implemented: Player has no damageTimer or invulnerability state"
    );

    it.todo(
      "Then enemy contact deals damage and knockback to the player — not implemented: EnemyAISystem only updates patrol movement"
    );
  });

  describe("When running a 10-second scripted traversal smoke test across every location", () => {
    const locationsDir = path.resolve(process.cwd(), "src/data/locations");
    const locationIds = fs
      .readdirSync(locationsDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(/\.json$/, "") as LocationId)
      .sort();

    for (const locationId of locationIds) {
      it(`Then "${locationId}" simulates 600 ticks (10 s) of run + jump with damage off without NaN, out-of-bounds, or throws`, () => {
        // Given
        debugManager.state.godMode = true;
        harness.engine.resetLevel(locationId);
        harness.setInput("right", true);

        // When
        for (let tick = 0; tick < 600; tick++) {
          const jumpActive = tick % 45 < 10;
          harness.setInput("jump", jumpActive);
          harness.step(1);

          const snap = harness.snapshot();
          expect(Number.isNaN(snap.x)).toBe(false);
          expect(Number.isNaN(snap.y)).toBe(false);
          expect(Number.isNaN(snap.vx)).toBe(false);
          expect(Number.isNaN(snap.vy)).toBe(false);
          expect(Number.isNaN(snap.health)).toBe(false);
          expect(snap.isDead).toBe(false);
          expect(snap.x).toBeGreaterThanOrEqual(0);
          expect(snap.x + snap.width).toBeLessThanOrEqual(harness.engine.levelWidth);
          expect(snap.y).toBeLessThanOrEqual(harness.engine.levelHeight + 100);
        }

        harness.clearInputs();

        // Then
        expect(harness.snapshot().health).toBeGreaterThan(0);
      });
    }
  });
});
