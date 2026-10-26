import React from "react";
import { HelpCircle } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import { HelpBannerProps } from "./types";
import { Paragraph, Text } from "@ui";

export type { HelpBannerProps };

/**
 * Top summary banner for the Help & Guide modal.
 * Uses centralized i18n for text resolution.
 */
export const HelpBanner: React.FC<HelpBannerProps> = React.memo(
  function HelpBanner({ className = "" }) {
    const { t } = useI18n();

    return (
      <div
        className={cn(
          "bg-stone-950/80 border border-amber-900/40 rounded-xl p-4 flex items-start gap-3",
          className
        )}
      >
        <HelpCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <Text weight="bold" className="text-amber-300">
            {t("helpGuideSubtitle")}
          </Text>
          <Paragraph size="xs" variant="muted" className="leading-relaxed">
            {t("tipsTextShortcuts")}
          </Paragraph>
        </div>
      </div>
    );
  }
);

HelpBanner.displayName = "HelpBanner";

export default HelpBanner;
