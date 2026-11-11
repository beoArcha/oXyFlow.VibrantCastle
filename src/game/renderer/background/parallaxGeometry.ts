import type { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";

/** Share of the background box height a scrolling layer image is stretched to. */
export const BOX_HEIGHT_FILL = 0.85;

/**
 * Largest on-screen scale a scrolling layer image may reach. Above this the pixel art
 * turns visibly soft, and tall boxes would otherwise stretch a 768 px image 3x or more.
 * The tallest box shipped before the cap (clocktower, 1400) resolves to 1.64.
 */
export const MAX_LAYER_UPSCALE = 1.65;

export type MirrorableLayer = ParallaxLayerSchema & { readonly mirrorTile?: boolean };

export interface LayerRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createLayerRect(): LayerRect {
  return { x: 0, y: 0, width: 0, height: 0 };
}

/**
 * Draw height of a scrolling layer: grows with the box but never below the viewport
 * (full vertical coverage) and never above the upscale cap (no blur on tall maps).
 */
export function resolveLayerDrawHeight(imageHeight: number, boxHeight: number, viewportHeight: number): number {
  const wanted = Math.min(boxHeight * BOX_HEIGHT_FILL, imageHeight * MAX_LAYER_UPSCALE);
  return Math.max(viewportHeight, wanted);
}

/**
 * Vertical placement of a scrolling layer. The offset is clamped to
 * [viewportHeight - drawHeight, 0] so neither the top nor the bottom edge of the image
 * can ever enter the viewport, whatever the speed, progress or drift values are.
 */
export function resolveLayerScreenY(
  drawHeight: number,
  viewportHeight: number,
  progressY: number,
  scrollSpeedY: number,
  driftY: number
): number {
  const overflow = Math.max(0, drawHeight - viewportHeight);
  const raw = -progressY * overflow * scrollSpeedY - driftY;
  return Math.max(-overflow, Math.min(0, raw));
}

/**
 * Cover-fit rectangle of the static FAR backdrop. Edges are floored/ceiled outward so
 * rounding can never leave a sub-pixel gap at the viewport border.
 */
export function resolveFarBackdropRect(
  out: LayerRect,
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  const scale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);
  const drawW = imageWidth * scale;
  const drawX = (viewportWidth - drawW) / 2;
  const left = Math.floor(drawX);
  out.x = left;
  out.y = 0;
  out.width = Math.ceil(drawX + drawW) - left;
  out.height = Math.ceil(imageHeight * scale);
}
