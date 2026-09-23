import React from "react";
import { CheckCircle2, Lock, Sparkles } from "lucide-react";
import { SkillTreeNode } from "../../game/types";
import { SkillIcon } from "./SkillIcon";
import { Badge, KbdKey } from "../ui";
import { useI18n } from "../../hooks/useI18n";
import { useSkills } from "../../hooks/useGame";
import { cn } from "../../lib/utils";

export interface SkillNodeItemProps {
  node: SkillTreeNode;
  isSelected: boolean;
  onSelect: (node: SkillTreeNode) => void;
}

export const SkillNodeItem: React.FC<SkillNodeItemProps> = ({ node, isSelected, onSelect }) => {
  const { t } = useI18n();
  const { evaluateSkill, primarySpellId, secondarySpellId } = useSkills();

  const evalResult = evaluateSkill(node.id);
  const isUnlocked = evalResult.isUnlocked;
  const isUnlockable = evalResult.canUnlock;

  const isPrimary = primarySpellId === node.id;
  const isSecondary = secondarySpellId === node.id;

  return (
    <div
      id={`skill-node-${node.id}`}
      onClick={() => onSelect(node)}
      className={cn(
        "p-2.5 rounded-xl border-2 flex flex-col items-center justify-between gap-1.5 transition-all cursor-pointer relative select-none",
        isSelected
          ? "border-amber-400 bg-amber-950/70 ring-2 ring-amber-400/50 scale-[1.03] shadow-lg shadow-amber-950/50 z-10"
          : isUnlocked
          ? "border-[#854d0e] bg-stone-900/90 hover:border-amber-400 hover:bg-stone-800"
          : isUnlockable
          ? "border-purple-500/70 bg-purple-950/40 hover:border-purple-300 animate-pulse"
          : "border-stone-800/80 bg-stone-950/60 opacity-55 hover:opacity-75"
      )}
    >
      {/* Equipped Key Badges in Top Corners */}
      {isPrimary && (
        <span className="absolute -top-2 -left-1 z-20">
          <KbdKey variant="cyan">U</KbdKey>
        </span>
      )}
      {isSecondary && (
        <span className="absolute -top-2 -right-1 z-20">
          <KbdKey variant="amber">I</KbdKey>
        </span>
      )}

      {/* Icon Frame */}
      <div
        className={cn(
          "p-2 rounded-xl border transition-colors",
          isSelected
            ? "bg-amber-900/40 border-amber-400/70 shadow-inner"
            : isUnlocked
            ? "bg-stone-900 border-amber-600/50"
            : isUnlockable
            ? "bg-purple-950/60 border-purple-400/50"
            : "bg-stone-950 border-stone-800"
        )}
      >
        <SkillIcon name={node.skill.iconName} size={22} />
      </div>

      {/* Skill Name */}
      <span className="text-[11px] font-bold text-center text-stone-200 line-clamp-1 w-full px-1">
        {t(node.skill.nameKey)}
      </span>

      {/* Status Badges */}
      <div className="flex items-center gap-1 mt-0.5">
        {isUnlocked ? (
          <Badge variant="green" className="text-[9px] px-1.5 py-0.5" icon={<CheckCircle2 size={10} />}>
            {t("statusLearned")}
          </Badge>
        ) : isUnlockable ? (
          <Badge variant="purple" className="text-[9px] px-1.5 py-0.5 font-mono font-bold" icon={<Sparkles size={9} />}>
            {node.pointCost} PU
          </Badge>
        ) : (
          <Badge variant="stone" className="text-[9px] px-1.5 py-0.5" icon={<Lock size={9} />}>
            {node.pointCost} PU
          </Badge>
        )}
      </div>
    </div>
  );
};

export default SkillNodeItem;
