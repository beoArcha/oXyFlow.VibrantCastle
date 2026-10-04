import React, { useMemo } from "react";
import { Flame, Shield, Zap } from "lucide-react";
import { createSkillCategoryGroups, SkillCategoryGroupVM } from "@components/adapters";
import { Card, CardHeader, CardTitle, CardContent } from "@ui";
import { SkillNodeItem } from "./SkillNodeItem";
import { useI18n } from "@context/I18nContext";
import { useSkills } from "@context/GameContext";

export interface SkillTreeConstellationProps {
  readonly className?: string;
  readonly primaryKey?: string;
  readonly secondaryKey?: string;
}

const getCategoryIcon = (iconType: SkillCategoryGroupVM["iconType"]): React.ReactElement => {
  switch (iconType) {
    case "flame":
      return <Flame className="w-4 h-4 text-amber-400" />;
    case "shield":
      return <Shield className="w-4 h-4 text-cyan-400" />;
    case "zap":
      return <Zap className="w-4 h-4 text-purple-400" />;
  }
};

export const SkillTreeConstellation = ({
  className = "",
  primaryKey = "U",
  secondaryKey = "I",
}: SkillTreeConstellationProps): React.ReactElement => {
  const { t } = useI18n();
  const {
    skillTreeNodes,
    selectedSkillId,
    setSelectedSkillId,
    evaluateSkill,
    primarySpellId,
    secondarySpellId,
  } = useSkills();

  const categoryGroups = useMemo(
    () => createSkillCategoryGroups(skillTreeNodes, evaluateSkill, primarySpellId, secondarySpellId),
    [skillTreeNodes, evaluateSkill, primarySpellId, secondarySpellId]
  );

  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      {categoryGroups.map((group) => (
        <Card key={group.key} variant="subtle" className="p-3 md:p-3.5 bg-[#1f0d07]/90 border border-[#5c2d18]">
          <CardHeader className="pb-2">
            <CardTitle icon={getCategoryIcon(group.iconType)} className="text-xs md:text-sm text-stone-200">
              {t(group.labelKey)}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-2.5">
              {group.nodes.map((node) => (
                <SkillNodeItem
                  key={node.id}
                  node={node}
                  isSelected={selectedSkillId === node.id}
                  onSelect={setSelectedSkillId}
                  primaryKey={primaryKey}
                  secondaryKey={secondaryKey}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SkillTreeConstellation;
