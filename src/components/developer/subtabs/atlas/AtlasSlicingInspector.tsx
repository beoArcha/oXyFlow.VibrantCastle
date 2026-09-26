import React from "react";
import {
  Grid,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Maximize2,
  Box,
  Copy,
} from "lucide-react";
import { Button, Badge } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  IAtlasSlicingConfig,
  SlicingMethod,
} from "./types";

export interface AtlasSlicingInspectorProps {
  slicingConfig?: IAtlasSlicingConfig;
  gridConfig: AtlasGridConfig;
  tracks: AtlasAnimationTrackDefinition[];
  selectedTrackName: string | null;
  onSlicingConfigChange: (config: IAtlasSlicingConfig) => void;
  onGridConfigChange: (grid: AtlasGridConfig) => void;
  onTracksChange: (tracks: AtlasAnimationTrackDefinition[]) => void;
  onSelectTrack: (trackName: string) => void;
}

export const AtlasSlicingInspector: React.FC<AtlasSlicingInspectorProps> = ({
  slicingConfig,
  gridConfig,
  tracks,
  selectedTrackName,
  onSlicingConfigChange,
  onGridConfigChange,
  onTracksChange,
  onSelectTrack,
}) => {
  const { t } = useI18n();

  const currentMethod: SlicingMethod = slicingConfig?.method || "by_count";

  // Change Slicing Strategy
  const handleMethodChange = (newMethod: SlicingMethod) => {
    const updated: IAtlasSlicingConfig = {
      ...slicingConfig,
      method: newMethod,
      grid:
        slicingConfig?.grid || {
          columns: gridConfig.columns,
          rows: gridConfig.rows,
          spacing: gridConfig.spacing,
          safeMargin: gridConfig.safeMargin,
          cellWidth: gridConfig.cellWidth,
          cellHeight: gridConfig.cellHeight,
        },
      cellSize:
        slicingConfig?.cellSize || {
          cellWidth: gridConfig.cellWidth,
          cellHeight: gridConfig.cellHeight,
          startX: 0,
          startY: 0,
          spacing: gridConfig.spacing,
          margin: gridConfig.safeMargin,
        },
      autoIslands:
        slicingConfig?.autoIslands || {
          minIslandPixels: 15,
          clusterYTolerance: 10,
        },
    };
    onSlicingConfigChange(updated);
  };

  // Add new animation track
  const handleAddTrack = () => {
    const newName = `anim_${tracks.length + 1}`;
    const nextRow = Math.min(gridConfig.rows - 1, tracks.length);
    const newTrack: AtlasAnimationTrackDefinition = {
      name: newName,
      row: nextRow,
      frames: 4,
      fps: 8,
      loop: true,
    };
    onTracksChange([...tracks, newTrack]);
    onSelectTrack(newName);
  };

  // Duplicate active track
  const handleDuplicateTrack = (tr: AtlasAnimationTrackDefinition) => {
    const newName = `${tr.name}_copy`;
    const newTrack: AtlasAnimationTrackDefinition = {
      ...tr,
      name: newName,
      row: Math.min(gridConfig.rows - 1, tr.row + 1),
      slotSpan: tr.slotSpan ? [...tr.slotSpan] : undefined,
    };
    onTracksChange([...tracks, newTrack]);
    onSelectTrack(newName);
  };

  // Remove track
  const handleRemoveTrack = (trackName: string) => {
    if (tracks.length <= 1) return;
    const remaining = tracks.filter((t) => t.name !== trackName);
    onTracksChange(remaining);
    if (selectedTrackName === trackName && remaining[0]) {
      onSelectTrack(remaining[0].name);
    }
  };

  // Update track property
  const handleUpdateTrack = (
    index: number,
    field: keyof AtlasAnimationTrackDefinition,
    value: any
  ) => {
    const updated = [...tracks];
    updated[index] = { ...updated[index], [field]: value };
    onTracksChange(updated);
  };

  // Adjust frame slotSpan (+1 or -1 cell)
  const handleAdjustSlotSpan = (trackIdx: number, frameIdx: number, delta: number) => {
    const track = tracks[trackIdx];
    if (!track) return;

    const currentSpans = track.slotSpan
      ? [...track.slotSpan]
      : Array(track.frames).fill(1);

    const oldVal = currentSpans[frameIdx] ?? 1;
    const newVal = Math.max(1, Math.min(8, oldVal + delta));
    currentSpans[frameIdx] = newVal;

    const hasWide = currentSpans.some((s) => s > 1);
    handleUpdateTrack(trackIdx, "slotSpan", currentSpans);
    handleUpdateTrack(trackIdx, "wide", hasWide);
  };

  const activeTrackIndex = tracks.findIndex((t) => t.name === selectedTrackName);
  const activeTrack = activeTrackIndex >= 0 ? tracks[activeTrackIndex] : tracks[0];

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Slicing Strategy Switcher */}
      <div className="p-2.5 bg-[#120603] rounded-xl border border-stone-800 flex flex-col gap-2">
        <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers size={13} className="text-amber-400" />
            {t("atlasStudioSlicingMethod")}
          </span>
          <Badge variant="amber">{currentMethod}</Badge>
        </span>

        {/* 4 Strategy Buttons */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            onClick={() => handleMethodChange("by_count")}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left font-bold transition-all ${
              currentMethod === "by_count"
                ? "bg-amber-600/30 border-amber-400 text-amber-200 shadow-sm shadow-amber-950/40"
                : "bg-black/50 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
            }`}
          >
            <Grid size={13} className="text-amber-400 flex-shrink-0" />
            <span className="text-[11px] truncate">{t("atlasStudioMethodByCount")}</span>
          </button>

          <button
            onClick={() => handleMethodChange("by_cell_size")}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left font-bold transition-all ${
              currentMethod === "by_cell_size"
                ? "bg-amber-600/30 border-amber-400 text-amber-200 shadow-sm shadow-amber-950/40"
                : "bg-black/50 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
            }`}
          >
            <Maximize2 size={13} className="text-cyan-400 flex-shrink-0" />
            <span className="text-[11px] truncate">{t("atlasStudioMethodByCellSize")}</span>
          </button>

          <button
            onClick={() => handleMethodChange("freeform_rects")}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left font-bold transition-all ${
              currentMethod === "freeform_rects"
                ? "bg-amber-600/30 border-amber-400 text-amber-200 shadow-sm shadow-amber-950/40"
                : "bg-black/50 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
            }`}
          >
            <Box size={13} className="text-rose-400 flex-shrink-0" />
            <span className="text-[11px] truncate">{t("atlasStudioMethodFreeform")}</span>
          </button>

          <button
            onClick={() => handleMethodChange("auto_islands")}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left font-bold transition-all ${
              currentMethod === "auto_islands"
                ? "bg-amber-600/30 border-amber-400 text-amber-200 shadow-sm shadow-amber-950/40"
                : "bg-black/50 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
            }`}
          >
            <Sparkles size={13} className="text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] truncate">{t("atlasStudioMethodAutoIslands")}</span>
          </button>
        </div>

        {/* Strategy Specific Parameters */}
        {currentMethod === "by_count" && (
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-800/80">
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">
                {t("atlasStudioGridCols")}
              </label>
              <input
                type="number"
                value={gridConfig.columns}
                min={1}
                max={64}
                onChange={(e) =>
                  onGridConfigChange({
                    ...gridConfig,
                    columns: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-amber-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">
                {t("atlasStudioGridRows")}
              </label>
              <input
                type="number"
                value={gridConfig.rows}
                min={1}
                max={64}
                onChange={(e) =>
                  onGridConfigChange({
                    ...gridConfig,
                    rows: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-amber-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">
                {t("atlasStudioSpacing")}
              </label>
              <input
                type="number"
                value={gridConfig.spacing}
                min={0}
                max={32}
                onChange={(e) =>
                  onGridConfigChange({
                    ...gridConfig,
                    spacing: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-amber-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">
                {t("atlasStudioCellWidth")}
              </label>
              <input
                type="number"
                value={gridConfig.cellWidth}
                min={16}
                max={1024}
                onChange={(e) =>
                  onGridConfigChange({
                    ...gridConfig,
                    cellWidth: parseInt(e.target.value) || 16,
                  })
                }
                className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-amber-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">
                {t("atlasStudioCellHeight")}
              </label>
              <input
                type="number"
                value={gridConfig.cellHeight}
                min={16}
                max={1024}
                onChange={(e) =>
                  onGridConfigChange({
                    ...gridConfig,
                    cellHeight: parseInt(e.target.value) || 16,
                  })
                }
                className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-amber-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">
                {t("atlasStudioSafeMargin")}
              </label>
              <input
                type="number"
                value={gridConfig.safeMargin}
                min={0}
                max={64}
                onChange={(e) =>
                  onGridConfigChange({
                    ...gridConfig,
                    safeMargin: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-amber-300 font-mono"
              />
            </div>
          </div>
        )}

        {currentMethod === "by_cell_size" && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-800/80">
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">
                {t("atlasStudioCellWidth")}
              </label>
              <input
                type="number"
                value={slicingConfig?.cellSize?.cellWidth ?? gridConfig.cellWidth}
                min={16}
                max={1024}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 16;
                  onGridConfigChange({ ...gridConfig, cellWidth: val });
                  onSlicingConfigChange({
                    ...slicingConfig,
                    method: "by_cell_size",
                    cellSize: {
                      ...(slicingConfig?.cellSize || {}),
                      cellWidth: val,
                      cellHeight: slicingConfig?.cellSize?.cellHeight ?? gridConfig.cellHeight,
                    },
                  });
                }}
                className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">
                {t("atlasStudioCellHeight")}
              </label>
              <input
                type="number"
                value={slicingConfig?.cellSize?.cellHeight ?? gridConfig.cellHeight}
                min={16}
                max={1024}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 16;
                  onGridConfigChange({ ...gridConfig, cellHeight: val });
                  onSlicingConfigChange({
                    ...slicingConfig,
                    method: "by_cell_size",
                    cellSize: {
                      ...(slicingConfig?.cellSize || {}),
                      cellWidth: slicingConfig?.cellSize?.cellWidth ?? gridConfig.cellWidth,
                      cellHeight: val,
                    },
                  });
                }}
                className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
              />
            </div>
          </div>
        )}

        {currentMethod === "auto_islands" && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-800/80">
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">
                {t("atlasStudioIslandMinPixels")}
              </label>
              <input
                type="number"
                value={slicingConfig?.autoIslands?.minIslandPixels ?? 15}
                min={2}
                max={500}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 15;
                  onSlicingConfigChange({
                    ...slicingConfig,
                    method: "auto_islands",
                    autoIslands: {
                      ...(slicingConfig?.autoIslands || {}),
                      minIslandPixels: val,
                    },
                  });
                }}
                className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-emerald-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">
                Cluster Y Tolerance (px)
              </label>
              <input
                type="number"
                value={slicingConfig?.autoIslands?.clusterYTolerance ?? 10}
                min={1}
                max={50}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 10;
                  onSlicingConfigChange({
                    ...slicingConfig,
                    method: "auto_islands",
                    autoIslands: {
                      ...(slicingConfig?.autoIslands || {}),
                      clusterYTolerance: val,
                    },
                  });
                }}
                className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-emerald-300 font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Tracks Header & Quick Selector */}
      <div className="p-2.5 bg-[#120603] rounded-xl border border-stone-800 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={13} className="text-amber-400" />
            {t("atlasStudioToggleTracks")} ({tracks.length})
          </span>

          <Button
            size="sm"
            variant="primary"
            onClick={handleAddTrack}
            className="h-6 text-[11px] px-2"
          >
            <Plus size={11} className="mr-1" />
            {t("atlasStudioAddTrack")}
          </Button>
        </div>

        {/* Tracks horizontal pill list */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-1">
          {tracks.map((tr) => (
            <button
              key={tr.name}
              onClick={() => onSelectTrack(tr.name)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border ${
                selectedTrackName === tr.name
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-400 shadow-sm shadow-amber-950/40"
                  : "bg-black/50 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700"
              }`}
            >
              {tr.name} (r{tr.row})
            </button>
          ))}
        </div>

        {/* Selected Track Editor */}
        {activeTrack && (
          <div className="p-2 bg-black/40 rounded-lg border border-stone-800/80 flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-300 font-mono">
                {activeTrack.name}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDuplicateTrack(activeTrack)}
                  title="Duplicate Track"
                  className="h-6 px-1.5 text-stone-400 hover:text-stone-200"
                >
                  <Copy size={12} />
                </Button>
                {tracks.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveTrack(activeTrack.name)}
                    title={t("atlasStudioRemoveTrack")}
                    className="h-6 px-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40"
                  >
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>
            </div>

            {/* Inputs: Name, Row, Frames, FPS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">
                  {t("atlasStudioTrackName")}
                </label>
                <input
                  type="text"
                  value={activeTrack.name}
                  onChange={(e) =>
                    handleUpdateTrack(activeTrackIndex, "name", e.target.value)
                  }
                  className="w-full bg-black/70 border border-stone-800 rounded px-2 py-1 text-xs text-amber-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">
                  {t("atlasStudioTrackRow")}
                </label>
                <input
                  type="number"
                  value={activeTrack.row}
                  min={0}
                  max={gridConfig.rows - 1}
                  onChange={(e) =>
                    handleUpdateTrack(
                      activeTrackIndex,
                      "row",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full bg-black/70 border border-stone-800 rounded px-2 py-1 text-xs text-amber-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">
                  {t("atlasStudioTrackFrames")}
                </label>
                <input
                  type="number"
                  value={activeTrack.frames}
                  min={1}
                  max={64}
                  onChange={(e) =>
                    handleUpdateTrack(
                      activeTrackIndex,
                      "frames",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="w-full bg-black/70 border border-stone-800 rounded px-2 py-1 text-xs text-amber-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">
                  {t("atlasStudioTrackFps")}
                </label>
                <input
                  type="number"
                  value={activeTrack.fps}
                  min={1}
                  max={60}
                  onChange={(e) =>
                    handleUpdateTrack(
                      activeTrackIndex,
                      "fps",
                      parseInt(e.target.value) || 8
                    )
                  }
                  className="w-full bg-black/70 border border-stone-800 rounded px-2 py-1 text-xs text-amber-200 font-mono"
                />
              </div>
            </div>

            {/* Visual slotSpan Frame Tiles Editor */}
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-stone-800/80">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{t("atlasStudioTrackSlotSpan")} (Frame Widths)</span>
                <span className="text-[9px] text-amber-400/90 font-normal">
                  Click + / - to resize cell spans
                </span>
              </span>

              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
                {Array.from({ length: activeTrack.frames }).map((_, fIdx) => {
                  const currentSpan =
                    activeTrack.slotSpan?.[fIdx] ?? activeTrack.cells?.[fIdx] ?? 1;

                  return (
                    <div
                      key={fIdx}
                      className={`flex flex-col items-center justify-between p-1.5 rounded-lg border text-center transition-all ${
                        currentSpan > 1
                          ? "bg-amber-950/40 border-amber-500/80 text-amber-300"
                          : "bg-black/60 border-stone-800 text-stone-300"
                      }`}
                      style={{ minWidth: `${Math.max(54, currentSpan * 32)}px` }}
                    >
                      <span className="text-[10px] font-mono text-stone-400">
                        #{fIdx}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-200">
                        {currentSpan}x
                      </span>

                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => handleAdjustSlotSpan(activeTrackIndex, fIdx, -1)}
                          disabled={currentSpan <= 1}
                          title={t("atlasStudioSubSlotSpan")}
                          className="w-4 h-4 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-[10px] font-bold"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleAdjustSlotSpan(activeTrackIndex, fIdx, 1)}
                          disabled={currentSpan >= 8}
                          title={t("atlasStudioAddSlotSpan")}
                          className="w-4 h-4 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-[10px] font-bold text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
