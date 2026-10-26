import React from "react";
import { Sparkles } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { Paragraph, Text } from "@ui";
import { cn } from "@lib/utils";
import type { HUDNarratorBannerProps } from "./types";

export const HUDNarratorBanner: React.FC<HUDNarratorBannerProps> = React.memo(({
  narration,
  isAnimating,
}) => {
  const { t } = useI18n();

  if (narration) {
    return (
      <div
        className={cn(
          "max-w-2xl bg-stone-950/90 backdrop-blur-md border border-amber-500/40 rounded-2xl px-5 py-3 shadow-2xl text-center flex flex-col items-center gap-1 transition-all",
          isAnimating ? "scale-105 border-amber-400" : "scale-100"
        )}
      >
        <Text
          size="2xs"
          weight="black"
          uppercase
          variant="primary"
          className="flex items-center gap-1.5 tracking-widest"
        >
          <Sparkles size={12} />
          {t("narratorTitle")}
        </Text>
        <Paragraph
          variant="narrator"
          size="xs"
          className="md:text-sm text-amber-100"
        >
          "{narration}"
        </Paragraph>
      </div>
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
