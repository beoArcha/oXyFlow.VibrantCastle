import React from "react";
import { HelpCircle, Pause, Play, Menu as MenuIcon, MapPin } from "lucide-react";
import { KbdKey } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { HUDTopControlsProps } from "./types";
import { cn } from "@lib/utils";

/**
 * Center toolbar buttons for Hints, Pause, Menu, and Location indicator.
 */
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
    <div className="bg-[#140602]/85 backdrop-blur-md border border-amber-500/30 rounded-2xl px-3 py-1.5 shadow-2xl flex items-center gap-2">
      {/* Help / Hints Button */}
      <button
        id="top-help-btn"
        title={`${t("hints")} [H / ?]`}
        onClick={onOpenHelp}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 hover:border-amber-500/50 text-xs font-bold transition-all cursor-pointer"
      >
        <HelpCircle size={15} className="text-amber-400" />
        <span className="hidden sm:inline">{t("hints")}</span>
        <KbdKey variant="amber">H</KbdKey>
      </button>

      {/* Pause / Resume Button */}
      <button
        id="top-pause-btn"
        title={`${t("pause")} [P]`}
        onClick={onTogglePause}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer",
          isPaused
            ? "bg-amber-600 text-white border-amber-400 animate-pulse"
            : "bg-black/40 hover:bg-black/70 text-stone-200 border-stone-700/60"
        )}
      >
        {isPaused ? <Play size={14} /> : <Pause size={14} />}
        <span className="hidden sm:inline">
          {isPaused ? t("resume") : t("pause")}
        </span>
        <KbdKey variant="stone">P</KbdKey>
      </button>

      {/* Menu Button */}
      <button
        id="top-menu-btn"
        title={`${t("menu")} [M / Esc]`}
        onClick={onOpenMenu}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 hover:border-amber-500/50 text-xs font-bold transition-all cursor-pointer"
      >
        <MenuIcon size={15} className="text-amber-400" />
        <span className="hidden sm:inline">{t("menu")}</span>
        <KbdKey variant="amber">M</KbdKey>
      </button>

      {/* Creation / Developer Suite Button (equal to Menu, Pause, Hints) */}
      {showCreation && onOpenCreation && (
        <button
          id="top-creation-btn"
          title={`${t("tabCreation")} [C]`}
          onClick={onOpenCreation}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/40 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 text-xs font-bold transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">{t("tabCreation")}</span>
          <KbdKey variant="amber">C</KbdKey>
        </button>
      )}

      {/* Location Badge */}
      {locationName && (
        <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-[#5c2d18] text-xs font-semibold text-amber-200">
          <MapPin size={13} className="text-amber-400" />
          <span>{locationName}</span>
        </div>
      )}
    </div>
  );
});
