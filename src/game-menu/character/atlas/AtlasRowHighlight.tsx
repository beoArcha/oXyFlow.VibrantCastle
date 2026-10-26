import React from "react";
import { Check } from "lucide-react";
import { AnimationName } from "@game/engine/spriteTypes";
import { Text } from "@ui";

export interface AtlasRowHighlightProps {
  readonly activeRow: number;
  readonly animationName: AnimationName;
  readonly cellHeight: number;
  readonly zoom: number;
}

/**
 * Visual highlight indicator overlay identifying the active animation track row
 * within the character spritesheet.
 */
export const AtlasRowHighlight: React.FC<AtlasRowHighlightProps> = React.memo(({
  activeRow,
  animationName,
  cellHeight,
  zoom,
}) => {
  return (
    <div
      className="absolute left-0 right-0 border-2 border-amber-400 pointer-events-none transition-all duration-200 shadow-md"
      style={{
        top: `${activeRow * cellHeight * zoom}px`,
        height: `${cellHeight * zoom}px`,
        backgroundColor: "rgba(217, 119, 6, 0.12)",
      }}
    >
      <div className="absolute top-1 left-1.5 bg-amber-600 text-white px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
        <Check size={10} />
        <Text family="mono" weight="bold" size="3xs" className="text-white">
          {animationName.toUpperCase()} (ROW {activeRow})
        </Text>
      </div>
    </div>
  );
});

AtlasRowHighlight.displayName = "AtlasRowHighlight";

export default AtlasRowHighlight;
