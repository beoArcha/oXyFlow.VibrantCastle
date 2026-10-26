import React from "react";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import { Button, Text } from "@ui";

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
      <Text size="2xs" variant="muted" className="mr-1">{t("audioPresetsLabel")}</Text>
      {presets.map((p) => {
        const isSelected = activePercent === p;
        return (
          <Button
            key={p}
            variant="ghost"
            size="sm"
            onClick={() => onSelectPercent(p)}
            className={cn(
              "h-auto px-2 py-0.5 rounded transition-all border",
              isSelected
                ? "bg-amber-600 text-white border-amber-400 shadow-sm hover:bg-amber-500"
                : "bg-[#140602] text-stone-400 hover:text-amber-200 border-stone-800 hover:border-amber-700/60"
            )}
          >
            <Text family="mono" weight="bold" size="2xs" className="text-inherit">
              {p === 0 ? t("audioMute") : `${p}%`}
            </Text>
          </Button>
        );
      })}
    </div>
  );
});

VolumePresetBar.displayName = "VolumePresetBar";
export default VolumePresetBar;
