import React from "react";
import { Plus, Check, Split, Box, X } from "lucide-react";
import { Button, ActionBar, IconButton } from "@ui";
import { useI18n } from "@context/I18nContext";
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
    <ActionBar
      variant="banner"
      bordered={false}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex-nowrap items-center gap-2 p-1.5 shadow-2xl shadow-black animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <span className="text-[11px] font-mono text-amber-300 font-bold px-2 border-r border-stone-800 shrink-0">
        {t("atlasStudioSelectionSize")}: {Math.round(activeSelection.width)}×{Math.round(activeSelection.height)}px
      </span>

      {onCreateTrackFromSelection && (
        <Button
          size="sm"
          variant="primary"
          icon={<Plus size={12} />}
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
          className="h-7 px-2.5 text-xs font-bold shadow"
        >
          {t("atlasStudioCreateTrackFromSelection")}
        </Button>
      )}

      {onAssignSelectionToActiveTrack && selectedTrackName && (
        <Button
          size="sm"
          variant="secondary"
          icon={<Check size={12} className="text-emerald-400" />}
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
          className="h-7 px-2.5 text-xs font-bold"
        >
          {t("atlasStudioAssignSelection")}
        </Button>
      )}

      {onMergeSelectionAsWide && gridConfig && (
        <Button
          size="sm"
          variant="secondary"
          icon={<Split size={12} className="text-cyan-400" />}
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
          className="h-7 px-2.5 text-xs font-bold"
        >
          {t("atlasStudioMergeWide")}
        </Button>
      )}

      {onAddFreeformFrame && (
        <Button
          size="sm"
          variant="danger"
          icon={<Box size={12} className="text-rose-400" />}
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
          className="h-7 px-2.5 text-xs font-bold"
        >
          {t("atlasStudioAddFreeformFrame")}
        </Button>
      )}

      <IconButton
        size="xs"
        variant="ghost"
        onClick={onClose}
        aria-label={t("atlasStudioCloseSelection")}
        tooltipContent={t("atlasStudioCloseSelection")}
        icon={<X size={14} />}
      />
    </ActionBar>
  );
};

export default AtlasSelectionFloatingAction;
