import React from "react";
import { Swords, Gamepad2 } from "lucide-react";
import { PlayerId } from "@game/types";
import { useI18n } from "@context/I18nContext";
import { HelpControlsCard } from "./HelpControlsCard";

export interface HelpControlsSectionProps {
  className?: string;
}

/**
 * Combat and movement controls section containing Player 1 and Player 2 cards.
 */
export const HelpControlsSection: React.FC<HelpControlsSectionProps> = ({ className = "" }) => {
  const { t } = useI18n();

  return (
    <section className={`flex flex-col gap-2.5 ${className}`} aria-labelledby="controls-heading">
      <div
        id="controls-heading"
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400"
      >
        <Swords size={14} />
        <span>{t("combatAndMovement")}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HelpControlsCard
          playerId={PlayerId.Player1}
          title={t("p1Status")}
          icon={<Swords size={14} />}
          flankBadge={t("p1FlankLabel")}
          theme="crimson"
        />
        <HelpControlsCard
          playerId={PlayerId.Player2}
          title={t("p2Status")}
          icon={<Gamepad2 size={14} />}
          flankBadge={t("p2FlankLabel")}
          theme="cyan"
        />
      </div>
    </section>
  );
};

export default HelpControlsSection;
