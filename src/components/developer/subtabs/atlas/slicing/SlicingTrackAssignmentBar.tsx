import React from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import { Button, Badge } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { AtlasAnimationTrackDefinition } from "../types";

export interface SlicingTrackAssignmentBarProps {
  selectedFrameIds: string[];
  tracks: AtlasAnimationTrackDefinition[];
  newTrackName: string;
  onNewTrackNameChange: (val: string) => void;
  onAssignSelectedToTrack: (trackName: string) => void;
  onCreateTrackFromSelected: () => void;
  onClearSelection: () => void;
}

export const SlicingTrackAssignmentBar: React.FC<SlicingTrackAssignmentBarProps> = ({
  selectedFrameIds,
  tracks,
  newTrackName,
  onNewTrackNameChange,
  onAssignSelectedToTrack,
  onCreateTrackFromSelected,
  onClearSelection,
}) => {
  const { t } = useI18n();

  if (selectedFrameIds.length === 0) return null;

  return (
    <div className="p-2.5 bg-amber-950/40 rounded-xl border border-amber-600/50 flex flex-wrap items-center justify-between gap-2.5 animate-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-2">
        <Badge variant="amber">
          {selectedFrameIds.length} {t("atlasStudioFramesSelected")}
        </Badge>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1 cursor-pointer"
        >
          <X size={12} />
          <span>{t("atlasStudioDeselectAll")}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Assign to existing track */}
        {tracks.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-300 font-medium">
              {t("atlasStudioAssignToTrack")}:
            </span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onAssignSelectedToTrack(e.target.value);
                }
              }}
              defaultValue=""
              className="bg-black/60 border border-stone-800 text-stone-200 text-xs rounded px-2 py-1 outline-none focus:border-amber-500 font-mono cursor-pointer"
            >
              <option value="" disabled>
                {t("atlasStudioSelectTrackPlaceholder")}
              </option>
              {tracks.map((tr) => (
                <option key={tr.name} value={tr.name}>
                  {tr.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Or create new track */}
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder={t("atlasStudioNewTrackNamePlaceholder")}
            value={newTrackName}
            onChange={(e) => onNewTrackNameChange(e.target.value)}
            className="w-28 bg-black/60 border border-stone-800 rounded px-2 py-1 text-xs font-mono text-amber-200 outline-none focus:border-amber-500"
          />
          <Button
            size="sm"
            variant="primary"
            icon={<Plus size={12} />}
            onClick={onCreateTrackFromSelected}
            className="text-xs"
          >
            {t("atlasStudioCreateTrackBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SlicingTrackAssignmentBar;
