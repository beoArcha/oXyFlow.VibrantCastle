import React from "react";
import { useI18n } from "@context/I18nContext";

export interface AtlasAnimationSpeedScaleProps {
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
}

export const AtlasAnimationSpeedScale: React.FC<AtlasAnimationSpeedScaleProps> = React.memo(({
  speedMultiplier,
  onSpeedChange,
  scale,
  onScaleChange,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-800/80 flex-wrap text-xs">
      <div className="flex items-center gap-1">
        <span className="text-stone-400 text-[11px] font-medium">{t("atlasStudioSpeed")}:</span>
        {[0.25, 0.5, 1.0, 2.0].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeedChange(s)}
            className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold cursor-pointer ${
              speedMultiplier === s
                ? "bg-amber-600 text-white"
                : "bg-black/60 text-stone-400 hover:text-stone-200"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-stone-400 text-[11px] font-medium">{t("atlasStudioScale")}:</span>
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onScaleChange(s)}
            className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold cursor-pointer ${
              scale === s
                ? "bg-amber-600 text-white"
                : "bg-black/60 text-stone-400 hover:text-stone-200"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
});

AtlasAnimationSpeedScale.displayName = "AtlasAnimationSpeedScale";
