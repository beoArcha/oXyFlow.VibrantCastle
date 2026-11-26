import React from "react";
import { Sparkles } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { Paragraph, IconText } from "@ui";
import { HUDPanel } from "./components/common/HUDPanel";
import { cn } from "@lib/utils";
import type { HUDNarratorBannerProps } from "./types";

export const HUDNarratorBanner: React.FC<HUDNarratorBannerProps> = React.memo(({
  narration,
  isAnimating,
}) => {
  const { t } = useI18n();

  if (!narration) {
    return null;
  }

  return (
    <HUDPanel
      variant="active"
      borderColor={isAnimating ? "border-amber-400/70" : "border-amber-500/35"}
      padding="none"
      className={cn(
        "max-w-xl px-4 py-2 text-center flex flex-col items-center gap-0.5 transition-all",
        isAnimating ? "scale-[1.02]" : "scale-100"
      )}
    >
      <IconText
        size="3xs"
        weight="bold"
        uppercase
        variant="primary"
        icon={<Sparkles size={11} />}
        className="tracking-widest"
      >
        {t("narratorTitle")}
      </IconText>
      <Paragraph
        variant="narrator"
        size="xs"
        className="text-amber-100 leading-snug"
      >
        "{narration}"
      </Paragraph>
    </HUDPanel>
  );
});

HUDNarratorBanner.displayName = "HUDNarratorBanner";
export default HUDNarratorBanner;
