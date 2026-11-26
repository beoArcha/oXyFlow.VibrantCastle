import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  MousePointer,
  Hand,
  Pipette,
  ListOrdered,
  Grid3X3,
  Layers,
  Frame,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FlipHorizontal,
  Download,
  Copy,
  RotateCcw,
  Plus,
  Trash2,
  Wand2,
  PanelRightClose,
  PanelRightOpen,
  ScrollText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  Upload,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  SearchInput,
  Select,
  Switch,
  Slider,
  Textarea,
  ColorPickerInput,
  FileUploadButton,
  Tabs,
  TabItem,
  Text,
  Label,
  Code,
  Alert,
} from "@ui";
import { LoggerManager, type LogRecord } from "@lib/logger";
import { defaultAtlasSlicingEngine } from "@game/engine/meta/slicing/AtlasSlicingEngine";
import {
  BackgroundProcessor,
  type IPixelBuffer,
} from "@game/engine/meta/slicing/BackgroundProcessor";
import type {
  ResolvedFrameRect,
  SlicingMethod,
  IFreeformFrameRect,
} from "@game/engine/meta/types";
import { ATLAS_PRESETS, type AtlasPresetCategory } from "./assetPresets";
import {
  buildEditableMetaFromPreset,
  resolveFramesForMeta,
  buildChromaKeyedCanvas,
  triggerCanvasPngDownload,
  triggerJsonTextDownload,
  SLICER_CANVAS_COLORS,
  CHROMA_COLOR_PRESETS,
  PIVOT_ANCHOR_PRESETS,
  type EditableMetaDoc,
} from "./atlasSlicerHelpers";

export interface AtlasSlicerSubtabProps {
  readonly onOpenLogs?: () => void;
}

type ToolMode = "select" | "pan" | "eyedropper" | "sequence";
type InspectorTabId = "preview" | "slicing" | "chroma" | "json";
type CategoryFilter = "all" | AtlasPresetCategory;

const CATEGORY_FILTERS: readonly { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Wszystkie" },
  { id: "character", label: "Postacie" },
  { id: "enemy", label: "Wrogowie" },
  { id: "structure", label: "Struktury" },
  { id: "portrait", label: "Portrety" },
];

const SLICING_METHOD_OPTIONS: { value: SlicingMethod; label: string }[] = [
  { value: "by_count", label: "Siatka (Kolumny × Wiersze)" },
  { value: "by_cell_size", label: "Rozmiar komórki (px)" },
  { value: "freeform_rects", label: "Dowolne prostokąty (Freeform)" },
  { value: "auto_islands", label: "Auto-wyspy (Flood-Fill)" },
];

/**
 * Full Atlas Slicer, Live Animation Preview & Alpha Chroma Baker.
 * All toolbar/preset/action buttons enforce `whitespace-nowrap shrink-0` so labels
 * always render cleanly on a single line without wrapping or clipping.
 */
export const AtlasSlicerSubtab: React.FC<AtlasSlicerSubtabProps> = ({
  onOpenLogs,
}) => {
  // Preset & source image state
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [presetSearch, setPresetSearch] = useState("");
  const [activePresetId, setActivePresetId] = useState<string>(
    ATLAS_PRESETS[0]?.id ?? "valen"
  );
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [customImageName, setCustomImageName] = useState<string | null>(null);

  const activePreset = useMemo(
    () => ATLAS_PRESETS.find((p) => p.id === activePresetId) ?? ATLAS_PRESETS[0],
    [activePresetId]
  );

  const [meta, setMeta] = useState<EditableMetaDoc>(() =>
    buildEditableMetaFromPreset(ATLAS_PRESETS[0])
  );
  const [jsonDraft, setJsonDraft] = useState<string>(() =>
    JSON.stringify(buildEditableMetaFromPreset(ATLAS_PRESETS[0]), null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Loaded HTMLImageElement & pixel buffer
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [pixelBuffer, setPixelBuffer] = useState<IPixelBuffer | null>(null);

  // Canvas viewport state
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

  // Overlays
  const [showGrid, setShowGrid] = useState(true);
  const [showTracks, setShowTracks] = useState(true);
  const [showMargins, setShowMargins] = useState(false);
  const [showFrames, setShowFrames] = useState(true);
  const [showChromaPreview, setShowChromaPreview] = useState(false);

  // Cursor & selection
  const [cursorCoords, setCursorCoords] = useState<{
    x: number;
    y: number;
    col: number;
    row: number;
  } | null>(null);
  const [hoveredFrameId, setHoveredFrameId] = useState<string | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  // Inspector & Animation Preview state
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<InspectorTabId>("preview");
  const [activeTrackName, setActiveTrackName] = useState<string>(
    () => Object.keys(buildEditableMetaFromPreset(ATLAS_PRESETS[0]).animations)[0] ?? "idle"
  );
  const [newTrackName, setNewTrackName] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [playheadIdx, setPlayheadIdx] = useState(0);
  const [previewScale, setPreviewScale] = useState(1.5);
  const [flipX, setFlipX] = useState(false);
  const [showGroundLine, setShowGroundLine] = useState(true);
  const [onionSkin, setOnionSkin] = useState(false);
  const [chromaFeather, setChromaFeather] = useState(6);

  // Slicer event log strip
  const [logStripOpen, setLogStripOpen] = useState(false);
  const [slicerLogs, setSlicerLogs] = useState<LogRecord[]>([]);

  const sheetCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const flashStatus = useCallback((msg: string) => {
    setStatusNotice(msg);
    window.setTimeout(() => setStatusNotice(null), 2400);
  }, []);

  // Load preset changes
  const handleSelectPreset = useCallback((presetId: string) => {
    const preset = ATLAS_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setCustomImageSrc(null);
    setCustomImageName(null);
    const nextMeta = buildEditableMetaFromPreset(preset);
    setMeta(nextMeta);
    setJsonDraft(JSON.stringify(nextMeta, null, 2));
    setJsonError(null);
    setActiveTrackName(Object.keys(nextMeta.animations)[0] ?? "idle");
    setSelectedFrameId(null);
    setPlayheadIdx(0);
    setPan({ x: 16, y: 16 });
  }, []);

  // Sync JSON textarea whenever meta changes from UI controls
  const updateMeta = useCallback((updater: (prev: EditableMetaDoc) => EditableMetaDoc) => {
    setMeta((prev) => {
      const next = updater(prev);
      setJsonDraft(JSON.stringify(next, null, 2));
      setJsonError(null);
      return next;
    });
  }, []);

  // Load texture image + extract pixel buffer for Eyedropper / Auto-Islands / Chroma
  const effectiveImageSrc = customImageSrc ?? activePreset?.imageSrc ?? "";

  useEffect(() => {
    if (!effectiveImageSrc) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = effectiveImageSrc;
    img.onload = () => {
      if (cancelled) return;
      setLoadedImage(img);
      const offscreen = document.createElement("canvas");
      offscreen.width = img.naturalWidth;
      offscreen.height = img.naturalHeight;
      const ctx = offscreen.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setPixelBuffer(BackgroundProcessor.extractFromCanvas(offscreen));
      }
    };
    return () => {
      cancelled = true;
    };
  }, [effectiveImageSrc]);

  // Subscribe to AtlasSlicing* logs from LoggerManager ringBuffer
  useEffect(() => {
    const ring = LoggerManager.getInstance().ringBuffer;
    const sync = () => {
      setSlicerLogs(
        ring
          .getLogs()
          .filter((r) => r.category.startsWith("AtlasSlicing"))
          .slice(-25)
      );
    };
    sync();
    return ring.subscribe(sync);
  }, []);

  const textureW = loadedImage?.naturalWidth || meta.atlas.columns * meta.atlas.cellWidth;
  const textureH = loadedImage?.naturalHeight || meta.atlas.rows * meta.atlas.cellHeight;

  // Chroma-keyed preview source canvas
  const chromaCanvas = useMemo(() => {
    if (!loadedImage || !showChromaPreview || meta.backgroundConfig.mode !== "color") {
      return null;
    }
    return buildChromaKeyedCanvas(
      loadedImage,
      meta.backgroundConfig.colorHex ?? "#ff00ff",
      meta.backgroundConfig.tolerance ?? 18,
      chromaFeather
    );
  }, [
    loadedImage,
    showChromaPreview,
    meta.backgroundConfig.mode,
    meta.backgroundConfig.colorHex,
    meta.backgroundConfig.tolerance,
    chromaFeather,
  ]);

  // Resolve frames through AtlasSlicingEngine
  const resolvedFrames = useMemo<ResolvedFrameRect[]>(
    () => resolveFramesForMeta(meta, textureW, textureH, pixelBuffer),
    [meta, textureW, textureH, pixelBuffer]
  );

  // Active animation track & resolved sequence frames
  const activeTrack = meta.animations[activeTrackName] ?? Object.values(meta.animations)[0];

  const activeTrackFrames = useMemo<ResolvedFrameRect[]>(() => {
    if (!activeTrack) return resolvedFrames.slice(0, 4);
    if (activeTrack.frameIndices && activeTrack.frameIndices.length > 0) {
      return activeTrack.frameIndices
        .map((idx) => resolvedFrames[idx])
        .filter((f): f is ResolvedFrameRect => Boolean(f));
    }
    const byName = resolvedFrames.filter((f) => f.trackName === activeTrackName);
    if (byName.length > 0) return byName;
    const byRow = resolvedFrames.filter((f) => f.row === activeTrack.row);
    if (byRow.length > 0) return byRow.slice(0, Math.max(1, activeTrack.frames));
    return resolvedFrames.slice(0, Math.max(1, activeTrack.frames));
  }, [activeTrack, activeTrackName, resolvedFrames]);

  // Playhead loop timer
  useEffect(() => {
    if (!isPlaying || activeTrackFrames.length <= 1) return;
    const fps = Math.max(1, activeTrack?.fps ?? 8);
    const intervalMs = Math.round(1000 / fps);
    const id = window.setInterval(() => {
      setPlayheadIdx((prev) => {
        const next = prev + 1;
        if (next >= activeTrackFrames.length) {
          return activeTrack?.loop === false ? prev : 0;
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [isPlaying, activeTrack?.fps, activeTrack?.loop, activeTrackFrames.length]);

  useEffect(() => {
    if (playheadIdx >= activeTrackFrames.length && activeTrackFrames.length > 0) {
      setPlayheadIdx(0);
    }
  }, [activeTrackFrames.length, playheadIdx]);

  // Render main Atlas Sheet Canvas
  useEffect(() => {
    const canvas = sheetCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Checkerboard background
    const tile = 16;
    for (let y = 0; y < h; y += tile) {
      for (let x = 0; x < w; x += tile) {
        ctx.fillStyle =
          ((x / tile + y / tile) & 1) === 0
            ? SLICER_CANVAS_COLORS.checkerLight
            : SLICER_CANVAS_COLORS.checkerDark;
        ctx.fillRect(x, y, tile, tile);
      }
    }

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    ctx.imageSmoothingEnabled = false;

    const source = chromaCanvas ?? loadedImage;
    if (source) {
      ctx.drawImage(source, 0, 0, textureW, textureH);
    }

    const cols = Math.max(1, meta.atlas.columns);
    const rows = Math.max(1, meta.atlas.rows);
    const cellW = textureW / cols;
    const cellH = textureH / rows;

    // Active track row highlight
    if (showTracks && activeTrack) {
      ctx.fillStyle = SLICER_CANVAS_COLORS.trackFill;
      ctx.fillRect(0, activeTrack.row * cellH, textureW, cellH);
    }

    // Grid overlay
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

    // Safe margin overlay
    if (showMargins && meta.atlas.safeMargin > 0) {
      ctx.strokeStyle = SLICER_CANVAS_COLORS.marginStroke;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.lineWidth = Math.max(1, 1 / zoom);
      const m = meta.atlas.safeMargin;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.strokeRect(
            c * cellW + m,
            r * cellH + m,
            Math.max(0, cellW - 2 * m),
            Math.max(0, cellH - 2 * m)
          );
        }
      }
      ctx.setLineDash([]);
    }

    // Resolved frame rectangles
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

        // Sequence index badge if part of activeTrack.frameIndices
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

  // Render Live Animation Preview Canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Subtle checker
    const tile = 12;
    for (let y = 0; y < h; y += tile) {
      for (let x = 0; x < w; x += tile) {
        ctx.fillStyle =
          ((x / tile + y / tile) & 1) === 0
            ? SLICER_CANVAS_COLORS.checkerLight
            : SLICER_CANVAS_COLORS.checkerDark;
        ctx.fillRect(x, y, tile, tile);
      }
    }

    const source = chromaCanvas ?? loadedImage;
    const frame = activeTrackFrames[playheadIdx] ?? activeTrackFrames[0];
    if (!source || !frame) return;

    const anchorX = meta.layout.anchor.x;
    const anchorY = meta.layout.anchor.y;
    const maxFitScale = Math.min((w * 0.8) / Math.max(1, frame.width), (h * 0.78) / Math.max(1, frame.height));
    const drawScale = maxFitScale * (previewScale / 1.5);
    const drawW = frame.width * drawScale;
    const drawH = frame.height * drawScale;
    const groundY = h - 22;
    const pivotCanvasX = w / 2;
    const pivotCanvasY = anchorY >= 0.85 ? groundY : h / 2;

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

    // Onion skinning (previous frame ghost)
    if (onionSkin && activeTrackFrames.length > 1) {
      const prevIdx =
        (playheadIdx - 1 + activeTrackFrames.length) % activeTrackFrames.length;
      drawSpriteFrame(activeTrackFrames[prevIdx], 0.28);
    }

    drawSpriteFrame(frame, 1);

    // Ground baseline
    if (showGroundLine) {
      ctx.strokeStyle = SLICER_CANVAS_COLORS.groundLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();
    }

    // Pivot crosshair
    ctx.strokeStyle = SLICER_CANVAS_COLORS.pivotCrosshair;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pivotCanvasX - 6, pivotCanvasY);
    ctx.lineTo(pivotCanvasX + 6, pivotCanvasY);
    ctx.moveTo(pivotCanvasX, pivotCanvasY - 6);
    ctx.lineTo(pivotCanvasX, pivotCanvasY + 6);
    ctx.stroke();
  }, [
    loadedImage,
    chromaCanvas,
    activeTrackFrames,
    playheadIdx,
    previewScale,
    flipX,
    showGroundLine,
    onionSkin,
    meta.layout.anchor.x,
    meta.layout.anchor.y,
  ]);

  // Convert mouse event on sheet canvas to texture pixel coordinates
  const getTexturePoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sheetCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const canvasX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const canvasY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const texX = (canvasX - pan.x) / zoom;
    const texY = (canvasY - pan.y) / zoom;
    return { texX, texY, canvasX, canvasY };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
      if (pixelBuffer) {
        const sampled = BackgroundProcessor.sampleColor(pixelBuffer, pt.texX, pt.texY);
        updateMeta((prev) => ({
          ...prev,
          backgroundConfig: {
            ...prev.backgroundConfig,
            mode: "color",
            colorHex: sampled.hex,
          },
        }));
        setShowChromaPreview(true);
        flashStatus(`Pobrano kolor tła: ${sampled.hex}`);
      }
      return;
    }

    const hit = defaultAtlasSlicingEngine.findFrameAt(pt.texX, pt.texY, resolvedFrames);
    if (!hit) return;

    setSelectedFrameId(hit.id);

    if (toolMode === "sequence" && activeTrackName) {
      const idx = resolvedFrames.findIndex((f) => f.id === hit.id);
      if (idx >= 0) {
        updateMeta((prev) => {
          const track = prev.animations[activeTrackName];
          if (!track) return prev;
          const existing = track.frameIndices ?? [];
          return {
            ...prev,
            animations: {
              ...prev.animations,
              [activeTrackName]: {
                ...track,
                frameIndices: [...existing, idx],
                frames: existing.length + 1,
              },
            },
          };
        });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
  };

  const handleFitCanvas = () => {
    const canvas = sheetCanvasRef.current;
    if (!canvas || textureW <= 0 || textureH <= 0) return;
    const fit = Math.min((canvas.width - 32) / textureW, (canvas.height - 32) / textureH);
    const clamped = Math.max(0.15, Math.min(3, Number(fit.toFixed(2))));
    setZoom(clamped);
    setPan({
      x: Math.round((canvas.width - textureW * clamped) / 2),
      y: Math.round((canvas.height - textureH * clamped) / 2),
    });
  };

  // Auto-Islands detection & bake into freeform frames
  const handleBakeAutoIslands = () => {
    if (!pixelBuffer) {
      flashStatus("Brak bufora pikseli do wykrycia wysp.");
      return;
    }
    const islandFrames = defaultAtlasSlicingEngine.resolveFrames(
      {
        ...meta,
        slicing: {
          method: "auto_islands",
          autoIslands: meta.slicing.autoIslands ?? {
            minIslandPixels: 24,
            clusterYTolerance: 16,
          },
        },
      },
      textureW,
      textureH,
      pixelBuffer
    );
    const bakedRecord: Record<string, IFreeformFrameRect> = {};
    islandFrames.forEach((f, idx) => {
      bakedRecord[f.id || `island_${idx}`] = {
        id: f.id || `island_${idx}`,
        x: Math.round(f.x),
        y: Math.round(f.y),
        width: Math.round(f.width),
        height: Math.round(f.height),
      };
    });
    updateMeta((prev) => ({
      ...prev,
      slicing: {
        ...prev.slicing,
        method: "freeform_rects",
        frames: bakedRecord,
      },
    }));
    flashStatus(`Wykryto i wypalono ${islandFrames.length} wysp do freeform_rects.`);
  };

  // Bake clean transparent PNG download
  const handleBakeCleanPng = () => {
    if (!loadedImage) return;
    const baked = buildChromaKeyedCanvas(
      loadedImage,
      meta.backgroundConfig.colorHex ?? "#ff00ff",
      meta.backgroundConfig.tolerance ?? 18,
      chromaFeather
    );
    if (!baked) return;
    const baseName = customImageName
      ? customImageName.replace(/\.[^.]+$/, "")
      : activePreset?.id ?? "atlas";
    triggerCanvasPngDownload(baked, `${baseName}_clean_alpha.png`);
    flashStatus("Pobrano czyste PNG z wypaloną przezroczystością Alpha.");
  };

  // Auto detect dominant perimeter background
  const handleAutoDetectBackground = () => {
    if (!pixelBuffer) return;
    const detected = BackgroundProcessor.detectDominantBackground(pixelBuffer);
    updateMeta((prev) => ({
      ...prev,
      backgroundConfig: {
        ...prev.backgroundConfig,
        mode: detected.isTransparent ? "transparent" : "color",
        colorHex: detected.colorHex,
      },
    }));
    if (!detected.isTransparent) {
      setShowChromaPreview(true);
    }
    flashStatus(
      detected.isTransparent
        ? "Wykryto już przezroczyste tło (Alpha)."
        : `Wykryto kolor tła krawędzi: ${detected.colorHex}`
    );
  };

  // Filtered presets
  const filteredPresets = useMemo(() => {
    const q = presetSearch.trim().toLowerCase();
    return ATLAS_PRESETS.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [categoryFilter, presetSearch]);

  const inspectorTabs: TabItem<InspectorTabId>[] = useMemo(
    () => [
      { id: "preview", label: "Podgląd" },
      { id: "slicing", label: "Cięcie i Ścieżki" },
      { id: "chroma", label: "Tło i Alpha" },
      { id: "json", label: "JSON" },
    ],
    []
  );

  const selectedFrameObj = useMemo(
    () => resolvedFrames.find((f) => f.id === selectedFrameId) ?? null,
    [resolvedFrames, selectedFrameId]
  );

  return (
    <div id="subtab-content-atlas-slicer" className="flex flex-col gap-3">
      {/* PRESET & UPLOAD BAR */}
      <Card variant="subtle">
        <CardContent className="p-3 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORY_FILTERS.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={categoryFilter === cat.id ? "primary" : "secondary"}
                  onClick={() => setCategoryFilter(cat.id)}
                  className="whitespace-nowrap shrink-0 px-3"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={presetSearch}
                onChange={(val) => setPresetSearch(val)}
                onClear={() => setPresetSearch("")}
                placeholder="Filtruj presety..."
                className="w-44"
              />
              <FileUploadButton
                accept="image/png,image/webp,image/svg+xml"
                label="Wgraj PNG"
                icon={<Upload size={13} />}
                variant="secondary"
                size="sm"
                className="whitespace-nowrap shrink-0"
                onFileSelect={(file) => {
                  const url = URL.createObjectURL(file);
                  setCustomImageSrc(url);
                  setCustomImageName(file.name);
                  flashStatus(`Załadowano własną teksturę: ${file.name}`);
                }}
              />
              <FileUploadButton
                accept="application/json,.json"
                label="Wgraj meta.json"
                icon={<Upload size={13} />}
                variant="outline"
                size="sm"
                className="whitespace-nowrap shrink-0"
                onFileSelect={(file) => {
                  file.text().then((txt) => {
                    try {
                      const parsed = JSON.parse(txt) as EditableMetaDoc;
                      setMeta(parsed);
                      setJsonDraft(JSON.stringify(parsed, null, 2));
                      setJsonError(null);
                      flashStatus(`Załadowano meta.json: ${file.name}`);
                    } catch {
                      setJsonError("Nieprawidłowy plik JSON.");
                    }
                  });
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {filteredPresets.map((preset) => (
              <Button
                key={preset.id}
                size="sm"
                variant={
                  !customImageSrc && preset.id === activePreset?.id ? "primary" : "ghost"
                }
                onClick={() => handleSelectPreset(preset.id)}
                className="whitespace-nowrap shrink-0 px-3"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {statusNotice && (
        <Alert variant="success" title={statusNotice} />
      )}

      {/* MAIN WORKSPACE: CANVAS VIEWPORT + COLLAPSIBLE INSPECTOR */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        {/* LEFT: INTERACTIVE VIEWPORT */}
        <Card
          variant="subtle"
          className={inspectorOpen ? "xl:col-span-7 flex flex-col" : "xl:col-span-12 flex flex-col"}
        >
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Tool modes — strictly single-line whitespace-nowrap shrink-0 */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant={toolMode === "select" ? "primary" : "secondary"}
                  icon={<MousePointer size={13} />}
                  onClick={() => setToolMode("select")}
                  className="whitespace-nowrap shrink-0 px-3"
                >
                  Wybierz
                </Button>
                <Button
                  size="sm"
                  variant={toolMode === "pan" ? "primary" : "secondary"}
                  icon={<Hand size={13} />}
                  onClick={() => setToolMode("pan")}
                  className="whitespace-nowrap shrink-0 px-3"
                >
                  Przesuń
                </Button>
                <Button
                  size="sm"
                  variant={toolMode === "eyedropper" ? "primary" : "secondary"}
                  icon={<Pipette size={13} />}
                  onClick={() => setToolMode("eyedropper")}
                  className="whitespace-nowrap shrink-0 px-3"
                >
                  Pipeta
                </Button>
                <Button
                  size="sm"
                  variant={toolMode === "sequence" ? "primary" : "secondary"}
                  icon={<ListOrdered size={13} />}
                  onClick={() => setToolMode("sequence")}
                  className="whitespace-nowrap shrink-0 px-3"
                >
                  Sekwencja
                </Button>
              </div>

              <Button
                size="sm"
                variant="outline"
                icon={
                  inspectorOpen ? (
                    <PanelRightClose size={13} />
                  ) : (
                    <PanelRightOpen size={13} />
                  )
                }
                onClick={() => setInspectorOpen((v) => !v)}
                className="whitespace-nowrap shrink-0 px-3"
              >
                {inspectorOpen ? "Ukryj Inspektor" : "Pokaż Inspektor"}
              </Button>
            </div>

            {/* Overlays & Zoom Bar — single-line non-wrapping buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/80">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant={showGrid ? "primary" : "ghost"}
                  icon={<Grid3X3 size={12} />}
                  onClick={() => setShowGrid((v) => !v)}
                  className="whitespace-nowrap shrink-0 px-2.5"
                >
                  Siatka
                </Button>
                <Button
                  size="sm"
                  variant={showTracks ? "primary" : "ghost"}
                  icon={<Layers size={12} />}
                  onClick={() => setShowTracks((v) => !v)}
                  className="whitespace-nowrap shrink-0 px-2.5"
                >
                  Ścieżki
                </Button>
                <Button
                  size="sm"
                  variant={showMargins ? "primary" : "ghost"}
                  icon={<Frame size={12} />}
                  onClick={() => setShowMargins((v) => !v)}
                  className="whitespace-nowrap shrink-0 px-2.5"
                >
                  Marginesy
                </Button>
                <Button
                  size="sm"
                  variant={showFrames ? "primary" : "ghost"}
                  onClick={() => setShowFrames((v) => !v)}
                  className="whitespace-nowrap shrink-0 px-2.5"
                >
                  Ramki ({resolvedFrames.length})
                </Button>
                <Button
                  size="sm"
                  variant={showChromaPreview ? "primary" : "ghost"}
                  icon={<Sparkles size={12} />}
                  onClick={() => setShowChromaPreview((v) => !v)}
                  className="whitespace-nowrap shrink-0 px-2.5"
                >
                  Chroma
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Maximize2 size={12} />}
                  onClick={handleFitCanvas}
                  className="whitespace-nowrap shrink-0 px-2.5"
                >
                  Dopasuj
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 16, y: 16 });
                  }}
                  className="whitespace-nowrap shrink-0 px-2.5"
                >
                  1×
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<ZoomOut size={12} />}
                  onClick={() => setZoom((z) => Math.max(0.15, Number((z - 0.15).toFixed(2))))}
                  className="whitespace-nowrap shrink-0 px-2"
                  aria-label="Oddal"
                />
                <Code size="xs" className="tabular-nums">
                  {Math.round(zoom * 100)}%
                </Code>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<ZoomIn size={12} />}
                  onClick={() => setZoom((z) => Math.min(4, Number((z + 0.15).toFixed(2))))}
                  className="whitespace-nowrap shrink-0 px-2"
                  aria-label="Przybliż"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-2">
            <div className="rounded-xl border border-stone-800 bg-black/70 overflow-hidden relative">
              <canvas
                ref={sheetCanvasRef}
                width={760}
                height={420}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={() => setIsPanning(false)}
                onMouseLeave={() => setIsPanning(false)}
                className="w-full h-[380px] block cursor-crosshair select-none"
              />
            </div>

            {/* Coordinate & Selection Telemetry Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-1">
              <div className="flex flex-wrap items-center gap-3 tabular-nums">
                <Text size="2xs" variant="muted">
                  Tekstura: {textureW}×{textureH}px
                </Text>
                {cursorCoords && (
                  <Text size="2xs" variant="muted">
                    Kursor: ({cursorCoords.x}, {cursorCoords.y}) • Kol {cursorCoords.col}, Wiersz{" "}
                    {cursorCoords.row}
                  </Text>
                )}
              </div>
              {selectedFrameObj && (
                <Badge variant="amber">
                  {selectedFrameObj.id}: {Math.round(selectedFrameObj.x)},
                  {Math.round(selectedFrameObj.y)} ({Math.round(selectedFrameObj.width)}×
                  {Math.round(selectedFrameObj.height)})
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: COLLAPSIBLE 4-TAB INSPECTOR */}
        {inspectorOpen && (
          <Card variant="subtle" className="xl:col-span-5 flex flex-col">
            <CardHeader className="pb-2">
              <Tabs<InspectorTabId>
                items={inspectorTabs}
                activeId={inspectorTab}
                onChange={setInspectorTab}
              />
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {/* TAB 1: LIVE ANIMATION PREVIEW */}
              {inspectorTab === "preview" && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Select
                      value={activeTrackName}
                      onChange={(e) => {
                        setActiveTrackName(e.target.value);
                        setPlayheadIdx(0);
                      }}
                      options={Object.keys(meta.animations).map((name) => ({
                        value: name,
                        label: `${name} (${meta.animations[name].frames} kl.)`,
                      }))}
                      size="sm"
                      containerClassName="flex-1 min-w-[150px]"
                    />
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<SkipBack size={13} />}
                        onClick={() =>
                          setPlayheadIdx(
                            (p) =>
                              (p - 1 + Math.max(1, activeTrackFrames.length)) %
                              Math.max(1, activeTrackFrames.length)
                          )
                        }
                        className="whitespace-nowrap shrink-0 px-2"
                        aria-label="Poprzednia klatka"
                      />
                      <Button
                        size="sm"
                        variant={isPlaying ? "primary" : "secondary"}
                        icon={isPlaying ? <Pause size={13} /> : <Play size={13} />}
                        onClick={() => setIsPlaying((v) => !v)}
                        className="whitespace-nowrap shrink-0 px-3"
                      >
                        {isPlaying ? "Pauza" : "Odtwórz"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<SkipForward size={13} />}
                        onClick={() =>
                          setPlayheadIdx(
                            (p) => (p + 1) % Math.max(1, activeTrackFrames.length)
                          )
                        }
                        className="whitespace-nowrap shrink-0 px-2"
                        aria-label="Następna klatka"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center rounded-xl border border-stone-800 bg-black/70 p-2">
                    <canvas
                      ref={previewCanvasRef}
                      width={260}
                      height={190}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Slider
                      label="FPS"
                      min={1}
                      max={30}
                      step={1}
                      unit=" fps"
                      value={activeTrack?.fps ?? 8}
                      onChange={(fps) =>
                        updateMeta((prev) => ({
                          ...prev,
                          animations: {
                            ...prev.animations,
                            [activeTrackName]: {
                              ...prev.animations[activeTrackName],
                              fps,
                            },
                          },
                        }))
                      }
                    />
                    <Slider
                      label="Skala podglądu"
                      min={0.5}
                      max={3}
                      step={0.25}
                      unit="×"
                      value={previewScale}
                      onChange={setPreviewScale}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={flipX ? "primary" : "secondary"}
                      icon={<FlipHorizontal size={12} />}
                      onClick={() => setFlipX((v) => !v)}
                      className="whitespace-nowrap shrink-0 px-2.5"
                    >
                      Odbij X
                    </Button>
                    <Button
                      size="sm"
                      variant={showGroundLine ? "primary" : "secondary"}
                      onClick={() => setShowGroundLine((v) => !v)}
                      className="whitespace-nowrap shrink-0 px-2.5"
                    >
                      Linia gruntu
                    </Button>
                    <Button
                      size="sm"
                      variant={onionSkin ? "primary" : "secondary"}
                      onClick={() => setOnionSkin((v) => !v)}
                      className="whitespace-nowrap shrink-0 px-2.5"
                    >
                      Onion Skin
                    </Button>
                  </div>

                  {/* Pivot presets */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
                    <Label>Punkt zakotwiczenia (Pivot)</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {PIVOT_ANCHOR_PRESETS.map((pv) => (
                        <Button
                          key={pv.id}
                          size="sm"
                          variant={
                            meta.layout.anchor.x === pv.x && meta.layout.anchor.y === pv.y
                              ? "primary"
                              : "ghost"
                          }
                          onClick={() =>
                            updateMeta((prev) => ({
                              ...prev,
                              layout: {
                                ...prev.layout,
                                anchor: { x: pv.x, y: pv.y },
                                origin: {
                                  type: pv.id,
                                  normalized: { x: pv.x, y: pv.y },
                                },
                              },
                            }))
                          }
                          className="whitespace-nowrap shrink-0 px-2.5"
                        >
                          {pv.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Filmstrip sequence manipulation */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label>
                        Taśma klatek ({activeTrackFrames.length}) — klatka {playheadIdx + 1}
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<ArrowLeftRight size={12} />}
                          className="whitespace-nowrap shrink-0 px-2"
                          onClick={() => {
                            const indices =
                              activeTrack?.frameIndices ??
                              activeTrackFrames.map((f) =>
                                resolvedFrames.findIndex((r) => r.id === f.id)
                              );
                            const reversed = [...indices].reverse();
                            updateMeta((prev) => ({
                              ...prev,
                              animations: {
                                ...prev.animations,
                                [activeTrackName]: {
                                  ...prev.animations[activeTrackName],
                                  frameIndices: reversed,
                                  frames: reversed.length,
                                },
                              },
                            }));
                          }}
                        >
                          Odwróć
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="whitespace-nowrap shrink-0 px-2"
                          onClick={() => {
                            const base =
                              activeTrack?.frameIndices ??
                              activeTrackFrames.map((f) =>
                                resolvedFrames.findIndex((r) => r.id === f.id)
                              );
                            const pingPong = [
                              ...base,
                              ...base.slice(1, -1).reverse(),
                            ];
                            updateMeta((prev) => ({
                              ...prev,
                              animations: {
                                ...prev.animations,
                                [activeTrackName]: {
                                  ...prev.animations[activeTrackName],
                                  frameIndices: pingPong,
                                  frames: pingPong.length,
                                },
                              },
                            }));
                          }}
                        >
                          Ping-Pong
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-[84px] overflow-y-auto">
                      {activeTrackFrames.map((f, idx) => (
                        <Button
                          key={`${f.id}_${idx}`}
                          size="sm"
                          variant={idx === playheadIdx ? "primary" : "secondary"}
                          onClick={() => {
                            setIsPlaying(false);
                            setPlayheadIdx(idx);
                            setSelectedFrameId(f.id);
                          }}
                          className="whitespace-nowrap shrink-0 px-2 font-mono text-[11px] tabular-nums"
                        >
                          #{idx + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: SLICING & ANIMATION TRACKS */}
              {inspectorTab === "slicing" && (
                <>
                  <Select
                    label="Strategia cięcia (AtlasSlicingEngine)"
                    value={meta.slicing.method}
                    onChange={(e) =>
                      updateMeta((prev) => ({
                        ...prev,
                        slicing: {
                          ...prev.slicing,
                          method: e.target.value as SlicingMethod,
                        },
                      }))
                    }
                    options={SLICING_METHOD_OPTIONS}
                  />

                  <div className="grid grid-cols-2 gap-2.5">
                    <Input
                      label="Kolumny"
                      type="number"
                      min={1}
                      value={String(meta.atlas.columns)}
                      onChange={(e) => {
                        const columns = Math.max(1, Number(e.target.value) || 1);
                        updateMeta((prev) => ({
                          ...prev,
                          atlas: { ...prev.atlas, columns },
                          slicing: {
                            ...prev.slicing,
                            grid: { ...(prev.slicing.grid ?? prev.atlas), columns },
                          },
                        }));
                      }}
                    />
                    <Input
                      label="Wiersze"
                      type="number"
                      min={1}
                      value={String(meta.atlas.rows)}
                      onChange={(e) => {
                        const rows = Math.max(1, Number(e.target.value) || 1);
                        updateMeta((prev) => ({
                          ...prev,
                          atlas: { ...prev.atlas, rows },
                          slicing: {
                            ...prev.slicing,
                            grid: { ...(prev.slicing.grid ?? prev.atlas), rows },
                          },
                        }));
                      }}
                    />
                    <Input
                      label="Szer. komórki (px)"
                      type="number"
                      min={8}
                      value={String(meta.slicing.cellSize?.cellWidth ?? meta.atlas.cellWidth)}
                      onChange={(e) => {
                        const cellWidth = Math.max(8, Number(e.target.value) || 64);
                        updateMeta((prev) => ({
                          ...prev,
                          atlas: { ...prev.atlas, cellWidth },
                          slicing: {
                            ...prev.slicing,
                            cellSize: {
                              cellHeight: prev.slicing.cellSize?.cellHeight ?? prev.atlas.cellHeight,
                              ...prev.slicing.cellSize,
                              cellWidth,
                            },
                          },
                        }));
                      }}
                    />
                    <Input
                      label="Wys. komórki (px)"
                      type="number"
                      min={8}
                      value={String(meta.slicing.cellSize?.cellHeight ?? meta.atlas.cellHeight)}
                      onChange={(e) => {
                        const cellHeight = Math.max(8, Number(e.target.value) || 64);
                        updateMeta((prev) => ({
                          ...prev,
                          atlas: { ...prev.atlas, cellHeight },
                          slicing: {
                            ...prev.slicing,
                            cellSize: {
                              cellWidth: prev.slicing.cellSize?.cellWidth ?? prev.atlas.cellWidth,
                              ...prev.slicing.cellSize,
                              cellHeight,
                            },
                          },
                        }));
                      }}
                    />
                    <Input
                      label="Odstęp (spacing)"
                      type="number"
                      min={0}
                      value={String(meta.atlas.spacing)}
                      onChange={(e) => {
                        const spacing = Math.max(0, Number(e.target.value) || 0);
                        updateMeta((prev) => ({
                          ...prev,
                          atlas: { ...prev.atlas, spacing },
                        }));
                      }}
                    />
                    <Input
                      label="Safe Margin (px)"
                      type="number"
                      min={0}
                      value={String(meta.atlas.safeMargin)}
                      onChange={(e) => {
                        const safeMargin = Math.max(0, Number(e.target.value) || 0);
                        updateMeta((prev) => ({
                          ...prev,
                          atlas: { ...prev.atlas, safeMargin },
                        }));
                      }}
                    />
                  </div>

                  {meta.slicing.method === "auto_islands" && (
                    <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-stone-800">
                      <Input
                        label="Min. pikseli wyspy"
                        type="number"
                        min={4}
                        containerClassName="flex-1"
                        value={String(meta.slicing.autoIslands?.minIslandPixels ?? 24)}
                        onChange={(e) =>
                          updateMeta((prev) => ({
                            ...prev,
                            slicing: {
                              ...prev.slicing,
                              autoIslands: {
                                ...prev.slicing.autoIslands,
                                minIslandPixels: Math.max(4, Number(e.target.value) || 16),
                              },
                            },
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Wand2 size={13} />}
                        onClick={handleBakeAutoIslands}
                        className="whitespace-nowrap shrink-0"
                      >
                        Wykryj i wypal wyspy
                      </Button>
                    </div>
                  )}

                  {/* Animation Track Manager */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-stone-800">
                    <Label>Ścieżki Animacji</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Nazwa nowej ścieżki (np. heavy_slash)"
                        value={newTrackName}
                        onChange={(e) => setNewTrackName(e.target.value)}
                        containerClassName="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Plus size={13} />}
                        className="whitespace-nowrap shrink-0"
                        onClick={() => {
                          const clean = newTrackName.trim();
                          if (!clean) return;
                          updateMeta((prev) => ({
                            ...prev,
                            animations: {
                              ...prev.animations,
                              [clean]: { row: 0, frames: 4, fps: 10, loop: true },
                            },
                          }));
                          setActiveTrackName(clean);
                          setNewTrackName("");
                        }}
                      >
                        Dodaj
                      </Button>
                    </div>

                    {activeTrack && (
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-black/40 border border-stone-800">
                        <Input
                          label="Wiersz"
                          type="number"
                          min={0}
                          value={String(activeTrack.row)}
                          onChange={(e) =>
                            updateMeta((prev) => ({
                              ...prev,
                              animations: {
                                ...prev.animations,
                                [activeTrackName]: {
                                  ...prev.animations[activeTrackName],
                                  row: Math.max(0, Number(e.target.value) || 0),
                                },
                              },
                            }))
                          }
                        />
                        <Input
                          label="Klatki"
                          type="number"
                          min={1}
                          value={String(activeTrack.frames)}
                          onChange={(e) =>
                            updateMeta((prev) => ({
                              ...prev,
                              animations: {
                                ...prev.animations,
                                [activeTrackName]: {
                                  ...prev.animations[activeTrackName],
                                  frames: Math.max(1, Number(e.target.value) || 1),
                                },
                              },
                            }))
                          }
                        />
                        <div className="flex flex-col justify-between">
                          <Label>Pętla (Loop)</Label>
                          <div className="flex items-center justify-between pt-1">
                            <Switch
                              checked={activeTrack.loop}
                              onCheckedChange={(loop) =>
                                updateMeta((prev) => ({
                                  ...prev,
                                  animations: {
                                    ...prev.animations,
                                    [activeTrackName]: {
                                      ...prev.animations[activeTrackName],
                                      loop,
                                    },
                                  },
                                }))
                              }
                            />
                            {Object.keys(meta.animations).length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<Trash2 size={12} />}
                                className="px-2"
                                aria-label="Usuń ścieżkę"
                                onClick={() => {
                                  updateMeta((prev) => {
                                    const copy = { ...prev.animations };
                                    delete copy[activeTrackName];
                                    return { ...prev, animations: copy };
                                  });
                                  const remaining = Object.keys(meta.animations).filter(
                                    (k) => k !== activeTrackName
                                  );
                                  setActiveTrackName(remaining[0] ?? "idle");
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 3: BACKGROUND & CHROMA KEY ALPHA BAKER */}
              {inspectorTab === "chroma" && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={
                        meta.backgroundConfig.mode === "transparent" ? "primary" : "secondary"
                      }
                      onClick={() =>
                        updateMeta((prev) => ({
                          ...prev,
                          backgroundConfig: { ...prev.backgroundConfig, mode: "transparent" },
                        }))
                      }
                      className="whitespace-nowrap shrink-0 px-3"
                    >
                      Przezroczyste (Alpha)
                    </Button>
                    <Button
                      size="sm"
                      variant={meta.backgroundConfig.mode === "color" ? "primary" : "secondary"}
                      onClick={() =>
                        updateMeta((prev) => ({
                          ...prev,
                          backgroundConfig: { ...prev.backgroundConfig, mode: "color" },
                        }))
                      }
                      className="whitespace-nowrap shrink-0 px-3"
                    >
                      Kluczowanie kolorem (Chroma)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Wand2 size={13} />}
                      onClick={handleAutoDetectBackground}
                      className="whitespace-nowrap shrink-0 px-3"
                    >
                      Auto-wykryj tło
                    </Button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Kolor tła do usunięcia (użyj też Pipety na canvasie)</Label>
                    <ColorPickerInput
                      value={meta.backgroundConfig.colorHex ?? "#ff00ff"}
                      onChange={(hex) =>
                        updateMeta((prev) => ({
                          ...prev,
                          backgroundConfig: {
                            ...prev.backgroundConfig,
                            mode: "color",
                            colorHex: hex,
                          },
                        }))
                      }
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {CHROMA_COLOR_PRESETS.map((sw) => (
                        <Button
                          key={sw.hex}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            updateMeta((prev) => ({
                              ...prev,
                              backgroundConfig: {
                                ...prev.backgroundConfig,
                                mode: "color",
                                colorHex: sw.hex,
                              },
                            }));
                            setShowChromaPreview(true);
                          }}
                          className="whitespace-nowrap shrink-0 px-2.5 text-[11px]"
                        >
                          {sw.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Slider
                    label="Tolerancja koloru"
                    min={0}
                    max={60}
                    step={1}
                    unit="%"
                    value={meta.backgroundConfig.tolerance ?? 18}
                    onChange={(tolerance) =>
                      updateMeta((prev) => ({
                        ...prev,
                        backgroundConfig: { ...prev.backgroundConfig, tolerance },
                      }))
                    }
                  />

                  <Slider
                    label="Wygładzanie krawędzi (Feather)"
                    min={0}
                    max={25}
                    step={1}
                    unit="%"
                    value={chromaFeather}
                    onChange={setChromaFeather}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showChromaPreview}
                        onCheckedChange={setShowChromaPreview}
                      />
                      <Text size="xs">Podgląd wyciętego tła na żywo</Text>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Download size={13} />}
                      onClick={handleBakeCleanPng}
                      className="whitespace-nowrap shrink-0 px-3"
                    >
                      Wypal czyste PNG (Alpha)
                    </Button>
                  </div>
                </>
              )}

              {/* TAB 4: JSON EXPORT & VALIDATION */}
              {inspectorTab === "json" && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {jsonError ? (
                      <Badge variant="red" icon={<AlertTriangle size={12} />}>
                        Błąd składni JSON
                      </Badge>
                    ) : (
                      <Badge variant="green" icon={<CheckCircle2 size={12} />}>
                        Poprawny meta.json
                      </Badge>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Copy size={12} />}
                        className="whitespace-nowrap shrink-0 px-2.5"
                        onClick={() => {
                          navigator.clipboard?.writeText(jsonDraft);
                          flashStatus("Skopiowano meta.json do schowka.");
                        }}
                      >
                        Kopiuj
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Download size={12} />}
                        className="whitespace-nowrap shrink-0 px-2.5"
                        onClick={() =>
                          triggerJsonTextDownload(
                            jsonDraft,
                            `${activePreset?.id ?? "atlas"}_meta.json`
                          )
                        }
                      >
                        Pobierz JSON
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<RotateCcw size={12} />}
                        className="whitespace-nowrap shrink-0 px-2.5"
                        onClick={() => activePreset && handleSelectPreset(activePreset.id)}
                      >
                        Resetuj
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={jsonDraft}
                    rows={14}
                    className="font-mono text-[11px]"
                    onChange={(e) => {
                      const nextTxt = e.target.value;
                      setJsonDraft(nextTxt);
                      try {
                        const parsed = JSON.parse(nextTxt) as EditableMetaDoc;
                        if (parsed && parsed.atlas) {
                          setMeta(parsed);
                          setJsonError(null);
                        } else {
                          setJsonError("Brak wymaganej sekcji 'atlas'.");
                        }
                      } catch (err) {
                        setJsonError(
                          err instanceof Error ? err.message : "Niepoprawny JSON"
                        );
                      }
                    }}
                  />
                  {jsonError && <Alert variant="danger" title={jsonError} />}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* COLLAPSIBLE SLICER EVENT LOG STRIP */}
      <Card variant="subtle">
        <CardContent className="p-2.5 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ScrollText size={14} className="text-amber-400" />
              <Text size="xs" weight="semibold">
                Dziennik AtlasSlicing ({slicerLogs.length})
              </Text>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setLogStripOpen((v) => !v)}
                className="whitespace-nowrap shrink-0 px-2.5"
              >
                {logStripOpen ? "Zwiń logi" : "Rozwiń logi"}
              </Button>
              {onOpenLogs && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onOpenLogs}
                  className="whitespace-nowrap shrink-0 px-2.5"
                >
                  Pełny Strumień Logów
                </Button>
              )}
            </div>
          </div>
          {logStripOpen && (
            <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1 rounded-lg bg-black/50 p-2 border border-stone-800">
              {slicerLogs.length === 0 ? (
                <Text size="2xs" variant="muted">
                  Brak zarejestrowanych zdarzeń AtlasSlicing.
                </Text>
              ) : (
                slicerLogs
                  .slice()
                  .reverse()
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center gap-2 text-[11px] font-mono text-stone-300"
                    >
                      <Badge variant="stone">{rec.level}</Badge>
                      <span className="truncate">{rec.message}</span>
                    </div>
                  ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

AtlasSlicerSubtab.displayName = "AtlasSlicerSubtab";
export default AtlasSlicerSubtab;
