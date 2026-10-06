import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@ui";
import { useI18n } from "@context/I18nContext";

export interface SchemaValidationBadgeProps {
  isValid: boolean;
  errorCount: number;
  validLabel?: string;
  errorLabelSuffix?: string;
  className?: string;
}

/**
 * Composite validation status badge utilizing the design system Badge primitive.
 */
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
      <Badge
        variant="green"
        role="status"
        aria-live="polite"
        icon={<CheckCircle2 size={13} className="shrink-0" />}
        className={className}
      >
        <span>{validLabel ?? t("dataStudioValid")}</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="red"
      role="status"
      aria-live="polite"
      icon={<AlertTriangle size={13} className="shrink-0" />}
      className={className}
    >
      <span>
        {errorCount} {errorLabelSuffix ?? t("dataStudioErrorCount")}
      </span>
    </Badge>
  );
};
