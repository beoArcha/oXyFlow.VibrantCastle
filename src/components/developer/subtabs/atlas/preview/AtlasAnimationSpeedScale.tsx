import React from "react";
import { PlaybackSpeedScaleControl } from "@ui";
import { useI18n } from "@context/I18nContext";

export interface AtlasAnimationSpeedScaleProps {
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 1.0, 2.0];
const SCALE_OPTIONS = [1, 2, 3, 4];

export const AtlasAnimationSpeedScale: React.FC<AtlasAnimationSpeedScaleProps> = React.memo(({
  speedMultiplier,
  onSpeedChange,
  scale,
  onScaleChange,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-800/80 flex-wrap text-xs">
      <PlaybackSpeedScaleControl
        speed={speedMultiplier}
        onSpeedChange={onSpeedChange}
        scale={scale}
        onScaleChange={onScaleChange}
        speedOptions={SPEED_OPTIONS}
        scaleOptions={SCALE_OPTIONS}
        speedLabel={`${t("atlasStudioSpeed")}:`}
        scaleLabel={`${t("atlasStudioScale")}:`}
        className="w-full justify-between"
      />
    </div>
  );
});

AtlasAnimationSpeedScale.displayName = "AtlasAnimationSpeedScale";
