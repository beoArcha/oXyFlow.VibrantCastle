import { Enemy, Player } from "../types";
import { GamePhysicsEngine } from "../physics/physics";

export interface IEnemyAISystem {
  update(
    enemies: Enemy[],
    players: Player[],
    physics: GamePhysicsEngine,
    dtMultiplier: number
  ): boolean; // returns hasActiveAggro
}

/**
 * EnemyAISystem
 * Coordinates enemy behavior, physics update calls, and combat alert/aggro evaluation.
 * Separates enemy domain logic from the main GameEngine loop (SRP).
 */
export class EnemyAISystem implements IEnemyAISystem {
  public update(
    enemies: Enemy[],
    players: Player[],
    physics: GamePhysicsEngine,
    dtMultiplier: number
  ): boolean {
    let hasActiveAggro = false;

    enemies.forEach((enemy) => {
      physics.updateEnemy(enemy, dtMultiplier);

      if (!enemy.isDead && !enemy.isDummy) {
        hasActiveAggro = true;
      }
    });

    return hasActiveAggro;
  }
}
