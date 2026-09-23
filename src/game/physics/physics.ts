import { Player, Enemy, Entity, InputMap, AnimationState, SoundType } from "../types";

/**
 * Audio interface for kinematic physics SFX (e.g. jump takeoff) (DIP).
 */
export interface IPhysicsAudio {
  playSFX(type: SoundType): void;
}

/**
 * Manages pure game physics and kinematics: acceleration, friction, asymmetric gravity, velocities,
 * slide/dash momentum, backsteps, and Celeste/Hollow Knight-grade jump mechanics (variable height,
 * coyote time, jump buffering, apex float).
 * Adheres strictly to SOLID Single Responsibility Principle (SRP) and Dependency Inversion (DIP).
 */
export class GamePhysicsEngine {
  // Asymmetric & dynamic gravity tuned for snappy responsive game feel
  private baseGravity: number = 0.42; // Base gravity during upward motion
  private fallGravity: number = 0.62; // Faster gravity on descent (avoids floaty feel)
  private lowJumpGravity: number = 0.85; // Cutting jump short if button released early
  private apexGravityMultiplier: number = 0.45; // Gentle float at apex for precision landing
  private maxFallSpeed: number = 11.5;

  // Horizontal motion feel
  private groundAcceleration: number = 0.75;
  private airAcceleration: number = 0.55;
  private groundFriction: number = 0.78;
  private airFriction: number = 0.94;
  private maxRunSpeed: number = 4.8;

  // Jump feel constants
  private initialJumpForce: number = -7.8;
  private maxJumpHoldDuration: number = 12; // frames (~200ms) of sustained upward boost if holding button
  private jumpHoldAcceleration: number = -0.32;
  private maxCoyoteFrames: number = 6; // ~100ms tolerance after leaving platform ledge
  private maxJumpBufferFrames: number = 6; // ~100ms buffer before landing

  // Slide / Dash / Backstep
  private slideSpeed: number = 10.5;
  private backstepSpeed: number = 7.5;

  constructor(private audio?: IPhysicsAudio) {}

  /**
   * Applies kinematic movement, momentum, input forces, and jump feel.
   * Scaled with dtMultiplier for frame rate independence.
   */
  public updatePlayer(player: Player, inputs: InputMap, dtMultiplier: number = 1.0) {
    if (player.isDead) {
      const effectiveFriction = Math.pow(this.groundFriction, dtMultiplier);
      player.vx *= effectiveFriction;
      player.vy += this.fallGravity * dtMultiplier;
      player.y += player.vy * dtMultiplier;
      player.animationState = AnimationState.Dead;
      return;
    }

    // 1. Smooth visual squash & stretch spring back to 1.0
    if (player.squashStretchScaleX !== undefined && player.squashStretchScaleY !== undefined) {
      const springRate = 1 - Math.pow(1 - 0.22, dtMultiplier);
      player.squashStretchScaleX += (1 - player.squashStretchScaleX) * springRate;
      player.squashStretchScaleY += (1 - player.squashStretchScaleY) * springRate;
    } else {
      player.squashStretchScaleX = 1;
      player.squashStretchScaleY = 1;
    }

    // 2. Process Active Slide / Dash Kinematics
    if (player.isDashing) {
      player.dashTime = Math.max(0, player.dashTime - dtMultiplier);
      player.vx = player.facingLeft ? -this.slideSpeed : this.slideSpeed;
      player.vy = 0; // maintain height during slide
      player.x += player.vx * dtMultiplier;
      player.animationState = AnimationState.Slide;

      if (player.dashTime <= 0) {
        player.isDashing = false;
        player.vx *= 0.4;
      }
      return;
    }

    // 3. Process Active Backstep (Lekki Odskok) Kinematics
    if (player.isBackstepping) {
      player.dashTime = Math.max(0, player.dashTime - dtMultiplier);
      // Move backwards relative to facing direction
      player.vx = player.facingLeft ? this.backstepSpeed : -this.backstepSpeed;
      player.vy += this.baseGravity * 0.5 * dtMultiplier;
      player.y += player.vy * dtMultiplier;
      player.x += player.vx * dtMultiplier;
      player.animationState = AnimationState.Backstep;

      if (player.dashTime <= 0) {
        player.isBackstepping = false;
        player.vx *= 0.3;
      }
      return;
    }

    // 4. Crouch / Crunch mechanics
    if (inputs.down && player.isGrounded && !inputs.left && !inputs.right && !inputs.jump) {
      player.isCrouching = true;
      player.vx *= Math.pow(0.5, dtMultiplier); // Rapidly stop
    } else {
      player.isCrouching = false;
    }

    // 5. Ground State Tracking & Coyote Time Window
    if (player.isGrounded) {
      player.coyoteTimer = this.maxCoyoteFrames;
      player.isJumping = false;
      player.jumpHoldTimer = 0;

      // Landing detection: If was in the air last frame, trigger landing squash
      if (!player.wasGrounded) {
        player.squashStretchScaleX = 1.22;
        player.squashStretchScaleY = 0.82;
      }
    } else {
      if (player.coyoteTimer > 0) {
        player.coyoteTimer = Math.max(0, player.coyoteTimer - dtMultiplier);
      }
    }
    player.wasGrounded = player.isGrounded;

    // 6. Jump Input Buffering
    if (inputs.jump) {
      player.jumpBufferTimer = this.maxJumpBufferFrames;
    } else if (player.jumpBufferTimer > 0) {
      player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dtMultiplier);
    }

    // 7. Jump Execution (Triggered by Ground + Jump OR Coyote Time + Jump Buffer)
    const canJump =
      (player.isGrounded || player.coyoteTimer > 0) && !player.isCrouching && !player.isJumping;
    if (canJump && player.jumpBufferTimer > 0) {
      // Execute satisfying jump takeoff
      player.vy = this.initialJumpForce;
      player.isGrounded = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.isJumping = true;
      player.jumpHoldTimer = this.maxJumpHoldDuration;

      // Transfer moving platform momentum (Inertial relative vector transfer)
      if (player.standingPlatformId) {
        if (player.platformVelocityX) {
          player.vx += player.platformVelocityX;
        }
        if (player.platformVelocityY && player.platformVelocityY < 0) {
          // If elevator was moving UP, boost the jump impulse
          player.vy += player.platformVelocityY * 0.75;
        }
        player.standingPlatformId = null;
        player.platformVelocityX = 0;
        player.platformVelocityY = 0;
      }

      // Visual Stretch on Takeoff (Anticipation / Stretch)
      player.squashStretchScaleX = 0.82;
      player.squashStretchScaleY = 1.25;

      if (this.audio) {
        this.audio.playSFX(SoundType.SFX_JUMP);
      }
    }

    // 8. Variable Jump Height & Hold Booster
    if (player.isJumping && inputs.jump && player.jumpHoldTimer > 0 && player.vy < 0) {
      player.vy += this.jumpHoldAcceleration * dtMultiplier;
      player.jumpHoldTimer = Math.max(0, player.jumpHoldTimer - dtMultiplier);
    } else if (!inputs.jump) {
      // Released jump button early -> cut ascending impulse immediately (low hop)
      player.jumpHoldTimer = 0;
    }

    // 9. Dynamic & Asymmetric Gravity Curve (Apex Float + Snappy Fall)
    let currentGravity = this.baseGravity;

    if (player.vy < 0) {
      // Ascending
      if (Math.abs(player.vy) < 1.8) {
        // Apex of jump (Peak / Hang time for air control precision)
        currentGravity = this.baseGravity * this.apexGravityMultiplier;
      } else if (!inputs.jump) {
        // Player let go of jump while moving upwards -> snappy cutoff
        currentGravity = this.lowJumpGravity;
      } else {
        currentGravity = this.baseGravity;
      }
    } else {
      // Descending / Falling (Heavier, snappier fall avoiding floaty drift)
      currentGravity = this.fallGravity;
    }

    player.vy += currentGravity * dtMultiplier;
    if (player.vy > this.maxFallSpeed) {
      player.vy = this.maxFallSpeed;
    }

    // 10. Horizontal Movement (Smooth Ground/Air Acceleration & Friction)
    const baseAccel = player.isGrounded ? this.groundAcceleration : this.airAcceleration;
    const accel = baseAccel * dtMultiplier;
    const friction = Math.pow(
      player.isGrounded ? this.groundFriction : this.airFriction,
      dtMultiplier
    );

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

    // Horizontal speed clamp
    if (player.vx > this.maxRunSpeed) player.vx = this.maxRunSpeed;
    if (player.vx < -this.maxRunSpeed) player.vx = -this.maxRunSpeed;

    // 11. Integrate Position
    player.x += player.vx * dtMultiplier;
    player.y += player.vy * dtMultiplier;

    // 12. Animation States
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

  /**
   * Updates interactive Enemies (patrolling dummies, aerial gargoyles, clockwork sentinels).
   */
  public updateEnemy(enemy: Enemy, dtMultiplier: number = 1.0) {
    if (enemy.isDead) return;

    if (enemy.damageTimer > 0) {
      enemy.damageTimer = Math.max(0, enemy.damageTimer - dtMultiplier);
    }

    if (!enemy.isDummy) {
      enemy.x += enemy.vx * dtMultiplier;
      if (enemy.x <= enemy.patrolMinX) {
        enemy.x = enemy.patrolMinX;
        enemy.vx = Math.abs(enemy.vx);
        enemy.facingLeft = false;
      } else if (enemy.x >= enemy.patrolMaxX) {
        enemy.x = enemy.patrolMaxX;
        enemy.vx = -Math.abs(enemy.vx);
        enemy.facingLeft = true;
      }
    }
  }

  /**
   * Moves environmental entities like floating platforms or revolving hazards,
   * carrying riders (players) with exact displacement vectors and preserving relative stability.
   */
  public updateEntities(entities: Entity[], dtMultiplier: number = 1.0, players?: Player[]) {
    entities.forEach(entity => {
      if (entity.vx !== undefined || entity.vy !== undefined) {
        const prevX = entity.x;
        const prevY = entity.y;
        const vx = entity.vx || 0;
        const vy = entity.vy || 0;

        entity.x += vx * dtMultiplier;
        entity.y += vy * dtMultiplier;

        if (entity.minX !== undefined && entity.maxX !== undefined) {
          if (entity.x <= entity.minX) {
            entity.x = entity.minX;
            entity.vx = Math.abs(vx);
          } else if (entity.x >= entity.maxX) {
            entity.x = entity.maxX;
            entity.vx = -Math.abs(vx);
          }
        }

        if (entity.minY !== undefined && entity.maxY !== undefined) {
          if (entity.y <= entity.minY) {
            entity.y = entity.minY;
            entity.vy = Math.abs(vy);
          } else if (entity.y >= entity.maxY) {
            entity.y = entity.maxY;
            entity.vy = -Math.abs(vy);
          }
        }

        const deltaX = entity.x - prevX;
        const deltaY = entity.y - prevY;

        // Kinematic rider carrying: Move players standing on this platform with exact displacement vector
        if (players && players.length > 0) {
          players.forEach(player => {
            if (player.isDead) return;

            const isCurrentRider = player.standingPlatformId === entity.id;
            const playerFeet = player.y + player.height;
            const isRestingOnTop =
              player.isGrounded &&
              !player.isJumping &&
              playerFeet >= prevY - 4 &&
              playerFeet <= prevY + 8 &&
              player.x + player.width > Math.min(prevX, entity.x) + 2 &&
              player.x < Math.max(prevX, entity.x) + (entity.width || 100) - 2;

            if (isCurrentRider || isRestingOnTop) {
              player.standingPlatformId = entity.id;
              player.x += deltaX;
              player.y += deltaY;
              player.platformVelocityX = entity.vx || 0;
              player.platformVelocityY = entity.vy || 0;
              player.isGrounded = true;
              player.vy = 0;
            }
          });
        }
      }
    });
  }

  /**
   * Resolves soft and solid collision interactions between multiple players on screen.
   * Prevents sprite phasing/clumping and supports riding/jumping on ally heads without glitches.
   */
  public resolvePlayerPlayerCollision(players: Player[], dtMultiplier: number = 1.0) {
    if (players.length < 2) return;

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];

        if (p1.isDead || p2.isDead) continue;

        const p1CenterX = p1.x + p1.width / 2;
        const p1CenterY = p1.y + p1.height / 2;
        const p2CenterX = p2.x + p2.width / 2;
        const p2CenterY = p2.y + p2.height / 2;

        const dx = p1CenterX - p2CenterX;
        const dy = p1CenterY - p2CenterY;

        const minXDist = (p1.width + p2.width) / 2;
        const minYDist = (p1.height + p2.height) / 2;

        const overlapX = minXDist - Math.abs(dx);
        const overlapY = minYDist - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          // Vertical collision (head landing / standing on ally)
          if (overlapY < overlapX && overlapY < 16) {
            if (dy < 0 && p1.vy >= 0) {
              // p1 lands on p2
              p1.y = p2.y - p1.height;
              p1.vy = 0;
              p1.isGrounded = true;
              p1.isJumping = false;
            } else if (dy > 0 && p2.vy >= 0) {
              // p2 lands on p1
              p2.y = p1.y - p2.height;
              p2.vy = 0;
              p2.isGrounded = true;
              p2.isJumping = false;
            }
          } else {
            // Horizontal soft separation (prevents merging into single figure)
            const pushAmt = (overlapX / 2) * Math.min(1.0, 0.4 * dtMultiplier + 0.1);
            if (dx > 0) {
              p1.x += pushAmt;
              p2.x -= pushAmt;
            } else {
              p1.x -= pushAmt;
              p2.x += pushAmt;
            }
          }
        }
      }
    }
  }
}

export const gamePhysics = new GamePhysicsEngine();
export default gamePhysics;
