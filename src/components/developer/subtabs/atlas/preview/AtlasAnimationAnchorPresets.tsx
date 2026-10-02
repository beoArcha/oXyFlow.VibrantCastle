import React from "react";
import { Crosshair } from "lucide-react";
import { Slider, Button } from "@components/ui";
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

  const presets = [
    {
      type: "feet" as const,
      normalized: { x: 0.5, y: 1.0 },
      label: t("atlasStudioAnchorFeet"),
    },
    {
      type: "center" as const,
      normalized: { x: 0.5, y: 0.5 },
      label: t("atlasStudioAnchorCenter"),
    },
    {
      type: "top_left" as const,
      normalized: { x: 0.0, y: 0.0 },
      label: t("atlasStudioAnchorTopLeft"),
    },
  ];

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
          {presets.map((p) => {
            const isSelected = origin?.type === p.type;
            return (
              <Button
                key={p.type}
                size="sm"
                variant={isSelected ? "primary" : "secondary"}
                onClick={() =>
                  onOriginChange?.({
                    type: p.type,
                    normalized: p.normalized,
                  })
                }
                className="flex-1 h-7 py-1 px-1 text-[10px] font-bold"
              >
                {p.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

AtlasAnimationAnchorPresets.displayName = "AtlasAnimationAnchorPresets";
