/**
 * Gameplay Feel Metrics (60 Hz fixed-step, courtyard location)
 *
 * | Metric | Measured | Target | Status |
 * | :--- | :--- | :--- | :--- |
 * | Tap jump apex height | TBD px | > 0 px | Pending |
 * | Hold jump apex height | TBD px | >= 1.5x tap | Pending |
 * | Tap / Hold ratio | TBD x | >= 1.50x | Pending |
 * | Tap jump air time | TBD ticks (TBD ms) | > 0 | Pending |
 * | Hold jump air time | TBD ticks (TBD ms) | > tap | Pending |
 * | Run-jump horizontal distance | TBD px | > 0 px | Pending |
 * | Ticks to top speed (4.8 px/tick) | TBD ticks (TBD ms) | responsive | Pending |
 * | Coyote time window | TBD ticks (TBD ms) | 80-120 ms | Pending |
 * | Jump buffer window | TBD ticks (TBD ms) | 100-150 ms | Pending |
 * | Mid-air direction reversal | TBD ticks to reverse | responsive | Pending |
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { GameInputEngine } from "@game/loop/input";
import { debugManager } from "@game/debug/debugManager";
import { LocationId } from "@game/locations/types";
import { InputMap, PlayerId } from "@game/types";

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
      console.log("[VC-085] Tap:", tap, "Hold:", hold, "Ratio:", ratio.toFixed(3));
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
      console.log("[VC-085] Run-jump distance:", distance.toFixed(2), "landed:", landed);
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
      console.log("[VC-085] Ticks to top speed:", ticksToTopSpeed);
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
      console.log("[VC-085] Coyote jump vy:", coyoteJumpVy, "coyoteJumped:", coyoteJumped, "lateJumped:", lateJumped);
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
      console.log("[VC-085] Mid-air reversal ticks:", ticksToReverse, "vx:", snapAfterReverse.vx);
      expect(ticksToReverse).toBeGreaterThan(0);
      expect(snapAfterReverse.vx).toBeLessThan(0);
      expect(snapAfterReverse.facingLeft).toBe(true);
    });
  });
});
