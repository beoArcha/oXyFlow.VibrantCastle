import {
  BackgroundLayerTier,
  ParallaxLayerSchema,
} from "@game/locations/schema/locationSchema";
import { MirrorableLayer, resolveLayerDrawHeight, resolveLayerScreenY } from "./parallaxGeometry";

export const TIER_ORDER: readonly BackgroundLayerTier[] = [
  "far",
  "mid_far",
  "mid",
  "boss_world",
  "mid_close",
  "boss_stage",
  "close",
];

export const DYNAMIC_TIERS: readonly BackgroundLayerTier[] = [
  "mid_far",
  "mid",
  "mid_close",
  "close",
] as const;

export const BOSS_TIERS: readonly BackgroundLayerTier[] = [
  "boss_world",
  "boss_stage",
] as const;

export const DEFAULT_TIER_SPEEDS: Readonly<
  Record<BackgroundLayerTier, { readonly x: number; readonly y: number }>
> = {
  far: { x: 0.04, y: 0.02 },
  mid_far: { x: 0.2, y: 0.08 },
  mid: { x: 0.38, y: 0.14 },
  mid_close: { x: 0.58, y: 0.22 },
  close: { x: 0.8, y: 0.32 },
  boss_stage: { x: 0.44, y: 0.14 },
  boss_world: { x: 0.24, y: 0.08 },
};

/**
 * Resolves the background layer tier from explicit schema properties, ID naming conventions, or depth tiers.
 */
export function resolveBackgroundTier(layer: ParallaxLayerSchema): BackgroundLayerTier {
  if (layer.tier) return layer.tier;

  const id = (layer.layerKey || layer.id).toLowerCase();
  if (id.includes("boss_world") || id.includes("boss:world")) return "boss_world";
  if (id.includes("boss_stage") || id.includes("boss:stage")) return "boss_stage";
  if (id.includes("mid_far") || id.includes("mid-far")) return "mid_far";
  if (id.includes("mid_close") || id.includes("mid-close") || id.includes("close_mid")) return "mid_close";
  if (id.includes("far") && !id.includes("mid")) return "far";
  if (id.includes("close") && !id.includes("mid")) return "close";
  if (id.includes("mid")) return "mid";

  if (layer.depth <= 0.15) return "far";
  if (layer.depth <= 0.35) return "mid_far";
  if (layer.depth <= 0.55) return "mid";
  if (layer.depth <= 0.75) return "mid_close";
  return "close";
}

/**
 * Draws `img` repeated horizontally across the viewport. Tile edges are rounded as
 * shared boundaries, so neighbours abut exactly (no 1 px gap or overlap). With `mirror`,
 * every odd world tile is flipped so its edge matches the neighbour's edge even when the
 * image itself does not tile.
 */
export function drawHorizontalTiles(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  screenX: number,
  screenY: number,
  drawW: number,
  drawH: number,
  viewportWidth: number,
  mirror: boolean
): void {
  let startX = screenX % drawW;
  if (startX > 0) startX -= drawW;
  const firstTile = Math.round((startX - screenX) / drawW);
  const top = Math.round(screenY);
  const height = Math.round(screenY + drawH) - top;

  let left = Math.round(startX);
  for (let n = 0; startX + n * drawW < viewportWidth; n++) {
    const right = Math.round(startX + (n + 1) * drawW);
    if (mirror && ((firstTile + n) & 1) === 1) {
      ctx.save();
      ctx.translate(right, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, top, right - left, height);
      ctx.restore();
    } else {
      ctx.drawImage(img, left, top, right - left, height);
    }
    left = right;
  }
}

export interface ITiledSurfaceBuffer {
  source: CanvasImageSource;
  width: number;
  height: number;
}

export interface ITiledSurfaceResolver {
  resolve(
    source: CanvasImageSource,
    srcWidth: number,
    srcHeight: number,
    desiredWidth: number,
    desiredHeight: number,
    allowUpscale: boolean,
    smoothing: boolean,
    out: ITiledSurfaceBuffer
  ): ITiledSurfaceBuffer;
}

const DEFAULT_SPEED_FALLBACK = { x: 0.5, y: 0.2 } as const;
const TILED_SURFACE_BUFFER: ITiledSurfaceBuffer = {
  source: null as unknown as CanvasImageSource,
  width: 0,
  height: 0,
};

/**
 * Draws `img` repeated horizontally across the viewport, clipped to `[0, viewportWidth] x [0, viewportHeight]`.
 * Tile edges share exact rounded boundaries so neighbours abut seamlessly without offscreen overdraw.
 */
export function drawHorizontalTilesClipped(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  srcW: number,
  srcH: number,
  screenX: number,
  screenY: number,
  drawW: number,
  drawH: number,
  viewportWidth: number,
  viewportHeight: number,
  mirror: boolean
): void {
  const top = Math.round(screenY);
  const height = Math.round(screenY + drawH) - top;
  if (height <= 0 || srcW <= 0 || srcH <= 0) return;

  const visTop = top > 0 ? top : 0;
  const visBottom = top + height < viewportHeight ? top + height : viewportHeight;
  const visH = visBottom - visTop;
  if (visH <= 0) return;

  const sy = ((visTop - top) / height) * srcH;
  const sh = (visH / height) * srcH;

  let startX = screenX % drawW;
  if (startX > 0) startX -= drawW;
  const firstTile = Math.round((startX - screenX) / drawW);

  let left = Math.round(startX);
  for (let n = 0; startX + n * drawW < viewportWidth; n++) {
    const right = Math.round(startX + (n + 1) * drawW);
    const tileW = right - left;
    const visLeft = left > 0 ? left : 0;
    const visRight = right < viewportWidth ? right : viewportWidth;
    const visW = visRight - visLeft;

    if (tileW > 0 && visW > 0) {
      if (mirror && ((firstTile + n) & 1) === 1) {
        const fx0 = right - visRight;
        const sx = (fx0 / tileW) * srcW;
        const sw = (visW / tileW) * srcW;
        ctx.save();
        ctx.translate(right, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, sx, sy, sw, sh, fx0, visTop, visW, visH);
        ctx.restore();
      } else {
        const sx = ((visLeft - left) / tileW) * srcW;
        const sw = (visW / tileW) * srcW;
        ctx.drawImage(img, sx, sy, sw, sh, visLeft, visTop, visW, visH);
      }
    }
    left = right;
  }
}

/**
 * Renders a dynamic parallax background layer with seamless horizontal tiling and vertical parallax clamping.
 */
export function renderTiledDynamicLayer(
  ctx: CanvasRenderingContext2D,
  layer: MirrorableLayer,
  tier: BackgroundLayerTier,
  img: HTMLImageElement,
  boxHeight: number,
  extraWidth: number,
  progressX: number,
  progressY: number,
  viewportWidth: number,
  viewportHeight: number,
  tickCount: number,
  alphaMultiplier = 1,
  showWireframes = false,
  surfaceResolver?: ITiledSurfaceResolver
): void {
  if (alphaMultiplier <= 0.005) return;

  const baseOpacity = layer.opacity !== undefined ? layer.opacity : 1;
  const finalAlpha = Math.max(0, Math.min(1, baseOpacity * alphaMultiplier));
  const needsStateSave = finalAlpha < 1 || Boolean(layer.blendMode) || showWireframes;

  if (needsStateSave) {
    ctx.save();
    if (finalAlpha < 1) {
      ctx.globalAlpha = finalAlpha;
    }
    if (layer.blendMode) {
      ctx.globalCompositeOperation = layer.blendMode;
    }
  }

  const srcNatW = img.naturalWidth;
  const srcNatH = img.naturalHeight;
  const drawH = resolveLayerDrawHeight(srcNatH, boxHeight, viewportHeight);
  const drawW = srcNatW * (drawH / srcNatH);

  const speed = DEFAULT_TIER_SPEEDS[tier] || DEFAULT_SPEED_FALLBACK;
  const scrollSpeedX = layer.scrollSpeedX !== undefined ? layer.scrollSpeedX : speed.x;
  const scrollSpeedY = layer.scrollSpeedY !== undefined ? layer.scrollSpeedY : speed.y;

  const driftX = layer.autoDriftX ? tickCount * layer.autoDriftX : 0;
  const driftY = layer.autoDriftY ? tickCount * layer.autoDriftY : 0;

  const screenX = -(progressX * extraWidth * scrollSpeedX) - driftX;
  const screenY = resolveLayerScreenY(drawH, viewportHeight, progressY, scrollSpeedY, driftY);

  let drawSource: CanvasImageSource = img;
  let drawSrcW = srcNatW;
  let drawSrcH = srcNatH;
  if (surfaceResolver) {
    const pixelScale = ctx.canvas ? ctx.canvas.width / Math.max(1, viewportWidth) : 1;
    const resolved = surfaceResolver.resolve(
      img,
      srcNatW,
      srcNatH,
      drawW * pixelScale,
      drawH * pixelScale,
      layer.blendMode !== "screen",
      ctx.imageSmoothingEnabled,
      TILED_SURFACE_BUFFER
    );
    drawSource = resolved.source;
    drawSrcW = resolved.width;
    drawSrcH = resolved.height;
  }

  drawHorizontalTilesClipped(
    ctx,
    drawSource,
    drawSrcW,
    drawSrcH,
    screenX,
    screenY,
    drawW,
    drawH,
    viewportWidth,
    viewportHeight,
    layer.mirrorTile === true
  );

  if (showWireframes) {
    renderTierWireframe(ctx, tier, layer.id, viewportWidth, viewportHeight);
  }

  if (needsStateSave) {
    ctx.restore();
  }
}


function renderTierWireframe(
  ctx: CanvasRenderingContext2D,
  tier: BackgroundLayerTier,
  layerId: string,
  viewportWidth: number,
  viewportHeight: number
): void {
  ctx.save();
  ctx.strokeStyle =
    tier === "mid_far"
      ? "#38bdf8"
      : tier === "mid"
        ? "#22c55e"
        : tier === "mid_close"
          ? "#eab308"
          : tier === "boss_stage"
            ? "#f97316"
            : tier === "boss_world"
              ? "#e11d48"
              : "#ec4899";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(0, 0, viewportWidth, viewportHeight);
  ctx.font = "bold 11px monospace";
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(`TIER: ${tier.toUpperCase()} [${layerId}]`, 14, 24 + TIER_ORDER.indexOf(tier) * 16);
  ctx.restore();
}
