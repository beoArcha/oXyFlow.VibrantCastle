import React from "react";
import { Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, ProgressBar, Badge } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import type { WeaponEfficacyVM } from "@components/adapters";
import { cn } from "@lib/utils";

export interface StatsWeaponsCardProps {
  readonly weapons: WeaponEfficacyVM;
  readonly className?: string;
}

export const StatsWeaponsCard = ({
  weapons,
  className,
}: StatsWeaponsCardProps): React.ReactElement => {
  const { t } = useI18n();

  return (
    <Card variant="subtle" className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle icon={<Award className="w-4 h-4 text-amber-400" />}>
            {t("weaponsBreakdown")}
          </CardTitle>
          {weapons.bestWeaponName && (
            <Badge variant="amber" className="text-[10px]">
              {t("mostEffectiveSpell")}: {weapons.bestWeaponName}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {weapons.items.length === 0 ? (
          <div className="text-center py-4 text-xs text-stone-500 italic">
            {t("narratorIdlePrompt")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {weapons.items.map((item) => (
              <div
                key={item.key}
                className="p-2 rounded-xl bg-[#140602]/80 border border-[#5c2d18] flex flex-col gap-1.5"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-200">{item.name}</span>
                  <span className="font-mono text-stone-300">
                    {item.damage} ({item.percentage}%)
                  </span>
                </div>
                <ProgressBar
                  value={item.damage}
                  max={Math.max(1, weapons.totalDamageDealt)}
                  variant="stamina"
                  heightClass="h-1.5"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
