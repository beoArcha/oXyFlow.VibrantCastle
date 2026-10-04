import React from "react";
import { Swords, Skull, Flame, Shield, Sparkles, FlaskConical } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, StatRow, Badge } from "@ui";
import { useI18n } from "@context/I18nContext";
import type { PlayerStatsVM } from "./stats.mapper";
import { cn } from "@lib/utils";

export interface StatsPlayerCardProps {
  readonly title: string;
  readonly score: number;
  readonly stats: PlayerStatsVM;
  readonly variant?: "red" | "cyan";
  readonly className?: string;
}

export const StatsPlayerCard = ({
  title,
  score,
  stats,
  variant = "red",
  className,
}: StatsPlayerCardProps): React.ReactElement => {
  const { t } = useI18n();
  const isRed = variant === "red";

  return (
    <Card
      variant="subtle"
      className={cn(isRed ? "border-red-900/50" : "border-cyan-900/50", className)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle
            icon={
              isRed ? (
                <Swords className="w-4 h-4 text-red-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-cyan-400" />
              )
            }
          >
            {title}
          </CardTitle>
          <Badge variant={isRed ? "red" : "cyan"} className="text-[10px]">
            {score} XP
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <StatRow
          label={t("totalKills")}
          value={stats.kills}
          icon={<Skull size={13} className={isRed ? "text-red-400" : "text-cyan-400"} />}
          variant={isRed ? "red" : "cyan"}
        />
        <StatRow
          label={t("damageDealt")}
          value={stats.damageDealt}
          icon={<Flame size={13} className="text-amber-400" />}
          variant="amber"
        />
        <StatRow
          label={t("damageTaken")}
          value={stats.damageTaken}
          icon={<Shield size={13} className="text-stone-400" />}
        />
        <StatRow
          label={t("meleeAttack")}
          value={stats.swordStrikes}
          icon={<Swords size={13} className="text-stone-300" />}
        />
        <StatRow
          label={t("magicPrimary")}
          value={stats.spellsCast}
          icon={<Sparkles size={13} className="text-cyan-400" />}
          variant="cyan"
        />
        <StatRow
          label={t("potionsConsumed")}
          value={stats.potionsDrunkTotal}
          icon={<FlaskConical size={13} className={isRed ? "text-amber-300" : "text-cyan-300"} />}
          variant={isRed ? "amber" : "cyan"}
        />
      </CardContent>
    </Card>
  );
};
