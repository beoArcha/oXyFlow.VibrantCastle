import React from "react";
import { Sparkles, Swords, Wand2 } from "lucide-react";
import { Badge, MetricTile, Tabs, TabsList, TabsTrigger, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import { useSkills } from "@context/GameContext";

export interface SkillPlayerTabsProps {
  readonly className?: string;
}

export const SkillPlayerTabs = ({
  className = "",
}: SkillPlayerTabsProps): React.ReactElement => {
  const { activePlayerIndex, setActivePlayerIndex, skillPoints, p1, p2, isTwoPlayer } = useSkills();
  const { t } = useI18n();

  const isCoOp = Boolean(isTwoPlayer && p2);

  const p1CharId = p1?.characterId ?? "valen";
  const p1IsValen = p1CharId === "valen";
  const p1Label = p1IsValen ? t("playerValenLabel") : `${t("aurelia")} (P1)`;

  const p2CharId = p2?.characterId ?? (p1CharId === "valen" ? "aurelia" : "valen");
  const p2IsValen = p2CharId === "valen";
  const p2Label = p2IsValen ? `${t("valen")} (P2)` : t("playerAureliaLabel");

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-[#5c2d18] pb-3 ${className}`}>
      {isCoOp ? (
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
      ) : (
        <Badge
          id={`skill-badge-${p1CharId}`}
          variant={p1IsValen ? "amber" : "cyan"}
          icon={p1IsValen ? <Swords size={14} /> : <Wand2 size={14} />}
          className="px-3 py-1.5 text-xs rounded-xl"
        >
          <Text weight="bold" size="xs" uppercase className="tracking-wide text-inherit">
            {p1Label} &middot; {p1IsValen ? t("characterClassKnight") : t("characterClassScholar")}
          </Text>
        </Badge>
      )}

      <MetricTile
        label={`${t("skillPointsUnit")}:`}
        value={`${skillPoints} ${t("skillPointsUnit")}`}
        icon={<Sparkles size={16} className="text-amber-400" />}
      />
    </div>
  );
};

export default SkillPlayerTabs;
