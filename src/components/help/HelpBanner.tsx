import React from "react";
import { HelpCircle } from "lucide-react";
import { useI18n } from "@hooks/useI18n";

export interface HelpBannerProps {
  className?: string;
}

/**
 * Top summary banner for the Help & Guide modal.
 * Uses centralized i18n for text resolution.
 */
export const HelpBanner: React.FC<HelpBannerProps> = ({ className = "" }) => {
  const { t } = useI18n();

  return (
    <div
      className={`bg-[#1c0c07] border border-amber-500/40 rounded-xl p-4 flex items-start gap-3 ${className}`}
    >
      <HelpCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1">
        <span className="font-bold text-amber-300">
          {t("helpGuideSubtitle")}
        </span>
        <p className="text-xs text-stone-300 leading-relaxed">
          {t("tipsTextShortcuts")}
        </p>
      </div>
    </div>
  );
};

export default HelpBanner;
