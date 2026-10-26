import React from "react";
import { HelpCircle, Pause, Play, Menu as MenuIcon, MapPin } from "lucide-react";
import { Button, KbdKey, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import type { HUDTopControlsProps } from "./types";
import { cn } from "@lib/utils";

export const HUDTopControls: React.FC<HUDTopControlsProps> = React.memo(({
  isPaused,
  onTogglePause,
  onOpenHelp,
  onOpenMenu,
  onOpenCreation,
  showCreation = true,
  locationName,
}) => {
  const { t } = useI18n();

  return (
    <div
      role="toolbar"
      aria-label={t("gameControls")}
      className="bg-stone-950/85 backdrop-blur-md border border-amber-500/30 rounded-2xl px-3 py-1.5 shadow-2xl flex items-center gap-2"
    >
      <Button
        id="top-help-btn"
        variant="secondary"
        size="sm"
        onClick={onOpenHelp}
        title={`${t("hints")} [H / ?]`}
        leftIcon={<HelpCircle size={15} className="text-amber-400" />}
        rightIcon={<KbdKey variant="amber">H</KbdKey>}
        className="h-8 px-2.5 bg-black/40 hover:bg-amber-500/20 text-amber-300 border-amber-500/20 hover:border-amber-500/50 rounded-xl"
      >
        <span className="hidden sm:inline">{t("hints")}</span>
      </Button>

      <Button
        id="top-pause-btn"
        variant={isPaused ? "primary" : "secondary"}
        size="sm"
        onClick={onTogglePause}
        aria-pressed={isPaused}
        title={`${t("pause")} [P]`}
        leftIcon={isPaused ? <Play size={14} /> : <Pause size={14} />}
        rightIcon={<KbdKey variant="stone">P</KbdKey>}
        className={cn(
          "h-8 px-2.5 rounded-xl",
          isPaused
            ? "bg-amber-600 text-white border-amber-400 animate-pulse"
            : "bg-black/40 hover:bg-black/70 text-stone-200 border-stone-700/60"
        )}
      >
        <span className="hidden sm:inline">
          {isPaused ? t("resume") : t("pause")}
        </span>
      </Button>

      <Button
        id="top-menu-btn"
        variant="secondary"
        size="sm"
        onClick={onOpenMenu}
        title={`${t("menu")} [M / Esc]`}
        leftIcon={<MenuIcon size={15} className="text-amber-400" />}
        rightIcon={<KbdKey variant="amber">M</KbdKey>}
        className="h-8 px-2.5 bg-black/40 hover:bg-amber-500/20 text-amber-300 border-amber-500/20 hover:border-amber-500/50 rounded-xl"
      >
        <span className="hidden sm:inline">{t("menu")}</span>
      </Button>

      {showCreation && onOpenCreation && (
        <Button
          id="top-creation-btn"
          variant="secondary"
          size="sm"
          onClick={onOpenCreation}
          title={`${t("tabCreation")} [C]`}
          leftIcon={<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          rightIcon={<KbdKey variant="amber">C</KbdKey>}
          className="h-8 px-2.5 bg-emerald-950/40 hover:bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-400 rounded-xl"
        >
          <span className="hidden sm:inline">{t("tabCreation")}</span>
        </Button>
      )}

      {locationName && (
        <Text
          as="div"
          size="xs"
          weight="semibold"
          variant="secondary"
          className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-amber-900/40"
        >
          <MapPin size={13} className="text-amber-400" />
          <span>{locationName}</span>
        </Text>
      )}
    </div>
  );
});
