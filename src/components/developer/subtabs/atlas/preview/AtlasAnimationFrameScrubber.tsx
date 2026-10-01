import React from "react";

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
      {Array.from({ length: totalFrames }).map((_, fIdx) => (
        <button
          key={fIdx}
          type="button"
          onClick={() => onSelectFrame(fIdx)}
          className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all border cursor-pointer ${
            currentFrame === fIdx
              ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-400 shadow-md shadow-amber-950/50"
              : "bg-black/50 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700"
          }`}
        >
          #{fIdx}
        </button>
      ))}
    </div>
  );
});

AtlasAnimationFrameScrubber.displayName = "AtlasAnimationFrameScrubber";
