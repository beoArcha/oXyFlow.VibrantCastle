import React from "react";
import { Flame, Shield, Zap } from "lucide-react";
import { SkillTreeNode, MagicCategory, MagicTriggerType } from "../../game/types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui";
import { SkillNodeItem } from "./SkillNodeItem";
import { useI18n } from "../../hooks/useI18n";
import { useSkills } from "../../hooks/useGame";

export interface SkillTreeConstellationProps {
  className?: string;
}

export const SkillTreeConstellation: React.FC<SkillTreeConstellationProps> = ({ className = "" }) => {
  const { t } = useI18n();
  const { skillTreeNodes, selectedSkillId, setSelectedSkillId } = useSkills();

  const categories = [
    {
      key: "offensive",
      match: (n: SkillTreeNode) =>
        n.skill.category === MagicCategory.Offensive &&
        n.skill.triggerType !== MagicTriggerType.Passive,
      label: t("offensiveCategory"),
      icon: <Flame className="w-4 h-4 text-amber-400" />,
    },
    {
      key: "defensive",
      match: (n: SkillTreeNode) =>
        n.skill.category === MagicCategory.Defensive &&
        n.skill.triggerType !== MagicTriggerType.Passive,
      label: t("defensiveCategory"),
      icon: <Shield className="w-4 h-4 text-cyan-400" />,
    },
    {
      key: "passive",
      match: (n: SkillTreeNode) => n.skill.triggerType === MagicTriggerType.Passive,
      label: t("passiveCategory"),
      icon: <Zap className="w-4 h-4 text-purple-400" />,
    },
  ];

  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      {categories.map((cat) => {
        const catNodes = skillTreeNodes
          .filter(cat.match)
          .sort((a, b) => a.tier - b.tier);

        return (
          <Card key={cat.key} variant="subtle" className="p-3 md:p-3.5 bg-[#1f0d07]/90 border border-[#5c2d18]">
            <CardHeader className="pb-2">
              <CardTitle icon={cat.icon} className="text-xs md:text-sm text-stone-200">
                {cat.label}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-3 gap-2.5">
                {catNodes.map((node) => (
                  <SkillNodeItem
                    key={node.id}
                    node={node}
                    isSelected={selectedSkillId === node.id}
                    onSelect={(n) => setSelectedSkillId(n.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SkillTreeConstellation;
