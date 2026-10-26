import React, { useMemo } from "react";
import { Layers, Plus, Copy, Trash2 } from "lucide-react";
import {
  Button,
  IconButton,
  Input,
  CompactNumberStepper,
  Tooltip,
  ConfirmDialog,
  Card,
  Text,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import { AtlasAnimationTrackDefinition } from "../types";
import { AtlasTrackSlotSpanEditor } from "./AtlasTrackSlotSpanEditor";

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
    <Card variant="subtle" className="p-2.5 gap-2">
      <div className="flex items-center justify-between gap-2">
        <Text as="span" size="2xs" weight="bold" uppercase className="text-stone-300 tracking-wider flex items-center gap-1.5">
          <Layers size={13} className="text-amber-400" />
          {t("atlasStudioToggleTracks")} ({tracks.length})
        </Text>

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
                "h-7 px-2.5 text-xs whitespace-nowrap",
                !isSelected && "bg-black/50 border-stone-800 text-stone-400 hover:text-stone-200"
              )}
            >
              <Text as="span" family="mono" size="xs" weight="bold">
                {tr.name} (r{tr.row})
              </Text>
            </Button>
          );
        })}
      </div>

      {/* Selected Track Editor */}
      {activeTrack && (
        <Card variant="dark" className="p-2 gap-2 mt-1">
          <div className="flex items-center justify-between gap-2">
            <Text as="span" family="mono" size="xs" weight="bold" className="text-amber-300">
              {activeTrack.name}
            </Text>
            <div className="flex items-center gap-1">
              <IconButton
                size="xs"
                variant="ghost"
                aria-label={t("atlasStudioDuplicateTrack") || "Duplicate track"}
                tooltipContent={t("atlasStudioDuplicateTrack")}
                onClick={() => handleDuplicateTrack(activeTrack)}
                className="text-stone-400 hover:text-stone-200"
                icon={<Copy size={12} />}
              />

              {tracks.length > 1 && (
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label={t("atlasStudioRemoveTrack") || "Remove track"}
                  tooltipContent={t("atlasStudioRemoveTrack")}
                  onClick={() => setTrackToDelete(activeTrack.name)}
                  className="text-rose-400 hover:text-rose-200 hover:bg-rose-950/40"
                  icon={<Trash2 size={12} />}
                />
              )}
            </div>
          </div>

          {/* Inputs: Name, Row, Frames, FPS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input
              family="mono"
              type="text"
              value={activeTrack.name}
              onChange={(e) =>
                handleUpdateTrack(activeTrackIndex, "name", e.target.value)
              }
              label={t("atlasStudioTrackName")}
              className="text-xs text-amber-200 py-1 px-2 h-7"
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
          <AtlasTrackSlotSpanEditor
            framesCount={activeTrack.frames}
            slotSpan={activeTrack.slotSpan}
            cells={activeTrack.cells}
            onAdjustSlotSpan={(fIdx, delta) => handleAdjustSlotSpan(activeTrackIndex, fIdx, delta)}
          />
        </Card>
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
    </Card>
  );
};

export default AtlasSlicingTracksManager;
