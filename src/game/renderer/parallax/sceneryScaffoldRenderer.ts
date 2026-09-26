import { LocationDefinition } from "../../locations/types";
import { ParallaxLayerSchema } from "../../locations/schema/locationSchema";
import { ICastleSilhouetteRenderer, defaultCastleSilhouetteRenderer } from "./castleSilhouetteRenderer";

export interface ISceneryScaffoldRenderer {
  renderScenery(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    layer: ParallaxLayerSchema,
    boxWidth: number,
    boxHeight: number,
    extraWidth: number,
    extraHeight: number,
    progressX: number,
    progressY: number,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void;

  renderCustomShapes(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    boxWidth: number,
    boxHeight: number,
    extraWidth: number,
    extraHeight: number,
    progressX: number,
    progressY: number,
    driftX: number,
    driftY: number,
    viewportWidth: number,
    viewportHeight: number
  ): void;
}

/**
 * Dedicated renderer for thematic scenery (Cypress trees, Clockwork shafts, Aether aqueducts, Thorn brambles)
 * and custom geometric silhouette shapes. Adheres to SRP & DIP.
 */
export class SceneryScaffoldRenderer implements ISceneryScaffoldRenderer {
  private readonly castleSilhouetteRenderer: ICastleSilhouetteRenderer;

  constructor(deps: { castleSilhouetteRenderer?: ICastleSilhouetteRenderer } = {}) {
    this.castleSilhouetteRenderer = deps.castleSilhouetteRenderer || defaultCastleSilhouetteRenderer;
  }

  public renderScenery(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    layer: ParallaxLayerSchema,
    boxWidth: number,
    _boxHeight: number,
    extraWidth: number,
    extraHeight: number,
    progressX: number,
    progressY: number,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    const sceneryColor = layer.color || "#8d4325";
    ctx.fillStyle = sceneryColor;

    const baseHorizonY = viewportHeight * 0.54;
    const verticalShift = (progressY - 0.5) * extraHeight * layer.scrollSpeedY;
    const step = 420;

    for (let boxX = 0; boxX < boxWidth + step; boxX += step) {
      const baseRatioX = boxX / boxWidth;
      const baseScreenX = boxX - baseRatioX * extraWidth;
      const parallaxShiftX = (progressX - baseRatioX) * extraWidth * layer.scrollSpeedX;
      const screenX = baseScreenX - parallaxShiftX;

      if (screenX + 200 < 0 || screenX > viewportWidth + 100) continue;

      const drawY = baseHorizonY - verticalShift;

      if (location.id === "clocktower") {
        this.drawClockworkShaft(ctx, screenX, drawY - 60, sceneryColor, tickCount, boxX);
      } else if (location.id === "aether_sanctuary") {
        this.drawAetherAqueduct(ctx, screenX, drawY - 40, sceneryColor);
      } else if (location.id === "thorn_chasm") {
        this.drawThornBramble(ctx, screenX, drawY + 10, sceneryColor);
      } else {
        this.drawParallaxTree(ctx, screenX, drawY, sceneryColor);
      }
    }
  }

  public renderCustomShapes(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    boxWidth: number,
    boxHeight: number,
    extraWidth: number,
    extraHeight: number,
    progressX: number,
    progressY: number,
    driftX: number,
    driftY: number,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    if (!layer.elements) return;

    for (const el of layer.elements) {
      ctx.fillStyle = el.color;

      const baseRatioX = el.x / boxWidth;
      const baseScreenX = el.x - baseRatioX * extraWidth;
      const parallaxShiftX = (progressX - baseRatioX) * extraWidth * layer.scrollSpeedX;
      const screenX = baseScreenX - parallaxShiftX - driftX;

      const baseRatioY = el.y / boxHeight;
      const baseScreenY = el.y - baseRatioY * extraHeight;
      const parallaxShiftY = (progressY - baseRatioY) * extraHeight * layer.scrollSpeedY;
      const screenY = baseScreenY - parallaxShiftY - driftY;

      if (el.type === "rect" && el.width && el.height) {
        if (screenX + el.width < 0 || screenX > viewportWidth) continue;
        ctx.fillRect(screenX, screenY, el.width, el.height);
      } else if (el.type === "circle" && el.radius) {
        if (screenX + el.radius < 0 || screenX - el.radius > viewportWidth) continue;
        ctx.beginPath();
        ctx.arc(screenX, screenY, el.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.type === "castle_tower") {
        const tw = el.width || 80;
        const th = el.height || 260;
        if (screenX + tw < 0 || screenX > viewportWidth) continue;
        this.castleSilhouetteRenderer.drawNeedleSpire(ctx, screenX, screenY, tw, th);
      } else if (el.type === "pillar") {
        const pw = el.width || 24;
        const ph = el.height || 200;
        if (screenX + pw < 0 || screenX > viewportWidth) continue;
        ctx.fillRect(screenX, screenY, pw, ph);
        ctx.fillRect(screenX - 6, screenY - 6, pw + 12, 8);
        ctx.fillRect(screenX - 6, screenY + ph - 2, pw + 12, 8);
      } else if (el.type === "tree") {
        this.drawParallaxTree(ctx, screenX, screenY, el.color);
      }
    }
  }

  private drawClockworkShaft(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    tickCount: number,
    seed: number
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 120, 24, 450);
    ctx.fillRect(x - 40, y + 40, 100, 10);

    const gearX = x + 12;
    const gearY = y - 30;
    const gearR = 48;
    const rotation = tickCount * 0.006 * (seed % 2 === 0 ? 1 : -1);

    ctx.save();
    ctx.translate(gearX, gearY);
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.arc(0, 0, gearR, 0, Math.PI * 2);
    ctx.fill();

    const numTeeth = 8;
    for (let i = 0; i < numTeeth; i++) {
      ctx.rotate((Math.PI * 2) / numTeeth);
      ctx.fillRect(-6, -gearR - 8, 12, 10);
    }

    ctx.fillStyle = "#0b0402";
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawAetherAqueduct(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 22, 350);
    ctx.fillRect(x + 140, y, 22, 350);
    ctx.fillRect(x - 20, y - 20, 200, 24);

    ctx.beginPath();
    ctx.arc(x + 81, y + 25, 45, Math.PI, 0);
    ctx.lineWidth = 14;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  private drawThornBramble(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;

    ctx.beginPath();
    ctx.moveTo(x, y + 250);
    ctx.quadraticCurveTo(x + 20, y + 100, x - 15, y);
    ctx.quadraticCurveTo(x - 30, y - 40, x + 10, y - 90);
    ctx.stroke();

    const spikeCoords = [
      { sx: x + 10, sy: y + 80, dx: 22, dy: -12 },
      { sx: x - 5, sy: y + 20, dx: -24, dy: -10 },
      { sx: x - 18, sy: y - 30, dx: -20, dy: 14 },
      { sx: x + 2, sy: y - 70, dx: 18, dy: -15 },
    ];

    for (let i = 0; i < spikeCoords.length; i++) {
      const s = spikeCoords[i];
      ctx.beginPath();
      ctx.moveTo(s.sx, s.sy);
      ctx.lineTo(s.sx + s.dx, s.sy + s.dy);
      ctx.lineTo(s.sx + s.dx * 0.2, s.sy + s.dy + 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawParallaxTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(x - 7, y - 20, 14, 300);

    const tiers = [
      { r: 42, offsetY: 30 },
      { r: 36, offsetY: 0 },
      { r: 30, offsetY: -30 },
      { r: 22, offsetY: -58 },
      { r: 14, offsetY: -82 },
    ];

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      ctx.beginPath();
      ctx.arc(x, y - tier.offsetY, tier.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export const defaultSceneryScaffoldRenderer = new SceneryScaffoldRenderer();
