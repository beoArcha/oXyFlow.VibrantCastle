import React, { useMemo } from "react";
import { Layers, Plus, Copy, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  CompactNumberStepper,
  Tooltip,
  ConfirmDialog,
} from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import { AtlasAnimationTrackDefinition } from "../types";

export interface AtlasSlicingTracksManagerProps {
  tracks: AtlasAnimationTrackDefinition[];
  selectedTrackName: string | null;
  maxRows: number;
  onTracksChange: (tracks: AtlasAnimationTrackDefinition[]) => void;
  onSelectTrack: (name: string) => void;
}

export const AtlasSlicingTracksManager: React.FC<AtlasSlicingTracksManagerProps> = ({
  tracks,
  selectedTrackName,
  maxRows,
  onTracksChange,
  onSelectTrack,
}) => {
  const { t } = useI18n();

  const activeTrack = useMemo(
    () => tracks.find((tr) => tr.name === selectedTrackName) || tracks[0] || null,
    [tracks, selectedTrackName]
  );

  const activeTrackIndex = useMemo(
    () => (activeTrack ? tracks.findIndex((tr) => tr.name === activeTrack.name) : -1),
    [tracks, activeTrack]
  );

  const [trackToDelete, setTrackToDelete] = React.useState<string | null>(null);

  const handleAddTrack = () => {
    const nextRow = Math.min(maxRows - 1, tracks.length);
    const newTrack: AtlasAnimationTrackDefinition = {
      name: `anim_${tracks.length + 1}`,
      row: nextRow,
      frames: 4,
      fps: 8,
      loop: true,
    };
    onTracksChange([...tracks, newTrack]);
    onSelectTrack(newTrack.name);
  };

  const handleRemoveTrack = (name: string) => {
    if (tracks.length <= 1) return;
    const remaining = tracks.filter((tr) => tr.name !== name);
    onTracksChange(remaining);
    if (selectedTrackName === name) {
      onSelectTrack(remaining[0]?.name || "");
    }
  };

  const handleDuplicateTrack = (tr: AtlasAnimationTrackDefinition) => {
    const copy: AtlasAnimationTrackDefinition = {
      ...tr,
      name: `${tr.name}_copy`,
      slotSpan: tr.slotSpan ? [...tr.slotSpan] : undefined,
    };
    onTracksChange([...tracks, copy]);
    onSelectTrack(copy.name);
  };

  const handleUpdateTrack = <K extends keyof AtlasAnimationTrackDefinition>(
    index: number,
    field: K,
    value: AtlasAnimationTrackDefinition[K]
  ) => {
    if (index < 0 || index >= tracks.length) return;
    const updated = [...tracks];
    updated[index] = { ...updated[index], [field]: value };
    onTracksChange(updated);
  };

  const handleAdjustSlotSpan = (trackIdx: number, frameIdx: number, delta: number) => {
    if (trackIdx < 0 || trackIdx >= tracks.length) return;
    const tr = tracks[trackIdx];
    const spans = tr.slotSpan ? [...tr.slotSpan] : Array(tr.frames).fill(1);
    const current = spans[frameIdx] ?? 1;
    const nextVal = Math.max(1, Math.min(8, current + delta));
    spans[frameIdx] = nextVal;

    const hasWide = spans.some((s) => s > 1);
    const updated = [...tracks];
    updated[trackIdx] = {
      ...tr,
      slotSpan: spans,
      wide: hasWide,
    };
    onTracksChange(updated);
  };

  return (
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
        {tracks.map((tr) => {
          const isSelected = selectedTrackName === tr.name;
          return (
            <Button
              key={tr.name}
              size="sm"
              variant={isSelected ? "primary" : "secondary"}
              onClick={() => onSelectTrack(tr.name)}
              className={cn(
                "h-7 px-2.5 text-xs font-mono font-bold whitespace-nowrap",
                !isSelected && "bg-black/50 border-stone-800 text-stone-400 hover:text-stone-200"
              )}
            >
              {tr.name} (r{tr.row})
            </Button>
          );
        })}
      </div>

      {/* Selected Track Editor */}
      {activeTrack && (
        <div className="p-2 bg-black/40 rounded-lg border border-stone-800/80 flex flex-col gap-2 mt-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-300 font-mono">
              {activeTrack.name}
            </span>
            <div className="flex items-center gap-1">
              <Tooltip content={t("atlasStudioDuplicateTrack")}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDuplicateTrack(activeTrack)}
                  className="h-6 px-1.5 text-stone-400 hover:text-stone-200"
                >
                  <Copy size={12} />
                </Button>
              </Tooltip>

              {tracks.length > 1 && (
                <Tooltip content={t("atlasStudioRemoveTrack")}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTrackToDelete(activeTrack.name)}
                    className="h-6 px-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40"
                  >
                    <Trash2 size={12} />
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Inputs: Name, Row, Frames, FPS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input
              type="text"
              value={activeTrack.name}
              onChange={(e) =>
                handleUpdateTrack(activeTrackIndex, "name", e.target.value)
              }
              label={t("atlasStudioTrackName")}
              className="font-mono text-xs text-amber-200 py-1 px-2 h-7"
              containerClassName="gap-0.5"
            />

            <CompactNumberStepper
              value={activeTrack.row}
              min={0}
              max={maxRows - 1}
              onChange={(v) => handleUpdateTrack(activeTrackIndex, "row", v)}
              label={t("atlasStudioTrackRow")}
            />

            <CompactNumberStepper
              value={activeTrack.frames}
              min={1}
              max={64}
              onChange={(v) => handleUpdateTrack(activeTrackIndex, "frames", v)}
              label={t("atlasStudioTrackFrames")}
            />

            <CompactNumberStepper
              value={activeTrack.fps}
              min={1}
              max={60}
              unit="fps"
              onChange={(v) => handleUpdateTrack(activeTrackIndex, "fps", v)}
              label={t("atlasStudioTrackFps")}
            />
          </div>

          {/* Visual slotSpan Frame Tiles Editor */}
          <div className="flex flex-col gap-1.5 pt-1.5 border-t border-stone-800/80">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>{t("atlasStudioTrackSlotSpan")}</span>
              <span className="text-[9px] text-amber-400/90 font-normal">
                {t("atlasStudioResizeSpansHint")}
              </span>
            </span>

            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
              {Array.from({ length: activeTrack.frames }).map((_, fIdx) => {
                const currentSpan =
                  activeTrack.slotSpan?.[fIdx] ?? activeTrack.cells?.[fIdx] ?? 1;

                return (
                  <div
                    key={fIdx}
                    className={`flex flex-col items-center justify-between p-1.5 rounded-lg border text-center transition-all ${currentSpan > 1
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
                      <Tooltip content={t("atlasStudioSubSlotSpan")}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAdjustSlotSpan(activeTrackIndex, fIdx, -1)}
                          disabled={currentSpan <= 1}
                          className="w-4.5 h-4.5 min-h-0 p-0 text-[10px] font-bold bg-stone-800 border-stone-700 hover:bg-stone-700"
                          aria-label={t("atlasStudioSubSlotSpan")}
                        >
                          -
                        </Button>
                      </Tooltip>
                      <Tooltip content={t("atlasStudioAddSlotSpan")}>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleAdjustSlotSpan(activeTrackIndex, fIdx, 1)}
                          disabled={currentSpan >= 8}
                          className="w-4.5 h-4.5 min-h-0 p-0 text-[10px] font-bold"
                          aria-label={t("atlasStudioAddSlotSpan")}
                        >
                          +
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Dialog for Track Deletion */}
      <ConfirmDialog
        isOpen={trackToDelete !== null}
        onClose={() => setTrackToDelete(null)}
        onConfirm={() => {
          if (trackToDelete) {
            handleRemoveTrack(trackToDelete);
            setTrackToDelete(null);
          }
        }}
        title={t("atlasStudioRemoveTrack")}
        message={
          trackToDelete
            ? `${t("atlasStudioRemoveTrackConfirm") || "Are you sure you want to delete track"} "${trackToDelete}"?`
            : ""
        }
        confirmLabel={t("delete") || "Delete"}
        cancelLabel={t("cancel") || "Cancel"}
        confirmVariant="danger"
      />
    </div>
  );
};

export default AtlasSlicingTracksManager;
