import { Player, Enemy, AssetQuality } from "../types";
import { SpriteAnimator } from "../engine/spriteAnimator";
import { IEnemyRenderer, defaultEnemyRenderer } from "./enemyRenderer";

export interface IActorRenderer {
  renderPlayers(
    ctx: CanvasRenderingContext2D,
    players: Player[],
    assetQuality: AssetQuality,
    tickCount: number
  ): void;

  renderEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[], tickCount?: number): void;
}

/**
 * Dedicated renderer for animated characters: players (with shield, squash & stretch)
 * and enemies (delegated via composition to EnemyRenderer) (SRP).
 */
export class ActorRenderer implements IActorRenderer {
  private readonly enemyRenderer: IEnemyRenderer;

  constructor(enemyRenderer: IEnemyRenderer = defaultEnemyRenderer) {
    this.enemyRenderer = enemyRenderer;
  }

  public renderPlayers(
    ctx: CanvasRenderingContext2D,
    players: Player[],
    assetQuality: AssetQuality,
    tickCount: number
  ): void {
    players.forEach((player) => {
      if (player.isDead) {
        ctx.fillStyle =
          player.id === "player1" ? "rgba(239, 68, 68, 0.4)" : "rgba(6, 182, 212, 0.4)";
        ctx.fillRect(player.x, player.y + player.height - 12, player.height, 12);
        return;
      }

      ctx.save();

      // Apply Squash & Stretch animation rooted at feet
      const feetX = player.x + player.width / 2;
      const feetY = player.y + player.height;
      const scaleX = player.squashStretchScaleX ?? 1;
      const scaleY = player.squashStretchScaleY ?? 1;

      ctx.translate(feetX, feetY);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-feetX, -feetY);

      // Render character with Engine SpriteAnimator & loaded PNG Sprite Maps
      SpriteAnimator.renderPlayer(ctx, player, assetQuality, tickCount);

      // Prismatic Shield Active Aura
      if (player.shieldActiveTime > 0) {
        ctx.save();
        const cx = player.x + player.width / 2;
        const cy = player.y + player.height / 2;

        const shieldPulse = Math.sin(Date.now() * 0.01) * 3;
        ctx.strokeStyle =
          player.id === "player1" ? "rgba(245, 158, 11, 0.85)" : "rgba(168, 85, 247, 0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 28 + shieldPulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle =
          player.id === "player1" ? "rgba(245, 158, 11, 0.15)" : "rgba(168, 85, 247, 0.15)";
        ctx.beginPath();
        ctx.arc(cx, cy, 28 + shieldPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    });
  }

  public renderEnemies(
    ctx: CanvasRenderingContext2D,
    enemies: Enemy[],
    tickCount: number = 0
  ): void {
    this.enemyRenderer.render(ctx, enemies, tickCount);
  }
}

export const defaultActorRenderer = new ActorRenderer();

