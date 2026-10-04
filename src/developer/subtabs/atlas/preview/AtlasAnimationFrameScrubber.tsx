import React from "react";
import { Button } from "@ui";

export interface AtlasAnimationFrameScrubberProps {
  totalFrames: number;
  currentFrame: number;
  onSelectFrame: (fIdx: number) => void;
}

export const AtlasAnimationFrameScrubber: React.FC<AtlasAnimationFrameScrubberProps> = React.memo(({
  totalFrames,
  currentFrame,
  onSelectFrame,
}) => {
  if (totalFrames <= 0) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-1">
      {Array.from({ length: totalFrames }).map((_, fIdx) => {
        const isSelected = currentFrame === fIdx;
        return (
          <Button
            key={fIdx}
            size="sm"
            variant={isSelected ? "primary" : "secondary"}
            onClick={() => onSelectFrame(fIdx)}
            className={`h-6 px-2 min-h-0 text-xs font-mono font-bold shrink-0 ${!isSelected ? "bg-black/50 border-stone-800 text-stone-400 hover:text-stone-200" : ""
              }`}
          >
            #{fIdx}
          </Button>
        );
      })}
    </div>
  );
});

AtlasAnimationFrameScrubber.displayName = "AtlasAnimationFrameScrubber";

export default AtlasAnimationFrameScrubber;
