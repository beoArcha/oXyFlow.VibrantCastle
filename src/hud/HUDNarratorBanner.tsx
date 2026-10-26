import React from "react";
import { Sparkles } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { Paragraph, Text, IconText } from "@ui";
import { HUDPanel } from "./components/common/HUDPanel";
import { cn } from "@lib/utils";
import type { HUDNarratorBannerProps } from "./types";

export const HUDNarratorBanner: React.FC<HUDNarratorBannerProps> = React.memo(({
  narration,
  isAnimating,
}) => {
  const { t } = useI18n();

  if (narration) {
    return (
      <HUDPanel
        variant="active"
        borderColor={isAnimating ? "border-amber-400" : "border-amber-500/40"}
        padding="none"
        className={cn(
          "max-w-2xl px-5 py-3 text-center flex flex-col items-center gap-1 transition-all",
          isAnimating ? "scale-105" : "scale-100"
        )}
      >
        <IconText
          size="2xs"
          weight="black"
          uppercase
          variant="primary"
          icon={<Sparkles size={12} />}
          className="tracking-widest"
        >
          {t("narratorTitle")}
        </IconText>
        <Paragraph
          variant="narrator"
          size="xs"
          className="md:text-sm text-amber-100"
        >
          "{narration}"
        </Paragraph>
      </HUDPanel>
    );
  }

  return (
    <Text
      as="div"
      size="3xs"
      variant="muted"
      className="opacity-40 hover:opacity-100 transition-opacity bg-black/40 px-3 py-1 rounded-full border border-stone-800"
    >
      {t("narratorIdlePrompt")}
    </Text>
  );
});

HUDNarratorBanner.displayName = "HUDNarratorBanner";
export default HUDNarratorBanner;
