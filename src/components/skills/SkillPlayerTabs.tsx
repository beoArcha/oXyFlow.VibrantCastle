import React from "react";
import { Sparkles, Swords, Wand2 } from "lucide-react";
import { cn } from "@lib/utils";
import { useI18n } from "@context/I18nContext";
import { useSkills } from "@context/GameContext";

export interface SkillPlayerTabsProps {
  className?: string;
}

export const SkillPlayerTabs: React.FC<SkillPlayerTabsProps> = ({ className }) => {
  const { activePlayerIndex, setActivePlayerIndex, skillPoints, activeCharacter } = useSkills();
  const { t } = useI18n();

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-[#5c2d18] pb-3", className)}>
      {/* Player Switching Tabs */}
      <div className="flex items-center gap-2">
        <button
          id="skill-tab-valen"
          type="button"
          onClick={() => setActivePlayerIndex(0)}
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none",
            activePlayerIndex === 0
              ? "bg-amber-600/90 text-amber-50 border border-amber-400 shadow-md shadow-amber-950/40"
              : "bg-stone-900/80 text-stone-300 border border-stone-800 hover:bg-stone-800 hover:text-white"
          )}
        >
          <Swords size={14} className={activePlayerIndex === 0 ? "text-amber-200" : "text-stone-400"} />
          <span>Valen (P1)</span>
          <span className="text-[10px] opacity-75 font-normal">Słoneczny Rycerz</span>
        </button>

        <button
          id="skill-tab-aurelia"
          type="button"
          onClick={() => setActivePlayerIndex(1)}
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none",
            activePlayerIndex === 1
              ? "bg-sky-600/90 text-sky-50 border border-sky-400 shadow-md shadow-sky-950/40"
              : "bg-stone-900/80 text-stone-300 border border-stone-800 hover:bg-stone-800 hover:text-white"
          )}
        >
          <Wand2 size={14} className={activePlayerIndex === 1 ? "text-sky-200" : "text-stone-400"} />
          <span>Aurelia (P2)</span>
          <span className="text-[10px] opacity-75 font-normal">Uczona Arkanów</span>
        </button>
      </div>

      {/* Available Skill Points Badge */}
      <div className="bg-stone-950/90 border border-amber-500/70 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-inner">
        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="text-xs text-stone-400 uppercase font-semibold">PU:</span>
        <span className="text-sm font-bold text-amber-300 font-mono">
          {skillPoints} {t("skillPointsUnit")}
        </span>
      </div>
    </div>
  );
};

export default SkillPlayerTabs;
