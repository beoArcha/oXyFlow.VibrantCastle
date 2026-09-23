import React, { useState } from "react";
import {
  Eye,
  Play,
  Pause,
  Layers,
  Film,
  ArrowLeftRight,
} from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "../../ui";
import { CharacterPortrait, CharacterSpritePreview, AtlasSheetViewer, CharacterProvider } from "../../character";
import { AnimationName } from "../../../game/engine/spriteTypes";
import { useSettings } from "../../../hooks/useGame";
import { useI18n } from "../../../hooks/useI18n";
import { useSpritePreviewState } from "../hooks/useSpritePreviewState";
import { cn } from "../../../lib/utils";

export const CharacterStudioSection: React.FC = () => {
  const { displaySettings } = useSettings();
  const { t } = useI18n();

  // Character preview state
  const {
    previewCharacter,
    previewMood,
    previewAction,
    setPreviewAction,
    previewSpeed,
    setPreviewSpeed,
    previewScale,
    setPreviewScale,
    selectCharacter,
  } = useSpritePreviewState();

  const [studioMode, setStudioMode] = useState<"stage" | "atlas">("stage");
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const animationOptions: Array<{ id: AnimationName; labelKey: string }> = [
    { id: "idle", labelKey: "animIdle" },
    { id: "run", labelKey: "animRun" },
    { id: "jump", labelKey: "animJump" },
    { id: "fall", labelKey: "animFall" },
    { id: "attack", labelKey: "animAttack" },
    { id: "dash", labelKey: "animDash" },
    { id: "cast", labelKey: "animCast" },
    { id: "crouch", labelKey: "animCrouch" },
  ];

  return (
    <Card variant="subtle">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <CardTitle icon={<Eye className="w-4 h-4 text-amber-400" />}>
              {t("studioTitle")}
            </CardTitle>
            {/* Studio View Mode Switcher */}
            <div className="flex items-center bg-black/60 p-1 rounded-lg border border-stone-800">
              <button
                type="button"
                onClick={() => setStudioMode("stage")}
                className={cn(
                  "px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                  studioMode === "stage"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-stone-400 hover:text-stone-200"
                )}
              >
                <Film size={13} />
                <span>{t("studioStageTab")}</span>
              </button>
              <button
                type="button"
                onClick={() => setStudioMode("atlas")}
                className={cn(
                  "px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                  studioMode === "atlas"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-stone-400 hover:text-stone-200"
                )}
              >
                <Layers size={13} />
                <span>{t("studioAtlasTab")}</span>
              </button>
            </div>
          </div>

          {/* Character Selector */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={previewCharacter === "valen" ? "primary" : "secondary"}
              onClick={() => selectCharacter("valen")}
              className="text-xs py-1 h-7"
            >
              Valen
            </Button>
            <Button
              size="sm"
              variant={previewCharacter === "aurelia" ? "primary" : "secondary"}
              onClick={() => selectCharacter("aurelia")}
              className="text-xs py-1 h-7"
            >
              Aurelia
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {studioMode === "stage" ? (
          <>
            {/* Controls Bar: Actions + Play/Pause + Flip + Speed + Zoom */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#140602] p-2.5 rounded-xl border border-[#5c2d18]/40">
              {/* Animation Action Selector */}
              <div className="flex flex-wrap items-center gap-1">
                {animationOptions.map(({ id, labelKey }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPreviewAction(id)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap",
                      previewAction === id
                        ? "bg-amber-600 text-white shadow-xs border border-amber-400 ring-1 ring-amber-400/40"
                        : "bg-stone-900/80 text-stone-400 hover:text-stone-200 border border-stone-800"
                    )}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>

              {/* Stage Controls: Play/Pause, Flip, Speed, Scale */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Play/Pause */}
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className={cn(
                    "p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1",
                    isPlaying
                      ? "bg-amber-950/70 border-amber-500 text-amber-300"
                      : "bg-stone-900 border-stone-700 text-stone-400 hover:text-stone-200"
                  )}
                  title={isPlaying ? t("studioPause") : t("studioPlay")}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                  <span className="text-[10px]">{isPlaying ? t("studioPause") : t("studioPlay")}</span>
                </button>

                {/* Flip Direction L/R */}
                <button
                  type="button"
                  onClick={() => setFlipHorizontal((f) => !f)}
                  className={cn(
                    "p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1",
                    flipHorizontal
                      ? "bg-amber-950/70 border-amber-500 text-amber-300"
                      : "bg-stone-900 border-stone-700 text-stone-400 hover:text-stone-200"
                  )}
                  title={t("studioFlipTitle")}
                >
                  <ArrowLeftRight size={12} />
                  <span className="text-[10px]">{flipHorizontal ? "L" : "P"}</span>
                </button>

                {/* Speed Selector */}
                <div className="flex items-center gap-1 bg-black/60 px-1.5 py-1 rounded-lg border border-stone-800">
                  <span className="text-[9px] text-stone-400 font-mono">Spd:</span>
                  {[0.5, 1.0, 1.5].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPreviewSpeed(spd)}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer transition-all",
                        previewSpeed === spd
                          ? "bg-amber-500 text-stone-950 font-bold"
                          : "text-stone-400 hover:text-stone-200"
                      )}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Scale / Zoom Selector */}
                <div className="flex items-center gap-1 bg-black/60 px-1.5 py-1 rounded-lg border border-stone-800">
                  <span className="text-[9px] text-stone-400 font-mono">Zoom:</span>
                  {[1.0, 1.5, 2.0, 2.5].map((scl) => (
                    <button
                      key={scl}
                      type="button"
                      onClick={() => setPreviewScale(scl)}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer transition-all",
                        previewScale === scl
                          ? "bg-amber-500 text-stone-950 font-bold"
                          : "text-stone-400 hover:text-stone-200"
                      )}
                    >
                      {scl}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Character Stage & Portrait */}
            <CharacterProvider
              characterId={previewCharacter}
              mood={previewMood}
              quality={displaySettings.assetQuality}
              accentColor={previewCharacter === "aurelia" ? "#06b6d4" : "#d97706"}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
                {/* Portrait Preview Card */}
                <div className="flex flex-col items-center justify-center gap-3 p-3.5 rounded-xl bg-black/60 border border-amber-900/40">
                  <div className="w-28 h-28 rounded-xl overflow-hidden border border-amber-500/40 shadow-lg bg-[#140602]">
                    <CharacterPortrait className="w-full h-full" />
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="text-sm font-bold text-amber-300 capitalize">{previewCharacter}</span>
                    <span className="text-[11px] font-mono text-stone-400">
                      {previewCharacter === "valen"
                        ? t("valenClassTitle")
                        : t("aureliaClassTitle")}
                    </span>
                    <span className="text-[10px] text-amber-400/80 font-mono mt-1">
                      {previewCharacter === "valen" ? t("valenClassTags") : t("aureliaClassTags")}
                    </span>
                  </div>
                </div>

                {/* High-Resolution Animated Sprite Stage (Spacious, No Clipping) */}
                <div className="md:col-span-3 flex flex-col justify-between p-3.5 rounded-xl bg-black/60 border border-amber-900/40">
                  <div className="w-full h-72 sm:h-80 relative overflow-hidden bg-[#0d0301] rounded-lg border border-stone-900 shadow-inner">
                    <CharacterSpritePreview
                      characterId={previewCharacter}
                      state={previewAction}
                      playbackSpeed={isPlaying ? previewSpeed : 0}
                      scale={previewScale}
                      flipHorizontal={flipHorizontal}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between pt-2.5 px-1 text-[11px] text-stone-400 border-t border-stone-800/80 mt-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-300 font-bold capitalize">
                        {previewCharacter} • {previewAction.toUpperCase()}
                      </span>
                      <span className="text-stone-500">•</span>
                      <span className="font-mono text-stone-400">
                        {previewSpeed}x {t("speedLabel")}
                      </span>
                      <span className="text-stone-500">•</span>
                      <span className="font-mono text-stone-400">
                        {previewScale}x zoom
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-stone-500">
                        {displaySettings.assetQuality.toUpperCase()} TIER • {displaySettings.scalingFilter.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CharacterProvider>
          </>
        ) : (
          /* Full Atlas Spritesheet Grid Inspection Mode */
          <AtlasSheetViewer
            characterId={previewCharacter}
            quality={displaySettings.assetQuality}
            activeAnimation={previewAction}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CharacterStudioSection;
