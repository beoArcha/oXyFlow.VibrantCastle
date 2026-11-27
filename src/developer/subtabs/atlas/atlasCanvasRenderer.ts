import type { IAnimationTrackMeta, ResolvedFrameRect } from "@game/engine/meta/types";
import { SLICER_CANVAS_COLORS, type EditableMetaDoc } from "./atlasSlicerHelpers";

export interface SheetCanvasRenderParams {
  readonly source: CanvasImageSource | null;
  readonly textureW: number;
  readonly textureH: number;
  readonly pan: { readonly x: number; readonly y: number };
  readonly zoom: number;
  readonly meta: EditableMetaDoc;
  readonly activeTrack: IAnimationTrackMeta | undefined;
  readonly resolvedFrames: readonly ResolvedFrameRect[];
  readonly showGrid: boolean;
  readonly showTracks: boolean;
  readonly showMargins: boolean;
  readonly showFrames: boolean;
  readonly selectedFrameId: string | null;
  readonly hoveredFrameId: string | null;
}

export interface PreviewCanvasRenderParams {
  readonly source: CanvasImageSource | null;
  readonly activeTrackFrames: readonly ResolvedFrameRect[];
  readonly playheadIdx: number;
  readonly previewScale: number;
  readonly flipX: boolean;
  readonly showGroundLine: boolean;
  readonly onionSkin: boolean;
  readonly anchorX: number;
  readonly anchorY: number;
}

/**
 * Draws the shared transparency checkerboard pattern across a canvas surface.
 */
export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tile: number
): void {
  for (let y = 0; y < height; y += tile) {
    for (let x = 0; x < width; x += tile) {
      ctx.fillStyle =
        ((x / tile + y / tile) & 1) === 0
          ? SLICER_CANVAS_COLORS.checkerLight
          : SLICER_CANVAS_COLORS.checkerDark;
      ctx.fillRect(x, y, tile, tile);
    }
  }
}

function drawGridAndMargins(
  ctx: CanvasRenderingContext2D,
  params: SheetCanvasRenderParams,
  cols: number,
  rows: number,
  cellW: number,
  cellH: number
): void {
  const { textureW, textureH, zoom, showGrid, showMargins, meta } = params;

  if (showGrid) {
    ctx.strokeStyle = SLICER_CANVAS_COLORS.gridStroke;
    ctx.lineWidth = Math.max(1, 1 / zoom);
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, 0);
      ctx.lineTo(c * cellW, textureH);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(textureW, r * cellH);
      ctx.stroke();
    }
  }

  if (showMargins && meta.atlas.safeMargin > 0) {
    ctx.strokeStyle = SLICER_CANVAS_COLORS.marginStroke;
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.lineWidth = Math.max(1, 1 / zoom);
    const margin = meta.atlas.safeMargin;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.strokeRect(
          c * cellW + margin,
          r * cellH + margin,
          Math.max(0, cellW - 2 * margin),
          Math.max(0, cellH - 2 * margin)
        );
      }
    }
    ctx.setLineDash([]);
  }
}

/**
 * Renders the main interactive spritesheet canvas with overlays and sequence badges.
 */
export function renderAtlasSheetCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: SheetCanvasRenderParams
): void {
  const {
    source,
    textureW,
    textureH,
    pan,
    zoom,
    meta,
    activeTrack,
    resolvedFrames,
    showTracks,
    showFrames,
    selectedFrameId,
    hoveredFrameId,
  } = params;

  ctx.clearRect(0, 0, width, height);
  drawCheckerboard(ctx, width, height, 16);

  ctx.save();
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);
  ctx.imageSmoothingEnabled = false;

  if (source) {
    ctx.drawImage(source, 0, 0, textureW, textureH);
  }

  const cols = Math.max(1, meta.atlas.columns);
  const rows = Math.max(1, meta.atlas.rows);
  const cellW = textureW / cols;
  const cellH = textureH / rows;

  if (showTracks && activeTrack) {
    ctx.fillStyle = SLICER_CANVAS_COLORS.trackFill;
    ctx.fillRect(0, activeTrack.row * cellH, textureW, cellH);
  }

  drawGridAndMargins(ctx, params, cols, rows, cellW, cellH);

  if (showFrames) {
    resolvedFrames.forEach((f, idx) => {
      const isSelected = f.id === selectedFrameId;
      const isHovered = f.id === hoveredFrameId;
      ctx.strokeStyle = isSelected
        ? SLICER_CANVAS_COLORS.selectedStroke
        : isHovered
          ? SLICER_CANVAS_COLORS.hoverStroke
          : SLICER_CANVAS_COLORS.frameStroke;
      ctx.lineWidth = (isSelected ? 2.5 : 1.2) / zoom;
      if (isSelected) {
        ctx.fillStyle = SLICER_CANVAS_COLORS.selectedFill;
        ctx.fillRect(f.x, f.y, f.width, f.height);
      }
      ctx.strokeRect(f.x, f.y, f.width, f.height);

      const seqPos = activeTrack?.frameIndices?.indexOf(idx) ?? -1;
      if (seqPos >= 0) {
        const badgeSize = Math.max(16, 18 / zoom);
        ctx.fillStyle = SLICER_CANVAS_COLORS.badgeBg;
        ctx.fillRect(f.x + 2, f.y + 2, badgeSize, badgeSize);
        ctx.fillStyle = SLICER_CANVAS_COLORS.badgeText;
        ctx.font = `bold ${Math.max(10, 11 / zoom)}px monospace`;
        ctx.fillText(String(seqPos + 1), f.x + 6, f.y + badgeSize - 4);
      }
    });
  }

  ctx.restore();
}

/**
 * Renders the live animation preview canvas with optional onion skinning, ground line, and pivot crosshair.
 */
export function renderAnimationPreviewCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: PreviewCanvasRenderParams
): void {
  const {
    source,
    activeTrackFrames,
    playheadIdx,
    previewScale,
    flipX,
    showGroundLine,
    onionSkin,
    anchorX,
    anchorY,
  } = params;

  ctx.clearRect(0, 0, width, height);
  drawCheckerboard(ctx, width, height, 12);

  const frame = activeTrackFrames[playheadIdx] ?? activeTrackFrames[0];
  if (!source || !frame) return;

  const maxFitScale = Math.min(
    (width * 0.8) / Math.max(1, frame.width),
    (height * 0.78) / Math.max(1, frame.height)
  );
  const drawScale = maxFitScale * (previewScale / 1.5);
  const drawW = frame.width * drawScale;
  const drawH = frame.height * drawScale;
  const groundY = height - 22;
  const pivotCanvasX = width / 2;
  const pivotCanvasY = anchorY >= 0.85 ? groundY : height / 2;

  const drawSpriteFrame = (f: ResolvedFrameRect, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(pivotCanvasX, pivotCanvasY);
    if (flipX) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      source,
      f.x,
      f.y,
      f.width,
      f.height,
      -drawW * anchorX,
      -drawH * anchorY,
      drawW,
      drawH
    );
    ctx.restore();
  };

  if (onionSkin && activeTrackFrames.length > 1) {
    const prevIdx =
      (playheadIdx - 1 + activeTrackFrames.length) % activeTrackFrames.length;
    drawSpriteFrame(activeTrackFrames[prevIdx], 0.28);
  }

  drawSpriteFrame(frame, 1);

  if (showGroundLine) {
    ctx.strokeStyle = SLICER_CANVAS_COLORS.groundLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();
  }

  ctx.strokeStyle = SLICER_CANVAS_COLORS.pivotCrosshair;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pivotCanvasX - 6, pivotCanvasY);
  ctx.lineTo(pivotCanvasX + 6, pivotCanvasY);
  ctx.moveTo(pivotCanvasX, pivotCanvasY - 6);
  ctx.lineTo(pivotCanvasX, pivotCanvasY + 6);
  ctx.stroke();
}
