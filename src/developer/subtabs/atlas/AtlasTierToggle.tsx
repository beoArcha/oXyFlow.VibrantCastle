import React from "react";
import { Button } from "@ui";
import { useI18n } from "@context/I18nContext";
import { ATLAS_HERO_TIER_ORDER, type AtlasHeroTier } from "./heroPixelTiers";

const TIER_LABEL_KEY = {
  low: "assetQualityLow",
  mid: "assetQualityMid",
  high: "assetQualityHigh",
} as const;

export interface AtlasTierToggleProps {
  tiers: readonly AtlasHeroTier[];
  selectedTier: AtlasHeroTier;
  onSelectTier: (tier: AtlasHeroTier) => void;
}

/** Quality tier switch (hi-8bit / hi-16bit / painted) shown only for heroes that have compiled pixel sheets. */
export const AtlasTierToggle: React.FC<AtlasTierToggleProps> = ({ tiers, selectedTier, onSelectTier }) => {
  const { t } = useI18n();
  if (tiers.length === 0) return null;

  return (
    <div role="group" aria-label={t("assetQualityOption")} className="flex items-center gap-1">
      {ATLAS_HERO_TIER_ORDER.filter((tier) => tiers.includes(tier)).map((tier) => (
        <Button
          key={tier}
          size="sm"
          variant={tier === selectedTier ? "primary" : "ghost"}
          aria-pressed={tier === selectedTier}
          onClick={() => onSelectTier(tier)}
          className="h-8 px-2.5"
        >
          {t(TIER_LABEL_KEY[tier])}
        </Button>
      ))}
    </div>
  );
};

export default AtlasTierToggle;
