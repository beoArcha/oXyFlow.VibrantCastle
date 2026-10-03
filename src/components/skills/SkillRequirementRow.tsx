import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export interface SkillRequirementRowProps {
  readonly label: string;
  readonly isMet: boolean;
  readonly children: React.ReactNode;
}

export const SkillRequirementRow = ({
  label,
  isMet,
  children,
}: SkillRequirementRowProps): React.ReactElement => {
  return (
    <div className="flex items-center justify-between p-1.5 bg-[#140704] rounded-md border border-[#3d1b0e]">
      <span className="text-stone-400">{label}</span>
      <div className="flex items-center gap-1.5">
        {children}
        {isMet ? (
          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
        ) : (
          <XCircle size={13} className="text-rose-400 shrink-0" />
        )}
      </div>
    </div>
  );
};

export default SkillRequirementRow;
