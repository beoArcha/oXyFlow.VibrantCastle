import React from "react";
import { AssetQuality } from "@game/types";
import { AnimationName } from "@game/engine/spriteTypes";
import { Badge } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { resolveCharacterProfileVM } from "@components/adapters";
import { cn } from "@lib/utils";
import { CharacterProvider } from "./CharacterContext";
import { CharacterPortrait } from "./CharacterPortrait";
import { CharacterSpritePreview } from "./CharacterSpritePreview";
import { CharacterStageControls } from "./CharacterStageControls";

export interface CharacterStageProps {
  characterId: string;
  mood?: string;
  quality: AssetQuality;
  scalingFilter?: string;
  activeAction?: AnimationName;
  onActionChange?: (action: AnimationName) => void;
  playbackSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  flipHorizontal?: boolean;
  onToggleFlip?: () => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  className?: string;
}

/**
 * Character animation stage featuring playback controls,
 * portrait overview, animated canvas viewport, and metadata telemetry tags.
 */
export const CharacterStage: React.FC<CharacterStageProps> = React.memo(({
  characterId,
  mood = "neutral",
  quality,
  scalingFilter = "pixelated",
  activeAction = "idle",
  onActionChange,
  playbackSpeed = 1.0,
  onSpeedChange,
  scale = 1.5,
  onScaleChange,
  flipHorizontal = false,
  onToggleFlip,
  isPlaying = true,
  onTogglePlay,
  className,
}) => {
  const { t } = useI18n();
  const profile = resolveCharacterProfileVM(characterId);

  const handleActionChange = onActionChange ?? (() => {});
  const handleSpeedChange = onSpeedChange ?? (() => {});
  const handleScaleChange = onScaleChange ?? (() => {});
  const handleToggleFlip = onToggleFlip ?? (() => {});
  const handleTogglePlay = onTogglePlay ?? (() => {});

  const accentColor = profile.accentColor;
  const classTitle = t(profile.classTitleKey);
  const classTags = t(profile.classTagsKey);

  return (
    <CharacterProvider
      characterId={characterId}
      mood={mood}
      quality={quality}
      accentColor={accentColor}
    >
      <div className={cn("flex flex-col gap-3", className)}>
        {/* Playback & Animation Controls */}
        <CharacterStageControls
          activeAction={activeAction}
          onActionChange={handleActionChange}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          flipHorizontal={flipHorizontal}
          onToggleFlip={handleToggleFlip}
          playbackSpeed={playbackSpeed}
          onSpeedChange={handleSpeedChange}
          scale={scale}
          onScaleChange={handleScaleChange}
        />

        {/* Character Stage & Portrait Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
          {/* Portrait Preview Card */}
          <div className="flex flex-col items-center justify-center gap-3 p-3.5 rounded-xl bg-black/60 border border-amber-900/40">
            <CharacterPortrait
              size="lg"
              variant="framed"
              className="w-28 h-28"
            />
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-bold text-amber-300 capitalize">{characterId}</span>
              <span className="text-[11px] font-mono text-stone-400">
                {classTitle}
              </span>
              <Badge variant="amber" className="mt-1 text-[9px]">
                {classTags}
              </Badge>
            </div>
          </div>

          {/* High-Resolution Animated Sprite Stage (Spacious, No Clipping) */}
          <div className="md:col-span-3 flex flex-col justify-between p-3.5 rounded-xl bg-black/60 border border-amber-900/40">
            <div className="w-full h-72 sm:h-80 relative overflow-hidden bg-[#0d0301] rounded-lg border border-stone-900 shadow-inner">
              <CharacterSpritePreview
                characterId={characterId}
                state={activeAction}
                playbackSpeed={isPlaying ? playbackSpeed : 0}
                scale={scale}
                flipHorizontal={flipHorizontal}
                className="w-full h-full"
              />
            </div>

            {/* Metadata Telemetry Bar */}
            <div className="flex flex-wrap items-center justify-between pt-2.5 px-1 text-[11px] text-stone-400 border-t border-stone-800/80 mt-2.5 gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="amber" className="capitalize font-mono">
                  {characterId} • {activeAction.toUpperCase()}
                </Badge>
                <Badge variant="stone" className="font-mono">
                  {playbackSpeed}x {t("speedLabel")}
                </Badge>
                <Badge variant="stone" className="font-mono">
                  {scale}x zoom
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="stone" className="font-mono">
                  {quality.toUpperCase()} TIER • {scalingFilter.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CharacterProvider>
  );
});

CharacterStage.displayName = "CharacterStage";

export default CharacterStage;
