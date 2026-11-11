import { Player, Enemy, Entity, InputMap } from "@game/types";
import { PlayerKinematics, IPhysicsAudio } from "./playerKinematics";

export type { IPhysicsAudio };
export { PlayerKinematics };

/**
 * Manages pure game physics: player kinematics delegation, enemy patrol bounds,
 * moving platform rider displacement carriage, and co-op player-player collision resolution.
 */
export class GamePhysicsEngine {
  private readonly playerKinematics: PlayerKinematics;

  constructor(private audio?: IPhysicsAudio) {
    this.playerKinematics = new PlayerKinematics(() => this.audio);
  }

  /**
   * Applies kinematic movement, momentum, input forces, and jump feel.
   * Scaled with dtMultiplier for frame rate independence.
   */
  public updatePlayer(player: Player, inputs: InputMap, dtMultiplier: number = 1.0): void {
    this.playerKinematics.update(player, inputs, dtMultiplier);
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
