import React from "react";
import { CheckCircle2, Lock, Sparkles } from "lucide-react";
import { SkillNodeVM } from "@components/adapters";
import { SkillIcon } from "./SkillIcon";
import { Badge, KbdKey } from "../ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface SkillNodeItemProps {
  readonly node: SkillNodeVM;
  readonly isSelected: boolean;
  readonly onSelect: (nodeId: string) => void;
  readonly primaryKey?: string;
  readonly secondaryKey?: string;
}

export const SkillNodeItem = ({
  node,
  isSelected,
  onSelect,
  primaryKey = "U",
  secondaryKey = "I",
}: SkillNodeItemProps): React.ReactElement => {
  const { t } = useI18n();

  return (
    <div
      id={`skill-node-${node.id}`}
      onClick={() => onSelect(node.id)}
      className={cn(
        "p-2.5 rounded-xl border-2 flex flex-col items-center justify-between gap-1.5 transition-all cursor-pointer relative select-none",
        isSelected
          ? "border-amber-400 bg-amber-950/70 ring-2 ring-amber-400/50 scale-[1.03] shadow-lg shadow-amber-950/50 z-10"
          : node.isUnlocked
            ? "border-[#854d0e] bg-stone-900/90 hover:border-amber-400 hover:bg-stone-800"
            : node.isUnlockable
              ? "border-purple-500/70 bg-purple-950/40 hover:border-purple-300 animate-pulse"
              : "border-stone-800/80 bg-stone-950/60 opacity-55 hover:opacity-75"
      )}
    >
      {node.isPrimary && (
        <span className="absolute -top-2 -left-1 z-20">
          <KbdKey variant="cyan">{primaryKey}</KbdKey>
        </span>
      )}
      {node.isSecondary && (
        <span className="absolute -top-2 -right-1 z-20">
          <KbdKey variant="amber">{secondaryKey}</KbdKey>
        </span>
      )}

      <div
        className={cn(
          "p-2 rounded-xl border transition-colors",
          isSelected
            ? "bg-amber-900/40 border-amber-400/70 shadow-inner"
            : node.isUnlocked
              ? "bg-stone-900 border-amber-600/50"
              : node.isUnlockable
                ? "bg-purple-950/60 border-purple-400/50"
                : "bg-stone-950 border-stone-800"
        )}
      >
        <SkillIcon name={node.iconName} size={22} />
      </div>

      <span className="text-[11px] font-bold text-center text-stone-200 line-clamp-1 w-full px-1">
        {t(node.nameKey)}
      </span>

      <div className="flex items-center gap-1 mt-0.5">
        {node.isUnlocked ? (
          <Badge variant="green" className="text-[9px] px-1.5 py-0.5" icon={<CheckCircle2 size={10} />}>
            {t("statusLearned")}
          </Badge>
        ) : (
          <Badge
            variant={node.isUnlockable ? "purple" : "stone"}
            className="text-[9px] px-1.5 py-0.5 font-mono font-bold"
            icon={node.isUnlockable ? <Sparkles size={9} /> : <Lock size={9} />}
          >
            {node.pointCost} {t("skillPointsUnit")}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default SkillNodeItem;
