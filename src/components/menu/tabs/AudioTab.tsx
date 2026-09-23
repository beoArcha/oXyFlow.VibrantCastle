import React from "react";
import { Music, Volume2, VolumeX, Sparkles, Play } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Slider, Button, Badge } from "../../ui";
import { useGame } from "../../../hooks/useGame";
import { useI18n } from "../../../hooks/useI18n";
import gameEngine from "../../../game/loop/engine";
import { SoundType } from "../../../game/types";
import { cn } from "../../../lib/utils";

export const AudioTab: React.FC = () => {
  const { volumeMusic, setVolumeMusic, volumeSFX, setVolumeSFX } = useGame();
  const { t, language } = useI18n();
  const isPl = language === "pl";

  const musicPercent = Math.round(volumeMusic * 100);
  const sfxPercent = Math.round(volumeSFX * 100);

  const presets = [0, 25, 50, 75, 100];

  const handleTestSFX = () => {
    gameEngine.playSFX(SoundType.SFX_SLASH);
  };

  const handleTestSpellSFX = () => {
    gameEngine.playSFX(SoundType.SFX_MAGIC_BOLT);
  };

  return (
    <div id="tab-content-audio" className="flex flex-col gap-4 animate-in fade-in duration-150">
      {/* 1. Music (BGM) Volume */}
      <Card variant="subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Music className="w-4 h-4 text-amber-400" />}>
              {t("musicVolume")}
            </CardTitle>
            <Badge variant={musicPercent > 0 ? "amber" : "stone"} className="font-mono">
              {musicPercent}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Slider
            id="bgm-volume-slider"
            label={t("musicVolume")}
            value={musicPercent}
            onChange={(v) => setVolumeMusic(v / 100)}
            min={0}
            max={100}
            unit="%"
            icon={musicPercent > 0 ? <Music size={14} /> : <VolumeX size={14} />}
          />

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[11px] text-stone-400 mr-1">{isPl ? "Szybki wybór:" : "Presets:"}</span>
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setVolumeMusic(p / 100)}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer border",
                  musicPercent === p
                    ? "bg-amber-600 text-white border-amber-400"
                    : "bg-[#140602] text-stone-400 hover:text-amber-200 border-stone-800 hover:border-amber-700/60"
                )}
              >
                {p === 0 ? (isPl ? "Wycisz" : "Mute") : `${p}%`}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. Sound Effects (SFX) Volume */}
      <Card variant="subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Volume2 className="w-4 h-4 text-amber-400" />}>
              {t("soundEffectsVolume")}
            </CardTitle>
            <Badge variant={sfxPercent > 0 ? "amber" : "stone"} className="font-mono">
              {sfxPercent}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Slider
            id="sfx-volume-slider"
            label={t("soundEffectsVolume")}
            value={sfxPercent}
            onChange={(v) => setVolumeSFX(v / 100)}
            min={0}
            max={100}
            unit="%"
            icon={sfxPercent > 0 ? <Volume2 size={14} /> : <VolumeX size={14} />}
          />

          {/* Quick Presets & Test Sound */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#4a200e]/50">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400 mr-1">{isPl ? "Szybki wybór:" : "Presets:"}</span>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setVolumeSFX(p / 100)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer border",
                    sfxPercent === p
                      ? "bg-amber-600 text-white border-amber-400"
                      : "bg-[#140602] text-stone-400 hover:text-amber-200 border-stone-800 hover:border-amber-700/60"
                  )}
                >
                  {p === 0 ? (isPl ? "Wycisz" : "Mute") : `${p}%`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<Play size={12} className="text-amber-400" />}
                onClick={handleTestSFX}
              >
                {isPl ? "Test Dźwięku" : "Test SFX"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<Sparkles size={12} className="text-purple-400" />}
                onClick={handleTestSpellSFX}
              >
                {isPl ? "Test Magii" : "Test Magic"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudioTab;
