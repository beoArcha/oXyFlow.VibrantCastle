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

export type ParallaxSurfaceKind = "far" | "boss" | "dynamic";
export type ParallaxResizeQuality = "pixelated" | "medium";

export interface ParallaxSurfaceMetrics {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly pixelScale: number;
  readonly smoothing: boolean;
  readonly maxDimension?: number;
}

export interface ParallaxLoadResizeSpec {
  readonly kind: ParallaxSurfaceKind;
  readonly boxHeight: number;
  readonly allowUpscale: boolean;
}

export interface ParallaxTargetDimensions {
  readonly width: number;
  readonly height: number;
  readonly resizeQuality: ParallaxResizeQuality;
}

export const DEFAULT_PARALLAX_SURFACE_MAX_DIMENSION = 2560;

export function createLayerRect(): LayerRect {
  return { x: 0, y: 0, width: 0, height: 0 };
}

const PRE_SCALE_RECT = createLayerRect();

/**
 * Computes the pre-scaled pixel dimensions for a parallax layer matching
 * ParallaxBackdropRenderer / renderTiledDynamicLayer and ParallaxSurfaceCache clamping.
 */
export function computeParallaxPreScaleDimensions(
  srcWidth: number,
  srcHeight: number,
  spec: ParallaxLoadResizeSpec,
  metrics: ParallaxSurfaceMetrics
): ParallaxTargetDimensions | null {
  if (srcWidth <= 0 || srcHeight <= 0 || metrics.viewportWidth <= 0 || metrics.viewportHeight <= 0) {
    return null;
  }

  const pixelScale = metrics.pixelScale > 0 ? metrics.pixelScale : 1;
  let desiredWidth = srcWidth;
  let desiredHeight = srcHeight;

  if (spec.kind === "far") {
    resolveFarBackdropRect(
      PRE_SCALE_RECT,
      srcWidth,
      srcHeight,
      metrics.viewportWidth * 1.06,
      metrics.viewportHeight * 1.03
    );
    desiredWidth = PRE_SCALE_RECT.width * pixelScale;
    desiredHeight = PRE_SCALE_RECT.height * pixelScale;
  } else if (spec.kind === "boss") {
    resolveFarBackdropRect(
      PRE_SCALE_RECT,
      srcWidth,
      srcHeight,
      metrics.viewportWidth * 1.06,
      metrics.viewportHeight * 1.04
    );
    desiredWidth = PRE_SCALE_RECT.width * pixelScale;
    desiredHeight = PRE_SCALE_RECT.height * pixelScale;
  } else {
    const drawH = resolveLayerDrawHeight(srcHeight, spec.boxHeight, metrics.viewportHeight);
    const drawW = srcWidth * (drawH / srcHeight);
    desiredWidth = drawW * pixelScale;
    desiredHeight = drawH * pixelScale;
  }

  const maxDim = Math.max(64, metrics.maxDimension ?? DEFAULT_PARALLAX_SURFACE_MAX_DIMENSION);
  let targetW = Math.max(1, Math.round(desiredWidth));
  let targetH = Math.max(1, Math.round(desiredHeight));

  if (!spec.allowUpscale && (targetW > srcWidth || targetH > srcHeight)) {
    const shrink = Math.min(1, srcWidth / targetW, srcHeight / targetH);
    targetW = Math.max(1, Math.round(targetW * shrink));
    targetH = Math.max(1, Math.round(targetH * shrink));
  }

  if (targetW > maxDim || targetH > maxDim) {
    const cap = Math.min(maxDim / targetW, maxDim / targetH);
    targetW = Math.max(1, Math.round(targetW * cap));
    targetH = Math.max(1, Math.round(targetH * cap));
  }

  return {
    width: targetW,
    height: targetH,
    resizeQuality: metrics.smoothing ? "medium" : "pixelated",
  };
}

/**
 * Draw height of a scrolling layer: grows with the box but never below the viewport
 * (full vertical coverage) and never above the upscale cap (no blur on tall maps).
 */
export function resolveLayerDrawHeight(imageHeight: number, boxHeight: number, viewportHeight: number): number {
  const wanted = Math.min(boxHeight * BOX_HEIGHT_FILL, imageHeight * MAX_LAYER_UPSCALE);
  return Math.max(viewportHeight, wanted);
}

/** Triangle wave in [0, range]: constant 0 for an empty range, periodic otherwise. */
function pingPong(value: number, range: number): number {
  if (range <= 0) return 0;
  const period = range * 2;
  const m = ((value % period) + period) % period;
  return m <= range ? m : period - m;
}

/**
 * Vertical placement of a scrolling layer. The camera-progress term is clamped to
 * [viewportHeight - drawHeight, 0]; drift then ping-pongs inside the room that is left,
 * so neither the top nor the bottom edge of the image can ever enter the viewport and a
 * drifting layer keeps moving instead of sticking at an edge (the axis does not tile).
 */
export function resolveLayerScreenY(
  drawHeight: number,
  viewportHeight: number,
  progressY: number,
  scrollSpeedY: number,
  driftY: number
): number {
  const overflow = Math.max(0, drawHeight - viewportHeight);
  const base = Math.max(-overflow, Math.min(0, -progressY * overflow * scrollSpeedY));
  // `|| 0` normalises -0 so a static layer compares equal to 0.
  return base - pingPong(driftY, overflow + base) || 0;
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
