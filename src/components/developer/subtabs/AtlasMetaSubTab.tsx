import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Grid,
  Sparkles,
  Upload,
  User,
  Skull,
  Building,
  FileJson,
  Layers,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Card, CardHeader, CardTitle, Badge, Button } from "../../ui";
import { useI18n } from "../../../hooks/useI18n";
import {
  ATLAS_PRESETS,
  AtlasPresetItem,
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  AtlasOriginDefinition,
  AtlasMetaDoc,
  SelectedCellInfo,
  AtlasTextureViewer,
  AtlasInspectorDock,
  AtlasPresetSelector,
  AtlasStatusBar,
  defaultAtlasAssetRegistry,
  AtlasInspectorTabId,
  SlicerViewerTool,
  IAtlasSlicingConfig,
  IAtlasBackgroundConfig,
} from "./atlas";
import { LoggerManager } from "../../../lib/logger";
import { AssetError, ParserError, ErrorCode, GameBaseError } from "../../../lib/errors";

export interface AtlasMetaSubTabProps {
  onNavigateToLogs?: () => void;
}

export const AtlasMetaSubTab: React.FC<AtlasMetaSubTabProps> = ({ onNavigateToLogs }) => {
  const { t } = useI18n();
  const studioLogger = useMemo(() => LoggerManager.getInstance().getLogger("AtlasStudio"), []);

  // Selected Preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>("valen");
  const [, setCustomImageSrc] = useState<string | null>(null);

  // Diagnostics & Error Telemetry State
  const [errorState, setErrorState] = useState<GameBaseError | null>(null);
  const [sliceMetrics, setSliceMetrics] = useState<{
    frameCount: number;
    durationMs: number;
    textureWidth?: number;
    textureHeight?: number;
  }>({
    frameCount: 0,
    durationMs: 0,
  });

  const handleMetricsChange = useCallback(
    (metrics: {
      frameCount: number;
      durationMs: number;
      textureWidth?: number;
      textureHeight?: number;
    }) => {
      setSliceMetrics((prev) => {
        if (
          prev.frameCount === metrics.frameCount &&
          prev.textureWidth === metrics.textureWidth &&
          prev.textureHeight === metrics.textureHeight &&
          Math.abs(prev.durationMs - metrics.durationMs) < 0.5
        ) {
          return prev;
        }
        return metrics;
      });
    },
    []
  );

  const handleErrorChange = useCallback((err: GameBaseError | null) => {
    setErrorState(err);
  }, []);

  // Active preset item
  const activePreset = useMemo(() => {
    return (
      ATLAS_PRESETS.find((p) => p.id === selectedPresetId) || ATLAS_PRESETS[0]
    );
  }, [selectedPresetId]);

  // Working state
  const [metaDoc, setMetaDoc] = useState<AtlasMetaDoc>(activePreset.defaultMeta);
  const [imageSrc, setImageSrc] = useState<string>(activePreset.imageSrc);

  const [gridConfig, setGridConfig] = useState<AtlasGridConfig>({
    columns: activePreset.defaultMeta.atlas?.columns || 12,
    rows: activePreset.defaultMeta.atlas?.rows || 8,
    spacing: activePreset.defaultMeta.atlas?.spacing || 0,
    safeMargin: activePreset.defaultMeta.atlas?.safeMargin || 0,
    cellWidth:
      activePreset.defaultMeta.variants?.high?.cellWidth ||
      activePreset.defaultMeta.atlas?.cellWidth ||
      128,
    cellHeight:
      activePreset.defaultMeta.variants?.high?.cellHeight ||
      activePreset.defaultMeta.atlas?.cellHeight ||
      128,
  });

  const [tracks, setTracks] = useState<AtlasAnimationTrackDefinition[]>([]);
  const [origin, setOrigin] = useState<AtlasOriginDefinition>({
    type: "feet",
    normalized: { x: 0.5, y: 1.0 },
  });

  const [selectedTrackName, setSelectedTrackName] = useState<string | null>(null);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(0);
  const [, setSelectedCellInfo] = useState<SelectedCellInfo | null>(null);

  // Studio Dock & Tool State
  const [activeInspectorTab, setActiveInspectorTab] = useState<AtlasInspectorTabId>("preview");
  const [viewerTool, setViewerTool] = useState<SlicerViewerTool>("select");
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  // Helper to parse tracks from a metaDoc
  const parseTracksFromMeta = useCallback((doc: AtlasMetaDoc) => {
    const list: AtlasAnimationTrackDefinition[] = [];
    if (doc.animations) {
      Object.entries(doc.animations).forEach(([name, data]: [string, any]) => {
        if (data && typeof data === "object" && data.row !== undefined) {
          list.push({
            name,
            row: data.row ?? 0,
            frames: data.frames ?? 1,
            fps: data.fps ?? 8,
            loop: data.loop !== undefined ? data.loop : true,
            wide: data.wide,
            slotSpan: data.slotSpan,
            cells: data.cells,
            frameIndices: data.frameIndices,
          });
        }
      });
    }

    // Structure format (layout with rows)
    if (list.length === 0 && doc.layout) {
      Object.entries(doc.layout).forEach(([name, data]: [string, any]) => {
        if (typeof data === "object" && data.row !== undefined) {
          const animInfo = doc.animations?.[name] || {};
          list.push({
            name,
            row: data.row,
            frames: data.frames ?? 1,
            fps: animInfo.fps ?? 8,
            loop: animInfo.loop !== undefined ? animInfo.loop : true,
            slotSpan: data.widthCells ? Array(data.frames).fill(data.widthCells) : undefined,
          });
        }
      });
    }

    return list;
  }, []);

  // Sync state when switching presets
  const applyPreset = useCallback(
    (preset: AtlasPresetItem) => {
      setSelectedPresetId(preset.id);
      setImageSrc(preset.imageSrc);
      setMetaDoc(preset.defaultMeta);
      setErrorState(null);

      studioLogger.info(`Loaded atlas preset: ${preset.name} [${preset.id}]`, {
        presetId: preset.id,
        category: preset.category,
      });

      const parsedGrid: AtlasGridConfig = {
        columns: preset.defaultMeta.atlas?.columns || 12,
        rows: preset.defaultMeta.atlas?.rows || 8,
        spacing: preset.defaultMeta.atlas?.spacing || 0,
        safeMargin: preset.defaultMeta.atlas?.safeMargin || 0,
        cellWidth:
          preset.defaultMeta.variants?.high?.cellWidth ||
          preset.defaultMeta.atlas?.cellWidth ||
          128,
        cellHeight:
          preset.defaultMeta.variants?.high?.cellHeight ||
          preset.defaultMeta.atlas?.cellHeight ||
          128,
      };
      setGridConfig(parsedGrid);

      let parsedTracks = parseTracksFromMeta(preset.defaultMeta);
      if (parsedTracks.length === 0) {
        parsedTracks = [
          {
            name: "idle",
            row: 0,
            frames: Math.min(4, parsedGrid.columns),
            fps: 8,
            loop: true,
          },
        ];
      }
      setTracks(parsedTracks);
      setSelectedTrackName(parsedTracks[0]?.name || null);
      setSelectedFrameIndex(0);

      const parsedOrigin: AtlasOriginDefinition = {
        type: preset.defaultMeta.layout?.origin?.type || "feet",
        normalized:
          preset.defaultMeta.layout?.origin?.normalized ||
          preset.defaultMeta.anchor || { x: 0.5, y: 1.0 },
      };
      setOrigin(parsedOrigin);
    },
    [parseTracksFromMeta]
  );

  // Initialize on mount
  useEffect(() => {
    applyPreset(activePreset);
  }, []);

  // Reset current preset to original
  const handleResetDefaults = () => {
    applyPreset(activePreset);
  };

  // Custom texture file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        const err = new AssetError(
          `Invalid graphic file type: ${file.type || file.name}`,
          ErrorCode.ASSET_CORRUPTED,
          { details: { fileName: file.name, fileType: file.type } }
        );
        studioLogger.error(err.message, { code: err.code, details: err.details });
        setErrorState(err);
        return;
      }

      const url = URL.createObjectURL(file);
      setCustomImageSrc(url);
      setImageSrc(url);
      setErrorState(null);
      studioLogger.info(
        `Loaded custom image texture: ${file.name} (${Math.round(file.size / 1024)} KB)`,
        { fileName: file.name, size: file.size }
      );
    }
  };

  // Custom JSON file upload
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (!content || !content.trim()) {
            throw new Error("JSON file is empty");
          }
          const parsed = JSON.parse(content);
          if (!parsed || typeof parsed !== "object") {
            throw new Error("Invalid JSON document structure");
          }

          setMetaDoc(parsed);
          setErrorState(null);
          studioLogger.info(
            `Successfully parsed and loaded JSON configuration: ${file.name}`,
            { fileName: file.name, size: file.size }
          );

          if (parsed.atlas) {
            setGridConfig({
              columns: parsed.atlas.columns ?? gridConfig.columns,
              rows: parsed.atlas.rows ?? gridConfig.rows,
              spacing: parsed.atlas.spacing ?? gridConfig.spacing,
              safeMargin: parsed.atlas.safeMargin ?? gridConfig.safeMargin,
              cellWidth:
                parsed.variants?.high?.cellWidth ??
                parsed.atlas?.cellWidth ??
                gridConfig.cellWidth,
              cellHeight:
                parsed.variants?.high?.cellHeight ??
                parsed.atlas?.cellHeight ??
                gridConfig.cellHeight,
            });
          }
          let parsedTracks = parseTracksFromMeta(parsed);
          if (parsedTracks.length === 0) {
            parsedTracks = [
              {
                name: "default",
                row: 0,
                frames: 4,
                fps: 8,
                loop: true,
              },
            ];
          }
          setTracks(parsedTracks);
          setSelectedTrackName(parsedTracks[0].name);
          setSelectedFrameIndex(0);
        } catch (err: any) {
          const parseError = new ParserError(
            `Failed to parse meta JSON file: ${err?.message || "Unknown error"}`,
            ErrorCode.PARSER_INVALID_FORMAT,
            { details: { fileName: file.name }, cause: err }
          );
          studioLogger.error(parseError.message, {
            code: parseError.code,
            details: parseError.details,
          });
          setErrorState(parseError);
        }
      };
      reader.onerror = () => {
        const readError = new ParserError(
          `Failed to read file from disk: ${file.name}`,
          ErrorCode.PARSER_INVALID_FORMAT,
          { details: { fileName: file.name } }
        );
        studioLogger.error(readError.message, { code: readError.code });
        setErrorState(readError);
      };
      reader.readAsText(file);
    }
  };

  // Interactive Slicer & Marquee Action Handlers
  const handleCreateTrackFromSelection = useCallback(
    (sel: {
      x: number;
      y: number;
      width: number;
      height: number;
      row?: number;
      framesCount?: number;
    }) => {
      const newName = `anim_${tracks.length + 1}`;
      const row =
        sel.row !== undefined ? sel.row : Math.min(gridConfig.rows - 1, tracks.length);
      const frames = Math.max(
        1,
        Math.round(sel.width / Math.max(1, gridConfig.cellWidth))
      );
      const newTrack: AtlasAnimationTrackDefinition = {
        name: newName,
        row,
        frames,
        fps: 8,
        loop: true,
      };
      setTracks((prev) => [...prev, newTrack]);
      setSelectedTrackName(newName);
      setSelectedFrameIndex(0);
      setActiveInspectorTab("slicing");
    },
    [tracks.length, gridConfig]
  );

  const handleAssignSelectionToActiveTrack = useCallback(
    (sel: {
      x: number;
      y: number;
      width: number;
      height: number;
      row?: number;
    }) => {
      if (!selectedTrackName) return;
      const frames = Math.max(
        1,
        Math.round(sel.width / Math.max(1, gridConfig.cellWidth))
      );
      const row = sel.row !== undefined ? sel.row : 0;
      setTracks((prev) =>
        prev.map((tr) =>
          tr.name === selectedTrackName ? { ...tr, row, frames } : tr
        )
      );
    },
    [selectedTrackName, gridConfig]
  );

  const handleMergeSelectionAsWide = useCallback(
    (sel: {
      x: number;
      y: number;
      width: number;
      height: number;
      span: number;
    }) => {
      if (!selectedTrackName) return;
      setTracks((prev) =>
        prev.map((tr) => {
          if (tr.name !== selectedTrackName) return tr;
          const targetFrame = selectedFrameIndex ?? 0;
          const spans = tr.slotSpan ? [...tr.slotSpan] : Array(tr.frames).fill(1);
          if (targetFrame < spans.length) {
            spans[targetFrame] = sel.span;
          }
          return {
            ...tr,
            wide: true,
            slotSpan: spans,
          };
        })
      );
      setActiveInspectorTab("slicing");
    },
    [selectedTrackName, selectedFrameIndex]
  );

  const handleSampleBackgroundColor = useCallback((hex: string) => {
    setMetaDoc((prev) => ({
      ...prev,
      backgroundConfig: {
        mode: "color",
        colorHex: hex,
        tolerance: prev.backgroundConfig?.tolerance ?? 15,
        removeAtRuntime: prev.backgroundConfig?.removeAtRuntime ?? true,
      },
    }));
    setActiveInspectorTab("background");
  }, []);

  const handleSlicingConfigChange = useCallback((config: IAtlasSlicingConfig) => {
    setMetaDoc((prev) => ({
      ...prev,
      slicing: config,
    }));
  }, []);

  const handleBackgroundConfigChange = useCallback((config: IAtlasBackgroundConfig) => {
    setMetaDoc((prev) => ({
      ...prev,
      backgroundConfig: config,
    }));
  }, []);

  return (
    <div
      id="subtab-content-atlas-slicer"
      className="flex flex-col gap-3 animate-in fade-in duration-150"
    >
      {/* 1. Header Toolbar: Searchable Atlas Selector & File Buttons */}
      <Card variant="default">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CardTitle icon={<Grid className="w-4 h-4 text-amber-400" />}>
                {t("subtabAtlasSlicer")}
              </CardTitle>
              <Badge variant="amber">Studio v3 Pro</Badge>
            </div>

            {/* Dynamic Searchable Preset Selector (OCP & KISS) */}
            <AtlasPresetSelector
              selectedPresetId={selectedPresetId}
              onSelectPreset={(presetId) => {
                const resolved = defaultAtlasAssetRegistry.resolveAsset(presetId);
                if (resolved) {
                  applyPreset({
                    id: resolved.id,
                    name: resolved.name,
                    category: resolved.category,
                    imageSrc: resolved.imageSrc,
                    defaultMeta: resolved.defaultMeta,
                  });
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Custom Texture Upload Button */}
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 hover:bg-[#1f0d06] text-stone-300 hover:text-amber-200 border border-stone-800 hover:border-amber-700 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
              <Upload size={12} />
              <span>{t("atlasStudioUploadImage")}</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {/* Custom JSON Upload Button */}
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 hover:bg-[#1f0d06] text-stone-300 hover:text-amber-200 border border-stone-800 hover:border-amber-700 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
              <FileJson size={12} />
              <span>{t("atlasStudioLoadJsonFile")}</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleJsonUpload}
                className="hidden"
              />
            </label>

            {/* Reset Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetDefaults}
              title={t("atlasStudioResetDefaults")}
              className="h-8 px-2.5"
            >
              <RotateCcw size={13} />
            </Button>

            {/* Toggle Inspector Button */}
            <Button
              size="sm"
              variant={isInspectorOpen ? "secondary" : "primary"}
              onClick={() => setIsInspectorOpen((prev) => !prev)}
              title={
                isInspectorOpen
                  ? t("atlasStudioCollapseInspector")
                  : t("atlasStudioExpandInspector")
              }
              className="h-8 px-2.5 flex items-center gap-1.5"
            >
              {isInspectorOpen ? (
                <PanelRightClose size={13} />
              ) : (
                <PanelRightOpen size={13} />
              )}
              <span className="hidden sm:inline text-xs font-semibold">
                {isInspectorOpen
                  ? t("atlasStudioCollapseInspector")
                  : t("atlasStudioExpandInspector")}
              </span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 2. Unified Studio Workbench (Collapsible 2-Column Split: Viewport / Inspector Dock) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Column: Texture & Grid Slicer Viewport (12 cols when inspector closed, 7-8 cols when open) */}
        <div
          className={`${
            isInspectorOpen ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"
          } flex flex-col transition-all duration-200`}
        >
          <AtlasTextureViewer
            imageSrc={imageSrc}
            gridConfig={gridConfig}
            tracks={tracks}
            slicingConfig={metaDoc.slicing}
            backgroundConfig={metaDoc.backgroundConfig}
            metaDoc={metaDoc}
            selectedTrackName={selectedTrackName}
            selectedFrameIndex={selectedFrameIndex}
            externalTool={viewerTool}
            onToolChange={(tool) => setViewerTool(tool)}
            onError={handleErrorChange}
            onMetricsChange={handleMetricsChange}
            onSelectCell={(info) => {
              setSelectedCellInfo(info);
              if (info.trackName) {
                setSelectedTrackName(info.trackName);
              }
              if (info.frameIndex !== undefined) {
                setSelectedFrameIndex(info.frameIndex);
              }
            }}
            onSelectTrack={(trackName) => {
              setSelectedTrackName(trackName);
              setSelectedFrameIndex(0);
            }}
            onSelectFrame={(frameIdx) => setSelectedFrameIndex(frameIdx)}
            onSampleBackgroundColor={handleSampleBackgroundColor}
            onCreateTrackFromSelection={handleCreateTrackFromSelection}
            onAssignSelectionToActiveTrack={handleAssignSelectionToActiveTrack}
            onMergeSelectionAsWide={handleMergeSelectionAsWide}
          />
        </div>

        {/* Right Column: Docked Inspector (collapsible) */}
        {isInspectorOpen && (
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col animate-in fade-in duration-150">
            <AtlasInspectorDock
              activeTab={activeInspectorTab}
              onTabChange={setActiveInspectorTab}
              imageSrc={imageSrc}
              assetId={activePreset.id}
              metaDoc={metaDoc}
              gridConfig={gridConfig}
              tracks={tracks}
              selectedTrackName={selectedTrackName}
              selectedFrameIndex={selectedFrameIndex}
              origin={origin}
              backgroundConfig={metaDoc.backgroundConfig}
              slicingConfig={metaDoc.slicing}
              onGridConfigChange={setGridConfig}
              onTracksChange={setTracks}
              onSelectTrack={(name) => {
                setSelectedTrackName(name);
                setSelectedFrameIndex(0);
              }}
              onSelectFrame={(frameIdx) => setSelectedFrameIndex(frameIdx)}
              onOriginChange={setOrigin}
              onBackgroundConfigChange={handleBackgroundConfigChange}
              onSlicingConfigChange={handleSlicingConfigChange}
              onMetaDocChange={setMetaDoc}
              onResetDefaults={handleResetDefaults}
              onRequestEyedropper={() => {
                setViewerTool("eyedropper");
              }}
            />
          </div>
        )}
      </div>

      {/* 3. Studio Telemetry & Status Bar */}
      <AtlasStatusBar
        assetId={activePreset.id}
        assetName={activePreset.name}
        category={activePreset.category}
        slicingMethod={metaDoc.slicing?.method || "by_count"}
        frameCount={sliceMetrics.frameCount}
        textureWidth={sliceMetrics.textureWidth}
        textureHeight={sliceMetrics.textureHeight}
        durationMs={sliceMetrics.durationMs}
        error={errorState}
        onClearError={() => setErrorState(null)}
        onNavigateToLogs={onNavigateToLogs}
      />
    </div>
  );
};

export default AtlasMetaSubTab;
