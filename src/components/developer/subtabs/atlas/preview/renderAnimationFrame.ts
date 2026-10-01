import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  AtlasOriginDefinition,
  IAtlasBackgroundConfig,
  ResolvedFrameRect,
} from "../types";
import { BackgroundProcessor } from "@game/engine/meta/slicing";
import { resolveAnimationSourceRect } from "./animationGeometry";

export interface RenderAnimationFrameOptions {
  frameIdx: number;
  image: HTMLImageElement | null;
  track: AtlasAnimationTrackDefinition | null;
  gridConfig: AtlasGridConfig;
  scale: number;
  showPivot: boolean;
  showGroundLine: boolean;
  flipX: boolean;
  origin?: AtlasOriginDefinition;
  backgroundConfig?: IAtlasBackgroundConfig;
  resolvedFrames?: ResolvedFrameRect[];
  onionSkinning: boolean;
}

export function getFrameCoordinates(
  fIdx: number,
  track: AtlasAnimationTrackDefinition,
  gridConfig: AtlasGridConfig,
  matchingTrackFrames: ResolvedFrameRect[]
): { x: number; y: number; w: number; h: number; pivot?: { x: number; y: number } } {
  const rect = resolveAnimationSourceRect(track, fIdx, gridConfig, matchingTrackFrames);
  return {
    x: rect.x,
    y: rect.y,
    w: rect.width,
    h: rect.height,
    pivot: rect.pivot,
  };
}

/**
 * Pure rendering function for animation preview canvas.
 * Decoupled from React lifecycle to eliminate garbage collection and redundant state renders.
 */
export function renderAnimationFrame(
  canvas: HTMLCanvasElement | null,
  offscreenCanvas: HTMLCanvasElement | null,
  options: RenderAnimationFrameOptions
): void {
  if (!canvas || !options.image || !options.track) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const {
    frameIdx,
    image,
    track,
    gridConfig,
    scale,
    showPivot,
    showGroundLine,
    flipX,
    origin,
    backgroundConfig,
    resolvedFrames,
    onionSkinning,
  } = options;

  const matchingTrackFrames = resolvedFrames
    ? resolvedFrames
        .filter((rf) => rf.trackName === track.name)
        .sort((a, b) => (a.frameIndex ?? 0) - (b.frameIndex ?? 0))
    : [];

  const curCoords = getFrameCoordinates(frameIdx, track, gridConfig, matchingTrackFrames);
  const sx = curCoords.x;
  const sy = curCoords.y;
  const sw = curCoords.w;
  const sh = curCoords.h;

  let effectiveOrigin = origin;
  if (curCoords.pivot) {
    effectiveOrigin = {
      type: origin?.type || "feet",
      normalized: curCoords.pivot,
    };
  }

  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);

  if (canvas.width !== dw || canvas.height !== dh) {
    canvas.width = dw;
    canvas.height = dh;
  }

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, dw, dh);

  let effectiveOffscreen = offscreenCanvas;
  if (!effectiveOffscreen && typeof document !== "undefined") {
    try {
      effectiveOffscreen = document.createElement("canvas");
    } catch {
      effectiveOffscreen = null;
    }
  }

  // Onion Skinning: Draw previous frame with faint cyan overlay behind current frame
  const totalFramesCount = matchingTrackFrames.length > 0
    ? matchingTrackFrames.length
    : (track.frameIndices ? track.frameIndices.length : track.frames);

  if (onionSkinning && totalFramesCount > 1) {
    const prevIdx = (frameIdx - 1 + totalFramesCount) % totalFramesCount;
    const prevCoords = getFrameCoordinates(prevIdx, track, gridConfig, matchingTrackFrames);
    ctx.save();
    ctx.globalAlpha = 0.35;
    if (flipX) {
      ctx.translate(dw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(image, prevCoords.x, prevCoords.y, prevCoords.w, prevCoords.h, 0, 0, dw, dh);
    ctx.restore();
  }

  const needsChroma =
    backgroundConfig?.mode === "color" &&
    Boolean(backgroundConfig.colorHex) &&
    backgroundConfig.removeAtRuntime !== false;

  let renderedViaOffscreen = false;

  if (needsChroma && effectiveOffscreen) {
    if (effectiveOffscreen.width !== sw || effectiveOffscreen.height !== sh) {
      effectiveOffscreen.width = sw;
      effectiveOffscreen.height = sh;
    }
    const offCtx = effectiveOffscreen.getContext("2d");

    if (offCtx) {
      offCtx.clearRect(0, 0, sw, sh);
      offCtx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

      try {
        const frameImgData = offCtx.getImageData(0, 0, sw, sh);
        const keyed = BackgroundProcessor.applyChromaKey(
          frameImgData,
          backgroundConfig.colorHex!,
          backgroundConfig.tolerance ?? 15
        );
        frameImgData.data.set(keyed.data);
        offCtx.putImageData(frameImgData, 0, 0);
      } catch {
        // Fallback to unmodified frame
      }

      ctx.save();
      if (flipX) {
        ctx.translate(dw, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(effectiveOffscreen, 0, 0, sw, sh, 0, 0, dw, dh);
      ctx.restore();
      renderedViaOffscreen = true;
    }
  }

  // Direct render if chroma keying wasn't active or offscreen canvas context was unavailable
  if (!renderedViaOffscreen) {
    ctx.save();
    if (flipX) {
      ctx.translate(dw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh);
    ctx.restore();
  }

  // Draw Ground Baseline if enabled
  if (showGroundLine && effectiveOrigin?.normalized) {
    const gy = Math.round(effectiveOrigin.normalized.y * dh);
    ctx.save();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(dw, gy);
    ctx.stroke();
    ctx.restore();
  }

  // Draw Pivot / Anchor crosshair
  if (showPivot && effectiveOrigin?.normalized) {
    const normX = flipX ? 1.0 - effectiveOrigin.normalized.x : effectiveOrigin.normalized.x;
    const px = Math.round(normX * dw);
    const py = Math.round(effectiveOrigin.normalized.y * dh);

    ctx.save();
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px - 8, py);
    ctx.lineTo(px + 8, py);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px, py - 8);
    ctx.lineTo(px, py + 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}
