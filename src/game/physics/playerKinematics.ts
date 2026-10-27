import { Player, InputMap, AnimationState, SoundType } from "@game/types";

/**
 * Audio interface for kinematic physics SFX (e.g. jump takeoff).
 */
export interface IPhysicsAudio {
  playSFX(type: SoundType): void;
}

/**
 * Handles kinematic player motion, variable jump, coyote time, jump buffering,
 * dynamic asymmetric gravity curves, and dash/backstep momentum.
 */
export class PlayerKinematics {
  // Asymmetric & dynamic gravity tuned for snappy responsive game feel
  private readonly baseGravity: number = 0.42; // Base gravity during upward motion
  private readonly fallGravity: number = 0.62; // Faster gravity on descent (avoids floaty feel)
  private readonly lowJumpGravity: number = 0.85; // Cutting jump short if button released early
  private readonly apexGravityMultiplier: number = 0.45; // Gentle float at apex for precision landing
  private readonly maxFallSpeed: number = 11.5;

  // Horizontal motion feel
  private readonly groundAcceleration: number = 0.75;
  private readonly airAcceleration: number = 0.55;
  private readonly groundFriction: number = 0.78;
  private readonly airFriction: number = 0.94;
  private readonly maxRunSpeed: number = 4.8;

  // Jump feel constants
  private readonly initialJumpForce: number = -7.8;
  private readonly maxJumpHoldDuration: number = 12; // frames (~200ms) of sustained upward boost if holding button
  private readonly jumpHoldAcceleration: number = -0.32;
  private readonly maxCoyoteFrames: number = 6; // ~100ms tolerance after leaving platform ledge
  private readonly maxJumpBufferFrames: number = 6; // ~100ms buffer before landing

  // Slide / Dash / Backstep
  private readonly slideSpeed: number = 10.5;
  private readonly backstepSpeed: number = 7.5;

  constructor(private readonly getAudio?: () => IPhysicsAudio | undefined) {}

  /**
   * Applies kinematic movement, momentum, input forces, and jump feel.
   * Scaled with dtMultiplier for frame rate independence.
   */
  public update(player: Player, inputs: InputMap, dtMultiplier: number = 1.0): void {
    if (player.isDead) {
      this.updateDeadPlayer(player, dtMultiplier);
      return;
    }

    this.updateSquashStretch(player, dtMultiplier);

    if (player.isDashing) {
      this.updateDashingPlayer(player, dtMultiplier);
      return;
    }

    if (player.isBackstepping) {
      this.updateBacksteppingPlayer(player, dtMultiplier);
      return;
    }

    this.updateCrouch(player, inputs, dtMultiplier);
    this.updateGroundedState(player, dtMultiplier);
    this.updateJumpBuffer(player, inputs, dtMultiplier);
    this.processJumpTrigger(player);
    this.processVariableJumpBoost(player, inputs, dtMultiplier);
    this.applyGravity(player, inputs, dtMultiplier);
    this.applyHorizontalMovement(player, inputs, dtMultiplier);
    this.integratePosition(player, dtMultiplier);
    this.resolveAnimationState(player);
  }

  private updateDeadPlayer(player: Player, dtMultiplier: number): void {
    const effectiveFriction = Math.pow(this.groundFriction, dtMultiplier);
    player.vx *= effectiveFriction;
    player.vy += this.fallGravity * dtMultiplier;
    player.y += player.vy * dtMultiplier;
    player.animationState = AnimationState.Dead;
  }

  private updateSquashStretch(player: Player, dtMultiplier: number): void {
    if (player.squashStretchScaleX !== undefined && player.squashStretchScaleY !== undefined) {
      const springRate = 1 - Math.pow(1 - 0.22, dtMultiplier);
      player.squashStretchScaleX += (1 - player.squashStretchScaleX) * springRate;
      player.squashStretchScaleY += (1 - player.squashStretchScaleY) * springRate;
    } else {
      player.squashStretchScaleX = 1;
      player.squashStretchScaleY = 1;
    }
  }

  private updateDashingPlayer(player: Player, dtMultiplier: number): void {
    player.dashTime = Math.max(0, player.dashTime - dtMultiplier);
    player.vx = player.facingLeft ? -this.slideSpeed : this.slideSpeed;
    player.vy = 0;
    player.x += player.vx * dtMultiplier;
    player.animationState = AnimationState.Slide;

    if (player.dashTime <= 0) {
      player.isDashing = false;
      player.vx *= 0.4;
    }
  }

  private updateBacksteppingPlayer(player: Player, dtMultiplier: number): void {
    player.dashTime = Math.max(0, player.dashTime - dtMultiplier);
    player.vx = player.facingLeft ? this.backstepSpeed : -this.backstepSpeed;
    player.vy += this.baseGravity * 0.5 * dtMultiplier;
    player.y += player.vy * dtMultiplier;
    player.x += player.vx * dtMultiplier;
    player.animationState = AnimationState.Backstep;

    if (player.dashTime <= 0) {
      player.isBackstepping = false;
      player.vx *= 0.3;
    }
  }

  private updateCrouch(player: Player, inputs: InputMap, dtMultiplier: number): void {
    if (inputs.down && player.isGrounded && !inputs.left && !inputs.right && !inputs.jump) {
      player.isCrouching = true;
      player.vx *= Math.pow(0.5, dtMultiplier);
    } else {
      player.isCrouching = false;
    }
  }

  private updateGroundedState(player: Player, dtMultiplier: number): void {
    if (player.isGrounded) {
      player.coyoteTimer = this.maxCoyoteFrames;
      player.isJumping = false;
      player.jumpHoldTimer = 0;

      if (!player.wasGrounded) {
        player.squashStretchScaleX = 1.22;
        player.squashStretchScaleY = 0.82;
      }
    } else if (player.coyoteTimer > 0) {
      player.coyoteTimer = Math.max(0, player.coyoteTimer - dtMultiplier);
    }
    player.wasGrounded = player.isGrounded;
  }

  private updateJumpBuffer(player: Player, inputs: InputMap, dtMultiplier: number): void {
    if (inputs.jump) {
      player.jumpBufferTimer = this.maxJumpBufferFrames;
    } else if (player.jumpBufferTimer > 0) {
      player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dtMultiplier);
    }
  }

  private processJumpTrigger(player: Player): void {
    const canJump = (player.isGrounded || player.coyoteTimer > 0) && !player.isCrouching && !player.isJumping;
    if (!canJump || player.jumpBufferTimer <= 0) return;

    player.vy = this.initialJumpForce;
    player.isGrounded = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    player.isJumping = true;
    player.jumpHoldTimer = this.maxJumpHoldDuration;

    if (player.standingPlatformId) {
      if (player.platformVelocityX) player.vx += player.platformVelocityX;
      if (player.platformVelocityY && player.platformVelocityY < 0) {
        player.vy += player.platformVelocityY * 0.75;
      }
      player.standingPlatformId = null;
      player.platformVelocityX = 0;
      player.platformVelocityY = 0;
    }

    player.squashStretchScaleX = 0.82;
    player.squashStretchScaleY = 1.25;

    const audio = this.getAudio?.();
    if (audio) {
      audio.playSFX(SoundType.SFX_JUMP);
    }
  }

  private processVariableJumpBoost(player: Player, inputs: InputMap, dtMultiplier: number): void {
    if (player.isJumping && inputs.jump && player.jumpHoldTimer > 0 && player.vy < 0) {
      player.vy += this.jumpHoldAcceleration * dtMultiplier;
      player.jumpHoldTimer = Math.max(0, player.jumpHoldTimer - dtMultiplier);
    } else if (!inputs.jump) {
      player.jumpHoldTimer = 0;
    }
  }

  private applyGravity(player: Player, inputs: InputMap, dtMultiplier: number): void {
    let currentGravity = this.baseGravity;

    if (player.vy < 0) {
      if (Math.abs(player.vy) < 1.8) {
        currentGravity = this.baseGravity * this.apexGravityMultiplier;
      } else if (!inputs.jump) {
        currentGravity = this.lowJumpGravity;
      } else {
        currentGravity = this.baseGravity;
      }
    } else {
      currentGravity = this.fallGravity;
    }

    player.vy += currentGravity * dtMultiplier;
    if (player.vy > this.maxFallSpeed) {
      player.vy = this.maxFallSpeed;
    }
  }

  private applyHorizontalMovement(player: Player, inputs: InputMap, dtMultiplier: number): void {
    const baseAccel = player.isGrounded ? this.groundAcceleration : this.airAcceleration;
    const accel = baseAccel * dtMultiplier;
    const friction = Math.pow(player.isGrounded ? this.groundFriction : this.airFriction, dtMultiplier);

    if (!player.isCrouching) {
      if (inputs.left) {
        player.vx -= accel;
        player.facingLeft = true;
      } else if (inputs.right) {
        player.vx += accel;
        player.facingLeft = false;
      } else {
        player.vx *= friction;
      }
    }

    if (player.vx > this.maxRunSpeed) player.vx = this.maxRunSpeed;
    if (player.vx < -this.maxRunSpeed) player.vx = -this.maxRunSpeed;
  }

  private integratePosition(player: Player, dtMultiplier: number): void {
    player.x += player.vx * dtMultiplier;
    player.y += player.vy * dtMultiplier;
  }

  private resolveAnimationState(player: Player): void {
    if (player.isAttacking) {
      player.animationState = AnimationState.Attack;
    } else if (player.isCasting) {
      player.animationState = AnimationState.Cast;
    } else if (player.isCrouching) {
      player.animationState = AnimationState.Crouch;
    } else if (!player.isGrounded) {
      player.animationState = player.vy < 0 ? AnimationState.Jump : AnimationState.Fall;
    } else if (Math.abs(player.vx) > 0.4) {
      player.animationState = AnimationState.Run;
    } else {
      player.animationState = AnimationState.Idle;
    }
  }
}
