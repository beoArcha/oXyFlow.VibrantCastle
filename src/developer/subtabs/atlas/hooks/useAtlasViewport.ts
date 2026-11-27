import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type React from "react";
import { defaultAtlasSlicingEngine } from "@game/engine/meta/slicing/AtlasSlicingEngine";
import type { IAnimationTrackMeta, ResolvedFrameRect } from "@game/engine/meta/types";
import { renderAtlasSheetCanvas } from "../atlasCanvasRenderer";
import type { EditableMetaDoc } from "../atlasSlicerHelpers";
import type { CursorCoords, ToolMode } from "../types";

export interface UseAtlasViewportOptions {
  readonly loadedImage: HTMLImageElement | null;
  readonly chromaCanvas: HTMLCanvasElement | null;
  readonly textureW: number;
  readonly textureH: number;
  readonly meta: EditableMetaDoc;
  readonly activeTrack: IAnimationTrackMeta | undefined;
  readonly resolvedFrames: readonly ResolvedFrameRect[];
  readonly onSampleBackgroundAt: (texX: number, texY: number) => void;
  readonly onAppendSequenceFrame: (frameId: string) => void;
}

/**
 * Manages sheet canvas zoom, pan, overlays, pointer interactions, and Canvas 2D rendering.
 */
export function useAtlasViewport(options: UseAtlasViewportOptions) {
  const {
    loadedImage,
    chromaCanvas,
    textureW,
    textureH,
    meta,
    activeTrack,
    resolvedFrames,
    onSampleBackgroundAt,
    onAppendSequenceFrame,
  } = options;

  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [zoom, setZoom] = useState<number>(0.75);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [isPanning, setIsPanning] = useState(false);
  const panOriginRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  const [showGrid, setShowGrid] = useState(true);
  const [showTracks, setShowTracks] = useState(true);
  const [showMargins, setShowMargins] = useState(false);
  const [showFrames, setShowFrames] = useState(true);

  const [cursorCoords, setCursorCoords] = useState<CursorCoords | null>(null);
  const [hoveredFrameId, setHoveredFrameId] = useState<string | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  const sheetCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = sheetCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderAtlasSheetCanvas(ctx, canvas.width, canvas.height, {
      source: chromaCanvas ?? loadedImage,
      textureW,
      textureH,
      pan,
      zoom,
      meta,
      activeTrack,
      resolvedFrames,
      showGrid,
      showTracks,
      showMargins,
      showFrames,
      selectedFrameId,
      hoveredFrameId,
    });
  }, [
    loadedImage,
    chromaCanvas,
    textureW,
    textureH,
    pan,
    zoom,
    meta,
    activeTrack,
    resolvedFrames,
    showGrid,
    showTracks,
    showMargins,
    showFrames,
    selectedFrameId,
    hoveredFrameId,
  ]);

  const getTexturePoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = sheetCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const canvasX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const canvasY = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const texX = (canvasX - pan.x) / zoom;
      const texY = (canvasY - pan.y) / zoom;
      return { texX, texY, canvasX, canvasY };
    },
    [pan.x, pan.y, zoom]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pt = getTexturePoint(e);
      if (!pt) return;

      if (toolMode === "pan" || e.button === 1) {
        setIsPanning(true);
        panOriginRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX: pan.x,
          panY: pan.y,
        };
        return;
      }

      if (toolMode === "eyedropper") {
        onSampleBackgroundAt(pt.texX, pt.texY);
        return;
      }

      const hit = defaultAtlasSlicingEngine.findFrameAt(pt.texX, pt.texY, resolvedFrames);
      if (!hit) return;

      setSelectedFrameId(hit.id);

      if (toolMode === "sequence") {
        onAppendSequenceFrame(hit.id);
      }
    },
    [
      getTexturePoint,
      toolMode,
      pan.x,
      pan.y,
      onSampleBackgroundAt,
      resolvedFrames,
      onAppendSequenceFrame,
    ]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning) {
        const dx = e.clientX - panOriginRef.current.x;
        const dy = e.clientY - panOriginRef.current.y;
        setPan({ x: panOriginRef.current.panX + dx, y: panOriginRef.current.panY + dy });
        return;
      }

      const pt = getTexturePoint(e);
      if (!pt) return;

      const cols = Math.max(1, meta.atlas.columns);
      const rows = Math.max(1, meta.atlas.rows);
      const col = Math.floor(pt.texX / (textureW / cols));
      const row = Math.floor(pt.texY / (textureH / rows));
      setCursorCoords({
        x: Math.round(pt.texX),
        y: Math.round(pt.texY),
        col,
        row,
      });

      const hit = defaultAtlasSlicingEngine.findFrameAt(pt.texX, pt.texY, resolvedFrames);
      setHoveredFrameId(hit?.id ?? null);
    },
    [isPanning, getTexturePoint, meta.atlas.columns, meta.atlas.rows, textureW, textureH, resolvedFrames]
  );

  const stopPanning = useCallback(() => setIsPanning(false), []);

  const handleFitCanvas = useCallback(() => {
    const canvas = sheetCanvasRef.current;
    if (!canvas || textureW <= 0 || textureH <= 0) return;
    const fit = Math.min((canvas.width - 32) / textureW, (canvas.height - 32) / textureH);
    const clamped = Math.max(0.15, Math.min(3, Number(fit.toFixed(2))));
    setZoom(clamped);
    setPan({
      x: Math.round((canvas.width - textureW * clamped) / 2),
      y: Math.round((canvas.height - textureH * clamped) / 2),
    });
  }, [textureW, textureH]);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 16, y: 16 });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.15, Number((z - 0.15).toFixed(2))));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(4, Number((z + 0.15).toFixed(2))));
  }, []);

  const resetViewportOnPreset = useCallback(() => {
    setSelectedFrameId(null);
    setPan({ x: 16, y: 16 });
  }, []);

  const selectedFrameObj = useMemo(
    () => resolvedFrames.find((f) => f.id === selectedFrameId) ?? null,
    [resolvedFrames, selectedFrameId]
  );

  return {
    sheetCanvasRef,
    toolMode,
    setToolMode,
    zoom,
    showGrid,
    setShowGrid,
    showTracks,
    setShowTracks,
    showMargins,
    setShowMargins,
    showFrames,
    setShowFrames,
    cursorCoords,
    selectedFrameId,
    setSelectedFrameId,
    selectedFrameObj,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    stopPanning,
    handleFitCanvas,
    handleResetZoom,
    handleZoomOut,
    handleZoomIn,
    resetViewportOnPreset,
  };
}
