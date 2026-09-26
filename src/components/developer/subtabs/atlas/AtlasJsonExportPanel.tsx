import React, { useState, useMemo } from "react";
import {
  FileCode,
  Copy,
  Download,
  Check,
  AlertTriangle,
  RotateCcw,
  Code,
  Sliders,
} from "lucide-react";
import { Button, Badge } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  AtlasOriginDefinition,
  AtlasMetaDoc,
} from "./types";

export interface AtlasJsonExportPanelProps {
  metaDoc: AtlasMetaDoc;
  gridConfig: AtlasGridConfig;
  tracks: AtlasAnimationTrackDefinition[];
  origin: AtlasOriginDefinition;
  assetId: string;
  onMetaDocChange: (doc: AtlasMetaDoc) => void;
  onResetDefaults: () => void;
}

export const AtlasJsonExportPanel: React.FC<AtlasJsonExportPanelProps> = ({
  metaDoc,
  gridConfig,
  tracks,
  origin,
  assetId,
  onMetaDocChange,
  onResetDefaults,
}) => {
  const { t } = useI18n();

  const [editorMode, setEditorMode] = useState<"formatted" | "raw">("formatted");
  const [copied, setCopied] = useState<boolean>(false);
  const [rawText, setRawText] = useState<string>("");
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  // Generate current unified JSON object
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
      slicing: metaDoc.slicing || {
        method: "by_count",
        grid: {
          columns: gridConfig.columns,
          rows: gridConfig.rows,
          spacing: gridConfig.spacing,
          safeMargin: gridConfig.safeMargin,
          cellWidth: gridConfig.cellWidth,
          cellHeight: gridConfig.cellHeight,
        },
      },
      backgroundConfig: metaDoc.backgroundConfig || {
        mode: "transparent",
      },
      atlas: {
        ...metaDoc.atlas,
        columns: gridConfig.columns,
        rows: gridConfig.rows,
        spacing: gridConfig.spacing,
        safeMargin: gridConfig.safeMargin,
        cellWidth: gridConfig.cellWidth,
        cellHeight: gridConfig.cellHeight,
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

  // Sync formatted rawText
  React.useEffect(() => {
    setRawText(JSON.stringify(fullMetaJson, null, 2));
    setSyntaxError(null);
  }, [fullMetaJson]);

  // Validation Warnings
  const validationIssues = useMemo(() => {
    const issues: string[] = [];

    if (gridConfig.columns <= 0 || gridConfig.rows <= 0) {
      issues.push(t("atlasStudioWarnColsRows"));
    }
    if (gridConfig.cellWidth <= 0 || gridConfig.cellHeight <= 0) {
      issues.push(t("atlasStudioWarnCellSize"));
    }

    tracks.forEach((tr) => {
      if (tr.row >= gridConfig.rows) {
        issues.push(
          `${t("atlasStudioWarnRowExceeds")}: '${tr.name}' (row ${tr.row} >= ${gridConfig.rows})`
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
          `${t("atlasStudioWarnColsExceeds")}: '${tr.name}' (${totalCols} > ${gridConfig.columns})`
        );
      }
    });

    return issues;
  }, [gridConfig, tracks, t]);

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy json", err);
    }
  };

  // Download JSON file
  const handleDownloadJson = () => {
    const blob = new Blob([rawText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assetId}_meta.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle raw editing
  const handleRawChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawText(text);
    try {
      const parsed = JSON.parse(text);
      setSyntaxError(null);
      onMetaDocChange(parsed);
    } catch (err: any) {
      setSyntaxError(err.message || "Invalid JSON syntax");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header Bar with Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-stone-200">
            {t("atlasStudioMetaEditorTitle")}
          </span>
          <Badge variant={validationIssues.length === 0 ? "green" : "amber"}>
            {validationIssues.length === 0
              ? t("atlasStudioValidationValid")
              : `${validationIssues.length} ${t("atlasStudioValidationWarning")}`}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Mode Switcher */}
          <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-stone-800">
            <button
              onClick={() => setEditorMode("formatted")}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                editorMode === "formatted"
                  ? "bg-amber-600 text-white"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Code size={11} /> View
            </button>
            <button
              onClick={() => setEditorMode("raw")}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                editorMode === "raw"
                  ? "bg-amber-600 text-white"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Sliders size={11} /> Edit
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyJson}
            className="h-6 text-[11px] px-2"
          >
            {copied ? (
              <>
                <Check size={11} className="mr-1 text-emerald-400" />
                {t("atlasStudioJsonCopied")}
              </>
            ) : (
              <>
                <Copy size={11} className="mr-1" />
                {t("atlasStudioCopyJson")}
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleDownloadJson}
            className="h-6 text-[11px] px-2"
          >
            <Download size={11} className="mr-1" />
            {t("atlasStudioDownloadJson")}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onResetDefaults}
            title={t("atlasStudioResetDefaults")}
            className="h-6 text-[11px] px-1.5"
          >
            <RotateCcw size={11} />
          </Button>
        </div>
      </div>

      {/* Validation Alert */}
      {validationIssues.length > 0 && (
        <div className="flex flex-col gap-1 p-2 bg-amber-950/40 border border-amber-600/50 rounded-lg text-xs text-amber-300">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={13} className="text-amber-400" />
            <span>{t("atlasStudioValidationWarning")}:</span>
          </div>
          <ul className="list-disc pl-5 text-[10px] text-amber-200/90 font-mono space-y-0.5">
            {validationIssues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Syntax Error Alert */}
      {syntaxError && (
        <div className="p-2 bg-rose-950/50 border border-rose-600 rounded-lg text-rose-300 text-xs font-mono">
          Syntax Error: {syntaxError}
        </div>
      )}

      {/* JSON Viewer / Editor Textarea */}
      <div className="relative">
        <textarea
          readOnly={editorMode === "formatted"}
          value={rawText}
          onChange={handleRawChange}
          rows={14}
          className={`w-full bg-[#0a0503] font-mono text-[11px] p-2.5 rounded-xl border leading-relaxed custom-scrollbar transition-all ${
            editorMode === "raw"
              ? "border-amber-600/60 text-amber-200 focus:outline-none focus:border-amber-400"
              : "border-stone-800 text-stone-300 select-text"
          }`}
          spellCheck={false}
        />
      </div>
    </div>
  );
};
