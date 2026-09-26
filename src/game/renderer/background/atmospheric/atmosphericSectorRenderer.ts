import { LocationDefinition } from "../../../locations/types";

export interface ISectorAtmosphericRenderer {
  renderSectorAtmosphere(
    ctx: CanvasRenderingContext2D,
    locationId: string,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void;

  renderProceduralFarBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void;

  clearCaches(): void;
}

/**
 * Dedicated renderer for sector-specific atmospheric blending phenomena
 * (Chasm Mist, Bastion Solar, Clocktower Steam, Aether Aura, Courtyard Haze)
 * and procedural far backdrops with cached gradients.
 */
export class AtmosphericSectorRenderer implements ISectorAtmosphericRenderer {
  private readonly gradientCache: Map<string, CanvasGradient> = new Map();

  public clearCaches(): void {
    this.gradientCache.clear();
  }

  public getOrCreateLinearGradient(
    ctx: CanvasRenderingContext2D,
    key: string,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stops: readonly [number, string][]
  ): CanvasGradient {
    let grad = this.gradientCache.get(key);
    if (!grad) {
      grad = ctx.createLinearGradient(x0, y0, x1, y1);
      for (let i = 0; i < stops.length; i++) {
        grad.addColorStop(stops[i][0], stops[i][1]);
      }
      this.gradientCache.set(key, grad);
    }
    return grad;
  }

  public getOrCreateRadialGradient(
    ctx: CanvasRenderingContext2D,
    key: string,
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number,
    stops: readonly [number, string][]
  ): CanvasGradient {
    let grad = this.gradientCache.get(key);
    if (!grad) {
      grad = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
      for (let i = 0; i < stops.length; i++) {
        grad.addColorStop(stops[i][0], stops[i][1]);
      }
      this.gradientCache.set(key, grad);
    }
    return grad;
  }

  public renderSectorAtmosphere(
    ctx: CanvasRenderingContext2D,
    locationId: string,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    switch (locationId) {
      case "thorn_chasm":
        this.renderChasmAtmosphericMist(ctx, viewportWidth, viewportHeight, tickCount);
        break;
      case "grand_bastion":
        this.renderBastionSolarGlow(ctx, viewportWidth, viewportHeight, tickCount);
        break;
      case "clocktower":
        this.renderClocktowerAtmosphericSteam(ctx, viewportWidth, viewportHeight, tickCount);
        break;
      case "aether_sanctuary":
        this.renderAetherAtmosphericAura(ctx, viewportWidth, viewportHeight, tickCount);
        break;
      case "courtyard":
        this.renderCourtyardAutumnHaze(ctx, viewportWidth, viewportHeight, tickCount);
        break;
    }
  }

  public renderProceduralFarBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    viewportWidth: number,
    viewportHeight: number,
    _tickCount: number
  ): void {
    let glowColor = "rgba(251, 191, 36, 0.22)";
    let mountainColor = "#2a150b";

    if (location.id === "thorn_chasm") {
      glowColor = "rgba(147, 51, 234, 0.18)";
      mountainColor = "#15041c";
    } else if (location.id === "aether_sanctuary") {
      glowColor = "rgba(56, 189, 248, 0.20)";
      mountainColor = "#0f172a";
    } else if (location.id === "clocktower") {
      glowColor = "rgba(245, 158, 11, 0.16)";
      mountainColor = "#1c0b05";
    }

    const key = `proc_far_${location.id}_${viewportWidth}_${viewportHeight}`;
    const grad = this.getOrCreateRadialGradient(
      ctx,
      key,
      viewportWidth * 0.5,
      viewportHeight * 0.4,
      50,
      viewportWidth * 0.5,
      viewportHeight * 0.4,
      viewportWidth * 0.7,
      [
        [0, glowColor],
        [1, "rgba(0,0,0,0)"],
      ]
    );
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // Distant mountain silhouette
    ctx.fillStyle = mountainColor;
    ctx.beginPath();
    ctx.moveTo(0, viewportHeight);
    for (let x = 0; x <= viewportWidth; x += 40) {
      const peak =
        viewportHeight * 0.65 -
        Math.sin(x * 0.005) * 35 -
        Math.cos(x * 0.012) * 20;
      ctx.lineTo(x, peak);
    }
    ctx.lineTo(viewportWidth, viewportHeight);
    ctx.closePath();
    ctx.fill();
  }

  private renderChasmAtmosphericMist(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.12;
    const waveOffset = Math.sin(tickCount * 0.02) * 15;
    const key = `chasm_mist_${viewportHeight}`;
    const mistGrad = this.getOrCreateLinearGradient(
      ctx,
      key,
      0,
      viewportHeight * 0.6,
      0,
      viewportHeight,
      [
        [0, "rgba(147, 51, 234, 0)"],
        [0.5, "rgba(147, 51, 234, 0.25)"],
        [1, "rgba(88, 28, 135, 0)"],
      ]
    );
    ctx.translate(0, waveOffset);
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, viewportHeight * 0.6, viewportWidth, viewportHeight * 0.4);
    ctx.restore();
  }

  private renderBastionSolarGlow(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.08 + Math.sin(tickCount * 0.015) * 0.02;
    const key = `bastion_solar_${viewportWidth}_${viewportHeight}`;
    const glowGrad = this.getOrCreateLinearGradient(
      ctx,
      key,
      0,
      0,
      viewportWidth,
      viewportHeight,
      [
        [0, "rgba(251, 191, 36, 0.2)"],
        [0.5, "rgba(245, 158, 11, 0.05)"],
        [1, "rgba(180, 83, 9, 0)"],
      ]
    );
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    ctx.restore();
  }

  private renderClocktowerAtmosphericSteam(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.09 + Math.sin(tickCount * 0.02) * 0.02;
    const waveOffset = Math.sin(tickCount * 0.018) * 12;
    const key = `clocktower_steam_${viewportHeight}`;
    const steamGrad = this.getOrCreateLinearGradient(
      ctx,
      key,
      0,
      viewportHeight * 0.5,
      0,
      viewportHeight,
      [
        [0, "rgba(217, 119, 6, 0)"],
        [0.5, "rgba(245, 158, 11, 0.16)"],
        [1, "rgba(180, 83, 9, 0.04)"],
      ]
    );
    ctx.translate(0, waveOffset);
    ctx.fillStyle = steamGrad;
    ctx.fillRect(0, viewportHeight * 0.5, viewportWidth, viewportHeight * 0.5);
    ctx.restore();
  }

  private renderAetherAtmosphericAura(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.1 + Math.sin(tickCount * 0.025) * 0.03;
    const key = `aether_aura_${viewportWidth}_${viewportHeight}`;
    const auraGrad = this.getOrCreateRadialGradient(
      ctx,
      key,
      viewportWidth * 0.5,
      viewportHeight * 0.35,
      60,
      viewportWidth * 0.5,
      viewportHeight * 0.35,
      viewportWidth * 0.65,
      [
        [0, "rgba(56, 189, 248, 0.18)"],
        [0.5, "rgba(99, 102, 241, 0.08)"],
        [1, "rgba(15, 23, 42, 0)"],
      ]
    );
    ctx.fillStyle = auraGrad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    ctx.restore();
  }

  private renderCourtyardAutumnHaze(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.07 + Math.sin(tickCount * 0.012) * 0.015;
    const key = `courtyard_haze_${viewportHeight}`;
    const hazeGrad = this.getOrCreateLinearGradient(
      ctx,
      key,
      0,
      viewportHeight * 0.55,
      0,
      viewportHeight,
      [
        [0, "rgba(234, 88, 12, 0)"],
        [0.5, "rgba(224, 108, 53, 0.12)"],
        [1, "rgba(120, 53, 15, 0.03)"],
      ]
    );
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, viewportHeight * 0.55, viewportWidth, viewportHeight * 0.45);
    ctx.restore();
  }
}

export const defaultAtmosphericSectorRenderer = new AtmosphericSectorRenderer();
