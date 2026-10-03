import React from "react";
import { Music, Volume2, VolumeX, Sparkles, Play } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Slider, Button, Badge } from "@components/ui";
import { useSettings } from "@context/SettingsContext";
import { useGameSession } from "@context/GameSessionContext";
import { useI18n } from "@context/I18nContext";
import { VolumePresetBar } from "./audio";
import { cn } from "@lib/utils";

export interface AudioTabProps {
  readonly className?: string;
}

export const AudioTab = ({ className }: AudioTabProps): React.ReactElement => {
  const { volumeMusic, setVolumeMusic, volumeSFX, setVolumeSFX } = useSettings();
  const { playPreviewSFX } = useGameSession();
  const { t } = useI18n();

  const musicPercent = Math.round(volumeMusic * 100);
  const sfxPercent = Math.round(volumeSFX * 100);

  const handleTestSFX = (): void => {
    playPreviewSFX("slash");
  };

  const handleTestSpellSFX = (): void => {
    playPreviewSFX("magic");
  };

  return (
    <div id="tab-content-audio" className={cn("flex flex-col gap-4 animate-in fade-in duration-150", className)}>
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

          <VolumePresetBar
            activePercent={musicPercent}
            onSelectPercent={(p) => setVolumeMusic(p / 100)}
          />
        </CardContent>
      </Card>

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

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#4a200e]/50">
            <VolumePresetBar
              activePercent={sfxPercent}
              onSelectPercent={(p) => setVolumeSFX(p / 100)}
            />

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<Play size={12} className="text-amber-400" />}
                onClick={handleTestSFX}
              >
                {t("audioTestSfxBtn")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<Sparkles size={12} className="text-purple-400" />}
                onClick={handleTestSpellSFX}
              >
                {t("audioTestMagicBtn")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudioTab;

