import React from "react";
import { ShieldAlert, UserCheck } from "lucide-react";
import { SkillRestrictionVM } from "./skills.mapper";
import { useI18n } from "@context/I18nContext";
import { Alert, Badge, Card } from "@ui";
import { SkillRequirementRow } from "./SkillRequirementRow";

export interface SkillRestrictionsBoxProps {
  readonly restriction: SkillRestrictionVM;
  readonly className?: string;
}

export const SkillRestrictionsBox = ({
  restriction,
  className = "",
}: SkillRestrictionsBoxProps): React.ReactElement => {
  const { t } = useI18n();

  const isValen = restriction.characterName === "Valen";

  return (
    <Card variant="subtle" className={`p-3 flex flex-col gap-2.5 text-xs ${className}`}>
      <div className="flex items-center justify-between border-b border-[#3d1b0e] pb-1.5">
        <div className="flex items-center gap-1.5 text-[#fbbf24] font-bold">
          <ShieldAlert size={14} className="text-amber-400" />
          <span>{t("requirementsAndRestrictions")}</span>
        </div>
        <Badge variant={isValen ? "amber" : "cyan"} className="text-[10px]" icon={<UserCheck size={10} />}>
          {restriction.characterName}
        </Badge>
      </div>

      <div className="text-[11px] text-[#fed7aa] italic leading-relaxed">
        {t(restriction.disciplineKey)}
      </div>

      {restriction.restrictionKey && (
        <div className="bg-[#26120b] p-2 rounded-lg border border-[#5c2d18]/70 text-[#fde68a] text-[11px] leading-relaxed">
          {t(restriction.restrictionKey)}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#3d1b0e]">
        <SkillRequirementRow
          label={t("restrictionPrerequisite")}
          isMet={restriction.hasPrerequisite}
        >
          {restriction.reqSkillNameKey ? (
            <span className="font-semibold text-stone-200 line-clamp-1 max-w-[90px]">
              {t(restriction.reqSkillNameKey)}
            </span>
          ) : (
            <span className="text-emerald-400 text-xs">
              {t("restrictionNone")}
            </span>
          )}
        </SkillRequirementRow>

        <SkillRequirementRow
          label={t("restrictionCost")}
          isMet={restriction.hasPoints}
        >
          <span className={`font-mono font-bold ${restriction.hasPoints ? "text-amber-300" : "text-rose-400"}`}>
            {restriction.pointCost} {t("skillPointsUnit")}
          </span>
          <span className="text-[10px] text-stone-500">
            ({restriction.availablePoints} {t("skillPointsUnit")})
          </span>
        </SkillRequirementRow>
      </div>

      {restriction.isUnavailable && (
        <Alert variant="warning" className="p-2 text-[10px] rounded-lg">
          {t("restrictionUnavailable")}
        </Alert>
      )}
    </Card>
  );
};

export default SkillRestrictionsBox;
