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
  MousePointer,
  Hand,
  Pipette,
  Sparkles,
  Plus,
  Check,
  X,
  Split,
  Box,
} from "lucide-react";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  SelectedCellInfo,
  AtlasMetaDoc,
  IAtlasSlicingConfig,
  IAtlasBackgroundConfig,
  ResolvedFrameRect,
} from "./types";
import {
  defaultAtlasSlicingEngine,
  BackgroundProcessor,
  IPixelBuffer,
} from "../../../../game/engine/meta/slicing";
import { LoggerManager } from "../../../../lib/logger";
import { AssetError, ErrorCode, GameBaseError } from "../../../../lib/errors";

export interface AtlasTextureViewerProps {
  imageSrc: string;
  gridConfig?: AtlasGridConfig;
  tracks?: AtlasAnimationTrackDefinition[];
  slicingConfig?: IAtlasSlicingConfig;
  backgroundConfig?: IAtlasBackgroundConfig;
  metaDoc?: AtlasMetaDoc;
  selectedTrackName: string | null;
  selectedFrameIndex: number | null;
  onSelectCell?: (info: SelectedCellInfo) => void;
  onSelectTrack?: (trackName: string) => void;
  onSelectFrame?: (frameIndex: number) => void;
  onSampleBackgroundColor?: (hex: string) => void;
  onCreateTrackFromSelection?: (selection: {
    x: number;
    y: number;
    width: number;
    height: number;
    row?: number;
    framesCount?: number;
  }) => void;
  onAssignSelectionToActiveTrack?: (selection: {
    x: number;
    y: number;
    width: number;
    height: number;
    row?: number;
  }) => void;
  onMergeSelectionAsWide?: (selection: {
    x: number;
    y: number;
    width: number;
    height: number;
    span: number;
  }) => void;
  onAddFreeformFrame?: (frame: {
    x: number;
    y: number;
    width: number;
    height: number;
    id?: string;
    trackName?: string;
    pivot?: { x: number; y: number };
  }) => void;
  onResolvedFramesChange?: (frames: ResolvedFrameRect[]) => void;
  externalTool?: SlicerViewerTool;
  onToolChange?: (tool: SlicerViewerTool) => void;
  onMetricsChange?: (metrics: {
    frameCount: number;
    durationMs: number;
    textureWidth: number;
    textureHeight: number;
  }) => void;
  onError?: (error: GameBaseError | null) => void;
}

export type SlicerViewerTool = "select" | "pan" | "eyedropper";

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
  tracks = [],
  slicingConfig,
  backgroundConfig,
  metaDoc,
  selectedTrackName,
  selectedFrameIndex,
  onSelectCell,
  onSelectTrack,
  onSelectFrame,
  onSampleBackgroundColor,
  onCreateTrackFromSelection,
  onAssignSelectionToActiveTrack,
  onMergeSelectionAsWide,
  onAddFreeformFrame,
  onResolvedFramesChange,
  externalTool,
  onToolChange,
  onMetricsChange,
  onError,
}) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Loaded image and pixel buffer
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [pixelBuffer, setPixelBuffer] = useState<IPixelBuffer | null>(null);

  // Navigation & Viewport State
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTool, setActiveToolState] = useState<SlicerViewerTool>("select");

  const setActiveTool = useCallback((tool: SlicerViewerTool) => {
    setActiveToolState(tool);
    onToolChange?.(tool);
  }, [onToolChange]);

  useEffect(() => {
    if (externalTool && externalTool !== activeTool) {
      setActiveToolState(externalTool);
    }
  }, [externalTool, activeTool]);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ mouseX: number; mouseY: number; initialPanX: number; initialPanY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  // Toggles
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTracks, setShowTracks] = useState<boolean>(true);
  const [showMargins, setShowMargins] = useState<boolean>(true);
  const [showFrames, setShowFrames] = useState<boolean>(true);
  const [previewChroma, setPreviewChroma] = useState<boolean>(false);

  // Marquee Drag-to-Select State
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [activeSelection, setActiveSelection] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Hover & Eyedropper Info
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    col: number;
    row: number;
    hex?: string;
  } | null>(null);

  // Ref for callbacks to prevent re-triggering effects on parent re-renders
  const onMetricsChangeRef = useRef(onMetricsChange);
  useEffect(() => {
    onMetricsChangeRef.current = onMetricsChange;
  }, [onMetricsChange]);

  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const onResolvedFramesChangeRef = useRef(onResolvedFramesChange);
  useEffect(() => {
    onResolvedFramesChangeRef.current = onResolvedFramesChange;
  }, [onResolvedFramesChange]);

  // Load image & extract pure pixel buffer
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;

    img.onerror = () => {
      const err = new AssetError(
        `Failed to load atlas texture from source: ${imageSrc.slice(0, 80)}`,
        ErrorCode.ASSET_LOAD_FAILED,
        { details: { imageSrc: imageSrc.slice(0, 100) } }
      );
      LoggerManager.getInstance()
        .getLogger("AtlasStudio")
        .error(err.message, { code: err.code, details: err.details });
      onErrorRef.current?.(err);
    };

    img.onload = () => {
      setImage(img);
      onErrorRef.current?.(null);
      LoggerManager.getInstance()
        .getLogger("AtlasStudio")
        .info(
          `Atlas texture loaded successfully: ${img.naturalWidth}x${img.naturalHeight}px`,
          { width: img.naturalWidth, height: img.naturalHeight }
        );

      // Extract pixel buffer via offscreen canvas
      if (typeof document !== "undefined") {
        const off = document.createElement("canvas");
        off.width = img.naturalWidth;
        off.height = img.naturalHeight;
        const ctx = off.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, off.width, off.height);
          setPixelBuffer({
            width: imgData.width,
            height: imgData.height,
            data: imgData.data,
          });
        }
      }
    };
  }, [imageSrc]);

  // Spacebar hotkey listener for temporary Pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        setIsSpacePressed(true);
      }
      if (e.key === "f" || e.key === "F") {
        if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          handleFitToContainer();
        }
      }
      if (e.key === "1") {
        if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          setZoom(1.0);
          setPanOffset({ x: 0, y: 0 });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Compute resolved frame rects using AtlasSlicingEngine
  const { resolvedFrames, sliceDuration } = useMemo(() => {
    if (!image) return { resolvedFrames: [] as ResolvedFrameRect[], sliceDuration: 0 };

    const effectiveDoc: AtlasMetaDoc = {
      ...(metaDoc || {}),
      atlas: {
        columns: gridConfig?.columns || 12,
        rows: gridConfig?.rows || 8,
        cellWidth: gridConfig?.cellWidth || 128,
        cellHeight: gridConfig?.cellHeight || 128,
        spacing: gridConfig?.spacing || 0,
        safeMargin: gridConfig?.safeMargin || 0,
      },
      slicing: slicingConfig || metaDoc?.slicing,
      backgroundConfig: backgroundConfig || metaDoc?.backgroundConfig,
    };

    // If tracks are passed explicitly, format them for context
    const animMap: Record<string, any> = {};
    tracks.forEach((tr) => {
      animMap[tr.name] = {
        row: tr.row,
        frames: tr.frames,
        fps: tr.fps,
        loop: tr.loop,
        wide: tr.wide,
        slotSpan: tr.slotSpan,
        cells: tr.cells,
        frameIndices: tr.frameIndices,
      };
    });
    effectiveDoc.animations = animMap;

    const t0 = performance.now();
    const frames = defaultAtlasSlicingEngine.resolveFrames(
      effectiveDoc,
      image.naturalWidth,
      image.naturalHeight,
      pixelBuffer || undefined
    );
    const duration = performance.now() - t0;

    return { resolvedFrames: frames, sliceDuration: duration };
  }, [image, gridConfig, tracks, slicingConfig, backgroundConfig, metaDoc, pixelBuffer]);

  const lastReportedMetricsRef = useRef<{
    frameCount: number;
    textureWidth: number;
    textureHeight: number;
  } | null>(null);

  const lastReportedFramesSignatureRef = useRef<string>("");

  // Report telemetry and frame metrics to parent only when actual dimensions or frame counts change
  useEffect(() => {
    if (!image) return;

    const prev = lastReportedMetricsRef.current;
    const hasChanged =
      !prev ||
      prev.frameCount !== resolvedFrames.length ||
      prev.textureWidth !== image.naturalWidth ||
      prev.textureHeight !== image.naturalHeight;

    if (hasChanged) {
      lastReportedMetricsRef.current = {
        frameCount: resolvedFrames.length,
        textureWidth: image.naturalWidth,
        textureHeight: image.naturalHeight,
      };
      onMetricsChangeRef.current?.({
        frameCount: resolvedFrames.length,
        durationMs: sliceDuration,
        textureWidth: image.naturalWidth,
        textureHeight: image.naturalHeight,
      });
    }

    // Sync resolved frames to parent (for islands detection list and freeform assignment)
    const signature = resolvedFrames
      .map((f) => `${f.id}:${f.x},${f.y},${f.width},${f.height}:${f.trackName || ""}:${f.frameIndex ?? ""}`)
      .join("|");
    if (signature !== lastReportedFramesSignatureRef.current) {
      lastReportedFramesSignatureRef.current = signature;
      onResolvedFramesChangeRef.current?.(resolvedFrames);
    }
  }, [resolvedFrames, sliceDuration, image]);

  // Center fit helper
  const handleFitToContainer = useCallback(() => {
    if (!containerRef.current || !image) return;
    const contW = containerRef.current.clientWidth - 48;
    const contH = containerRef.current.clientHeight - 48;
    const zoomW = contW / image.naturalWidth;
    const zoomH = contH / image.naturalHeight;
    const calculatedZoom = Math.min(1.5, Math.max(0.2, Math.min(zoomW, zoomH)));
    setZoom(Number(calculatedZoom.toFixed(2)));
    setPanOffset({ x: 0, y: 0 });
  }, [image]);

  // Wheel zoom centered on cursor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      setZoom((prevZoom) => {
        const nextZoom = Math.min(5.0, Math.max(0.25, Number((prevZoom * zoomFactor).toFixed(2))));
        if (nextZoom === prevZoom) return prevZoom;

        setPanOffset((prevPan) => {
          const dx = mouseX - prevPan.x;
          const dy = mouseY - prevPan.y;
          const scaleChange = nextZoom / prevZoom;
          return {
            x: Math.round(mouseX - dx * scaleChange),
            y: Math.round(mouseY - dy * scaleChange),
          };
        });

        return nextZoom;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Main Canvas Render Loop
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
      // Process chroma on offscreen canvas and draw
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
  ]);

  // Mouse coordinate translation helper
  const getTextureCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !image) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;
    return {
      x: Math.round(Math.max(0, Math.min(image.naturalWidth, mouseX))),
      y: Math.round(Math.max(0, Math.min(image.naturalHeight, mouseY))),
    };
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // 1. Pan mode (Middle click OR Spacebar OR Hand Tool)
    if (e.button === 1 || isSpacePressed || activeTool === "pan") {
      setIsPanning(true);
      panStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        initialPanX: panOffset.x,
        initialPanY: panOffset.y,
      };
      return;
    }

    // 2. Eyedropper mode
    if (activeTool === "eyedropper" && pixelBuffer) {
      const { x, y } = getTextureCoords(e);
      const sample = BackgroundProcessor.sampleColor(pixelBuffer, x, y);
      onSampleBackgroundColor?.(sample.hex);
      return;
    }

    // 3. Selection mode
    if (e.button === 0 && activeTool === "select") {
      const { x, y } = getTextureCoords(e);
      setDragStart({ x, y });
      setDragCurrent({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Pan in progress
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.mouseX;
      const dy = e.clientY - panStartRef.current.mouseY;
      setPanOffset({
        x: panStartRef.current.initialPanX + dx,
        y: panStartRef.current.initialPanY + dy,
      });
      return;
    }

    const { x, y } = getTextureCoords(e);

    // Marquee dragging in progress
    if (dragStart) {
      setDragCurrent({ x, y });
    }

    // Hover info & Eyedropper
    const cellW = gridConfig?.cellWidth || 64;
    const cellH = gridConfig?.cellHeight || 64;
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);

    let hex: string | undefined;
    if (pixelBuffer && activeTool === "eyedropper") {
      hex = BackgroundProcessor.sampleColor(pixelBuffer, x, y).hex;
    }

    setHoverInfo({ x, y, col, row, hex });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (dragStart && dragCurrent) {
      const width = Math.abs(dragCurrent.x - dragStart.x);
      const height = Math.abs(dragCurrent.y - dragStart.y);

      // If dragged more than threshold, finalize selection box
      if (width > 8 && height > 8) {
        setActiveSelection({
          x: Math.min(dragStart.x, dragCurrent.x),
          y: Math.min(dragStart.y, dragCurrent.y),
          width,
          height,
        });
      } else {
        // Simple click -> select existing frame
        setActiveSelection(null);
        const { x, y } = getTextureCoords(e);
        const hit = defaultAtlasSlicingEngine.findFrameAt(x, y, resolvedFrames);

        if (hit) {
          if (hit.trackName) onSelectTrack?.(hit.trackName);
          if (hit.frameIndex !== undefined) onSelectFrame?.(hit.frameIndex);
          onSelectCell?.({
            col: hit.col ?? 0,
            row: hit.row ?? 0,
            x: hit.x,
            y: hit.y,
            width: hit.width,
            height: hit.height,
            trackName: hit.trackName,
            frameIndex: hit.frameIndex,
          });
        }
      }
    }

    setDragStart(null);
    setDragCurrent(null);
  };

  return (
    <Card variant="default" className="flex flex-col flex-1 min-h-[460px] select-none">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
        <div className="flex items-center gap-2">
          <CardTitle icon={<GridIcon className="w-4 h-4 text-amber-400" />}>
            {t("atlasStudioViewerTitle")}
          </CardTitle>
          {image && (
            <Badge variant="stone">
              {image.naturalWidth} × {image.naturalHeight}px
            </Badge>
          )}
          {gridConfig && (
            <Badge variant="amber">
              {gridConfig.columns} {t("atlasStudioColsShort")} × {gridConfig.rows} {t("atlasStudioRowsShort")}
            </Badge>
          )}
          {slicingConfig?.method && (
            <Badge variant="purple" className="text-[10px] font-mono uppercase">
              {slicingConfig.method}
            </Badge>
          )}
          <Badge variant="green" className="text-[10px]">
            {resolvedFrames.length} {t("atlasStudioFrameInfo") || "klatek"}
          </Badge>
        </div>

        {/* Top Control Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Tool Modes: Select, Pan, Eyedropper */}
          <div className="flex items-center bg-black/60 rounded-lg border border-stone-800 p-0.5">
            <button
              type="button"
              onClick={() => setActiveTool("select")}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                activeTool === "select"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
              title={t("atlasStudioToolSelect")}
            >
              <MousePointer size={13} />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool("pan")}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                activeTool === "pan"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
              title={t("atlasStudioToolPan")}
            >
              <Hand size={13} />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool("eyedropper")}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                activeTool === "eyedropper"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
              title={t("atlasStudioToolEyedropper")}
            >
              <Pipette size={13} />
            </button>
          </div>

          {/* Chroma Preview Button */}
          <button
            type="button"
            onClick={() => setPreviewChroma((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
              previewChroma
                ? "bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold"
                : "bg-black/60 border-stone-800 text-stone-400 hover:text-stone-200"
            }`}
            title={t("atlasStudioToggleChromaPreview")}
          >
            <Sparkles size={12} className={previewChroma ? "text-emerald-400" : "text-stone-500"} />
            <span>{t("atlasStudioToggleChromaPreview")}</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-black/60 rounded-lg border border-stone-800 p-0.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoom((z) => Math.max(0.25, Number((z - 0.25).toFixed(2))))}
              title={t("atlasStudioZoom")}
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
              onClick={() => setZoom((z) => Math.min(5.0, Number((z + 0.25).toFixed(2))))}
              title={t("atlasStudioZoom")}
              className="px-2 py-1 h-7"
            >
              <ZoomIn size={13} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setZoom(1.0);
                setPanOffset({ x: 0, y: 0 });
              }}
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

          {/* Layer toggles */}
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

      <CardContent className="flex flex-col flex-1 p-2 gap-2 relative">
        {/* Interactive Viewport Container with Pan & Zoom */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`relative flex-1 min-h-[360px] max-h-[580px] overflow-hidden rounded-lg border border-stone-800 bg-[#0c0806] custom-scrollbar p-2 flex items-center justify-center select-none ${
            isPanning || activeTool === "pan" || isSpacePressed
              ? "cursor-grab active:cursor-grabbing"
              : activeTool === "eyedropper"
              ? "cursor-crosshair"
              : "cursor-crosshair"
          }`}
          style={{
            backgroundImage:
              "radial-gradient(#24140e 1px, transparent 1px), radial-gradient(#180a06 1px, #0a0402 1px)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
        >
          {/* Canvas container with pan transform */}
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

          {/* Floating Context Actions for Active Marquee Selection */}
          {activeSelection && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#120603]/95 border border-amber-500/70 p-1.5 rounded-xl shadow-2xl shadow-black animate-in fade-in slide-in-from-top-2 duration-150">
              <span className="text-[11px] font-mono text-amber-300 font-bold px-2 border-r border-stone-800">
                {t("atlasStudioSelectionSize")}: {Math.round(activeSelection.width)}×{Math.round(activeSelection.height)}px
              </span>

              {onCreateTrackFromSelection && (
                <button
                  type="button"
                  onClick={() => {
                    const row = gridConfig ? Math.floor(activeSelection.y / gridConfig.cellHeight) : 0;
                    onCreateTrackFromSelection({
                      x: activeSelection.x,
                      y: activeSelection.y,
                      width: activeSelection.width,
                      height: activeSelection.height,
                      row,
                    });
                    setActiveSelection(null);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all cursor-pointer shadow"
                >
                  <Plus size={12} />
                  <span>{t("atlasStudioCreateTrackFromSelection")}</span>
                </button>
              )}

              {onAssignSelectionToActiveTrack && selectedTrackName && (
                <button
                  type="button"
                  onClick={() => {
                    const row = gridConfig ? Math.floor(activeSelection.y / gridConfig.cellHeight) : 0;
                    onAssignSelectionToActiveTrack({
                      x: activeSelection.x,
                      y: activeSelection.y,
                      width: activeSelection.width,
                      height: activeSelection.height,
                      row,
                    });
                    setActiveSelection(null);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Check size={12} className="text-emerald-400" />
                  <span>{t("atlasStudioAssignSelection")}</span>
                </button>
              )}

              {onMergeSelectionAsWide && gridConfig && (
                <button
                  type="button"
                  onClick={() => {
                    const span = Math.max(1, Math.round(activeSelection.width / gridConfig.cellWidth));
                    onMergeSelectionAsWide({
                      x: activeSelection.x,
                      y: activeSelection.y,
                      width: activeSelection.width,
                      height: activeSelection.height,
                      span,
                    });
                    setActiveSelection(null);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Split size={12} className="text-cyan-400" />
                  <span>{t("atlasStudioMergeWide")}</span>
                </button>
              )}

              {onAddFreeformFrame && (
                <button
                  type="button"
                  onClick={() => {
                    onAddFreeformFrame({
                      x: activeSelection.x,
                      y: activeSelection.y,
                      width: activeSelection.width,
                      height: activeSelection.height,
                      trackName: selectedTrackName || undefined,
                      pivot: { x: 0.5, y: 1.0 },
                    });
                    setActiveSelection(null);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-500/50 text-rose-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Box size={12} className="text-rose-400" />
                  <span>{t("atlasStudioAddFreeformFrame")}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveSelection(null)}
                className="p-1 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                title="Zamknij zaznaczenie"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#120603] rounded border border-stone-800 text-[11px] font-mono text-stone-400">
          <div className="flex items-center gap-4">
            {hoverInfo ? (
              <span className="flex items-center gap-2">
                <span>
                  Cursor: X: <strong className="text-amber-300">{hoverInfo.x}</strong> Y:{" "}
                  <strong className="text-amber-300">{hoverInfo.y}</strong> | Col:{" "}
                  <strong className="text-cyan-300">{hoverInfo.col}</strong> Row:{" "}
                  <strong className="text-cyan-300">{hoverInfo.row}</strong>
                </span>
                {hoverInfo.hex && (
                  <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-black/60 border border-stone-800">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/40"
                      style={{ backgroundColor: hoverInfo.hex }}
                    />
                    <strong className="text-stone-200">{hoverInfo.hex}</strong>
                  </span>
                )}
              </span>
            ) : (
              <span>{t("atlasStudioHoverCoords")}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {gridConfig && (
              <>
                <span>
                  {t("atlasStudioCellPrefix")}{" "}
                  <strong className="text-amber-300">{gridConfig.cellWidth}</strong> ×{" "}
                  <strong className="text-amber-300">{gridConfig.cellHeight}</strong>px
                </span>
                <span>
                  {t("atlasStudioSafeMargin")}:{" "}
                  <strong className="text-sky-300">{gridConfig.safeMargin}</strong>px
                </span>
              </>
            )}
            {resolvedFrames.length > 0 && (
              <span>
                Klatki: <strong className="text-emerald-400">{resolvedFrames.length}</strong>
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AtlasTextureViewer;
