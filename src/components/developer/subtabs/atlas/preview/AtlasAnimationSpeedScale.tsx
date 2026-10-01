import React from "react";
import { SegmentedControl } from "@components/ui";
import { useI18n } from "@context/I18nContext";

export interface AtlasAnimationSpeedScaleProps {
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 1.0, 2.0].map((s) => ({
  value: s,
  label: `${s}x`,
}));

const SCALE_OPTIONS = [1, 2, 3, 4].map((s) => ({
  value: s,
  label: `${s}x`,
}));

export const AtlasAnimationSpeedScale: React.FC<AtlasAnimationSpeedScaleProps> = React.memo(({
  speedMultiplier,
  onSpeedChange,
  scale,
  onScaleChange,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-800/80 flex-wrap text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-stone-400 text-[11px] font-medium">{t("atlasStudioSpeed")}:</span>
        <SegmentedControl<number>
          options={SPEED_OPTIONS}
          value={speedMultiplier}
          onChange={onSpeedChange}
          size="sm"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-stone-400 text-[11px] font-medium">{t("atlasStudioScale")}:</span>
        <SegmentedControl<number>
          options={SCALE_OPTIONS}
          value={scale}
          onChange={onScaleChange}
          size="sm"
        />
      </div>
    </div>
  );
});

AtlasAnimationSpeedScale.displayName = "AtlasAnimationSpeedScale";
