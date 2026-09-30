import { useRef, useEffect, useState, useCallback } from "react";
import {
  AtlasGridConfig,
  ResolvedFrameRect,
  SelectedCellInfo,
  SlicerViewerTool,
} from "../types";
import {
  defaultAtlasSlicingEngine,
  BackgroundProcessor,
  IPixelBuffer,
} from "@game/engine/meta/slicing";

export interface UseAtlasViewerInteractionsParams {
  image: HTMLImageElement | null;
  pixelBuffer: IPixelBuffer | null;
  gridConfig?: AtlasGridConfig;
  resolvedFrames: ResolvedFrameRect[];
  externalTool?: SlicerViewerTool;
  onToolChange?: (tool: SlicerViewerTool) => void;
  onSampleBackgroundColor?: (hex: string) => void;
  onSelectTrack?: (trackName: string) => void;
  onSelectFrame?: (frameIndex: number) => void;
  onSelectCell?: (info: SelectedCellInfo) => void;
  onToggleSequenceFrame?: (target: {
    hit?: ResolvedFrameRect | null;
    col: number;
    row: number;
    x: number;
    y: number;
  }) => void;
}

export function useAtlasViewerInteractions({
  image,
  pixelBuffer,
  gridConfig,
  resolvedFrames,
  externalTool,
  onToolChange,
  onSampleBackgroundColor,
  onSelectTrack,
  onSelectFrame,
  onSelectCell,
  onToggleSequenceFrame,
}: UseAtlasViewerInteractionsParams) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTool, setActiveToolState] = useState<SlicerViewerTool>("select");
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const panStartRef = useRef<{ mouseX: number; mouseY: number; initialPanX: number; initialPanY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

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

  const setActiveTool = useCallback((tool: SlicerViewerTool) => {
    setActiveToolState(tool);
    onToolChange?.(tool);
  }, [onToolChange]);

  useEffect(() => {
    if (externalTool && externalTool !== activeTool) {
      setActiveToolState(externalTool);
    }
  }, [externalTool, activeTool]);

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

  const handleZoomReset = useCallback(() => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(5.0, Number((z + 0.25).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.25, Number((z - 0.25).toFixed(2))));
  }, []);

  // Hotkey listener: Space, F, 1
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
          handleZoomReset();
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
  }, [handleFitToContainer, handleZoomReset]);

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

  const getTextureCoords = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !image) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;
    return {
      x: Math.round(Math.max(0, Math.min(image.naturalWidth, mouseX))),
      y: Math.round(Math.max(0, Math.min(image.naturalHeight, mouseY))),
    };
  }, [image, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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

    if (activeTool === "eyedropper" && pixelBuffer) {
      const { x, y } = getTextureCoords(e);
      const sample = BackgroundProcessor.sampleColor(pixelBuffer, x, y);
      onSampleBackgroundColor?.(sample.hex);
      return;
    }

    if (e.button === 0 && activeTool === "sequence") {
      const { x, y } = getTextureCoords(e);
      const hit = defaultAtlasSlicingEngine.findFrameAt(x, y, resolvedFrames);
      const cellW = gridConfig?.cellWidth || 64;
      const cellH = gridConfig?.cellHeight || 64;
      const col = Math.floor(x / cellW);
      const row = Math.floor(y / cellH);

      onToggleSequenceFrame?.({
        hit,
        col,
        row,
        x,
        y,
      });
      return;
    }

    if (e.button === 0 && activeTool === "select") {
      const { x, y } = getTextureCoords(e);
      setDragStart({ x, y });
      setDragCurrent({ x, y });
    }
  }, [
    isSpacePressed,
    activeTool,
    panOffset,
    pixelBuffer,
    getTextureCoords,
    onSampleBackgroundColor,
    resolvedFrames,
    gridConfig,
    onToggleSequenceFrame,
  ]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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

    if (dragStart) {
      setDragCurrent({ x, y });
    }

    const cellW = gridConfig?.cellWidth || 64;
    const cellH = gridConfig?.cellHeight || 64;
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);

    let hex: string | undefined;
    if (pixelBuffer && activeTool === "eyedropper") {
      hex = BackgroundProcessor.sampleColor(pixelBuffer, x, y).hex;
    }

    setHoverInfo({ x, y, col, row, hex });
  }, [isPanning, dragStart, getTextureCoords, gridConfig, pixelBuffer, activeTool]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (dragStart && dragCurrent) {
      const width = Math.abs(dragCurrent.x - dragStart.x);
      const height = Math.abs(dragCurrent.y - dragStart.y);

      if (width > 8 && height > 8) {
        setActiveSelection({
          x: Math.min(dragStart.x, dragCurrent.x),
          y: Math.min(dragStart.y, dragCurrent.y),
          width,
          height,
        });
      } else {
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
  }, [isPanning, dragStart, dragCurrent, getTextureCoords, resolvedFrames, onSelectTrack, onSelectFrame, onSelectCell]);

  return {
    containerRef,
    canvasRef,
    zoom,
    panOffset,
    activeTool,
    setActiveTool,
    isSpacePressed,
    isPanning,
    dragStart,
    dragCurrent,
    activeSelection,
    setActiveSelection,
    hoverInfo,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleFitToContainer,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
