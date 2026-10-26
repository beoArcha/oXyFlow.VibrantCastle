import React from "react";
import { HelpCircle, Pause, Play, Menu as MenuIcon, MapPin } from "lucide-react";
import { KeyboundButton, IconText } from "@ui";
import { useI18n } from "@context/I18nContext";
import { HUDPanel } from "./components/common/HUDPanel";
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
    <HUDPanel
      role="toolbar"
      aria-label={t("gameControls")}
      borderColor="border-amber-500/30"
      padding="none"
      className="px-3 py-1.5 flex items-center gap-2"
    >
      <KeyboundButton
        id="top-help-btn"
        variant="secondary"
        size="sm"
        onClick={onOpenHelp}
        title={`${t("hints")} [H / ?]`}
        leftIcon={<HelpCircle size={15} className="text-amber-400" />}
        kbdKey="H"
        kbdVariant="amber"
        responsiveLabel
        label={t("hints")}
        className="h-8 px-2.5 bg-black/40 hover:bg-amber-500/20 text-amber-300 border-amber-500/20 hover:border-amber-500/50 rounded-xl"
      />

      <KeyboundButton
        id="top-pause-btn"
        variant={isPaused ? "primary" : "secondary"}
        size="sm"
        onClick={onTogglePause}
        aria-pressed={isPaused}
        title={`${t("pause")} [P]`}
        leftIcon={isPaused ? <Play size={14} /> : <Pause size={14} />}
        kbdKey="P"
        kbdVariant="stone"
        responsiveLabel
        label={isPaused ? t("resume") : t("pause")}
        className={cn(
          "h-8 px-2.5 rounded-xl",
          isPaused
            ? "bg-amber-600 text-white border-amber-400 animate-pulse"
            : "bg-black/40 hover:bg-black/70 text-stone-200 border-stone-700/60"
        )}
      />

      <KeyboundButton
        id="top-menu-btn"
        variant="secondary"
        size="sm"
        onClick={onOpenMenu}
        title={`${t("menu")} [M / Esc]`}
        leftIcon={<MenuIcon size={15} className="text-amber-400" />}
        kbdKey="M"
        kbdVariant="amber"
        responsiveLabel
        label={t("menu")}
        className="h-8 px-2.5 bg-black/40 hover:bg-amber-500/20 text-amber-300 border-amber-500/20 hover:border-amber-500/50 rounded-xl"
      />

      {showCreation && onOpenCreation && (
        <KeyboundButton
          id="top-creation-btn"
          variant="secondary"
          size="sm"
          onClick={onOpenCreation}
          title={`${t("tabCreation")} [C]`}
          leftIcon={<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          kbdKey="C"
          kbdVariant="amber"
          responsiveLabel
          label={t("tabCreation")}
          className="h-8 px-2.5 bg-emerald-950/40 hover:bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-400 rounded-xl"
        />
      )}

      {locationName && (
        <IconText
          as="div"
          size="xs"
          weight="semibold"
          variant="secondary"
          icon={<MapPin size={13} className="text-amber-400" />}
          className="hidden lg:flex pl-2 border-l border-amber-900/40"
        >
          {locationName}
        </IconText>
      )}
    </HUDPanel>
  );
});

HUDTopControls.displayName = "HUDTopControls";
export default HUDTopControls;
