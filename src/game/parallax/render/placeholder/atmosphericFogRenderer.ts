import { LocationDefinition } from "@game/locations/types";
import { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";

export interface IAtmosphericFogRenderer {
  renderSkyGradient(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    layer: ParallaxLayerSchema,
    viewportWidth: number,
    viewportHeight: number,
    progressY: number,
    tickCount: number
  ): void;

  renderFogOverlay(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    viewportWidth: number,
    viewportHeight: number,
    progressY: number,
    driftX: number,
    tickCount: number
  ): void;
}

/**
 * Dedicated renderer for atmospheric horizon haze, twinkling star fields,
 * sky gradients, and undulating multi-frequency fog ribbons.
 */
export class AtmosphericFogRenderer implements IAtmosphericFogRenderer {
  private readonly cachedStars: Array<{
    xRatio: number;
    yRatio: number;
    size: number;
    phase: number;
    brightness: number;
  }> = [];

  constructor() {
    this.initStarField();
  }

  private initStarField(): void {
    let seed = 42;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < 70; i++) {
      this.cachedStars.push({
        xRatio: random(),
        yRatio: random() * 0.65,
        size: random() > 0.85 ? 2 : 1,
        phase: random() * Math.PI * 2,
        brightness: 0.3 + random() * 0.7,
      });
    }
  }

  public renderSkyGradient(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    layer: ParallaxLayerSchema,
    viewportWidth: number,
    viewportHeight: number,
    progressY: number,
    tickCount: number
  ): void {
    const yShift = (progressY - 0.5) * 60;
    const grad = ctx.createLinearGradient(0, -yShift, 0, viewportHeight + 40 - yShift);

    const topColor = location.theme.bgGradientTop || "#2d140a";
    const bottomColor = location.theme.bgGradientBottom || "#120602";

    grad.addColorStop(0, topColor);
    grad.addColorStop(0.65, bottomColor);
    grad.addColorStop(1, location.theme.fogColor || "rgba(20, 6, 2, 0.8)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // If sky is dark or twilight, render subtle twinkling stars
    const isNightOrAether =
      location.id === "aether_sanctuary" ||
      location.id === "clocktower" ||
      location.id === "thorn_chasm" ||
      layer.depth < 0.05;

    if (isNightOrAether) {
      ctx.save();
      const starTint = location.id === "aether_sanctuary" ? "#38bdf8" : "#fef08a";
      for (let i = 0; i < this.cachedStars.length; i++) {
        const star = this.cachedStars[i];
        const starX = star.xRatio * viewportWidth;
        const starY = star.yRatio * viewportHeight - yShift * 0.3;
        const twinkle = Math.sin(tickCount * 0.04 + star.phase);
        const alpha = Math.max(0.1, star.brightness + twinkle * 0.35);

        ctx.globalAlpha = alpha * 0.75;
        ctx.fillStyle = starTint;
        ctx.fillRect(starX, starY, star.size, star.size);
      }
      ctx.restore();
    }

    // Atmospheric horizon haze band
    const hazeGrad = ctx.createLinearGradient(0, viewportHeight * 0.45, 0, viewportHeight);
    hazeGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    hazeGrad.addColorStop(0.7, layer.color || location.theme.fogColor || "rgba(245, 158, 11, 0.06)");
    hazeGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, viewportHeight * 0.45, viewportWidth, viewportHeight * 0.55);
  }

  public renderFogOverlay(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    viewportWidth: number,
    viewportHeight: number,
    progressY: number,
    driftX: number,
    tickCount: number
  ): void {
    const fogColor = layer.color || "rgba(245, 158, 11, 0.08)";
    const fogTop = viewportHeight * 0.42 - progressY * 40;

    ctx.save();
    ctx.fillStyle = fogColor;

    // Main smooth vertical fog gradient
    const grad = ctx.createLinearGradient(0, fogTop, 0, viewportHeight);
    grad.addColorStop(0, "rgba(0, 0, 0, 0)");
    grad.addColorStop(0.35, fogColor);
    grad.addColorStop(0.75, fogColor);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;

    // Undulating upper edge
    ctx.beginPath();
    ctx.moveTo(0, viewportHeight);
    ctx.lineTo(0, fogTop);

    const step = 40;
    for (let x = 0; x <= viewportWidth + step; x += step) {
      const wave1 = Math.sin((x + driftX * 0.8) * 0.008) * 22;
      const wave2 = Math.cos((x + tickCount * 1.2) * 0.015) * 12;
      ctx.lineTo(x, fogTop + wave1 + wave2);
    }

    ctx.lineTo(viewportWidth, viewportHeight);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export const defaultAtmosphericFogRenderer = new AtmosphericFogRenderer();
