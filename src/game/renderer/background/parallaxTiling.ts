import {
  BackgroundLayerTier,
  ParallaxLayerSchema,
} from "@game/locations/schema/locationSchema";
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
 * Renders a dynamic parallax background layer with seamless horizontal tiling and vertical parallax clamping.
 */
export function renderTiledDynamicLayer(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerSchema,
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

  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

  const effectiveHeight = Math.max(viewportHeight, boxHeight * 0.85);
  const scale = effectiveHeight / imgH;
  const drawW = imgW * scale;
  const drawH = effectiveHeight;

  const speed = DEFAULT_TIER_SPEEDS[tier] || { x: 0.5, y: 0.2 };
  const scrollSpeedX = layer.scrollSpeedX !== undefined ? layer.scrollSpeedX : speed.x;
  const scrollSpeedY = layer.scrollSpeedY !== undefined ? layer.scrollSpeedY : speed.y;

  const driftX = layer.autoDriftX ? tickCount * layer.autoDriftX : 0;
  const driftY = layer.autoDriftY ? tickCount * layer.autoDriftY : 0;

  const scrollX = progressX * extraWidth * scrollSpeedX;
  const screenX = -scrollX - driftX;

  const maxShiftY = Math.max(0, drawH - viewportHeight);
  const screenY = -progressY * maxShiftY * scrollSpeedY - driftY;

  let startX = screenX % drawW;
  if (startX > 0) startX -= drawW;

  for (let x = startX; x < viewportWidth + drawW; x += drawW) {
    ctx.drawImage(img, Math.round(x), Math.round(screenY), Math.round(drawW), Math.round(drawH));
  }

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
