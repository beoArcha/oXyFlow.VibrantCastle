import React from "react";
import { Sparkles } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { HUDNarratorBannerProps } from "./types";
import { cn } from "@lib/utils";

/**
 * Bastion-style narrator subtitle card displayed at the bottom of the HUD.
 */
export const HUDNarratorBanner: React.FC<HUDNarratorBannerProps> = React.memo(({
  narration,
  isAnimating,
}) => {
  const { t } = useI18n();

  if (narration) {
    return (
      <div
        className={cn(
          "max-w-2xl bg-[#140602]/90 backdrop-blur-md border border-amber-500/40 rounded-2xl px-5 py-3 shadow-2xl text-center flex flex-col items-center gap-1 transition-all",
          isAnimating ? "scale-105 border-amber-400" : "scale-100"
        )}
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
          <Sparkles size={12} />
          {t("narratorTitle")}
        </span>
        <p className="text-xs md:text-sm font-serif text-[#fed7aa] italic leading-relaxed">
          "{narration}"
        </p>
      </div>
    );
  }

  return (
    <div className="opacity-40 hover:opacity-100 text-[10px] text-stone-400 transition-opacity bg-black/40 px-3 py-1 rounded-full border border-stone-800">
      {t("narratorIdlePrompt")}
    </div>
  );
});
