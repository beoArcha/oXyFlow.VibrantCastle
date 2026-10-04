import { LocationDefinition } from "@game/locations/types";
import { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";

export interface ICastleSilhouetteRenderer {
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
    viewportHeight: number,
    tickCount: number
  ): void;
  drawNeedleSpire(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void;
}

/**
 * Dedicated renderer for Castlevania-style castle silhouettes (Distant Spires & Mid-ground Fortress Ramparts).
 */
export class CastleSilhouetteRenderer implements ICastleSilhouetteRenderer {
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
    viewportHeight: number,
    tickCount: number
  ): void {
    const isDistant = layer.depth < 0.2;
    const baseColor = layer.color || (isDistant ? "rgba(180, 83, 9, 0.16)" : "rgba(180, 83, 9, 0.26)");
    ctx.fillStyle = baseColor;

    // Repeating architecture intervals across the oversized background box
    const step = isDistant ? 560 : 440;
    const structureWidth = isDistant ? 120 : 160;
    const baseHeight = isDistant ? 340 : 280;

    // Baseline positioning: deeper layers sit slightly higher, foreground layers sit lower
    const horizonY = isDistant ? viewportHeight * 0.38 : viewportHeight * 0.46;
    const verticalShift = (progressY - 0.5) * extraHeight * layer.scrollSpeedY;

    // Window light color: amber warm candle glow or aether blue glow
    const windowColor = location.id === "aether_sanctuary" ? "rgba(56, 189, 248, 0.45)" : "rgba(251, 191, 36, 0.45)";

    for (let boxX = 0; boxX < boxWidth + step; boxX += step) {
      const baseRatioX = boxX / boxWidth;
      const baseScreenX = boxX - baseRatioX * extraWidth;
      const parallaxShiftX = (progressX - baseRatioX) * extraWidth * layer.scrollSpeedX;
      const screenX = baseScreenX - parallaxShiftX;

      // Frustum culling
      if (screenX + structureWidth + 100 < 0 || screenX > viewportWidth + 100) {
        continue;
      }

      const drawY = horizonY - verticalShift;

      if (isDistant) {
        // Distant slender needle spires and gothic cathedral silhouettes
        this.drawNeedleSpire(ctx, screenX, drawY, 80, baseHeight);
        this.drawNeedleSpire(ctx, screenX + 160, drawY - 30, 95, baseHeight + 30);
        this.drawNeedleSpire(ctx, screenX + 310, drawY + 20, 70, baseHeight - 20);

        // High arched connecting rampart bridges
        ctx.fillRect(screenX + 60, drawY + 80, 120, 14);
        ctx.fillRect(screenX + 230, drawY + 95, 100, 12);
      } else {
        // Midground fortified ramparts, machicolated towers, battlements
        this.drawFortressBastion(
          ctx,
          screenX,
          drawY,
          structureWidth,
          baseHeight,
          windowColor,
          tickCount,
          boxX
        );
        this.drawFortressBastion(
          ctx,
          screenX + 220,
          drawY - 25,
          structureWidth - 20,
          baseHeight + 25,
          windowColor,
          tickCount,
          boxX + 220
        );

        // Heavy connecting battlement wall
        ctx.fillStyle = baseColor;
        ctx.fillRect(screenX + structureWidth - 10, drawY + 70, 90, baseHeight - 70);
        // Wall crenellations
        for (let c = 0; c < 90; c += 18) {
          ctx.fillRect(screenX + structureWidth - 10 + c, drawY + 58, 10, 12);
        }
      }
    }
  }

  public drawNeedleSpire(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    // Spire tower body
    ctx.fillRect(x, y, w, h + 300);

    // Decorative corbels / overhang
    ctx.fillRect(x - 6, y - 6, w + 12, 10);

    // Needle pinnacle roof
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 65);
    ctx.lineTo(x - 4, y - 6);
    ctx.lineTo(x + w + 4, y - 6);
    ctx.closePath();
    ctx.fill();

    // Spire apex needle
    ctx.fillRect(x + w / 2 - 1.5, y - 85, 3, 22);
  }

  private drawFortressBastion(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    windowColor: string,
    tickCount: number,
    seed: number
  ): void {
    // Tower body
    ctx.fillRect(x, y, w, h + 300);

    // Cornice overhang
    ctx.fillRect(x - 8, y - 10, w + 16, 14);

    // Battlements / Crenels
    const toothW = Math.max(12, Math.floor(w / 6));
    for (let pos = x - 8; pos < x + w + 8; pos += toothW * 2) {
      ctx.fillRect(pos, y - 24, toothW, 14);
    }

    // High pointed roof on central turret
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 55);
    ctx.lineTo(x + 10, y - 10);
    ctx.lineTo(x + w - 10, y - 10);
    ctx.closePath();
    ctx.fill();

    // Animated waving banner / pennant atop tower
    const flagWave = Math.sin(tickCount * 0.08 + seed) * 4;
    ctx.fillRect(x + w / 2 - 1.5, y - 80, 3, 25);
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 80);
    ctx.lineTo(x + w / 2 + 18, y - 74 + flagWave);
    ctx.lineTo(x + w / 2, y - 68);
    ctx.closePath();
    ctx.fill();

    // Arched arrow slits with flickering warm candlelight
    const flicker = Math.sin(tickCount * 0.05 + seed) * 0.15;
    ctx.save();
    ctx.fillStyle = windowColor;
    ctx.globalAlpha = Math.max(0.2, 0.4 + flicker);

    const winX1 = x + w * 0.3 - 4;
    const winX2 = x + w * 0.7 - 4;
    const winY = y + 45;

    // Two arched window slots
    ctx.fillRect(winX1, winY, 8, 16);
    ctx.beginPath();
    ctx.arc(winX1 + 4, winY, 4, Math.PI, 0);
    ctx.fill();

    ctx.fillRect(winX2, winY, 8, 16);
    ctx.beginPath();
    ctx.arc(winX2 + 4, winY, 4, Math.PI, 0);
    ctx.fill();

    ctx.restore();
  }
}

export const defaultCastleSilhouetteRenderer = new CastleSilhouetteRenderer();
