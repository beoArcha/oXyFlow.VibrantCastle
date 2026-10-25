import React, { useMemo } from "react";
import { Compass, CheckCircle2 } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import { HelpMechanicsTipsProps } from "./types";

export type { HelpMechanicsTipsProps };

/**
 * Mechanics and gameplay advice section.
 * Explains hitbox reduction, spells, exploration, and live screens.
 */
export const HelpMechanicsTips: React.FC<HelpMechanicsTipsProps> = React.memo(
  function HelpMechanicsTips({ className = "" }) {
    const { t } = useI18n();

    const tips = useMemo(
      () => [
        { id: "move", text: t("tipsTextMove"), iconColor: "text-amber-400" },
        { id: "combat", text: t("tipsTextCombat"), iconColor: "text-cyan-400" },
        { id: "objectives", text: t("tipsTextObjectives"), iconColor: "text-purple-400" },
        { id: "screens", text: t("tipsTextLiveScreens"), iconColor: "text-emerald-400" },
      ],
      [t]
    );

    return (
      <section
        className={cn(
          "bg-stone-950/80 border border-amber-900/40 rounded-xl p-4 flex flex-col gap-3 shadow-sm",
          className
        )}
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
          {tips.map((tip) => (
            <div key={tip.id} className="flex items-start gap-2">
              <CheckCircle2 size={14} className={cn(tip.iconColor, "shrink-0 mt-0.5")} />
              <span className="leading-relaxed">{tip.text}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }
);

HelpMechanicsTips.displayName = "HelpMechanicsTips";

export default HelpMechanicsTips;
