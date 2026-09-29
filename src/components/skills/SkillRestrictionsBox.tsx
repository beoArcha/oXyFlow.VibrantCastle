import React from "react";
import { ShieldAlert, CheckCircle2, XCircle, UserCheck, AlertTriangle } from "lucide-react";
import { SkillTreeNode } from "@game/types";
import { useI18n } from "@context/I18nContext";
import { useSkills } from "@context/GameContext";
import { Badge } from "../ui";

export interface SkillRestrictionsBoxProps {
  node: SkillTreeNode;
  className?: string;
}

export const SkillRestrictionsBox: React.FC<SkillRestrictionsBoxProps> = ({ node, className = "" }) => {
  const { t } = useI18n();
  const { evaluateSkill, skillPoints } = useSkills();

  const evalResult = evaluateSkill(node.id);
  const isCharacterValen = node.character === "valen";
  const charRestrictionText = isCharacterValen
    ? t("restrictionCharacterValen")
    : t("restrictionCharacterAurelia");

  const localizedRestrictionDesc = node.restrictionKey ? t(node.restrictionKey) : "";
  const reqNode = evalResult.reqSkillNode;

  return (
    <div className={`bg-[#1c0c07]/90 rounded-xl p-3 border border-[#5c2d18] flex flex-col gap-2.5 text-xs ${className}`}>
      {/* Title & Character Restriction Header */}
      <div className="flex items-center justify-between border-b border-[#3d1b0e] pb-1.5">
        <div className="flex items-center gap-1.5 text-[#fbbf24] font-bold">
          <ShieldAlert size={14} className="text-amber-400" />
          <span>{t("requirementsAndRestrictions")}</span>
        </div>
        <Badge variant={isCharacterValen ? "amber" : "cyan"} className="text-[10px]" icon={<UserCheck size={10} />}>
          {isCharacterValen ? "Valen" : "Aurelia"}
        </Badge>
      </div>

      {/* Discipline description */}
      <div className="text-[11px] text-[#fed7aa] italic leading-relaxed">
        {charRestrictionText}
      </div>

      {/* Specific I18N Detailed Restriction */}
      {localizedRestrictionDesc && (
        <div className="bg-[#26120b] p-2 rounded-lg border border-[#5c2d18]/70 text-[#fde68a] text-[11px] leading-relaxed">
          {localizedRestrictionDesc}
        </div>
      )}

      {/* Requirements Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#3d1b0e]">
        {/* Prerequisite Node Requirement */}
        <div className="flex items-center justify-between p-1.5 bg-[#140704] rounded-md border border-[#3d1b0e]">
          <span className="text-stone-400">{t("restrictionPrerequisite")}</span>
          <div className="flex items-center gap-1">
            {reqNode ? (
              <>
                <span className="font-semibold text-stone-200 line-clamp-1 max-w-[90px]">
                  {t(reqNode.skill.nameKey)}
                </span>
                {evalResult.hasPrerequisite ? (
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                ) : (
                  <XCircle size={13} className="text-rose-400 shrink-0" />
                )}
              </>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> {t("restrictionNone")}
              </span>
            )}
          </div>
        </div>

        {/* Skill Points Requirement */}
        <div className="flex items-center justify-between p-1.5 bg-[#140704] rounded-md border border-[#3d1b0e]">
          <span className="text-stone-400">{t("restrictionCost")}</span>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono font-bold ${evalResult.hasPoints ? "text-amber-300" : "text-rose-400"}`}>
              {node.pointCost} PU
            </span>
            <span className="text-[10px] text-stone-500">
              ({skillPoints} PU)
            </span>
            {evalResult.hasPoints ? (
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            ) : (
              <XCircle size={13} className="text-rose-400 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Warning message if currently locked */}
      {!evalResult.isUnlocked && !evalResult.canUnlock && (
        <div className="flex items-start gap-1.5 text-[10px] text-amber-400/90 bg-amber-950/40 border border-amber-800/40 p-1.5 rounded-md">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <span>{t("restrictionUnavailable")}</span>
        </div>
      )}
    </div>
  );
};

export default SkillRestrictionsBox;
