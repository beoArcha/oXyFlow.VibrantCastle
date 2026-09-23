import { Projectile, Particle } from "../types";

export interface IFxRenderer {
  renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]): void;
  renderParticles(
    ctx: CanvasRenderingContext2D,
    particles: readonly Particle[],
    targetType: "dust" | "leaf" | "spark"
  ): void;
}

/**
 * Dedicated visual effects renderer for magic projectiles, glow cores, and particle simulations (SRP).
 */
export class FxRenderer implements IFxRenderer {
  public renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]): void {
    projectiles.forEach((p) => {
      ctx.save();

      // Glowing outer aura
      const grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.radius * 2);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.4, p.color);
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Solid core missile
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Trailing tail spark
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillRect(p.x - p.vx * 1.5, p.y - p.vy * 1.5, p.radius * 0.8, p.radius * 0.8);

      ctx.restore();
    });
  }

  public renderParticles(
    ctx: CanvasRenderingContext2D,
    particles: readonly Particle[],
    targetType: "dust" | "leaf" | "spark"
  ): void {
    particles.forEach((p) => {
      if (p.type !== targetType) return;

      ctx.fillStyle = p.color;

      if (p.type === "spark") {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else if (p.type === "leaf") {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 1.5, p.size, p.life * 0.04, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const alpha = 1.0 - p.life / p.maxLife;
        ctx.fillStyle = `rgba(253, 224, 71, ${alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}

export const defaultFxRenderer = new FxRenderer();
