import { Player, Entity, CollisionType, ParticleBurstType } from "@game/types";
import { ICollisionEngine } from "./collisions";

/**
 * Context callbacks and state queries for EnvironmentCollisionSystem.
 */
export interface IEnvironmentCollisionContext {
  collisionEngine: ICollisionEngine;
  triggerNarration(id: string): void;
  onGoalReached(goalEntity?: Entity): void;
  onLeverActivated(leverId: string): void;
  spawnBurst(
    x: number,
    y: number,
    color: string,
    type: ParticleBurstType,
    count: number
  ): void;
  isNoClip(): boolean;
  isLevelTransitionPending(): boolean;
}

/**
 * Interface contract for EnvironmentCollisionSystem.
 */
export interface IEnvironmentCollisionSystem {
  resolveEnvironmentCollisions(
    players: Player[],
    entities: Entity[],
    levelWidth: number,
    portalCooldownTimer: number,
    context: IEnvironmentCollisionContext
  ): void;
}

/**
 * EnvironmentCollisionSystem handles player interaction with level terrain:
 * - Solid platforms, moving carriage platforms, and one-way pass-throughs
 * - Grounded state transitions and landing dust particle emission
 * - Hazard damage interception when active shield is present
 * - Horizontal level boundary constraints
 *
 * Implements Zero Allocation design in the per-frame simulation loop.
 */
export class EnvironmentCollisionSystem implements IEnvironmentCollisionSystem {
  public resolveEnvironmentCollisions(
    players: Player[],
    entities: Entity[],
    levelWidth: number,
    portalCooldownTimer: number,
    context: IEnvironmentCollisionContext
  ): void {
    const isNoClip = context.isNoClip();

    for (let pIdx = 0; pIdx < players.length; pIdx++) {
      if (context.isLevelTransitionPending()) break;
      const player = players[pIdx];

      // Ghost / noclip mode passes through terrain
      if (isNoClip) continue;

      let groundedThisFrame = false;

      for (let eIdx = 0; eIdx < entities.length; eIdx++) {
        if (context.isLevelTransitionPending()) break;
        const entity = entities[eIdx];

        // Skip lifted gates
        if (entity.y === -1000) continue;

        // Portal grace period after transition prevents immediate re-trigger / ping-pong
        if (entity.type === CollisionType.Goal && portalCooldownTimer > 0) {
          continue;
        }

        const collides = context.collisionEngine.checkIntersection(player, entity);
        if (collides) {
          // If hazard and player has active shield, shield absorbs damage!
          if (entity.type === CollisionType.Hazard && player.shieldActiveTime > 0) {
            context.spawnBurst(
              player.x + player.width / 2,
              player.y + player.height / 2,
              "#a855f7",
              "spark",
              8
            );
            continue;
          }

          context.collisionEngine.resolve(player, entity, {
            triggerNarration: (id: string) => context.triggerNarration(id),
            onGoalReached: (goalEntity?: Entity) => context.onGoalReached(goalEntity),
            onLeverActivated: (id: string) => context.onLeverActivated(id),
          });

          if (context.isLevelTransitionPending()) {
            break;
          }

          if (
            (entity.type === CollisionType.Solid || entity.type === CollisionType.OneWay) &&
            player.vy === 0 &&
            player.y + player.height <= entity.y + 10
          ) {
            groundedThisFrame = true;
            player.standingPlatformId = entity.id;
            player.platformVelocityX = entity.vx || 0;
            player.platformVelocityY = entity.vy || 0;
          }
        }
      }

      if (context.isLevelTransitionPending()) {
        break;
      }

      if (groundedThisFrame) {
        if (!player.isGrounded) {
          // Landing puff dust particles
          context.spawnBurst(
            player.x + player.width / 2,
            player.y + player.height,
            "#fed7aa",
            "dust",
            6
          );
        }
        player.isGrounded = true;
      } else if (player.isGrounded) {
        // Zero-allocation ground-beneath check (no temporary rect allocation)
        let solidBeneath = false;
        const feetX = player.x;
        const feetY = player.y + 1;
        const feetRight = feetX + player.width;
        const feetBottom = feetY + player.height;

        for (let j = 0; j < entities.length; j++) {
          const entity = entities[j];
          if (
            (entity.type === CollisionType.Solid || entity.type === CollisionType.OneWay) &&
            entity.y !== -1000
          ) {
            if (
              feetX < entity.x + entity.width &&
              feetRight > entity.x &&
              feetY < entity.y + entity.height &&
              feetBottom > entity.y
            ) {
              solidBeneath = true;
              player.standingPlatformId = entity.id;
              player.platformVelocityX = entity.vx || 0;
              player.platformVelocityY = entity.vy || 0;
              break;
            }
          }
        }

        if (!solidBeneath) {
          player.isGrounded = false;
          player.standingPlatformId = null;
          player.platformVelocityX = 0;
          player.platformVelocityY = 0;
        }
      }

      // Screen bound clamps (ensure platform carriage never pushes outside map bounds)
      if (player.x < 0) {
        player.x = 0;
      } else if (player.x + player.width > levelWidth) {
        player.x = levelWidth - player.width;
      }
    }
  }
}
