import React from "react";
import { Pause, Play, HelpCircle, Menu as MenuIcon, ArrowRight, RotateCcw, Backpack, BookOpen } from "lucide-react";
import { Button } from "../ui";
import { useI18n } from "../../hooks/useI18n";
import { HUDStatusOverlayProps } from "./types";

/**
 * Overlay screens covering Paused, Victory, and Defeat game outcomes.
 */
export const HUDStatusOverlay: React.FC<HUDStatusOverlayProps> = React.memo(({
  isPaused,
  isVictory,
  isDefeat,
  onResume,
  onOpenHelp,
  onOpenMenu,
  onOpenInventory,
  onOpenSkillTree,
  onNextLocation,
  onRestart,
}) => {
  const { t } = useI18n();

  // 1. Paused screen
  if (isPaused && !isVictory && !isDefeat) {
    return (
      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-50 animate-in fade-in">
        <div className="bg-[#1c0c07]/95 border-2 border-amber-500/60 rounded-2xl p-6 md:p-8 max-w-lg shadow-2xl flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border border-amber-500/50 bg-black/80 flex items-center justify-center text-amber-400 shadow-inner">
            <Pause size={28} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-black text-[#fbbf24] tracking-wide drop-shadow-md">
              {t("gamePaused")}
            </h2>
            <p className="text-xs text-stone-300 mt-1">{t("pressToResume")}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
            <Button
              id="pause-resume-btn"
              variant="primary"
              size="md"
              icon={<Play size={16} />}
              onClick={onResume}
            >
              {t("resume")} [P]
            </Button>
            <Button
              id="pause-help-btn"
              variant="secondary"
              size="md"
              icon={<HelpCircle size={16} />}
              onClick={onOpenHelp}
            >
              {t("hints")} [H]
            </Button>
            <Button
              id="pause-menu-btn"
              variant="outline"
              size="md"
              icon={<MenuIcon size={16} />}
              onClick={onOpenMenu}
            >
              {t("menu")} [M]
            </Button>
            {onOpenInventory && (
              <Button
                id="pause-inventory-btn"
                variant="secondary"
                size="md"
                icon={<Backpack size={16} className="text-amber-400" />}
                onClick={onOpenInventory}
              >
                {t("inventoryBtn")} [I]
              </Button>
            )}
            {onOpenSkillTree && (
              <Button
                id="pause-skills-btn"
                variant="purple"
                size="md"
                icon={<BookOpen size={16} className="text-purple-300" />}
                onClick={onOpenSkillTree}
              >
                {t("skillTreeBtn")} [K]
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Victory screen
  if (isVictory) {
    return (
      <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-40 animate-in fade-in">
        <h2 className="text-3xl md:text-5xl font-serif font-black text-[#fbbf24] tracking-wider mb-2 drop-shadow-lg">
          {t("victory")}
        </h2>
        <p className="text-sm md:text-base text-[#fed7aa] max-w-md mb-6 leading-relaxed">
          {t("trainingGoalSuccess")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            id="advance-location-btn"
            size="lg"
            variant="primary"
            icon={<ArrowRight size={18} />}
            onClick={onNextLocation}
          >
            {t("nextLocation")}
          </Button>
          <Button
            id="victory-restart-btn"
            size="lg"
            variant="secondary"
            icon={<RotateCcw size={18} />}
            onClick={onRestart}
          >
            {t("restart")}
          </Button>
        </div>
      </div>
    );
  }

  // 3. Defeat screen
  if (isDefeat) {
    return (
      <div className="absolute inset-0 bg-red-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-40 animate-in fade-in">
        <h2 className="text-3xl md:text-5xl font-serif font-black text-red-500 tracking-wider mb-2 drop-shadow-lg">
          {t("defeat")}
        </h2>
        <p className="text-sm md:text-base text-stone-300 max-w-md mb-6 leading-relaxed">
          {t("defeatSubtitle")}
        </p>
        <Button
          id="defeat-restart-btn"
          size="lg"
          variant="danger"
          icon={<RotateCcw size={18} />}
          onClick={onRestart}
        >
          {t("restart")}
        </Button>
      </div>
    );
  }

  return null;
});
