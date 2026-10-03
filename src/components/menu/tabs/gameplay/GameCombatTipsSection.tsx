import React from "react";
import { Sparkles, Compass } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface GameCombatTipsSectionProps {
  readonly className?: string;
}

export const GameCombatTipsSection = ({
  className,
}: GameCombatTipsSectionProps = {}): React.ReactElement => {
  const { t } = useI18n();

  return (
    <Card variant="subtle" className={cn(className)}>
      <CardHeader>
        <CardTitle icon={<Sparkles className="w-4 h-4 text-amber-400" />}>
          {t("crouchAimTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-stone-300 space-y-2.5 leading-relaxed">
        <div className="p-3 rounded-xl bg-[#140602] border border-[#5c2d18]">
          <strong className="text-amber-300 block mb-1 font-serif text-sm">
            {t("dashAction")}:
          </strong>
          <p className="text-stone-300">{t("slideDescription")}</p>
          <p className="text-stone-400 mt-1">{t("backstepDescription")}</p>
        </div>

        <div className="p-3 rounded-xl bg-[#140602] border border-[#5c2d18]">
          <strong className="text-amber-300 block mb-1 font-serif text-sm">
            {t("directionalAimingTitle")}:
          </strong>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-stone-300">
            <li className="flex items-center gap-1.5">
              <Compass size={12} className="text-amber-400 shrink-0" />
              {t("aimStraightUp")}
            </li>
            <li className="flex items-center gap-1.5">
              <Compass size={12} className="text-amber-400 shrink-0" />
              {t("aim45Up")}
            </li>
            <li className="flex items-center gap-1.5">
              <Compass size={12} className="text-amber-400 shrink-0" />
              {t("aim45Down")}
            </li>
            <li className="flex items-center gap-1.5">
              <Compass size={12} className="text-amber-400 shrink-0" />
              {t("aimStraightDown")}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
