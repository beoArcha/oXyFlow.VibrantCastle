import { ParallaxLayerSchema } from "../../locations/schema/locationSchema";

export interface ICelestialRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    boxWidth: number,
    boxHeight: number,
    extraWidth: number,
    extraHeight: number,
    progressX: number,
    progressY: number,
    scrollX: number,
    scrollY: number,
    driftX: number,
    driftY: number,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void;
}

/**
 * Dedicated renderer for parallax celestial bodies (Suns, Moons, Eclipses, Radiant Halos).
 * Adheres to SRP & AGENT.md file size limits (< 150 lines).
 */
export class CelestialRenderer implements ICelestialRenderer {
  private readonly coronaGradientCache: Map<string, CanvasGradient> = new Map();

  public clearCaches(): void {
    this.coronaGradientCache.clear();
  }

  public render(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    boxWidth: number,
    boxHeight: number,
    extraWidth: number,
    extraHeight: number,
    progressX: number,
    progressY: number,
    _scrollX: number,
    _scrollY: number,
    driftX: number,
    driftY: number,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    if (!layer.elements || layer.elements.length === 0) return;

    for (const el of layer.elements) {
      if (el.type !== "circle" || !el.radius) continue;

      // Project celestial object from background box space into viewport
      const baseRatioX = el.x / boxWidth;
      const baseScreenX = el.x - baseRatioX * extraWidth;
      const parallaxShiftX = (progressX - baseRatioX) * extraWidth * layer.scrollSpeedX;
      const screenX = baseScreenX - parallaxShiftX - (driftX % viewportWidth);

      const baseRatioY = el.y / boxHeight;
      const baseScreenY = el.y - baseRatioY * extraHeight;
      const parallaxShiftY = (progressY - baseRatioY) * extraHeight * layer.scrollSpeedY;
      const screenY = baseScreenY - parallaxShiftY - driftY;

      // View-frustum culling
      const maxR = el.radius * 2.2;
      if (
        screenX + maxR < -50 ||
        screenX - maxR > viewportWidth + 50 ||
        screenY + maxR < -50 ||
        screenY - maxR > viewportHeight + 50
      ) {
        continue;
      }

      // Zero-allocation cached outer ethereal corona / halo (atmospheric scattering)
      const gradKey = `${el.color}_${el.radius}`;
      let glowGrad = this.coronaGradientCache.get(gradKey);
      if (!glowGrad) {
        glowGrad = ctx.createRadialGradient(
          0,
          0,
          el.radius * 0.2,
          0,
          0,
          el.radius * 1.8
        );
        glowGrad.addColorStop(0, el.color);
        glowGrad.addColorStop(0.45, el.color);
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        this.coronaGradientCache.set(gradKey, glowGrad);
      }

      ctx.save();
      ctx.translate(screenX, screenY);

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, el.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Inner solid celestial disk
      ctx.fillStyle = el.color;
      ctx.beginPath();
      ctx.arc(0, 0, el.radius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle radiant corona pulse
      const pulse = Math.sin(tickCount * 0.03 + el.x) * 3;
      ctx.strokeStyle = el.color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, el.radius + 6 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }
}

export const defaultCelestialRenderer = new CelestialRenderer();
