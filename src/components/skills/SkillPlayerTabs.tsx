import React from "react";
import { Sparkles, Swords, Wand2 } from "lucide-react";
import { MetricTile, Tabs, TabsList, TabsTrigger } from "../ui";
import { useI18n } from "@context/I18nContext";
import { useSkills } from "@context/GameContext";

export interface SkillPlayerTabsProps {
  readonly className?: string;
}

export const SkillPlayerTabs = ({
  className = "",
}: SkillPlayerTabsProps): React.ReactElement => {
  const { activePlayerIndex, setActivePlayerIndex, skillPoints } = useSkills();
  const { t } = useI18n();

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-[#5c2d18] pb-3 ${className}`}>
      <Tabs
        value={String(activePlayerIndex)}
        onValueChange={(val) => setActivePlayerIndex(Number(val))}
      >
        <TabsList>
          <TabsTrigger
            id="skill-tab-valen"
            value="0"
            icon={<Swords size={14} />}
            badge={t("characterClassKnight")}
          >
            {t("playerValenLabel")}
          </TabsTrigger>
          <TabsTrigger
            id="skill-tab-aurelia"
            value="1"
            icon={<Wand2 size={14} />}
            badge={t("characterClassScholar")}
          >
            {t("playerAureliaLabel")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <MetricTile
        label={`${t("skillPointsUnit")}:`}
        value={`${skillPoints} ${t("skillPointsUnit")}`}
        icon={<Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />}
        variant="amber"
        compact
      />
    </div>
  );
};

export default SkillPlayerTabs;
