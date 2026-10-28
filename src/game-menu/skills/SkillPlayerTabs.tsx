import React, { useContext } from "react";
import { Sparkles, Swords, Wand2 } from "lucide-react";
import { MetricTile, Tabs, TabsList, TabsTrigger } from "@ui";
import { useI18n } from "@context/I18nContext";
import { useSkills } from "@context/GameContext";
import { GameEngineContext } from "@context/GameEngineContext";

export interface SkillPlayerTabsProps {
  readonly className?: string;
}

export const SkillPlayerTabs = ({
  className = "",
}: SkillPlayerTabsProps): React.ReactElement => {
  const { activePlayerIndex, setActivePlayerIndex, skillPoints } = useSkills();
  const gameEngine = useContext(GameEngineContext);
  const { t } = useI18n();

  const p1CharId = gameEngine?.p1?.characterId ?? "valen";
  const p2CharId = gameEngine?.p2?.characterId ?? (p1CharId === "valen" ? "aurelia" : "valen");

  const p1IsValen = p1CharId === "valen";
  const p2IsValen = p2CharId === "valen";

  const p1Label = p1IsValen ? t("playerValenLabel") : `${t("aurelia")} (P1)`;
  const p2Label = p2IsValen ? `${t("valen")} (P2)` : t("playerAureliaLabel");

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-[#5c2d18] pb-3 ${className}`}>
      <Tabs
        value={String(activePlayerIndex)}
        onValueChange={(val: string) => setActivePlayerIndex(Number(val))}
      >
        <TabsList>
          <TabsTrigger
            id={`skill-tab-${p1CharId}`}
            value="0"
            icon={p1IsValen ? <Swords size={14} /> : <Wand2 size={14} />}
            badge={p1IsValen ? t("characterClassKnight") : t("characterClassScholar")}
          >
            {p1Label}
          </TabsTrigger>
          <TabsTrigger
            id={`skill-tab-${p2CharId}`}
            value="1"
            icon={p2IsValen ? <Swords size={14} /> : <Wand2 size={14} />}
            badge={p2IsValen ? t("characterClassKnight") : t("characterClassScholar")}
          >
            {p2Label}
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
