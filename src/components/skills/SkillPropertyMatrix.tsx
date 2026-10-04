import React from "react";
import { SkillPropertyItemVM } from "@components/adapters";
import { useI18n } from "@context/I18nContext";
import { StatRow } from "@ui";

export interface SkillPropertyMatrixProps {
  readonly properties: readonly SkillPropertyItemVM[];
  readonly className?: string;
}

export const SkillPropertyMatrix = ({
  properties,
  className = "",
}: SkillPropertyMatrixProps): React.ReactElement | null => {
  const { t } = useI18n();

  if (properties.length === 0) {
    return null;
  }

  return (
    <div className={`bg-[#140704] rounded-xl p-2.5 border border-[#3d1b0e] flex flex-col gap-1.5 text-xs ${className}`}>
      {properties.map((prop) => (
        <StatRow
          key={prop.id}
          label={t(prop.labelKey)}
          value={prop.value}
          className={prop.colorClass}
        />
      ))}
    </div>
  );
};

export default SkillPropertyMatrix;
