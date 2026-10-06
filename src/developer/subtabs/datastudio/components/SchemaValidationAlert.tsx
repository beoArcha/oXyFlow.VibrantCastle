import React from "react";
import { AlertTriangle } from "lucide-react";
import { ValidationErrorDetail } from "@lib/schemas/commonSchema";
import { useI18n } from "@context/I18nContext";

export interface SchemaValidationAlertProps {
  errors: ValidationErrorDetail[];
  title?: string;
  className?: string;
}

export const SchemaValidationAlert: React.FC<SchemaValidationAlertProps> = ({
  errors,
  title,
  className = "",
}) => {
  const { t } = useI18n();
  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`bg-rose-950/40 border border-rose-900/60 rounded-lg p-3 text-xs text-rose-300 flex flex-col gap-1.5 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-1.5 font-semibold text-rose-400">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
        <span>{title ?? t("dataStudioValidationErrors")}</span>
      </div>
      <ul className="flex flex-col gap-1 pl-1 list-none m-0">
        {errors.map((err, idx) => (
          <li key={`${err.path}-${idx}`} className="font-mono text-[11px] leading-snug">
            <span className="text-rose-400/70 select-none mr-1">•</span>
            <span className="text-amber-300 font-semibold">{err.path}</span>
            <span className="text-rose-200/90">: {err.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
