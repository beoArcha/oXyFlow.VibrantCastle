import { SpriteFrame } from "@game/engine/spriteTypes";
import { SpriteStageVisualProps } from "./types";

export interface RenderSpritePreviewOptions extends SpriteStageVisualProps {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly frame: SpriteFrame | null;
  readonly texture: HTMLImageElement | null;
}

/**
 * Pure 2D canvas drawing routine for CharacterSpritePreview.
 *
 * Responsibilities:
 * - Clears canvas and draws atmospheric radial background gradient.
 * - Computes adaptive vertical and horizontal clearance preventing sprite clipping.
 * - Draws gothic ground accent line and soft contact shadow.
 * - Transforms coordinate space and blits sprite frame pixels crisply.
 */
export function renderSpritePreviewFrame(options: RenderSpritePreviewOptions): void {
  const {
    canvas,
    ctx,
    frame,
    texture,
    scale = 1.6,
    flipHorizontal = false,
    backgroundGradient = ["#1a0802", "#080201"],
    accentColor = "#d97706",
  } = options;

  const w = canvas.width;
  const h = canvas.height;
  if (w <= 0 || h <= 0) return;

  ctx.clearRect(0, 0, w, h);

  // 1. Atmospheric radial background gradient
  const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 1.1);
  grad.addColorStop(0, backgroundGradient[0]);
  grad.addColorStop(1, backgroundGradient[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 2. Intelligent Ground & Center calculation to guarantee ZERO clipping
  let feetX = Math.round(w / 2);
  let feetY = Math.round(h * 0.78);

  if (frame) {
    const scaledHeadHeight = frame.originY * scale;
    const scaledFeetDepth = (frame.h - frame.originY) * scale;
    const scaledLeftWidth = frame.originX * scale;
    const scaledRightWidth = (frame.w - frame.originX) * scale;

    // Keep at least 24px clearance from top edge
    if (feetY - scaledHeadHeight < 24) {
      feetY = Math.round(scaledHeadHeight + 24);
    }
    // Keep at least 20px clearance from bottom edge
    if (feetY + scaledFeetDepth > h - 20) {
      feetY = Math.round(h - scaledFeetDepth - 20);
    }

    // Horizontal clearance
    if (feetX - scaledLeftWidth < 24) {
      feetX = Math.round(scaledLeftWidth + 24);
    } else if (feetX + scaledRightWidth > w - 24) {
      feetX = Math.round(w - scaledRightWidth - 24);
    }
  }

  const groundY = feetY;

  // 3. Ground guide accent line
  ctx.strokeStyle = accentColor;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(Math.max(16, feetX - 120 * scale), groundY);
  ctx.lineTo(Math.min(w - 16, feetX + 120 * scale), groundY);
  ctx.stroke();

  // 4. Contact shadow ellipse
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.beginPath();
  ctx.ellipse(feetX, groundY, 24 * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;

  // 5. Draw Sprite Frame
  if (frame && texture && texture.complete && texture.naturalWidth > 0) {
    ctx.save();
    ctx.translate(feetX, feetY);
    if (flipHorizontal) {
      ctx.scale(-1, 1);
    }
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      texture,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      -frame.originX,
      -frame.originY,
      frame.w,
      frame.h
    );
    ctx.restore();
  }
}
