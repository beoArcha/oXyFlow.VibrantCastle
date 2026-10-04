import React from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import { Button, Badge, Select, ActionBar, Input } from "@ui";
import { useI18n } from "@context/I18nContext";
import { AtlasAnimationTrackDefinition } from "../types";

export interface AtlasSlicingTrackAssignmentBarProps {
  selectedFrameIds: string[];
  tracks: AtlasAnimationTrackDefinition[];
  newTrackName: string;
  onNewTrackNameChange: (val: string) => void;
  onAssignSelectedToTrack: (trackName: string) => void;
  onCreateTrackFromSelected: () => void;
  onClearSelection: () => void;
}

export const AtlasSlicingTrackAssignmentBar: React.FC<AtlasSlicingTrackAssignmentBarProps> = ({
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
    <ActionBar
      variant="banner"
      bordered={false}
      className="animate-in slide-in-from-top-1 duration-150"
      description={
        <div className="flex items-center gap-2">
          <Badge variant="amber">
            {selectedFrameIds.length} {t("atlasStudioFramesSelected")}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="h-6 px-1.5 text-stone-400 hover:text-stone-200 text-xs"
          >
            <X size={12} className="mr-1" />
            <span>{t("atlasStudioDeselectAll")}</span>
          </Button>
        </div>
      }
      actions={
        <>
          {/* Assign to existing track */}
          {tracks.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-300 font-medium">
                {t("atlasStudioAssignToTrack")}:
              </span>
              <Select
                size="sm"
                variant="castle"
                placeholder={t("atlasStudioSelectTrackPlaceholder")}
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onAssignSelectedToTrack(e.target.value);
                  }
                }}
                options={tracks.map((tr) => ({
                  value: tr.name,
                  label: tr.name,
                }))}
                className="font-mono text-xs w-36"
              />
            </div>
          )}

          {/* Or create new track */}
          <div className="flex items-center gap-1">
            <Input
              type="text"
              placeholder={t("atlasStudioNewTrackNamePlaceholder")}
              value={newTrackName}
              onChange={(e) => onNewTrackNameChange(e.target.value)}
              containerClassName="w-28"
              className="h-7 px-2 text-xs font-mono text-amber-200 bg-black/60 border-stone-800"
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
        </>
      }
    />
  );
};

export default AtlasSlicingTrackAssignmentBar;
