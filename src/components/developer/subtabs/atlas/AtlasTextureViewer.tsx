import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Grid as GridIcon,
  Layers,
  Square,
  Hash,
} from "lucide-react";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  SelectedCellInfo,
} from "./types";

export interface AtlasTextureViewerProps {
  imageSrc: string;
  gridConfig: AtlasGridConfig;
  tracks: AtlasAnimationTrackDefinition[];
  selectedTrackName: string | null;
  selectedFrameIndex: number | null;
  onSelectCell?: (info: SelectedCellInfo) => void;
  onSelectTrack?: (trackName: string) => void;
  onSelectFrame?: (frameIndex: number) => void;
}

const TRACK_COLORS = [
  { stroke: "#38bdf8", fill: "rgba(56, 189, 248, 0.18)" }, // sky
  { stroke: "#4ade80", fill: "rgba(74, 222, 128, 0.18)" }, // emerald
  { stroke: "#facc15", fill: "rgba(250, 204, 21, 0.18)" }, // amber/yellow
  { stroke: "#f472b6", fill: "rgba(244, 114, 182, 0.18)" }, // pink
  { stroke: "#a78bfa", fill: "rgba(167, 139, 250, 0.18)" }, // purple
  { stroke: "#fb923c", fill: "rgba(251, 146, 60, 0.18)" },  // orange
  { stroke: "#2dd4bf", fill: "rgba(45, 212, 191, 0.18)" },  // teal
  { stroke: "#f87171", fill: "rgba(248, 113, 113, 0.18)" }, // red
];

export const AtlasTextureViewer: React.FC<AtlasTextureViewerProps> = ({
  imageSrc,
  gridConfig,
  tracks,
  selectedTrackName,
  selectedFrameIndex,
  onSelectCell,
  onSelectTrack,
  onSelectFrame,
}) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTracks, setShowTracks] = useState<boolean>(true);
  const [showMargins, setShowMargins] = useState<boolean>(true);
  const [showFrames, setShowFrames] = useState<boolean>(true);
  const [hoverInfo, setHoverInfo] = useState<{ col: number; row: number; x: number; y: number } | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImage(img);
    };
  }, [imageSrc]);

  // Compute track frame rects
  const trackFrameRects = useMemo(() => {
    const rects: {
      trackName: string;
      frameIndex: number;
      x: number;
      y: number;
      width: number;
      height: number;
      col: number;
      row: number;
      colorIndex: number;
    }[] = [];

    tracks.forEach((track, trackIdx) => {
      let currentCol = 0;
      const colorIndex = trackIdx % TRACK_COLORS.length;

      for (let f = 0; f < track.frames; f++) {
        let col = currentCol;
        let span = 1;

        if (track.frameIndices && track.frameIndices[f] !== undefined) {
          col = track.frameIndices[f];
        }

        if (track.slotSpan && track.slotSpan[f] !== undefined) {
          span = track.slotSpan[f];
        } else if (track.cells && track.cells[f] !== undefined) {
          span = track.cells[f];
        }

        const x = col * gridConfig.cellWidth;
        const y = track.row * gridConfig.cellHeight;
        const width = span * gridConfig.cellWidth;
        const height = gridConfig.cellHeight;

        rects.push({
          trackName: track.name,
          frameIndex: f,
          x,
          y,
          width,
          height,
          col,
          row: track.row,
          colorIndex,
        });

        if (!track.frameIndices) {
          currentCol += span;
        }
      }
    });

    return rects;
  }, [tracks, gridConfig]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayW = Math.round(image.width * zoom);
    const displayH = Math.round(image.height * zoom);

    canvas.width = displayW;
    canvas.height = displayH;

    // Background checkerboard
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, displayW, displayH);

    // Draw Atlas Image
    ctx.drawImage(image, 0, 0, displayW, displayH);

    // Draw Grid Lines
    if (showGrid) {
      ctx.strokeStyle = "rgba(217, 119, 6, 0.4)"; // amber-600
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical lines
      for (let c = 0; c <= gridConfig.columns; c++) {
        const x = Math.round(c * gridConfig.cellWidth * zoom);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, displayH);
        ctx.stroke();
      }

      // Horizontal lines
      for (let r = 0; r <= gridConfig.rows; r++) {
        const y = Math.round(r * gridConfig.cellHeight * zoom);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(displayW, y);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

    // Draw Safe Margins
    if (showMargins && gridConfig.safeMargin > 0) {
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

    // Draw Track Frames
    if (showTracks) {
      trackFrameRects.forEach((rect) => {
        const isCurrentTrack = rect.trackName === selectedTrackName;
        const isCurrentFrame = isCurrentTrack && rect.frameIndex === selectedFrameIndex;

        const color = TRACK_COLORS[rect.colorIndex];
        const rx = Math.round(rect.x * zoom);
        const ry = Math.round(rect.y * zoom);
        const rw = Math.round(rect.width * zoom);
        const rh = Math.round(rect.height * zoom);

        // Fill
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
          const label = `${rect.trackName}[${rect.frameIndex}]`;
          ctx.font = `bold ${Math.max(9, Math.round(10 * zoom))}px monospace`;
          ctx.fillStyle = isCurrentFrame ? "#ffffff" : isCurrentTrack ? "#fde68a" : color.stroke;
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 3;
          ctx.fillText(label, rx + 4, ry + Math.min(14, rh - 4));
          ctx.shadowBlur = 0;
        }
      });
    }
  }, [
    image,
    zoom,
    gridConfig,
    showGrid,
    showTracks,
    showMargins,
    showFrames,
    trackFrameRects,
    selectedTrackName,
    selectedFrameIndex,
  ]);

  // Click on Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !image) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;

    const col = Math.floor(mouseX / gridConfig.cellWidth);
    const row = Math.floor(mouseY / gridConfig.cellHeight);

    // Find clicked frame
    const hitFrame = trackFrameRects.find(
      (f) =>
        mouseX >= f.x &&
        mouseX < f.x + f.width &&
        mouseY >= f.y &&
        mouseY < f.y + f.height
    );

    if (hitFrame) {
      onSelectTrack?.(hitFrame.trackName);
      onSelectFrame?.(hitFrame.frameIndex);
      onSelectCell?.({
        col: hitFrame.col,
        row: hitFrame.row,
        x: hitFrame.x,
        y: hitFrame.y,
        width: hitFrame.width,
        height: hitFrame.height,
        trackName: hitFrame.trackName,
        frameIndex: hitFrame.frameIndex,
      });
    } else {
      onSelectCell?.({
        col,
        row,
        x: col * gridConfig.cellWidth,
        y: row * gridConfig.cellHeight,
        width: gridConfig.cellWidth,
        height: gridConfig.cellHeight,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = Math.round((e.clientX - rect.left) / zoom);
    const mouseY = Math.round((e.clientY - rect.top) / zoom);
    const col = Math.floor(mouseX / gridConfig.cellWidth);
    const row = Math.floor(mouseY / gridConfig.cellHeight);
    setHoverInfo({ col, row, x: mouseX, y: mouseY });
  };

  const handleFitToContainer = useCallback(() => {
    if (!containerRef.current || !image) return;
    const contW = containerRef.current.clientWidth - 32;
    const calculatedZoom = Math.min(1.0, Math.max(0.25, contW / image.width));
    setZoom(Number(calculatedZoom.toFixed(2)));
  }, [image]);

  return (
    <Card variant="default" className="flex flex-col flex-1 min-h-[460px]">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle icon={<GridIcon className="w-4 h-4 text-amber-400" />}>
            {t("atlasStudioViewerTitle")}
          </CardTitle>
          {image && (
            <Badge variant="stone">
              {image.width} × {image.height}px
            </Badge>
          )}
          <Badge variant="amber">
            {gridConfig.columns} cols × {gridConfig.rows} rows
          </Badge>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom controls */}
          <div className="flex items-center bg-black/60 rounded-lg border border-stone-800 p-0.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoom((z) => Math.max(0.25, Number((z - 0.25).toFixed(2))))}
              title={t("atlasZoom")}
              className="px-2 py-1 h-7"
            >
              <ZoomOut size={13} />
            </Button>
            <span className="px-1.5 text-xs font-mono font-bold text-amber-300 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoom((z) => Math.min(4.0, Number((z + 0.25).toFixed(2))))}
              title={t("atlasZoom")}
              className="px-2 py-1 h-7"
            >
              <ZoomIn size={13} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoom(1.0)}
              title={t("atlasStudioZoomReset")}
              className="px-2 py-1 h-7"
            >
              <RotateCcw size={12} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleFitToContainer}
              title={t("atlasStudioZoomFit")}
              className="px-2 py-1 h-7"
            >
              <Maximize2 size={12} />
            </Button>
          </div>

          {/* Toggle buttons */}
          <Button
            size="sm"
            variant={showGrid ? "primary" : "secondary"}
            onClick={() => setShowGrid((v) => !v)}
            title={t("atlasStudioToggleGrid")}
            className="h-7 text-xs px-2"
          >
            <GridIcon size={12} className="mr-1" />
            {t("atlasStudioToggleGrid")}
          </Button>

          <Button
            size="sm"
            variant={showTracks ? "primary" : "secondary"}
            onClick={() => setShowTracks((v) => !v)}
            title={t("atlasStudioToggleTracks")}
            className="h-7 text-xs px-2"
          >
            <Layers size={12} className="mr-1" />
            {t("atlasStudioToggleTracks")}
          </Button>

          <Button
            size="sm"
            variant={showMargins ? "primary" : "secondary"}
            onClick={() => setShowMargins((v) => !v)}
            title={t("atlasStudioToggleMargins")}
            className="h-7 text-xs px-2"
          >
            <Square size={12} className="mr-1" />
            {t("atlasStudioToggleMargins")}
          </Button>

          <Button
            size="sm"
            variant={showFrames ? "primary" : "secondary"}
            onClick={() => setShowFrames((v) => !v)}
            title={t("atlasStudioToggleFrames")}
            className="h-7 text-xs px-2"
          >
            <Hash size={12} className="mr-1" />
            {t("atlasStudioToggleFrames")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 p-2 gap-2">
        {/* Canvas Scroll Container */}
        <div
          ref={containerRef}
          className="relative flex-1 min-h-[360px] max-h-[580px] overflow-auto rounded-lg border border-stone-800 bg-[#0c0806] custom-scrollbar p-2 flex items-center justify-center select-none"
          style={{
            backgroundImage:
              "radial-gradient(#24140e 1px, transparent 1px), radial-gradient(#180a06 1px, #0a0402 1px)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverInfo(null)}
            className="cursor-crosshair shadow-2xl rounded border border-amber-900/50"
          />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#120603] rounded border border-stone-800 text-[11px] font-mono text-stone-400">
          <div className="flex items-center gap-4">
            {hoverInfo ? (
              <span>
                Cursor: X: <strong className="text-amber-300">{hoverInfo.x}</strong> Y:{" "}
                <strong className="text-amber-300">{hoverInfo.y}</strong> | Col:{" "}
                <strong className="text-cyan-300">{hoverInfo.col}</strong> Row:{" "}
                <strong className="text-cyan-300">{hoverInfo.row}</strong>
              </span>
            ) : (
              <span>Hover canvas for coordinates</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span>
              Cell: <strong className="text-amber-300">{gridConfig.cellWidth}</strong> ×{" "}
              <strong className="text-amber-300">{gridConfig.cellHeight}</strong>px
            </span>
            <span>
              SafeMargin: <strong className="text-sky-300">{gridConfig.safeMargin}</strong>px
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
