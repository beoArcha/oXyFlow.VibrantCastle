import { LocationDefinition } from "@game/locations/types";
import { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";

export interface IMountainRidgeRenderer {
  render(
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
    viewportHeight: number
  ): void;
}

/**
 * Dedicated renderer for procedural mountain ridges and chasm gorge crags with rim lighting.
 * Adheres to SRP & AGENT.md file size limits (< 160 lines).
 */
export class MountainRidgeRenderer implements IMountainRidgeRenderer {
  public render(
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
    viewportHeight: number
  ): void {
    const ridgeColor = layer.color || "rgba(100, 35, 15, 0.22)";
    ctx.fillStyle = ridgeColor;

    const baseHorizonY = viewportHeight * 0.52;
    const verticalShift = (progressY - 0.5) * extraHeight * layer.scrollSpeedY;
    const step = 380;

    for (let boxX = -step; boxX < boxWidth + step * 2; boxX += step) {
      const baseRatioX = boxX / boxWidth;
      const baseScreenX = boxX - baseRatioX * extraWidth;
      const parallaxShiftX = (progressX - baseRatioX) * extraWidth * layer.scrollSpeedX;
      const screenX = baseScreenX - parallaxShiftX;

      if (screenX + step * 2 < -50 || screenX > viewportWidth + 50) continue;

      const peakY = baseHorizonY - 140 - verticalShift;
      const baseY = viewportHeight + 100;

      // Jagged mountain polygon
      ctx.beginPath();
      ctx.moveTo(screenX - 80, baseY);
      ctx.lineTo(screenX + 60, peakY + 40);
      ctx.lineTo(screenX + step * 0.45, peakY);
      ctx.lineTo(screenX + step * 0.75, peakY + 55);
      ctx.lineTo(screenX + step + 60, baseY);
      ctx.closePath();
      ctx.fill();

      // Rim lighting highlight on crest edge
      ctx.save();
      ctx.strokeStyle = location.theme.fogColor || "rgba(251, 191, 36, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(screenX - 40, baseY - 60);
      ctx.lineTo(screenX + 60, peakY + 40);
      ctx.lineTo(screenX + step * 0.45, peakY);
      ctx.lineTo(screenX + step * 0.75, peakY + 55);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export const defaultMountainRidgeRenderer = new MountainRidgeRenderer();
