import React, { useMemo } from "react";
import { Layers, Music, Sparkles } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, SegmentedControl } from "@ui";
import { useI18n } from "@context/I18nContext";
import { BackgroundLayerTier } from "@game/locations/schema/locationSchema";
import { PARALLAX_TIERS, MUSIC_INTENSITY_PRESETS } from "./constants";
import { TesterParallaxCardProps } from "./types";

/**
 * Presentation card for parallax depth tiers, dynamic music intensity and particle bursts.
 */
export const TesterParallaxCard: React.FC<TesterParallaxCardProps> = ({
  parallaxTiers,
  onToggleParallaxTier,
  onSetMusicIntensity,
  onTriggerParticleBurst,
}) => {
  const { t } = useI18n();

  const musicOptions = useMemo(
    () =>
      MUSIC_INTENSITY_PRESETS.map((m) => ({
        value: m.val,
        label: t(m.labelKey),
      })),
    [t]
  );

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Layers className="w-4 h-4 text-amber-400" />}>
          {t("testerParallaxTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <div className="text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
            <Layers size={13} className="text-amber-400" />
            <span>{t("testerParallaxTiersLabel")}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {PARALLAX_TIERS.map((tier: BackgroundLayerTier) => (
              <Button
                key={tier}
                size="sm"
                variant={parallaxTiers[tier] ? "primary" : "secondary"}
                onClick={() => onToggleParallaxTier(tier)}
                className="text-xs"
              >
                {tier.toUpperCase()}:{" "}
                {parallaxTiers[tier] ? t("testerStatusOn") : t("testerStatusOff")}
              </Button>
            ))}
          </div>
        </div>

        <Card variant="dark" className="p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Music size={15} className="text-purple-400" />
            <span className="text-xs font-bold text-stone-200">
              {t("testerMusicIntensityLabel")}
            </span>
          </div>
          <SegmentedControl
            options={musicOptions}
            value={0.4}
            onChange={onSetMusicIntensity}
            size="sm"
          />
        </Card>

        <Card variant="dark" className="p-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-amber-400" />
            <span className="text-xs font-bold text-stone-200">
              {t("testerParticlesTestLabel")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onTriggerParticleBurst("spark")}
            >
              {t("testerParticleSpark")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onTriggerParticleBurst("magic")}
            >
              {t("testerParticleMagic")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onTriggerParticleBurst("dust")}
            >
              {t("testerParticleDust")}
            </Button>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
};

export default TesterParallaxCard;
