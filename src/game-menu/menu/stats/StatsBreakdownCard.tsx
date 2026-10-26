import React from "react";
import { Target, FlaskConical } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, ProgressBar, Text, IconText } from "@ui";
import { useI18n } from "@context/I18nContext";
import type { KillsBreakdownVM, PotionsBreakdownVM } from "./stats.mapper";
import { cn } from "@lib/utils";

export interface StatsBreakdownCardProps {
  readonly kills: KillsBreakdownVM;
  readonly potions: PotionsBreakdownVM;
  readonly leversPulled: number;
  readonly className?: string;
}

export const StatsBreakdownCard = ({
  kills,
  potions,
  leversPulled,
  className,
}: StatsBreakdownCardProps): React.ReactElement => {
  const { t } = useI18n();

  const maxKills = Math.max(1, kills.totalKills);
  const maxPotions = Math.max(1, potions.totalPotions);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<Target className="w-4 h-4 text-amber-400" />}>
            {t("killsBreakdown")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-300">{t("trainingDummiesKilled")}</span>
              <Text family="mono" weight="bold" className="text-amber-300">{kills.dummy}</Text>
            </div>
            <ProgressBar
              value={kills.dummy}
              max={maxKills}
              variant="stamina"
              heightClass="h-1.5"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-300">{t("automatonsKilled")}</span>
              <Text family="mono" weight="bold" className="text-amber-300">{kills.automaton}</Text>
            </div>
            <ProgressBar
              value={kills.automaton}
              max={maxKills}
              variant="stamina"
              heightClass="h-1.5"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-300">{t("gargoylesKilled")}</span>
              <Text family="mono" weight="bold" className="text-amber-300">{kills.gargoyle}</Text>
            </div>
            <ProgressBar
              value={kills.gargoyle}
              max={maxKills}
              variant="stamina"
              heightClass="h-1.5"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-300">{t("crawlersKilled")}</span>
              <Text family="mono" weight="bold" className="text-amber-300">{kills.crawler}</Text>
            </div>
            <ProgressBar
              value={kills.crawler}
              max={maxKills}
              variant="stamina"
              heightClass="h-1.5"
            />
          </div>
        </CardContent>
      </Card>

      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<FlaskConical className="w-4 h-4 text-cyan-400" />}>
            {t("potionsBreakdown")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <IconText size="xs" className="text-red-300" icon={<span className="w-2 h-2 rounded-full bg-red-500" />}>
                {t("healthPotionStat")}
              </IconText>
              <Text family="mono" weight="bold" className="text-red-300">{potions.health}</Text>
            </div>
            <ProgressBar
              value={potions.health}
              max={maxPotions}
              variant="health"
              heightClass="h-1.5"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <IconText size="xs" className="text-cyan-300" icon={<span className="w-2 h-2 rounded-full bg-cyan-400" />}>
                {t("manaPotionStat")}
              </IconText>
              <Text family="mono" weight="bold" className="text-cyan-300">{potions.mana}</Text>
            </div>
            <ProgressBar
              value={potions.mana}
              max={maxPotions}
              variant="mana"
              heightClass="h-1.5"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <IconText size="xs" className="text-amber-300" icon={<span className="w-2 h-2 rounded-full bg-amber-400" />}>
                {t("staminaPotionStat")}
              </IconText>
              <Text family="mono" weight="bold" className="text-amber-300">{potions.stamina}</Text>
            </div>
            <ProgressBar
              value={potions.stamina}
              max={maxPotions}
              variant="stamina"
              heightClass="h-1.5"
            />
          </div>

          <div className="mt-2 pt-2 border-t border-[#3a1a0f] flex justify-between text-xs">
            <span className="text-stone-400">{t("leversActivatedCount")}:</span>
            <Text family="mono" weight="bold" className="text-amber-300">{leversPulled}</Text>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
