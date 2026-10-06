import { Projectile, Particle } from "@game/types";

export interface IFxRenderer {
  renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]): void;
  renderParticles(
    ctx: CanvasRenderingContext2D,
    particles: readonly Particle[],
    targetType: "dust" | "leaf" | "spark"
  ): void;
}

/**
 * Dedicated visual effects renderer for magic projectiles, glow cores, and particle simulations.
 */
export class FxRenderer implements IFxRenderer {
  private readonly projectileGradientCache: Map<string, CanvasGradient> = new Map();

  public clearCaches(): void {
    this.projectileGradientCache.clear();
  }

  public renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]): void {
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      const r = p.radius || 8;
      const key = `${p.color}_${r}`;

      let grad = this.projectileGradientCache.get(key);
      if (!grad) {
        grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.4, p.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        this.projectileGradientCache.set(key, grad);
      }

      ctx.save();
      ctx.translate(p.x, p.y);

      // Glowing outer aura
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
      ctx.fill();

      // Solid core missile
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Trailing tail spark
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillRect(-p.vx * 1.5, -p.vy * 1.5, r * 0.8, r * 0.8);
      ctx.restore();
    }
  }

  public renderParticles(
    ctx: CanvasRenderingContext2D,
    particles: readonly Particle[],
    targetType: "dust" | "leaf" | "spark"
  ): void {
    const prevAlpha = ctx.globalAlpha;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.type !== targetType) continue;

      ctx.fillStyle = p.color;

      if (p.type === "spark") {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else if (p.type === "leaf") {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 1.5, p.size, p.life * 0.04, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Dust particle: avoid string interpolation in render loop 
        const alpha = Math.max(0, (1.0 - p.life / p.maxLife) * 0.35);
        ctx.globalAlpha = prevAlpha * alpha;
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = prevAlpha;
      }
    }

    ctx.globalAlpha = prevAlpha;
  }
}

export const defaultFxRenderer = new FxRenderer();
