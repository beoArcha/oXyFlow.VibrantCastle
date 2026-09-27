import React, { useEffect, RefObject } from "react";
import {
  AtlasGridConfig,
  ResolvedFrameRect,
  IAtlasBackgroundConfig,
} from "../types";
import {
  BackgroundProcessor,
  IPixelBuffer,
} from "@game/engine/meta/slicing";

export const TRACK_COLORS = [
  { stroke: "#38bdf8", fill: "rgba(56, 189, 248, 0.18)" }, // sky
  { stroke: "#4ade80", fill: "rgba(74, 222, 128, 0.18)" }, // emerald
  { stroke: "#facc15", fill: "rgba(250, 204, 21, 0.18)" }, // amber/yellow
  { stroke: "#f472b6", fill: "rgba(244, 114, 182, 0.18)" }, // pink
  { stroke: "#a78bfa", fill: "rgba(167, 139, 250, 0.18)" }, // purple
  { stroke: "#fb923c", fill: "rgba(251, 146, 60, 0.18)" },  // orange
  { stroke: "#2dd4bf", fill: "rgba(45, 212, 191, 0.18)" },  // teal
  { stroke: "#f87171", fill: "rgba(248, 113, 113, 0.18)" }, // red
];

export interface AtlasTextureCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  image: HTMLImageElement | null;
  zoom: number;
  panOffset: { x: number; y: number };
  isPanning: boolean;
  previewChroma: boolean;
  pixelBuffer: IPixelBuffer | null;
  backgroundConfig?: IAtlasBackgroundConfig;
  showGrid: boolean;
  showTracks: boolean;
  showMargins: boolean;
  showFrames: boolean;
  gridConfig?: AtlasGridConfig;
  resolvedFrames: ResolvedFrameRect[];
  selectedTrackName: string | null;
  selectedFrameIndex: number | null;
  dragStart: { x: number; y: number } | null;
  dragCurrent: { x: number; y: number } | null;
  activeSelection: { x: number; y: number; width: number; height: number } | null;
}

export const AtlasTextureCanvas: React.FC<AtlasTextureCanvasProps> = ({
  canvasRef,
  image,
  zoom,
  panOffset,
  isPanning,
  previewChroma,
  pixelBuffer,
  backgroundConfig,
  showGrid,
  showTracks,
  showMargins,
  showFrames,
  gridConfig,
  resolvedFrames,
  selectedTrackName,
  selectedFrameIndex,
  dragStart,
  dragCurrent,
  activeSelection,
}) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayW = Math.round(image.naturalWidth * zoom);
    const displayH = Math.round(image.naturalHeight * zoom);

    canvas.width = displayW;
    canvas.height = displayH;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, displayW, displayH);

    // 1. Draw Texture Image (with optional Chroma Key preview)
    if (previewChroma && pixelBuffer && backgroundConfig?.colorHex) {
      const keyed = BackgroundProcessor.applyChromaKey(
        pixelBuffer,
        backgroundConfig.colorHex,
        backgroundConfig.tolerance ?? 15,
        4
      );
      if (typeof document !== "undefined") {
        const off = document.createElement("canvas");
        off.width = image.naturalWidth;
        off.height = image.naturalHeight;
        const octx = off.getContext("2d");
        if (octx) {
          const imgData = octx.createImageData(keyed.width, keyed.height);
          imgData.data.set(keyed.data);
          octx.putImageData(imgData, 0, 0);
          ctx.drawImage(off, 0, 0, displayW, displayH);
        }
      }
    } else {
      ctx.drawImage(image, 0, 0, displayW, displayH);
    }

    // 2. Draw Grid Lines (if enabled and gridConfig provided)
    if (showGrid && gridConfig) {
      ctx.strokeStyle = "rgba(217, 119, 6, 0.4)"; // amber-600
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      const cellW = gridConfig.cellWidth;
      const cellH = gridConfig.cellHeight;

      // Vertical lines
      for (let c = 0; c <= gridConfig.columns; c++) {
        const x = Math.round(c * cellW * zoom);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, displayH);
        ctx.stroke();
      }

      // Horizontal lines
      for (let r = 0; r <= gridConfig.rows; r++) {
        const y = Math.round(r * cellH * zoom);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(displayW, y);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

    // 3. Draw Safe Margins
    if (showMargins && gridConfig && gridConfig.safeMargin > 0) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)"; // sky
      ctx.lineWidth = 1;
      const margin = gridConfig.safeMargin * zoom;

      for (let r = 0; r < gridConfig.rows; r++) {
        for (let c = 0; c < gridConfig.columns; c++) {
          const cx = Math.round(c * gridConfig.cellWidth * zoom);
          const cy = Math.round(r * gridConfig.cellHeight * zoom);
          const cw = Math.round(gridConfig.cellWidth * zoom);
          const ch = Math.round(gridConfig.cellHeight * zoom);

          ctx.strokeRect(cx + margin, cy + margin, cw - margin * 2, ch - margin * 2);
        }
      }
    }

    // 4. Draw Resolved Frames & Tracks
    if (showTracks) {
      resolvedFrames.forEach((rect, idx) => {
        const isCurrentTrack = rect.trackName && rect.trackName === selectedTrackName;
        const isCurrentFrame = isCurrentTrack && rect.frameIndex === selectedFrameIndex;

        const colorIndex = idx % TRACK_COLORS.length;
        const color = TRACK_COLORS[colorIndex];
        const rx = Math.round(rect.x * zoom);
        const ry = Math.round(rect.y * zoom);
        const rw = Math.round(rect.width * zoom);
        const rh = Math.round(rect.height * zoom);

        // Fill highlight
        if (isCurrentFrame) {
          ctx.fillStyle = "rgba(251, 191, 36, 0.45)"; // amber active
        } else if (isCurrentTrack) {
          ctx.fillStyle = "rgba(251, 191, 36, 0.22)";
        } else {
          ctx.fillStyle = color.fill;
        }
        ctx.fillRect(rx, ry, rw, rh);

        // Border
        if (isCurrentFrame) {
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2.5;
        } else if (isCurrentTrack) {
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = color.stroke;
          ctx.lineWidth = 1;
        }
        ctx.strokeRect(rx, ry, rw, rh);

        // Frame label badge
        if (showFrames) {
          const label = rect.trackName ? `${rect.trackName}[${rect.frameIndex ?? 0}]` : rect.id;
          ctx.font = `bold ${Math.max(9, Math.round(10 * zoom))}px monospace`;
          ctx.fillStyle = isCurrentFrame ? "#ffffff" : isCurrentTrack ? "#fde68a" : color.stroke;
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 3;
          ctx.fillText(label, rx + 4, ry + Math.min(14, rh - 4));
          ctx.shadowBlur = 0;
        }
      });
    }

    // 5. Draw Active / Dragging Marquee Box Selection
    const curMarquee = dragStart && dragCurrent ? {
      x: Math.min(dragStart.x, dragCurrent.x),
      y: Math.min(dragStart.y, dragCurrent.y),
      width: Math.abs(dragCurrent.x - dragStart.x),
      height: Math.abs(dragCurrent.y - dragStart.y),
    } : activeSelection;

    if (curMarquee && curMarquee.width > 2 && curMarquee.height > 2) {
      const mx = Math.round(curMarquee.x * zoom);
      const my = Math.round(curMarquee.y * zoom);
      const mw = Math.round(curMarquee.width * zoom);
      const mh = Math.round(curMarquee.height * zoom);

      ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
      ctx.fillRect(mx, my, mw, mh);

      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(mx, my, mw, mh);
      ctx.setLineDash([]);

      // Corner handles
      const handleSize = 6;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(mx - handleSize / 2, my - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(mx + mw - handleSize / 2, my - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(mx - handleSize / 2, my + mh - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(mx + mw - handleSize / 2, my + mh - handleSize / 2, handleSize, handleSize);

      // Dimension badge
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(mx + 4, my + 4, 85, 16);
      ctx.font = "bold 10px monospace";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`${Math.round(curMarquee.width)}×${Math.round(curMarquee.height)}px`, mx + 8, my + 16);
    }
  }, [
    image,
    zoom,
    previewChroma,
    pixelBuffer,
    backgroundConfig,
    showGrid,
    showTracks,
    showMargins,
    showFrames,
    gridConfig,
    resolvedFrames,
    selectedTrackName,
    selectedFrameIndex,
    dragStart,
    dragCurrent,
    activeSelection,
    canvasRef,
  ]);

  return (
    <div
      style={{
        transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        transition: isPanning ? "none" : "transform 0.05s ease-out",
      }}
      className="relative flex items-center justify-center shadow-2xl"
    >
      <canvas
        ref={canvasRef}
        className="rounded border border-amber-900/50 shadow-2xl"
      />
    </div>
  );
};

export default AtlasTextureCanvas;
