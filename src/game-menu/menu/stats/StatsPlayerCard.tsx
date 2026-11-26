import React from "react";
import { User, Swords, Shield, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, StatRow } from "@ui";
import { useI18n } from "@context/I18nContext";
import type { PlayerStatsVM } from "./types";
import { cn } from "@lib/utils";

export interface StatsPlayerCardProps {
  readonly title: string;
  readonly stats: PlayerStatsVM;
  readonly variant?: "amber" | "cyan";
  readonly className?: string;
}

export const StatsPlayerCard: React.FC<StatsPlayerCardProps> = ({
  title,
  stats,
  variant = "amber",
  className,
}) => {
  const { t } = useI18n();

  return (
    <Card variant="subtle" className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle
            icon={
              <User
                className={cn(
                  "w-4 h-4",
                  variant === "cyan" ? "text-cyan-400" : "text-amber-400"
                )}
              />
            }
          >
            {title}
          </CardTitle>
          <Badge variant={variant}>
            {t("xpEarned")}: {Math.round(stats.score)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        <StatRow
          label={t("totalKills")}
          value={String(stats.kills)}
          icon={<Swords size={12} className="text-red-400" />}
        />
        <StatRow
          label={t("damageDealt")}
          value={String(Math.round(stats.damageDealt))}
          icon={<Swords size={12} className="text-amber-400" />}
        />
        <StatRow
          label={t("damageTaken")}
          value={String(Math.round(stats.damageTaken))}
          icon={<Shield size={12} className="text-stone-400" />}
        />
        <StatRow
          label={t("primarySpell")}
          value={String(stats.spellsCast)}
          icon={<Sparkles size={12} className="text-purple-400" />}
        />
        <StatRow
          label={t("potionsConsumed")}
          value={String(stats.potionsDrunkTotal)}
        />
      </CardContent>
    </Card>
  );
};

StatsPlayerCard.displayName = "StatsPlayerCard";
export default StatsPlayerCard;
