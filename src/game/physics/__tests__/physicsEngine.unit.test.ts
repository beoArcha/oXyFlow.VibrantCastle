import { describe, it, expect, beforeEach } from "bun:test";
import { GamePhysicsEngine, IPhysicsAudio } from "../physics";
import { Player, Enemy, Entity, InputMap, AnimationState, SoundType, PlayerId } from "@/game/types";
import { createMockPlayer, createMockEnemy } from "@test-utils/mockEntities";

describe("GamePhysicsEngine & Kinematics", () => {
  let physics: GamePhysicsEngine;
  let playedSounds: SoundType[];
  let mockAudio: IPhysicsAudio;
  let player: Player;
  let defaultInputs: InputMap;

  beforeEach(() => {
    playedSounds = [];
    mockAudio = {
      playSFX: (type: SoundType) => {
        playedSounds.push(type);
      },
    };
    physics = new GamePhysicsEngine(mockAudio);
    player = createMockPlayer({
      x: 100,
      y: 200,
      vx: 0,
      vy: 0,
      isGrounded: true,
      wasGrounded: true,
    });
    defaultInputs = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      action1: false,
      action2: false,
      magic1: false,
      magic2: false,
      potion1: false,
      potion2: false,
      potion3: false,
    };
  });

  describe("Dead player physics", () => {
    it("applies ground friction and gravity while setting Dead animation state", () => {
      player.isDead = true;
      player.vx = 4;
      player.vy = 2;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.vx).toBeLessThan(4);
      expect(player.vy).toBeGreaterThan(2);
      expect(player.animationState).toBe(AnimationState.Dead);
    });
  });

  describe("Squash and stretch restoration", () => {
    it("springs squash and stretch scales smoothly back towards 1.0", () => {
      player.squashStretchScaleX = 0.8;
      player.squashStretchScaleY = 1.3;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.squashStretchScaleX).toBeGreaterThan(0.8);
      expect(player.squashStretchScaleY).toBeLessThan(1.3);
    });

    it("initializes squash and stretch to 1.0 if undefined", () => {
      (player as any).squashStretchScaleX = undefined;
      (player as any).squashStretchScaleY = undefined;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.squashStretchScaleX).toBe(1);
      expect(player.squashStretchScaleY).toBe(1);
    });
  });

  describe("Slide and dash kinematics", () => {
    it("updates position with slide speed and Slide animation during dash", () => {
      player.isDashing = true;
      player.dashTime = 5;
      player.facingLeft = false;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.vx).toBe(10.5);
      expect(player.vy).toBe(0);
      expect(player.dashTime).toBe(4);
      expect(player.animationState).toBe(AnimationState.Slide);
    });

    it("dashes left when facing left", () => {
      player.isDashing = true;
      player.dashTime = 5;
      player.facingLeft = true;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.vx).toBe(-10.5);
    });

    it("terminates dash and dampens velocity when dash timer expires", () => {
      player.isDashing = true;
      player.dashTime = 0.5;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.isDashing).toBe(false);
      expect(player.vx).toBeCloseTo(10.5 * 0.4, 2);
    });
  });

  describe("Backstep kinematics", () => {
    it("propels player backward relative to facing direction with gravity", () => {
      player.isBackstepping = true;
      player.dashTime = 4;
      player.facingLeft = false; // should move backward (negative vx)

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.vx).toBe(-7.5);
      expect(player.vy).toBeGreaterThan(0);
      expect(player.animationState).toBe(AnimationState.Backstep);
    });

    it("terminates backstep when dash timer expires and dampens velocity", () => {
      player.isBackstepping = true;
      player.dashTime = 0.8;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.isBackstepping).toBe(false);
      expect(player.vx).toBeCloseTo(-7.5 * 0.3, 2);
    });
  });

  describe("Crouch mechanics", () => {
    it("activates crouch and rapidly stops horizontal velocity when pressing down on ground", () => {
      player.vx = 4;
      player.isGrounded = true;
      defaultInputs.down = true;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.isCrouching).toBe(true);
      expect(player.vx).toBe(2); // 4 * 0.5
      expect(player.animationState).toBe(AnimationState.Crouch);
    });

    it("cancels crouch if horizontal movement is pressed", () => {
      player.isGrounded = true;
      defaultInputs.down = true;
      defaultInputs.right = true;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.isCrouching).toBe(false);
    });
  });

  describe("Coyote time and jump input buffering", () => {
    it("preserves coyote timer after walking off a ledge into the air", () => {
      player.isGrounded = false;
      player.wasGrounded = true;
      player.coyoteTimer = 6;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.coyoteTimer).toBe(5);
    });

    it("triggers landing squash when transitioning from airborne to grounded", () => {
      player.isGrounded = true;
      player.wasGrounded = false;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.squashStretchScaleX).toBe(1.22);
      expect(player.squashStretchScaleY).toBe(0.82);
    });

    it("buffers jump input pressed while in the air", () => {
      player.isGrounded = false;
      player.wasGrounded = false;
      player.coyoteTimer = 0;
      defaultInputs.jump = true;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.jumpBufferTimer).toBe(6);
    });

    it("executes buffered jump immediately upon landing", () => {
      player.isGrounded = true;
      player.jumpBufferTimer = 3;
      defaultInputs.jump = false; // button was pressed earlier, buffer is active

      physics.updatePlayer(player, defaultInputs, 1.0);

      // Takes off (-7.8) with lowJumpGravity (+0.85) applied on same frame since jump is released
      expect(player.vy).toBeCloseTo(-7.8 + 0.85, 2);
      expect(player.isJumping).toBe(true);
      expect(player.jumpBufferTimer).toBe(0);
      expect(playedSounds).toContain(SoundType.SFX_JUMP);
    });

    it("executes jump via coyote time after leaving platform", () => {
      player.isGrounded = false;
      player.coyoteTimer = 4;
      defaultInputs.jump = true;

      physics.updatePlayer(player, defaultInputs, 1.0);

      // Takes off (-7.8), sustained hold (-0.32), base gravity (+0.42) = -7.7
      expect(player.vy).toBeCloseTo(-7.7, 1);
      expect(player.isJumping).toBe(true);
      expect(player.coyoteTimer).toBe(0);
    });
  });

  describe("Moving platform momentum transfer", () => {
    it("transfers horizontal and upward moving platform velocity on jump", () => {
      player.isGrounded = true;
      player.standingPlatformId = "elevator_1";
      player.platformVelocityX = 3;
      player.platformVelocityY = -4; // elevator moving upward
      defaultInputs.jump = true;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.standingPlatformId).toBeNull();
      // Transferred 3.0 vx, air friction (0.94) applied on airborne frame = 2.82
      expect(player.vx).toBeCloseTo(3.0 * 0.94, 2);
      expect(player.vy).toBeLessThan(-10);
    });
  });

  describe("Variable jump height and asymmetric gravity", () => {
    it("sustains upward acceleration when holding jump button", () => {
      player.isGrounded = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.isJumping = true;
      player.vy = -6;
      player.jumpHoldTimer = 10;
      defaultInputs.jump = true;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.jumpHoldTimer).toBe(9);
    });

    it("cuts jump boost immediately when jump button is released early", () => {
      player.isGrounded = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.isJumping = true;
      player.vy = -6;
      player.jumpHoldTimer = 10;
      defaultInputs.jump = false;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.jumpHoldTimer).toBe(0);
    });

    it("applies apex float gravity when vertical velocity is near zero", () => {
      player.isGrounded = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.vy = -0.5; // near apex
      defaultInputs.jump = true;

      physics.updatePlayer(player, defaultInputs, 1.0);

      // vy change should be baseGravity (0.42) * apexMultiplier (0.45) = ~0.189
      expect(player.vy).toBeCloseTo(-0.5 + 0.42 * 0.45, 2);
    });

    it("applies snappy fall gravity and clamps at max fall speed", () => {
      player.vy = 11.4; // falling
      player.isGrounded = false;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.vy).toBe(11.5); // clamped to maxFallSpeed
    });
  });

  describe("Horizontal movement and friction", () => {
    it("accelerates left and sets facing direction", () => {
      defaultInputs.left = true;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.vx).toBe(-0.75);
      expect(player.facingLeft).toBe(true);
    });

    it("accelerates right and sets facing direction", () => {
      defaultInputs.right = true;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.vx).toBe(0.75);
      expect(player.facingLeft).toBe(false);
    });

    it("clamps horizontal velocity to max run speed", () => {
      player.vx = 4.7;
      defaultInputs.right = true;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.vx).toBe(4.8);
    });

    it("applies ground friction when no directional input is given", () => {
      player.vx = 4.0;
      player.isGrounded = true;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.vx).toBeCloseTo(4.0 * 0.78, 2);
    });

    it("applies air friction when airborne", () => {
      player.vx = 4.0;
      player.isGrounded = false;

      physics.updatePlayer(player, defaultInputs, 1.0);

      expect(player.vx).toBeCloseTo(4.0 * 0.94, 2);
    });
  });

  describe("Animation state resolution", () => {
    it("prioritizes attack animation when attacking", () => {
      player.isAttacking = true;
      physics.updatePlayer(player, defaultInputs, 1.0);
      expect(player.animationState).toBe(AnimationState.Attack);
    });

    it("prioritizes cast animation when casting", () => {
      player.isCasting = true;
      physics.updatePlayer(player, defaultInputs, 1.0);
      expect(player.animationState).toBe(AnimationState.Cast);
    });

    it("sets Jump animation when airborne and moving upward", () => {
      player.isGrounded = false;
      player.vy = -3;
      physics.updatePlayer(player, defaultInputs, 1.0);
      expect(player.animationState).toBe(AnimationState.Jump);
    });

    it("sets Fall animation when airborne and moving downward", () => {
      player.isGrounded = false;
      player.vy = 3;
      physics.updatePlayer(player, defaultInputs, 1.0);
      expect(player.animationState).toBe(AnimationState.Fall);
    });

    it("sets Run animation when grounded with horizontal velocity", () => {
      player.isGrounded = true;
      player.vx = 2.0;
      physics.updatePlayer(player, defaultInputs, 1.0);
      expect(player.animationState).toBe(AnimationState.Run);
    });

    it("sets Idle animation when grounded with low velocity", () => {
      player.isGrounded = true;
      player.vx = 0.1;
      physics.updatePlayer(player, defaultInputs, 1.0);
      expect(player.animationState).toBe(AnimationState.Idle);
    });
  });

  describe("Enemy physics (updateEnemy)", () => {
    let enemy: Enemy;

    beforeEach(() => {
      enemy = createMockEnemy({
        x: 100,
        y: 200,
        vx: 2,
        patrolMinX: 50,
        patrolMaxX: 150,
        facingLeft: false,
        damageTimer: 10,
        isDead: false,
        isDummy: false,
      });
    });

    it("ignores dead enemies", () => {
      enemy.isDead = true;
      const initialX = enemy.x;

      physics.updateEnemy(enemy, 1.0);

      expect(enemy.x).toBe(initialX);
    });

    it("decrements damage timer and updates patrol position", () => {
      physics.updateEnemy(enemy, 1.0);

      expect(enemy.damageTimer).toBe(9);
      expect(enemy.x).toBe(102);
    });

    it("reverses velocity and flips facing when reaching patrolMaxX", () => {
      enemy.x = 149;
      enemy.vx = 2;

      physics.updateEnemy(enemy, 1.0);

      expect(enemy.x).toBe(150);
      expect(enemy.vx).toBe(-2);
      expect(enemy.facingLeft).toBe(true);
    });

    it("reverses velocity and flips facing when reaching patrolMinX", () => {
      enemy.x = 51;
      enemy.vx = -2;

      physics.updateEnemy(enemy, 1.0);

      expect(enemy.x).toBe(50);
      expect(enemy.vx).toBe(2);
      expect(enemy.facingLeft).toBe(false);
    });

    it("does not move stationary dummy enemies", () => {
      enemy.isDummy = true;
      enemy.x = 100;
      enemy.vx = 2;

      physics.updateEnemy(enemy, 1.0);

      expect(enemy.x).toBe(100);
    });
  });

  describe("Moving entities & rider carrying (updateEntities)", () => {
    it("moves entity and bounces between min and max bounds", () => {
      const platform: Entity = {
        id: "plat_1",
        x: 198,
        y: 100,
        width: 100,
        height: 20,
        vx: 4,
        vy: 0,
        minX: 100,
        maxX: 200,
      } as any;

      physics.updateEntities([platform], 1.0);

      expect(platform.x).toBe(200);
      expect(platform.vx).toBe(-4);
    });

    it("carries player standing on a moving platform", () => {
      const platform: Entity = {
        id: "plat_1",
        x: 100,
        y: 200,
        width: 100,
        height: 20,
        vx: 3,
        vy: 0,
      } as any;

      player.standingPlatformId = "plat_1";
      player.x = 120;
      player.y = 150;
      player.isGrounded = true;

      physics.updateEntities([platform], 1.0, [player]);

      expect(player.x).toBe(123); // moved by platform displacement (+3)
      expect(player.platformVelocityX).toBe(3);
    });
  });

  describe("Player-player collision resolution", () => {
    let player2: Player;

    beforeEach(() => {
      player2 = createMockPlayer({
        id: PlayerId.Player2,
        x: 120,
        y: 200,
        width: 40,
        height: 60,
      });
      player.x = 100;
      player.y = 200;
      player.width = 40;
      player.height = 60;
    });

    it("gently separates overlapping players horizontally", () => {
      physics.resolvePlayerPlayerCollision([player, player2], 1.0);

      expect(player.x).toBeLessThan(100);
      expect(player2.x).toBeGreaterThan(120);
    });

    it("supports landing on an ally's head cleanly", () => {
      // player is falling directly onto player2 (height 60, y 200) with slight overlap
      player.x = 120;
      player.y = 145;
      player.vy = 2;

      physics.resolvePlayerPlayerCollision([player, player2], 1.0);

      expect(player.y).toBe(player2.y - player.height);
      expect(player.vy).toBe(0);
      expect(player.isGrounded).toBe(true);
    });

    it("does nothing with fewer than two players or dead players", () => {
      player.isDead = true;
      const origX = player.x;

      physics.resolvePlayerPlayerCollision([player, player2], 1.0);

      expect(player.x).toBe(origX);
    });
  });
});
