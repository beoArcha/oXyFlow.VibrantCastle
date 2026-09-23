import React, { useState, useMemo } from "react";
import {
  FileCode,
  Copy,
  Download,
  Check,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Code,
  Sliders,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  AtlasOriginDefinition,
  AtlasMetaDoc,
} from "./types";

export interface AtlasMetaEditorProps {
  metaDoc: AtlasMetaDoc;
  gridConfig: AtlasGridConfig;
  tracks: AtlasAnimationTrackDefinition[];
  origin: AtlasOriginDefinition;
  assetId: string;
  onGridConfigChange: (grid: AtlasGridConfig) => void;
  onTracksChange: (tracks: AtlasAnimationTrackDefinition[]) => void;
  onOriginChange: (origin: AtlasOriginDefinition) => void;
  onMetaDocChange: (doc: AtlasMetaDoc) => void;
  onResetDefaults: () => void;
}

export const AtlasMetaEditor: React.FC<AtlasMetaEditorProps> = ({
  metaDoc,
  gridConfig,
  tracks,
  origin,
  assetId,
  onGridConfigChange,
  onTracksChange,
  onOriginChange,
  onMetaDocChange,
  onResetDefaults,
}) => {
  const { t } = useI18n();
  const [editorMode, setEditorMode] = useState<"form" | "json">("form");
  const [copied, setCopied] = useState<boolean>(false);
  const [jsonText, setJsonText] = useState<string>("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Generate current JSON object from components
  const fullMetaJson = useMemo(() => {
    const animMap: Record<string, any> = {};
    tracks.forEach((track) => {
      animMap[track.name] = {
        row: track.row,
        frames: track.frames,
        fps: track.fps,
        loop: track.loop,
        ...(track.wide ? { wide: true } : {}),
        ...(track.slotSpan ? { slotSpan: track.slotSpan } : {}),
        ...(track.cells ? { cells: track.cells } : {}),
        ...(track.frameIndices ? { frameIndices: track.frameIndices } : {}),
      };
    });

    const doc: AtlasMetaDoc = {
      ...metaDoc,
      characterId: metaDoc.characterId || assetId,
      atlas: {
        ...metaDoc.atlas,
        columns: gridConfig.columns,
        rows: gridConfig.rows,
        spacing: gridConfig.spacing,
        safeMargin: gridConfig.safeMargin,
      },
      variants: {
        ...metaDoc.variants,
        high: {
          cellWidth: gridConfig.cellWidth,
          cellHeight: gridConfig.cellHeight,
          scale: metaDoc.variants?.high?.scale ?? 1.5,
        },
      },
      animations: animMap,
      layout: {
        ...metaDoc.layout,
        origin: {
          type: origin.type || "feet",
          normalized: origin.normalized,
        },
      },
    };

    return doc;
  }, [metaDoc, gridConfig, tracks, origin, assetId]);

  // Sync formatted JSON text
  React.useEffect(() => {
    setJsonText(JSON.stringify(fullMetaJson, null, 2));
    setJsonError(null);
  }, [fullMetaJson]);

  // Validation Warnings
  const validationIssues = useMemo(() => {
    const issues: string[] = [];

    if (gridConfig.columns <= 0 || gridConfig.rows <= 0) {
      issues.push("Columns and rows must be greater than 0");
    }
    if (gridConfig.cellWidth <= 0 || gridConfig.cellHeight <= 0) {
      issues.push("Cell dimensions must be greater than 0px");
    }

    tracks.forEach((tr) => {
      if (tr.row >= gridConfig.rows) {
        issues.push(
          `Track '${tr.name}' row (${tr.row}) exceeds atlas rows count (${gridConfig.rows})`
        );
      }

      let totalCols = 0;
      if (tr.slotSpan) {
        totalCols = tr.slotSpan.reduce((sum, val) => sum + val, 0);
      } else if (tr.cells) {
        totalCols = tr.cells.reduce((sum, val) => sum + val, 0);
      } else {
        totalCols = tr.frames;
      }

      if (totalCols > gridConfig.columns) {
        issues.push(
          `Track '${tr.name}' spans ${totalCols} cells, exceeding atlas columns (${gridConfig.columns})`
        );
      }
    });

    return issues;
  }, [gridConfig, tracks]);

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy json", err);
    }
  };

  // Download JSON file
  const handleDownloadJson = () => {
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assetId}_meta.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Parse JSON change in textarea
  const handleJsonTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      onMetaDocChange(parsed);

      if (parsed.atlas) {
        onGridConfigChange({
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

      if (parsed.animations) {
        const newTracks: AtlasAnimationTrackDefinition[] = Object.entries(
          parsed.animations
        ).map(([name, data]: [string, any]) => ({
          name,
          row: data.row ?? 0,
          frames: data.frames ?? 1,
          fps: data.fps ?? 8,
          loop: data.loop !== undefined ? data.loop : true,
          wide: data.wide,
          slotSpan: data.slotSpan,
          cells: data.cells,
          frameIndices: data.frameIndices,
        }));
        onTracksChange(newTracks);
      }

      if (parsed.layout?.origin) {
        onOriginChange({
          type: parsed.layout.origin.type || "feet",
          normalized: parsed.layout.origin.normalized || { x: 0.5, y: 1.0 },
        });
      }
    } catch (err: any) {
      setJsonError(err.message || "Invalid JSON syntax");
    }
  };

  // Add new animation track
  const handleAddTrack = () => {
    const newTrackName = `anim_${tracks.length + 1}`;
    const nextRow = Math.min(gridConfig.rows - 1, tracks.length);
    onTracksChange([
      ...tracks,
      {
        name: newTrackName,
        row: nextRow,
        frames: 4,
        fps: 8,
        loop: true,
      },
    ]);
  };

  // Remove animation track
  const handleRemoveTrack = (trackName: string) => {
    if (tracks.length <= 1) return;
    onTracksChange(tracks.filter((t) => t.name !== trackName));
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

  return (
    <Card variant="default" className="flex flex-col flex-1">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle icon={<FileCode className="w-4 h-4 text-emerald-400" />}>
            {t("atlasStudioMetaEditorTitle")}
          </CardTitle>
          <Badge variant={validationIssues.length === 0 ? "green" : "amber"}>
            {validationIssues.length === 0
              ? t("atlasStudioValidationValid")
              : `${validationIssues.length} warnings`}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-stone-800">
            <button
              onClick={() => setEditorMode("form")}
              className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                editorMode === "form"
                  ? "bg-amber-600 text-white"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Sliders size={12} /> Form
            </button>
            <button
              onClick={() => setEditorMode("json")}
              className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                editorMode === "json"
                  ? "bg-amber-600 text-white"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Code size={12} /> JSON
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyJson}
            className="h-7 text-xs px-2.5"
          >
            {copied ? (
              <>
                <Check size={12} className="mr-1 text-emerald-400" />
                {t("atlasStudioJsonCopied")}
              </>
            ) : (
              <>
                <Copy size={12} className="mr-1" />
                {t("atlasStudioCopyJson")}
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleDownloadJson}
            className="h-7 text-xs px-2.5"
          >
            <Download size={12} className="mr-1" />
            {t("atlasStudioDownloadJson")}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onResetDefaults}
            title={t("atlasStudioResetDefaults")}
            className="h-7 text-xs px-2"
          >
            <RotateCcw size={12} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-3">
        {/* Validation Issues Alert */}
        {validationIssues.length > 0 && (
          <div className="flex flex-col gap-1 p-2 bg-amber-950/40 border border-amber-600/50 rounded-lg text-xs text-amber-300">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle size={14} className="text-amber-400" />
              <span>{t("atlasStudioValidationWarning")}:</span>
            </div>
            <ul className="list-disc pl-5 text-[11px] text-amber-200/90 font-mono space-y-0.5">
              {validationIssues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {editorMode === "form" ? (
          <div className="flex flex-col gap-3">
            {/* Grid & Dimensions Form */}
            <div className="p-3 bg-[#120603] rounded-xl border border-stone-800 flex flex-col gap-2">
              <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                {t("atlasViewerTitle")} (Grid)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">
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
                  <label className="text-[10px] text-stone-400 block mb-1">
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
                  <label className="text-[10px] text-stone-400 block mb-1">
                    {t("atlasStudioCellWidth")}
                  </label>
                  <input
                    type="number"
                    value={gridConfig.cellWidth}
                    min={8}
                    max={1024}
                    step={4}
                    onChange={(e) =>
                      onGridConfigChange({
                        ...gridConfig,
                        cellWidth: parseInt(e.target.value) || 64,
                      })
                    }
                    className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-amber-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">
                    {t("atlasStudioCellHeight")}
                  </label>
                  <input
                    type="number"
                    value={gridConfig.cellHeight}
                    min={8}
                    max={1024}
                    step={4}
                    onChange={(e) =>
                      onGridConfigChange({
                        ...gridConfig,
                        cellHeight: parseInt(e.target.value) || 64,
                      })
                    }
                    className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-amber-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">
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
                  <label className="text-[10px] text-stone-400 block mb-1">
                    {t("atlasStudioSafeMargin")}
                  </label>
                  <input
                    type="number"
                    value={gridConfig.safeMargin}
                    min={0}
                    max={32}
                    onChange={(e) =>
                      onGridConfigChange({
                        ...gridConfig,
                        safeMargin: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Animation Tracks Form Table */}
            <div className="p-3 bg-[#120603] rounded-xl border border-stone-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
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

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] text-stone-400 uppercase bg-[#0c0402] border-b border-stone-800">
                    <tr>
                      <th className="py-1.5 px-2">{t("atlasStudioTrackName")}</th>
                      <th className="py-1.5 px-2">{t("atlasStudioTrackRow")}</th>
                      <th className="py-1.5 px-2">{t("atlasStudioTrackFrames")}</th>
                      <th className="py-1.5 px-2">{t("atlasStudioTrackFps")}</th>
                      <th className="py-1.5 px-2">{t("atlasStudioLoop")}</th>
                      <th className="py-1.5 px-2">SlotSpan</th>
                      <th className="py-1.5 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-900">
                    {tracks.map((track, idx) => (
                      <tr key={track.name} className="hover:bg-black/40">
                        <td className="py-1 px-2 font-bold text-amber-200">
                          <input
                            type="text"
                            value={track.name}
                            onChange={(e) =>
                              handleUpdateTrack(idx, "name", e.target.value)
                            }
                            className="w-24 bg-black/50 border border-stone-800 rounded px-1.5 py-0.5 text-xs text-amber-200"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="number"
                            value={track.row}
                            min={0}
                            max={gridConfig.rows - 1}
                            onChange={(e) =>
                              handleUpdateTrack(
                                idx,
                                "row",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-12 bg-black/50 border border-stone-800 rounded px-1.5 py-0.5 text-xs text-cyan-300"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="number"
                            value={track.frames}
                            min={1}
                            max={32}
                            onChange={(e) =>
                              handleUpdateTrack(
                                idx,
                                "frames",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-12 bg-black/50 border border-stone-800 rounded px-1.5 py-0.5 text-xs text-emerald-300"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="number"
                            value={track.fps}
                            min={1}
                            max={60}
                            onChange={(e) =>
                              handleUpdateTrack(
                                idx,
                                "fps",
                                parseInt(e.target.value) || 8
                              )
                            }
                            className="w-12 bg-black/50 border border-stone-800 rounded px-1.5 py-0.5 text-xs text-stone-200"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="checkbox"
                            checked={track.loop}
                            onChange={(e) =>
                              handleUpdateTrack(idx, "loop", e.target.checked)
                            }
                            className="rounded bg-black/50 border-stone-800 text-amber-500"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            placeholder="e.g. 1,1,2,1"
                            value={
                              track.slotSpan
                                ? track.slotSpan.join(",")
                                : track.cells
                                ? track.cells.join(",")
                                : ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val.trim()) {
                                handleUpdateTrack(idx, "slotSpan", undefined);
                              } else {
                                const parsed = val
                                  .split(",")
                                  .map((s) => parseInt(s.trim()))
                                  .filter((n) => !isNaN(n) && n > 0);
                                handleUpdateTrack(idx, "slotSpan", parsed);
                              }
                            }}
                            className="w-24 bg-black/50 border border-stone-800 rounded px-1.5 py-0.5 text-[11px] text-stone-300"
                          />
                        </td>
                        <td className="py-1 px-2 text-right">
                          <button
                            onClick={() => handleRemoveTrack(track.name)}
                            disabled={tracks.length <= 1}
                            className="text-stone-500 hover:text-rose-400 disabled:opacity-30 p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* JSON Raw Editor Mode */
          <div className="flex flex-col gap-2">
            {jsonError && (
              <div className="p-2 bg-rose-950/60 border border-rose-600 rounded text-xs text-rose-300 font-mono">
                {jsonError}
              </div>
            )}
            <textarea
              value={jsonText}
              onChange={handleJsonTextChange}
              rows={16}
              className="w-full bg-[#0a0402] text-amber-300 font-mono text-xs p-3 rounded-lg border border-stone-800 focus:outline-none focus:border-amber-500 custom-scrollbar leading-relaxed"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
