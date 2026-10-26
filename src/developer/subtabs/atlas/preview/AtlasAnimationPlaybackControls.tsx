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
import { Button, ActionBar, Tooltip, KbdKey } from "@ui";
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
    <ActionBar
      variant="subtle"
      bordered={false}
      className="flex items-center justify-between gap-2 flex-wrap"
    >
      {/* Play/Pause & Step Buttons */}
      <div className="flex items-center gap-1">
        <Tooltip
          content={
            <div className="flex items-center gap-1.5">
              <span>{isPlaying ? t("atlasStudioPause") : t("atlasStudioPlay")}</span>
              <KbdKey variant="amber">Space</KbdKey>
            </div>
          }
        >
          <Button
            size="sm"
            variant={isPlaying ? "secondary" : "primary"}
            onClick={onTogglePlay}
            className="h-7 px-2.5 text-xs"
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
        </Tooltip>

        <Tooltip
          content={
            <div className="flex items-center gap-1.5">
              <span>{t("atlasStudioStepPrev")}</span>
              <KbdKey variant="amber">←</KbdKey>
            </div>
          }
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={onStepPrev}
            aria-label={t("atlasStudioStepPrev")}
            className="h-7 px-1.5"
          >
            <ChevronLeft size={15} />
          </Button>
        </Tooltip>

        <Tooltip
          content={
            <div className="flex items-center gap-1.5">
              <span>{t("atlasStudioStepNext")}</span>
              <KbdKey variant="amber">→</KbdKey>
            </div>
          }
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={onStepNext}
            aria-label={t("atlasStudioStepNext")}
            className="h-7 px-1.5"
          >
            <ChevronRight size={15} />
          </Button>
        </Tooltip>

        <Tooltip content={t("atlasStudioLoop")}>
          <Button
            size="sm"
            variant={loop ? "primary" : "secondary"}
            onClick={onToggleLoop}
            aria-label={t("atlasStudioLoop")}
            className="h-7 px-2 text-[11px]"
          >
            <Repeat size={11} className="mr-1" />
            {t("atlasStudioLoop")}
          </Button>
        </Tooltip>
      </div>

      {/* Flip X, Ground Line, Pivot Toggles */}
      <div className="flex items-center gap-1">
        <Tooltip content={t("atlasStudioFlipX")}>
          <Button
            size="sm"
            variant={flipX ? "primary" : "secondary"}
            onClick={onToggleFlipX}
            aria-label={t("atlasStudioFlipX")}
            className="h-7 px-2 text-[11px]"
          >
            <ArrowLeftRight size={11} className="mr-1" />
            {t("atlasStudioFlipX")}
          </Button>
        </Tooltip>

        <Tooltip content={t("atlasStudioGroundLine")}>
          <Button
            size="sm"
            variant={showGroundLine ? "primary" : "secondary"}
            onClick={onToggleGroundLine}
            aria-label={t("atlasStudioGroundLine")}
            className="h-7 px-2 text-[11px]"
          >
            <Minus size={11} className="mr-1 text-amber-400" />
            {t("atlasStudioGroundLine")}
          </Button>
        </Tooltip>

        <Tooltip content={t("atlasStudioAnchor")}>
          <Button
            size="sm"
            variant={showPivot ? "primary" : "secondary"}
            onClick={onTogglePivot}
            aria-label={t("atlasStudioAnchor")}
            className="h-7 px-2 text-[11px]"
          >
            <Crosshair size={11} className="mr-1 text-rose-400" />
            {t("atlasStudioPivotShort")}
          </Button>
        </Tooltip>

        <Tooltip content={t("atlasStudioOnionSkinning")}>
          <Button
            size="sm"
            variant={onionSkinning ? "primary" : "secondary"}
            onClick={onToggleOnionSkinning}
            aria-label={t("atlasStudioOnionSkinning")}
            className="h-7 px-2 text-[11px]"
          >
            <Layers size={11} className="mr-1 text-cyan-400" />
            {t("atlasStudioOnionSkinning")}
          </Button>
        </Tooltip>
      </div>
    </ActionBar>
  );
});

AtlasAnimationPlaybackControls.displayName = "AtlasAnimationPlaybackControls";

export default AtlasAnimationPlaybackControls;
