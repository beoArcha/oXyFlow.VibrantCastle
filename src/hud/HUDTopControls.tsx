import React from "react";
import { Pause, Play, MapPin, Volume2 } from "lucide-react";
import { KeyboundButton, IconText, Button } from "@ui";
import { useI18n } from "@context/I18nContext";
import { HUDPanel } from "./components/common/HUDPanel";
import type { HUDTopControlsProps } from "./types";
import { cn } from "@lib/utils";

/**
 * Slim top-center HUD strip showing the current location, pause toggle [P],
 * and a one-click audio activation cue when browser audio is not yet unlocked.
 * All modal navigation lives in the Top Bar to eliminate duplicated controls.
 */
export const HUDTopControls: React.FC<HUDTopControlsProps> = React.memo(({
  isPaused,
  onTogglePause,
  locationName,
  isAudioInitialized = true,
  onInitializeAudio,
}) => {
  const { t } = useI18n();

  return (
    <HUDPanel
      role="toolbar"
      aria-label={t("gameControls")}
      borderColor="border-amber-500/25"
      padding="none"
      className="px-3 py-1 flex items-center gap-2 whitespace-nowrap"
    >
      {locationName && (
        <IconText
          as="div"
          size="xs"
          weight="semibold"
          variant="secondary"
          icon={<MapPin size={13} className="text-amber-400 shrink-0" />}
          className="pr-2 border-r border-amber-900/40 whitespace-nowrap"
        >
          {locationName}
        </IconText>
      )}

      <KeyboundButton
        id="top-pause-btn"
        variant={isPaused ? "primary" : "secondary"}
        size="sm"
        onClick={onTogglePause}
        aria-pressed={isPaused}
        title={`${t("pause")} [P]`}
        leftIcon={isPaused ? <Play size={13} /> : <Pause size={13} />}
        kbdKey="P"
        kbdVariant="stone"
        responsiveLabel
        label={isPaused ? t("resume") : t("pause")}
        className={cn(
          "h-7 px-2 rounded-lg whitespace-nowrap",
          isPaused
            ? "bg-amber-600 text-white border-amber-400"
            : "bg-black/40 hover:bg-black/70 text-stone-200 border-stone-700/60"
        )}
      />

      {!isAudioInitialized && onInitializeAudio && (
        <Button
          id="top-audio-btn"
          variant="secondary"
          size="sm"
          onClick={onInitializeAudio}
          title={t("clickToEnableSound")}
          leftIcon={<Volume2 size={13} className="text-amber-400" />}
          className="h-7 px-2 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 text-amber-200 border-amber-600/40 text-2xs whitespace-nowrap"
        >
          {t("clickToEnableSound")}
        </Button>
      )}
    </HUDPanel>
  );
});

HUDTopControls.displayName = "HUDTopControls";
export default HUDTopControls;
