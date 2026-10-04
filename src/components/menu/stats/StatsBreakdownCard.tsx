import React from "react";
import { Target, FlaskConical } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, ProgressBar } from "@ui";
import { useI18n } from "@context/I18nContext";
import type { KillsBreakdownVM, PotionsBreakdownVM } from "@components/adapters";
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
              <span className="font-mono font-bold text-amber-300">{kills.dummy}</span>
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
              <span className="font-mono font-bold text-amber-300">{kills.automaton}</span>
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
              <span className="font-mono font-bold text-amber-300">{kills.gargoyle}</span>
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
              <span className="font-mono font-bold text-amber-300">{kills.crawler}</span>
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
              <span className="text-red-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {t("healthPotionStat")}
              </span>
              <span className="font-mono font-bold text-red-300">{potions.health}</span>
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
              <span className="text-cyan-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                {t("manaPotionStat")}
              </span>
              <span className="font-mono font-bold text-cyan-300">{potions.mana}</span>
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
              <span className="text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {t("staminaPotionStat")}
              </span>
              <span className="font-mono font-bold text-amber-300">{potions.stamina}</span>
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
            <span className="font-mono font-bold text-amber-300">{leversPulled}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
