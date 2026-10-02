import React, { useEffect, RefObject } from "react";
import {
  AtlasGridConfig,
  ResolvedFrameRect,
  IAtlasBackgroundConfig,
  AtlasAnimationTrackDefinition,
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
  tracks?: AtlasAnimationTrackDefinition[];
  selectedTrackName: string | null;
  selectedFrameIndex: number | null;
  dragStart: { x: number; y: number } | null;
  dragCurrent: { x: number; y: number } | null;
  activeSelection: { x: number; y: number; width: number; height: number } | null;
  isLoading?: boolean;
}

export const AtlasTextureCanvas: React.FC<AtlasTextureCanvasProps> = ({
  canvasRef,
  image,
  zoom,
  panOffset,
  isPanning,
  isLoading = false,
  previewChroma,
  pixelBuffer,
  backgroundConfig,
  showGrid,
  showTracks,
  showMargins,
  showFrames,
  gridConfig,
  resolvedFrames,
  tracks,
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
        // Two-step chroma pipeline:
        // BackgroundProcessor returns raw Uint8ClampedArray RGBA pixels.
        // We put raw pixel data into a 1:1 offscreen canvas, then blit it scaled via ctx.drawImage
        // to maintain crisp nearest-neighbor display with zero mutation of original source textures.
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

        // Sequence badge indicator ([1], [2], [3]...)
        if (isCurrentTrack && rect.frameIndex !== undefined) {
          const badgeNum = (rect.frameIndex + 1).toString();
          const badgeRadius = Math.max(9, Math.round(10 * Math.min(1.5, zoom)));
          const bx = rx + rw - badgeRadius - 3;
          const by = ry + badgeRadius + 3;

          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, badgeRadius, 0, Math.PI * 2);
          ctx.fillStyle = isCurrentFrame ? "#f59e0b" : "#b45309";
          ctx.fill();
          ctx.strokeStyle = "#fef3c7";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.font = `bold ${Math.max(9, Math.round(10 * Math.min(1.5, zoom)))}px sans-serif`;
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(badgeNum, bx, by);
          ctx.restore();
        }
      });

      // If active track is a regular grid track with no matching resolved frames, render its frames
      const activeTrack = tracks?.find((tr) => tr.name === selectedTrackName);
      const hasResolvedForTrack = resolvedFrames.some((rf) => rf.trackName === selectedTrackName);

      if (activeTrack && !hasResolvedForTrack && gridConfig) {
        const row = activeTrack.row;
        const total = activeTrack.frames;
        for (let f = 0; f < total; f++) {
          let col = f;
          if (activeTrack.frameIndices && activeTrack.frameIndices[f] !== undefined) {
            col = activeTrack.frameIndices[f];
          }
          const isCurFrame = f === selectedFrameIndex;
          const cellW = gridConfig.cellWidth;
          const cellH = gridConfig.cellHeight;
          const fx = Math.round(col * cellW * zoom);
          const fy = Math.round(row * cellH * zoom);
          const fw = Math.round(cellW * zoom);
          const fh = Math.round(cellH * zoom);

          // Track highlight overlay
          ctx.fillStyle = isCurFrame ? "rgba(251, 191, 36, 0.4)" : "rgba(251, 191, 36, 0.18)";
          ctx.fillRect(fx, fy, fw, fh);
          ctx.strokeStyle = isCurFrame ? "#fbbf24" : "#f59e0b";
          ctx.lineWidth = isCurFrame ? 2.5 : 1.5;
          ctx.strokeRect(fx, fy, fw, fh);

          // Sequence badge
          const badgeNum = (f + 1).toString();
          const badgeRadius = Math.max(9, Math.round(10 * Math.min(1.5, zoom)));
          const bx = fx + fw - badgeRadius - 3;
          const by = fy + badgeRadius + 3;

          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, badgeRadius, 0, Math.PI * 2);
          ctx.fillStyle = isCurFrame ? "#f59e0b" : "#b45309";
          ctx.fill();
          ctx.strokeStyle = "#fef3c7";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.font = `bold ${Math.max(9, Math.round(10 * Math.min(1.5, zoom)))}px sans-serif`;
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(badgeNum, bx, by);
          ctx.restore();
        }
      }
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
    tracks,
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

      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/75 backdrop-blur-xs rounded border border-amber-500/40 animate-in fade-in duration-150">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
          <span className="text-[11px] font-mono font-semibold text-amber-200 tracking-wider">
            Loading Texture...
          </span>
        </div>
      )}
    </div>
  );
};

export default AtlasTextureCanvas;
