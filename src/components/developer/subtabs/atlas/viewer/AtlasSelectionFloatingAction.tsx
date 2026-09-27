import React from "react";
import { Plus, Check, Split, Box, X } from "lucide-react";
import { useI18n } from "@hooks/useI18n";
import { AtlasGridConfig } from "../types";

export interface AtlasSelectionFloatingActionProps {
  activeSelection: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  gridConfig?: AtlasGridConfig;
  selectedTrackName: string | null;
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
  onClose: () => void;
}

export const AtlasSelectionFloatingAction: React.FC<AtlasSelectionFloatingActionProps> = ({
  activeSelection,
  gridConfig,
  selectedTrackName,
  onCreateTrackFromSelection,
  onAssignSelectionToActiveTrack,
  onMergeSelectionAsWide,
  onAddFreeformFrame,
  onClose,
}) => {
  const { t } = useI18n();

  return (
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
            onClose();
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
            onClose();
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
            onClose();
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
            onClose();
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-500/50 text-rose-200 text-xs font-bold transition-all cursor-pointer"
        >
          <Box size={12} className="text-rose-400" />
          <span>{t("atlasStudioAddFreeformFrame")}</span>
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        className="p-1 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
        title="Zamknij zaznaczenie"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default AtlasSelectionFloatingAction;
