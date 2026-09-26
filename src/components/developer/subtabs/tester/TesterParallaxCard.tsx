import React from "react";
import { Layers, Music, Sparkles } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";
import { BackgroundLayerTier } from "../../../../game/locations/schema/locationSchema";

const PARALLAX_TIERS: BackgroundLayerTier[] = ["far", "mid_far", "mid", "mid_close", "close"];

export interface TesterParallaxCardProps {
  parallaxTiers: Record<BackgroundLayerTier, boolean>;
  onToggleParallaxTier: (tier: BackgroundLayerTier) => void;
  onSetMusicIntensity: (intensity: number) => void;
  onTriggerParticleBurst: (type: "spark" | "magic" | "dust") => void;
}

export const TesterParallaxCard: React.FC<TesterParallaxCardProps> = ({
  parallaxTiers,
  onToggleParallaxTier,
  onSetMusicIntensity,
  onTriggerParticleBurst,
}) => {
  const { t } = useI18n();

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Layers className="w-4 h-4 text-amber-400" />}>
          {t("testerParallaxTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Parallax Layer Toggles */}
        <div>
          <div className="text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
            <Layers size={13} className="text-amber-400" />
            <span>{t("testerParallaxTiersLabel")}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {PARALLAX_TIERS.map((tier) => (
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

        {/* Music Intensity */}
        <div className="p-3 bg-[#180904] rounded-lg border border-[#4a1d0d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Music size={15} className="text-purple-400" />
            <span className="text-xs font-bold text-stone-200">
              {t("testerMusicIntensityLabel")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { labelKey: "testerMusicChill", val: 0.1 },
              { labelKey: "testerMusicSuspense", val: 0.4 },
              { labelKey: "testerMusicCombat", val: 0.7 },
              { labelKey: "testerMusicClimax", val: 1.0 },
            ].map((m) => (
              <Button
                key={m.val}
                size="sm"
                variant="secondary"
                onClick={() => onSetMusicIntensity(m.val)}
              >
                {t(m.labelKey)}
              </Button>
            ))}
          </div>
        </div>

        {/* Particle Emitter Test */}
        <div className="flex items-center justify-between p-2.5 bg-[#180904] rounded-lg border border-[#4a1d0d] flex-wrap gap-2">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default TesterParallaxCard;
