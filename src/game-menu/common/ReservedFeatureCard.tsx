import React from "react";
import { Lock } from "lucide-react";
import { Heading, Paragraph } from "@ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import type { ReservedI18n } from "@i18n/types";

export interface ReservedFeatureCardProps {
  readonly titleKey: keyof ReservedI18n;
  readonly descriptionKey: keyof ReservedI18n;
  readonly className?: string;
}

/**
 * Disabled placeholder for content that is not built yet. Keeps the slot visible
 * so it reads as reserved. Not focusable and not interactive.
 */
export const ReservedFeatureCard = ({
  titleKey,
  descriptionKey,
  className,
}: ReservedFeatureCardProps): React.ReactElement => {
  const { t } = useI18n();
  const titleId = `reserved-${titleKey}`;

  return (
    <div
      role="group"
      aria-disabled="true"
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col gap-2 p-4 rounded-xl border border-dashed border-border-medium bg-surface-darker/60 opacity-70 select-none cursor-not-allowed",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-stone-400 min-w-0">
          <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <Heading id={titleId} level={4} size="sm" variant="muted" className="truncate">
            {t(titleKey)}
          </Heading>
        </div>
        <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wide text-stone-500 whitespace-nowrap">
          {t("reservedComingSoon")}
        </span>
      </div>
      <Paragraph size="xs" variant="muted" className="leading-relaxed">
        {t(descriptionKey)}
      </Paragraph>
    </div>
  );
};

export default ReservedFeatureCard;
