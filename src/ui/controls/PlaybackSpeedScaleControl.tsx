import React from "react";
import { cn } from "@lib/utils";
import { SegmentedControl } from "./SegmentedControl";

export interface PlaybackSpeedScaleControlProps {
  readonly speed: number;
  readonly onSpeedChange: (speed: number) => void;
  readonly scale: number;
  readonly onScaleChange: (scale: number) => void;
  readonly speedOptions?: readonly number[];
  readonly scaleOptions?: readonly number[];
  readonly speedLabel?: string;
  readonly scaleLabel?: string;
  readonly className?: string;
}

const DEFAULT_SPEED_OPTIONS: readonly number[] = [0.5, 1.0, 1.5];
const DEFAULT_SCALE_OPTIONS: readonly number[] = [1.0, 1.5, 2.0, 2.5];

/**
 * Reusable animation playback speed and viewport zoom scale control.
 * Shared across Character Stage and Atlas Studio developer tools.
 */
export const PlaybackSpeedScaleControl: React.FC<PlaybackSpeedScaleControlProps> = React.memo(({
  speed,
  onSpeedChange,
  scale,
  onScaleChange,
  speedOptions = DEFAULT_SPEED_OPTIONS,
  scaleOptions = DEFAULT_SCALE_OPTIONS,
  speedLabel = "Spd:",
  scaleLabel = "Zoom:",
  className,
}) => {
  const speedSegments = speedOptions.map((s) => ({
    value: s,
    label: `${s}x`,
  }));

  const scaleSegments = scaleOptions.map((sc) => ({
    value: sc,
    label: `${sc}x`,
  }));

  return (
    <div className={cn("flex items-center gap-2 shrink-0 flex-wrap", className)}>
      {/* Speed Selector */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-stone-400 font-mono select-none">{speedLabel}</span>
        <SegmentedControl<number>
          options={speedSegments}
          value={speed}
          onChange={onSpeedChange}
          size="sm"
        />
      </div>

      {/* Scale / Zoom Selector */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-stone-400 font-mono select-none">{scaleLabel}</span>
        <SegmentedControl<number>
          options={scaleSegments}
          value={scale}
          onChange={onScaleChange}
          size="sm"
        />
      </div>
    </div>
  );
});

PlaybackSpeedScaleControl.displayName = "PlaybackSpeedScaleControl";

export default PlaybackSpeedScaleControl;
