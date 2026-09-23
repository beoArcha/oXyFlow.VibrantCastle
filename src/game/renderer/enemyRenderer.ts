import { Enemy } from "../types";
import { IAtlasSpriteRenderer, defaultAtlasSpriteRenderer } from "./atlasSpriteRenderer";

export interface IEnemyRenderer {
  render(ctx: CanvasRenderingContext2D, enemies: Enemy[], tickCount: number): void;
}

/**
 * Dedicated EnemyRenderer (Single Responsibility Principle & Open-Closed Principle).
 * Polymorphically renders enemies using high-resolution sprite sheet atlases
 * (e.g. Training Dummy, Clockwork Owl Gargoyle) with procedural fallback rendering
 * for non-atlas adversaries.
 */
export class EnemyRenderer implements IEnemyRenderer {
  private readonly atlasRenderer: IAtlasSpriteRenderer;

  constructor(atlasRenderer: IAtlasSpriteRenderer = defaultAtlasSpriteRenderer) {
    this.atlasRenderer = atlasRenderer;
  }

  public render(ctx: CanvasRenderingContext2D, enemies: Enemy[], tickCount: number): void {
    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      ctx.save();

      // 1. Determine Atlas ID
      let atlasId: string | null = null;
      if (enemy.templateId && this.atlasRenderer.hasAtlas(enemy.templateId)) {
        atlasId = enemy.templateId;
      } else if (enemy.isDummy && this.atlasRenderer.hasAtlas("training_dummy")) {
        atlasId = "training_dummy";
      } else if (enemy.isAerial && this.atlasRenderer.hasAtlas("clockwork_owl_gargoyle")) {
        atlasId = "clockwork_owl_gargoyle";
      }

      // 2. Determine Animation State
      let animName = enemy.animationState || (enemy.isAerial ? "gargoyle_fly" : "idle");
      if (enemy.damageTimer > 0) {
        animName = enemy.isAerial ? "gargoyle_hit" : "hit";
      }

      // 3. Attempt Atlas Rendering
      let renderedWithAtlas = false;
      if (atlasId) {
        const tint = enemy.damageTimer > 0 ? "rgba(239, 68, 68, 0.65)" : undefined;
        renderedWithAtlas = this.atlasRenderer.render(ctx, {
          atlasId,
          animationName: animName,
          ticks: enemy.animationTicks !== undefined ? enemy.animationTicks : tickCount,
          x: enemy.x,
          y: enemy.y,
          width: enemy.width,
          height: enemy.height,
          facingLeft: enemy.facingLeft,
          tintColor: tint,
        });
      }

      // 4. Procedural Fallback if no atlas available or texture not ready
      if (!renderedWithAtlas) {
        this.renderProceduralEnemy(ctx, enemy, tickCount);
      }

      // 5. Mini Overhead Health Bar (when damaged)
      if (enemy.health < enemy.maxHealth && enemy.health > 0) {
        this.renderHealthBar(ctx, enemy);
      }

      ctx.restore();
    });
  }

  /**
   * Procedural vector rendering fallback for enemies without an active sprite atlas
   */
  private renderProceduralEnemy(
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    tickCount: number
  ): void {
    const isFlashing = enemy.damageTimer > 0;

    if (enemy.isDummy) {
      // Procedural Training Dummy
      const cx = enemy.x + enemy.width / 2;

      ctx.fillStyle = "#78350f";
      ctx.fillRect(cx - 4, enemy.y + enemy.height - 12, 8, 12);
      ctx.fillRect(enemy.x, enemy.y + 24, enemy.width, 6);

      ctx.fillStyle = isFlashing ? "#ef4444" : "#eab308";
      ctx.fillRect(enemy.x + 4, enemy.y + 8, enemy.width - 8, enemy.height - 20);

      ctx.fillStyle = "#5c2512";
      ctx.fillRect(enemy.x + 4, enemy.y + 14, enemy.width - 8, 3);
      ctx.fillRect(enemy.x + 4, enemy.y + 32, enemy.width - 8, 3);

      ctx.fillStyle = "#6b7280";
      ctx.fillRect(cx - 10, enemy.y - 12, 20, 20);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(cx - 2, enemy.y - 20, 6, 8);
    } else if (enemy.isAerial) {
      // Procedural Flying Gargoyle
      const cy = enemy.y + enemy.height / 2;
      const hoverOffset = Math.sin((tickCount + enemy.x) * 0.08) * 6;
      const flapAngle = Math.sin((tickCount + enemy.x) * 0.2) * 15;

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

      ctx.fillStyle = isFlashing ? "#ef4444" : "#c29547";
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
    } else {
      // Generic Heavy Sentinel / Automaton / Knight
      ctx.fillStyle = isFlashing ? "#ef4444" : "#334155";
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

      // Armor trim
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(enemy.x, enemy.y, enemy.width, 4);
      ctx.fillRect(enemy.x, enemy.y + enemy.height - 6, enemy.width, 6);

      // Glowing optics
      ctx.fillStyle = isFlashing ? "#fca5a5" : "#38bdf8";
      const eyeX = enemy.facingLeft ? enemy.x + 6 : enemy.x + enemy.width - 14;
      ctx.fillRect(eyeX, enemy.y + 10, 8, 4);
    }
  }

  private renderHealthBar(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    const barWidth = Math.max(30, enemy.width);
    const barHeight = 4;
    const barX = enemy.x + (enemy.width - barWidth) / 2;
    const barY = enemy.y - 12;

    const hpRatio = Math.max(0, Math.min(1, enemy.health / enemy.maxHealth));

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    ctx.fillStyle = hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(barX, barY, Math.round(barWidth * hpRatio), barHeight);
  }
}

export const defaultEnemyRenderer = new EnemyRenderer();
