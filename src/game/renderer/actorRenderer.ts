import { Player, Enemy, AssetQuality } from "../types";
import { SpriteAnimator } from "../engine/spriteAnimator";

export interface IActorRenderer {
  renderPlayers(
    ctx: CanvasRenderingContext2D,
    players: Player[],
    assetQuality: AssetQuality,
    tickCount: number
  ): void;

  renderEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]): void;
}

/**
 * Dedicated renderer for animated characters: players (with shield, squash & stretch)
 * and enemies (target dummies, flying gargoyles, damage flashes) (SRP).
 */
export class ActorRenderer implements IActorRenderer {
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

  public renderEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]): void {
    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      ctx.save();

      if (enemy.damageTimer > 0) {
        ctx.fillStyle = "#f87171";
      } else {
        ctx.fillStyle = enemy.isDummy ? "#d97706" : "#4c1d95";
      }

      if (enemy.isDummy) {
        const cx = enemy.x + enemy.width / 2;

        ctx.fillStyle = "#78350f";
        ctx.fillRect(cx - 4, enemy.y + enemy.height - 12, 8, 12);
        ctx.fillRect(enemy.x, enemy.y + 24, enemy.width, 6);

        ctx.fillStyle = enemy.damageTimer > 0 ? "#ef4444" : "#eab308";
        ctx.fillRect(enemy.x + 4, enemy.y + 8, enemy.width - 8, enemy.height - 20);

        ctx.fillStyle = "#5c2512";
        ctx.fillRect(enemy.x + 4, enemy.y + 14, enemy.width - 8, 3);
        ctx.fillRect(enemy.x + 4, enemy.y + 32, enemy.width - 8, 3);

        ctx.fillStyle = "#6b7280";
        ctx.fillRect(cx - 10, enemy.y - 12, 20, 20);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(cx - 2, enemy.y - 20, 6, 8);
      } else {
        const cy = enemy.y + enemy.height / 2;
        const hoverOffset = Math.sin(Date.now() * 0.008) * 6;
        const flapAngle = Math.sin(Date.now() * 0.02) * 15;

        ctx.fillStyle = "#b45309";

        // Left Wing
        ctx.save();
        ctx.translate(enemy.x, cy + hoverOffset);
        ctx.rotate((-flapAngle * Math.PI) / 180);
        ctx.fillRect(-22, -10, 22, 14);
        ctx.restore();

        // Right Wing
        ctx.save();
        ctx.translate(enemy.x + enemy.width, cy + hoverOffset);
        ctx.rotate((flapAngle * Math.PI) / 180);
        ctx.fillRect(0, -10, 22, 14);
        ctx.restore();

        ctx.fillStyle = enemy.damageTimer > 0 ? "#ef4444" : "#c29547";
        ctx.fillRect(enemy.x, enemy.y + hoverOffset, enemy.width, enemy.height);

        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(
          enemy.facingLeft ? enemy.x + 4 : enemy.x + enemy.width - 12,
          enemy.y + hoverOffset + 6,
          4,
          4
        );
        ctx.fillRect(
          enemy.facingLeft ? enemy.x + 12 : enemy.x + enemy.width - 20,
          enemy.y + hoverOffset + 6,
          4,
          4
        );
      }

      ctx.restore();
    });
  }
}

export const defaultActorRenderer = new ActorRenderer();
