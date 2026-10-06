import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useI18n } from "@context/I18nContext";

export interface SchemaValidationBadgeProps {
  isValid: boolean;
  errorCount: number;
  validLabel?: string;
  errorLabelSuffix?: string;
  className?: string;
}

export const SchemaValidationBadge: React.FC<SchemaValidationBadgeProps> = ({
  isValid,
  errorCount,
  validLabel,
  errorLabelSuffix,
  className = "",
}) => {
  const { t } = useI18n();

  if (isValid) {
    return (
      <span
        role="status"
        aria-live="polite"
        className={`flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-md shadow-sm ${className}`}
      >
        <CheckCircle2 size={13} className="shrink-0" />
        <span>{validLabel ?? t("dataStudioValid")}</span>
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-live="polite"
      className={`flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-700/50 px-2.5 py-1 rounded-md shadow-sm ${className}`}
    >
      <AlertTriangle size={13} className="shrink-0" />
      <span>
        {errorCount} {errorLabelSuffix ?? t("dataStudioErrorCount")}
      </span>
    </span>
  );
};
