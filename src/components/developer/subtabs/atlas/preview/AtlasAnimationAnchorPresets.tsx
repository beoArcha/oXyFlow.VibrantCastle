import React from "react";
import { Crosshair } from "lucide-react";
import { Slider } from "@/components/ui";
import { useI18n } from "@context/I18nContext";
import { AtlasOriginDefinition } from "../types";

export interface AtlasAnimationAnchorPresetsProps {
  fps: number;
  onFpsChange: (fps: number) => void;
  origin?: AtlasOriginDefinition;
  onOriginChange?: (origin: AtlasOriginDefinition) => void;
}

export const AtlasAnimationAnchorPresets: React.FC<AtlasAnimationAnchorPresetsProps> = React.memo(({
  fps,
  onFpsChange,
  origin,
  onOriginChange,
}) => {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-stone-800/80">
      <Slider
        label={t("atlasStudioFps")}
        value={fps}
        onChange={onFpsChange}
        min={1}
        max={60}
        step={1}
        unit=" fps"
      />

      {/* Pivot Presets */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-[#fed7aa] font-medium flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Crosshair size={11} className="text-[#d97706]" />
            {t("atlasStudioAnchor")}
          </span>
          <span className="font-mono text-[10px] text-rose-300">
            ({origin?.normalized?.x ?? 0.5}, {origin?.normalized?.y ?? 1.0})
          </span>
        </span>
        <div className="flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() =>
              onOriginChange?.({
                type: "feet",
                normalized: { x: 0.5, y: 1.0 },
              })
            }
            className="flex-1 py-1 px-1 bg-black/60 rounded border border-stone-800 hover:border-amber-700 text-stone-300 font-bold cursor-pointer"
          >
            {t("atlasStudioAnchorFeet")}
          </button>
          <button
            type="button"
            onClick={() =>
              onOriginChange?.({
                type: "center",
                normalized: { x: 0.5, y: 0.5 },
              })
            }
            className="flex-1 py-1 px-1 bg-black/60 rounded border border-stone-800 hover:border-amber-700 text-stone-300 font-bold cursor-pointer"
          >
            {t("atlasStudioAnchorCenter")}
          </button>
          <button
            type="button"
            onClick={() =>
              onOriginChange?.({
                type: "top_left",
                normalized: { x: 0.0, y: 0.0 },
              })
            }
            className="flex-1 py-1 px-1 bg-black/60 rounded border border-stone-800 hover:border-amber-700 text-stone-300 font-bold cursor-pointer"
          >
            {t("atlasStudioAnchorTopLeft")}
          </button>
        </div>
      </div>
    </div>
  );
});

AtlasAnimationAnchorPresets.displayName = "AtlasAnimationAnchorPresets";
