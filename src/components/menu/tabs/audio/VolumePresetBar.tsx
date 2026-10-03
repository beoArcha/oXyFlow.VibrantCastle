import React from "react";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface VolumePresetBarProps {
  readonly activePercent: number;
  readonly onSelectPercent: (percent: number) => void;
  readonly presets?: readonly number[];
  readonly className?: string;
}

const DEFAULT_PRESETS: readonly number[] = [0, 25, 50, 75, 100];

/**
 * Shared menu control for quick audio volume presets.
 * Renders selectable percentage pills with active highlights and mute translation.
 */
export const VolumePresetBar: React.FC<VolumePresetBarProps> = React.memo(({
  activePercent,
  onSelectPercent,
  presets = DEFAULT_PRESETS,
  className,
}) => {
  const { t } = useI18n();

  return (
    <div className={cn("flex items-center gap-1.5 pt-1", className)}>
      <span className="text-[11px] text-stone-400 mr-1">{t("audioPresetsLabel")}</span>
      {presets.map((p) => {
        const isSelected = activePercent === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onSelectPercent(p)}
            className={cn(
              "px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer border",
              isSelected
                ? "bg-amber-600 text-white border-amber-400 shadow-sm"
                : "bg-[#140602] text-stone-400 hover:text-amber-200 border-stone-800 hover:border-amber-700/60"
            )}
          >
            {p === 0 ? t("audioMute") : `${p}%`}
          </button>
        );
      })}
    </div>
  );
});

VolumePresetBar.displayName = "VolumePresetBar";
export default VolumePresetBar;
