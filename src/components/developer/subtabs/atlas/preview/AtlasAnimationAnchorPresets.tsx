import React from "react";
import { Crosshair } from "lucide-react";
import { Slider, SegmentedControl, SegmentedControlOption } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { AtlasOriginDefinition } from "../types";

export interface AtlasAnimationAnchorPresetsProps {
  fps: number;
  onFpsChange: (fps: number) => void;
  origin?: AtlasOriginDefinition;
  onOriginChange?: (origin: AtlasOriginDefinition) => void;
}

type OriginPresetType = "feet" | "center" | "top_left";

export const AtlasAnimationAnchorPresets: React.FC<AtlasAnimationAnchorPresetsProps> = React.memo(({
  fps,
  onFpsChange,
  origin,
  onOriginChange,
}) => {
  const { t } = useI18n();

  const presets: { type: OriginPresetType; normalized: { x: number; y: number }; label: string }[] = [
    {
      type: "feet",
      normalized: { x: 0.5, y: 1.0 },
      label: t("atlasStudioAnchorFeet"),
    },
    {
      type: "center",
      normalized: { x: 0.5, y: 0.5 },
      label: t("atlasStudioAnchorCenter"),
    },
    {
      type: "top_left",
      normalized: { x: 0.0, y: 0.0 },
      label: t("atlasStudioAnchorTopLeft"),
    },
  ];

  const activeType: OriginPresetType =
    origin?.type === "center" || origin?.type === "top_left" || origin?.type === "feet"
      ? origin.type
      : "feet";

  const options: SegmentedControlOption<OriginPresetType>[] = presets.map((p) => ({
    value: p.type,
    label: p.label,
  }));

  const handleSelect = (val: OriginPresetType) => {
    const matched = presets.find((p) => p.type === val);
    if (matched) {
      onOriginChange?.({
        type: matched.type,
        normalized: matched.normalized,
      });
    }
  };

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
        <SegmentedControl<OriginPresetType>
          options={options}
          value={activeType}
          onChange={handleSelect}
          fullWidth
          size="sm"
        />
      </div>
    </div>
  );
});

AtlasAnimationAnchorPresets.displayName = "AtlasAnimationAnchorPresets";

export default AtlasAnimationAnchorPresets;
