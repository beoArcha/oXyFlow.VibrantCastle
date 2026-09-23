import React from "react";
import { Compass, CheckCircle2 } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";

export interface HelpMechanicsTipsProps {
  className?: string;
}

/**
 * Mechanics and gameplay advice section.
 * Explains hitbox reduction, spells, exploration, and live screens.
 */
export const HelpMechanicsTips: React.FC<HelpMechanicsTipsProps> = ({ className = "" }) => {
  const { t } = useI18n();

  const tips = [
    { text: t("tipsTextMove"), iconColor: "text-amber-400" },
    { text: t("tipsTextCombat"), iconColor: "text-cyan-400" },
    { text: t("tipsTextObjectives"), iconColor: "text-purple-400" },
    { text: t("tipsTextLiveScreens"), iconColor: "text-emerald-400" },
  ];

  return (
    <section
      className={`bg-[#140602] border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3 shadow-sm ${className}`}
      aria-labelledby="mechanics-heading"
    >
      <div
        id="mechanics-heading"
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400"
      >
        <Compass size={14} />
        <span>{t("tipsMechanics")}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-300">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <CheckCircle2 size={14} className={`${tip.iconColor} shrink-0 mt-0.5`} />
            <span className="leading-relaxed">{tip.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HelpMechanicsTips;
