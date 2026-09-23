import { Player, Entity, CollisionType, SoundType } from "../types";
import { gameAudio } from "../engine/audioEngine";
import { statsManager } from "../logic/stats";

export interface ICollisionContext {
  triggerNarration: (id: string) => void;
  onLeverActivated?: (triggerId: string) => void;
  onGoalReached?: (entity?: Entity) => void;
}

/**
 * Interface for the Strategy Pattern handling collisions.
 * Adheres to Interface Segregation and Liskov Substitution principles.
 */
export interface CollisionStrategy {
  handle(player: Player, entity: Entity, context: ICollisionContext): void;
}

/**
 * Strategy for standard solid platforms and walls.
 * Corrects positions mathematically and resolves velocity vectors.
 */
export class SolidCollisionStrategy implements CollisionStrategy {
  handle(player: Player, entity: Entity): void {
    // AABB Overlap resolution
    const pCenterX = player.x + player.width / 2;
    const pCenterY = player.y + player.height / 2;
    const eCenterX = entity.x + entity.width / 2;
    const eCenterY = entity.y + entity.height / 2;

    const dx = pCenterX - eCenterX;
    const dy = pCenterY - eCenterY;

    const minXDist = (player.width + entity.width) / 2;
    const minYDist = (player.height + entity.height) / 2;

    const overlapX = minXDist - Math.abs(dx);
    const overlapY = minYDist - Math.abs(dy);

    if (overlapX > 0 && overlapY > 0) {
      // Corner Nudging (Celeste/Mario style ledge forgiveness when jumping upwards or landing):
      // If player catches a corner edge by just a few pixels while jumping upwards, nudge horizontally instead of slamming head
      const cornerTolerance = 8;
      if (dy > 0 && player.vy < 0 && overlapX <= cornerTolerance && overlapY > cornerTolerance) {
        if (dx > 0) {
          player.x += overlapX + 1; // Nudge to the right
        } else {
          player.x -= overlapX + 1; // Nudge to the left
        }
        return;
      }

      // Check if player is descending or resting on top of the platform
      const playerFeet = player.y + player.height;
      const isLandingFromAbove = dy < 0 && (playerFeet <= entity.y + 16 || player.vy >= 0);

      if (overlapX < overlapY && !isLandingFromAbove) {
        // Resolve on X-axis (walls)
        if (dx > 0) {
          player.x += overlapX;
          player.vx = Math.max(0, player.vx);
        } else {
          player.x -= overlapX;
          player.vx = Math.min(0, player.vx);
        }
      } else {
        // Resolve on Y-axis (floor / ceiling)
        if (dy > 0) {
          // Hit ceiling from below
          player.y += overlapY;
          player.vy = Math.max(0, player.vy);
          player.isJumping = false;
          player.jumpHoldTimer = 0;
        } else {
          // Landed on floor
          player.y = entity.y - player.height;
          player.vy = 0;
          player.isGrounded = true;
          player.isJumping = false;
          player.jumpHoldTimer = 0;
          player.standingPlatformId = entity.id;
          player.platformVelocityX = entity.vx || 0;
          player.platformVelocityY = entity.vy || 0;
        }
      }
    }
  }
}

/**
 * Strategy for semi-permeable one-way platforms (scaffoldings, balconies, balustrades).
 * Allows players to jump through from below, but lands solidly when descending onto the top edge.
 */
export class OneWayCollisionStrategy implements CollisionStrategy {
  handle(player: Player, entity: Entity): void {
    // Only resolve landing if the player is falling or descending
    if (player.vy >= 0) {
      const playerFeet = player.y + player.height;
      const prevFeetY = playerFeet - player.vy;
      const platformTop = entity.y;

      // Check if player's feet crossed the top surface within forgiving landing window
      if (prevFeetY <= platformTop + 14 && playerFeet >= platformTop - 4) {
        player.y = platformTop - player.height;
        player.vy = 0;
        player.isGrounded = true;
        player.isJumping = false;
        player.jumpHoldTimer = 0;
        player.standingPlatformId = entity.id;
        player.platformVelocityX = entity.vx || 0;
        player.platformVelocityY = entity.vy || 0;
      }
    }
  }
}

/**
 * Strategy for hazardous entities (spikes, acid traps).
 * Damages the player, knocks them back, and triggers visual/audio feedback.
 */
export class HazardCollisionStrategy implements CollisionStrategy {
  handle(player: Player, entity: Entity, context: { triggerNarration: (id: string) => void }): void {
    if (player.isDead) return;
    
    // Knocks back player away from hazard center
    const knockbackForceX = 6;
    const knockbackForceY = -5;
    
    if (player.x + player.width / 2 < entity.x + entity.width / 2) {
      player.vx = -knockbackForceX;
    } else {
      player.vx = knockbackForceX;
    }
    
    player.vy = knockbackForceY;
    player.isGrounded = false;
    
    // Inflict Damage
    player.health = Math.max(0, player.health - 20);
    statsManager.recordDamageTaken(player.id, 20);
    gameAudio.playSFX(SoundType.SFX_HIT);

    if (player.health <= 0) {
      player.isDead = true;
      context.triggerNarration("narration_defeat");
    } else {
      context.triggerNarration("narration_enemy_hit");
    }
  }
}

/**
 * Strategy for narrative triggers.
 * Displays Bastion-style narrative subtitles and plays environmental cues.
 */
export class TriggerCollisionStrategy implements CollisionStrategy {
  handle(player: Player, entity: Entity, context: { triggerNarration: (id: string) => void }): void {
    if (entity.isActivated) return;
    
    entity.isActivated = true;
    if (entity.triggerId) {
      context.triggerNarration(entity.triggerId);
    }
  }
}

/**
 * Strategy for interactive levers.
 * Responds to player attacks or collision by unlocking doors and toggling triggers.
 */
export class LeverCollisionStrategy implements CollisionStrategy {
  handle(player: Player, entity: Entity, context: ICollisionContext): void {
    if (entity.isActivated) return;
    
    // Lever gets activated if player is in an active attack state overlapping it
    if (player.isAttacking) {
      entity.isActivated = true;
      gameAudio.playSFX(SoundType.SFX_UNLOCK);
      context.triggerNarration("narration_lever");
      if (entity.triggerId && context.onLeverActivated) {
        context.onLeverActivated(entity.triggerId);
      }
    }
  }
}

/**
 * Strategy for training/level goals.
 * Marks the completion of the level and plays celebratory victory arpeggios.
 */
export class GoalCollisionStrategy implements CollisionStrategy {
  handle(player: Player, entity: Entity, context: ICollisionContext): void {
    if (entity.isActivated) return;
    entity.isActivated = true;
    if (context.onGoalReached) {
      context.onGoalReached(entity);
    }
  }
}

/**
 * Interface contract for the Collision Engine (Dependency Inversion Principle).
 */
export interface ICollisionEngine {
  checkIntersection(p: { x: number; y: number; width: number; height: number }, e: Entity): boolean;
  resolve(player: Player, entity: Entity, context: ICollisionContext): void;
  registerStrategy(type: CollisionType, strategy: CollisionStrategy): void;
}

/**
 * Main manager applying strategies dynamically based on entity CollisionType.
 * Excellent showcase of Open-Closed Principle (SOLID) and Strategy Pattern!
 */
export class CollisionEngine implements ICollisionEngine {
  private strategies: Map<CollisionType, CollisionStrategy> = new Map();

  constructor() {
    this.strategies.set(CollisionType.Solid, new SolidCollisionStrategy());
    this.strategies.set(CollisionType.OneWay, new OneWayCollisionStrategy());
    this.strategies.set(CollisionType.Hazard, new HazardCollisionStrategy());
    this.strategies.set(CollisionType.Trigger, new TriggerCollisionStrategy());
    this.strategies.set(CollisionType.Lever, new LeverCollisionStrategy());
    this.strategies.set(CollisionType.Goal, new GoalCollisionStrategy());
  }

  public registerStrategy(type: CollisionType, strategy: CollisionStrategy): void {
    this.strategies.set(type, strategy);
  }

  /**
   * Helper to perform standard AABB intersection checks
   */
  public checkIntersection(p: { x: number; y: number; width: number; height: number }, e: Entity): boolean {
    return p.x < e.x + e.width &&
           p.x + p.width > e.x &&
           p.y < e.y + e.height &&
           p.y + p.height > e.y;
  }

  /**
   * Delegates the collision resolution to the corresponding Strategy class.
   */
  public resolve(player: Player, entity: Entity, context: ICollisionContext): void {
    if (!this.checkIntersection(player, entity)) return;

    const strategy = this.strategies.get(entity.type);
    if (strategy) {
      strategy.handle(player, entity, context);
    }
  }
}

export const gameCollisions = new CollisionEngine();
export default gameCollisions;
