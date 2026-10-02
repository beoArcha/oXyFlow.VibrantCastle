import React from "react";
import { Play, Pause, ArrowLeftRight } from "lucide-react";
import { Button, Tooltip, PlaybackSpeedScaleControl } from "@components/ui";
import { AnimationName } from "@game/engine/spriteTypes";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface CharacterStageControlsProps {
  activeAction: AnimationName;
  onActionChange: (action: AnimationName) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  flipHorizontal: boolean;
  onToggleFlip: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  className?: string;
}

const ANIMATION_OPTIONS: Array<{ id: AnimationName; labelKey: string }> = [
  { id: "idle", labelKey: "animIdle" },
  { id: "run", labelKey: "animRun" },
  { id: "jump", labelKey: "animJump" },
  { id: "fall", labelKey: "animFall" },
  { id: "attack", labelKey: "animAttack" },
  { id: "dash", labelKey: "animDash" },
  { id: "cast", labelKey: "animCast" },
  { id: "crouch", labelKey: "animCrouch" },
];

const SPEED_OPTIONS = [0.5, 1.0, 1.5];
const SCALE_OPTIONS = [1.0, 1.5, 2.0, 2.5];

/**
 * Control bar for character animations, playback speed, scale, and direction.
 * Composes Button, Tooltip, and semantic UI primitives.
 */
export const CharacterStageControls: React.FC<CharacterStageControlsProps> = React.memo(({
  activeAction,
  onActionChange,
  isPlaying,
  onTogglePlay,
  flipHorizontal,
  onToggleFlip,
  playbackSpeed,
  onSpeedChange,
  scale,
  onScaleChange,
  className,
}) => {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 bg-[#140602] p-2.5 rounded-xl border border-[#5c2d18]/40",
        className
      )}
    >
      {/* Animation Action Selector */}
      <div className="flex flex-wrap items-center gap-1">
        {ANIMATION_OPTIONS.map(({ id, labelKey }) => (
          <Button
            key={id}
            size="sm"
            variant={activeAction === id ? "primary" : "secondary"}
            onClick={() => onActionChange(id)}
            className={cn(
              "px-2.5 py-1 text-[11px] h-7 min-h-0",
              activeAction === id && "ring-1 ring-amber-400/40"
            )}
          >
            {t(labelKey)}
          </Button>
        ))}
      </div>

      {/* Stage Controls: Play/Pause, Flip, Speed, Scale */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Play/Pause */}
        <Tooltip content={isPlaying ? t("studioPause") : t("studioPlay")}>
          <Button
            size="sm"
            variant={isPlaying ? "primary" : "secondary"}
            onClick={onTogglePlay}
            leftIcon={isPlaying ? <Pause size={12} /> : <Play size={12} />}
            className="h-7 px-2 text-[10px] min-h-0"
            aria-label={isPlaying ? t("studioPause") : t("studioPlay")}
          >
            <span className="text-[10px] hidden sm:inline">
              {isPlaying ? t("studioPause") : t("studioPlay")}
            </span>
          </Button>
        </Tooltip>

        {/* Flip Direction L/R */}
        <Tooltip content={t("studioFlipTitle")}>
          <Button
            size="sm"
            variant={flipHorizontal ? "primary" : "secondary"}
            onClick={onToggleFlip}
            leftIcon={<ArrowLeftRight size={12} />}
            className="h-7 px-2 text-[10px] min-h-0"
            aria-label={t("studioFlipTitle")}
          >
            <span className="text-[10px]">{flipHorizontal ? "L" : "R"}</span>
          </Button>
        </Tooltip>

        {/* Speed & Scale / Zoom Selector */}
        <PlaybackSpeedScaleControl
          speed={playbackSpeed}
          onSpeedChange={onSpeedChange}
          scale={scale}
          onScaleChange={onScaleChange}
          speedOptions={SPEED_OPTIONS}
          scaleOptions={SCALE_OPTIONS}
        />
      </div>
    </div>
  );
});

CharacterStageControls.displayName = "CharacterStageControls";

export default CharacterStageControls;
