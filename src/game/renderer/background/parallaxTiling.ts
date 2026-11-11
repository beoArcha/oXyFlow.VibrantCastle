import {
  BackgroundLayerTier,
  ParallaxLayerSchema,
} from "@game/locations/schema/locationSchema";
import { MirrorableLayer, resolveLayerDrawHeight, resolveLayerScreenY } from "./parallaxGeometry";
import { debugManager } from "@game/debug/debugManager";

export const TIER_ORDER: readonly BackgroundLayerTier[] = [
  "far",
  "mid_far",
  "mid",
  "mid_close",
  "close",
];

export const DYNAMIC_TIERS: readonly BackgroundLayerTier[] = [
  "mid_far",
  "mid",
  "mid_close",
  "close",
] as const;

export const DEFAULT_TIER_SPEEDS: Readonly<
  Record<BackgroundLayerTier, { readonly x: number; readonly y: number }>
> = {
  far: { x: 0.0, y: 0.0 },
  mid_far: { x: 0.22, y: 0.09 },
  mid: { x: 0.42, y: 0.18 },
  mid_close: { x: 0.65, y: 0.3 },
  close: { x: 0.85, y: 0.45 },
};

/**
 * Resolves the background layer tier from explicit schema properties, ID naming conventions, or depth tiers.
 */
export function resolveBackgroundTier(layer: ParallaxLayerSchema): BackgroundLayerTier {
  if (layer.tier) return layer.tier;

  const id = layer.id.toLowerCase();
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
  tickCount: number
): void {
  ctx.save();
  if (layer.opacity !== undefined && layer.opacity < 1) {
    ctx.globalAlpha = layer.opacity;
  }

  const drawH = resolveLayerDrawHeight(img.naturalHeight, boxHeight, viewportHeight);
  const drawW = img.naturalWidth * (drawH / img.naturalHeight);

  const speed = DEFAULT_TIER_SPEEDS[tier] || { x: 0.5, y: 0.2 };
  const scrollSpeedX = layer.scrollSpeedX !== undefined ? layer.scrollSpeedX : speed.x;
  const scrollSpeedY = layer.scrollSpeedY !== undefined ? layer.scrollSpeedY : speed.y;

  const driftX = layer.autoDriftX ? tickCount * layer.autoDriftX : 0;
  const driftY = layer.autoDriftY ? tickCount * layer.autoDriftY : 0;

  const screenX = -(progressX * extraWidth * scrollSpeedX) - driftX;
  const screenY = resolveLayerScreenY(drawH, viewportHeight, progressY, scrollSpeedY, driftY);

  drawHorizontalTiles(ctx, img, screenX, screenY, drawW, drawH, viewportWidth, layer.mirrorTile === true);

  if (debugManager.state.showHitboxes) {
    renderTierWireframe(ctx, tier, layer.id, viewportWidth, viewportHeight);
  }

  ctx.restore();
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
          : "#ec4899";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(0, 0, viewportWidth, viewportHeight);
  ctx.font = "bold 11px monospace";
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(`TIER: ${tier.toUpperCase()} [${layerId}]`, 14, 24 + DYNAMIC_TIERS.indexOf(tier) * 16);
  ctx.restore();
}
