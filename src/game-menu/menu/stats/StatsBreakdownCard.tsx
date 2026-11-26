import React from "react";
import { Skull, FlaskConical } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, ProgressBar, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import type { KillsBreakdownVM, PotionsBreakdownVM } from "./types";
import { cn } from "@lib/utils";

export interface StatsBreakdownCardProps {
  readonly kills: KillsBreakdownVM;
  readonly potions: PotionsBreakdownVM;
  readonly className?: string;
}

export const StatsBreakdownCard: React.FC<StatsBreakdownCardProps> = ({
  kills,
  potions,
  className,
}) => {
  const { t } = useI18n();

  const killRows = [
    { key: "dummy", label: t("trainingDummiesKilled"), value: kills.dummy },
    { key: "automaton", label: t("automatonsKilled"), value: kills.automaton },
    { key: "gargoyle", label: t("gargoylesKilled"), value: kills.gargoyle },
    { key: "crawler", label: t("crawlersKilled"), value: kills.crawler },
  ];

  const potionRows = [
    { key: "health", label: t("healthPotionStat"), value: potions.health, variant: "health" as const },
    { key: "mana", label: t("manaPotionStat"), value: potions.mana, variant: "mana" as const },
    { key: "stamina", label: t("staminaPotionStat"), value: potions.stamina, variant: "stamina" as const },
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<Skull className="w-4 h-4 text-red-400" />}>
            {t("killsBreakdown")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {killRows.map((row) => (
            <div key={row.key} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <Text size="xs" className="text-stone-300">{row.label}</Text>
                <Text size="xs" family="mono" weight="bold" className="text-amber-300">
                  {row.value}
                </Text>
              </div>
              <ProgressBar
                value={row.value}
                max={Math.max(1, kills.totalKills)}
                variant="health"
                heightClass="h-1.5"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<FlaskConical className="w-4 h-4 text-emerald-400" />}>
            {t("potionsBreakdown")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {potionRows.map((row) => (
            <div key={row.key} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <Text size="xs" className="text-stone-300">{row.label}</Text>
                <Text size="xs" family="mono" weight="bold" className="text-amber-300">
                  {row.value}
                </Text>
              </div>
              <ProgressBar
                value={row.value}
                max={Math.max(1, potions.totalPotions)}
                variant={row.variant}
                heightClass="h-1.5"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

StatsBreakdownCard.displayName = "StatsBreakdownCard";
export default StatsBreakdownCard;
