import React from "react";
import { Clock, Skull, Swords, FlaskConical, Cog } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, MetricTile } from "@ui";
import { useI18n } from "@context/I18nContext";
import type { SessionSummaryVM } from "./types";
import { cn } from "@lib/utils";

export interface StatsSessionCardProps {
  readonly summary: SessionSummaryVM;
  readonly className?: string;
}

export const StatsSessionCard: React.FC<StatsSessionCardProps> = ({
  summary,
  className,
}) => {
  const { t } = useI18n();

  return (
    <Card variant="subtle" className={cn(className)}>
      <CardHeader>
        <CardTitle icon={<Clock className="w-4 h-4 text-amber-400" />}>
          {t("gameStatsTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <MetricTile
            label={t("playTime")}
            value={summary.formattedPlayTime}
            icon={<Clock size={14} className="text-amber-400" />}
          />
          <MetricTile
            label={t("totalKills")}
            value={String(summary.totalKills)}
            icon={<Skull size={14} className="text-red-400" />}
          />
          <MetricTile
            label={t("damageDealt")}
            value={String(Math.round(summary.totalDamageDealt))}
            icon={<Swords size={14} className="text-orange-400" />}
          />
          <MetricTile
            label={t("potionsConsumed")}
            value={String(summary.totalPotionsConsumed)}
            icon={<FlaskConical size={14} className="text-emerald-400" />}
          />
          <MetricTile
            label={t("leversActivatedCount")}
            value={String(summary.leversPulled)}
            icon={<Cog size={14} className="text-cyan-400" />}
          />
        </div>
      </CardContent>
    </Card>
  );
};

StatsSessionCard.displayName = "StatsSessionCard";
export default StatsSessionCard;
