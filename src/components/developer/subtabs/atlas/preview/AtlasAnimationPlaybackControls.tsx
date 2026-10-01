import React from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Crosshair,
  ArrowLeftRight,
  Minus,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useI18n } from "@context/I18nContext";

export interface AtlasAnimationPlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  loop: boolean;
  onToggleLoop: () => void;
  flipX: boolean;
  onToggleFlipX: () => void;
  showGroundLine: boolean;
  onToggleGroundLine: () => void;
  showPivot: boolean;
  onTogglePivot: () => void;
  onionSkinning: boolean;
  onToggleOnionSkinning: () => void;
  onStepPrev: () => void;
  onStepNext: () => void;
}

export const AtlasAnimationPlaybackControls: React.FC<AtlasAnimationPlaybackControlsProps> = React.memo(({
  isPlaying,
  onTogglePlay,
  loop,
  onToggleLoop,
  flipX,
  onToggleFlipX,
  showGroundLine,
  onToggleGroundLine,
  showPivot,
  onTogglePivot,
  onionSkinning,
  onToggleOnionSkinning,
  onStepPrev,
  onStepNext,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      {/* Play/Pause & Step Buttons */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={isPlaying ? "secondary" : "primary"}
          onClick={onTogglePlay}
          className="h-7 px-2.5 text-xs font-bold"
        >
          {isPlaying ? (
            <>
              <Pause size={12} className="mr-1" /> {t("atlasStudioPause")}
            </>
          ) : (
            <>
              <Play size={12} className="mr-1" /> {t("atlasStudioPlay")}
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onStepPrev}
          title={t("atlasStudioStepPrev")}
          className="h-7 px-1.5"
        >
          <ChevronLeft size={15} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onStepNext}
          title={t("atlasStudioStepNext")}
          className="h-7 px-1.5"
        >
          <ChevronRight size={15} />
        </Button>

        <Button
          size="sm"
          variant={loop ? "primary" : "secondary"}
          onClick={onToggleLoop}
          title={t("atlasStudioLoop")}
          className="h-7 px-2 text-[11px]"
        >
          <Repeat size={11} className="mr-1" />
          {t("atlasStudioLoop")}
        </Button>
      </div>

      {/* Flip X, Ground Line, Pivot Toggles */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={flipX ? "primary" : "secondary"}
          onClick={onToggleFlipX}
          title={t("atlasStudioFlipX")}
          className="h-7 px-2 text-[11px]"
        >
          <ArrowLeftRight size={11} className="mr-1" />
          {t("atlasStudioFlipX")}
        </Button>

        <Button
          size="sm"
          variant={showGroundLine ? "primary" : "secondary"}
          onClick={onToggleGroundLine}
          title={t("atlasStudioGroundLine")}
          className="h-7 px-2 text-[11px]"
        >
          <Minus size={11} className="mr-1 text-amber-400" />
          {t("atlasStudioGroundLine")}
        </Button>

        <Button
          size="sm"
          variant={showPivot ? "primary" : "secondary"}
          onClick={onTogglePivot}
          title={t("atlasStudioAnchor")}
          className="h-7 px-2 text-[11px]"
        >
          <Crosshair size={11} className="mr-1 text-rose-400" />
          {t("atlasStudioPivotShort")}
        </Button>

        <Button
          size="sm"
          variant={onionSkinning ? "primary" : "secondary"}
          onClick={onToggleOnionSkinning}
          title={t("atlasStudioOnionSkinning")}
          className="h-7 px-2 text-[11px]"
        >
          <Layers size={11} className="mr-1 text-cyan-400" />
          {t("atlasStudioOnionSkinning")}
        </Button>
      </div>
    </div>
  );
});

AtlasAnimationPlaybackControls.displayName = "AtlasAnimationPlaybackControls";
