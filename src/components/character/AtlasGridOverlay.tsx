import React from "react";
import { cn } from "@lib/utils";

export interface AtlasGridOverlayProps {
  columns: number;
  rows: number;
  activeRow: number;
}

/**
 * 12x8 pixel grid overlay displaying individual sprite frame boundaries
 * and hover coordinate stamps ({r},{c}).
 */
export const AtlasGridOverlay: React.FC<AtlasGridOverlayProps> = React.memo(({
  columns,
  rows,
  activeRow,
}) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none border border-amber-500/40"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: rows * columns }).map((_, idx) => {
        const r = Math.floor(idx / columns);
        const c = idx % columns;
        const isActiveAnimationRow = r === activeRow;

        return (
          <div
            key={idx}
            className={cn(
              "border border-amber-500/20 relative transition-colors",
              isActiveAnimationRow && "bg-amber-500/10 border-amber-400/50"
            )}
          >
            <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono text-stone-500/60 leading-none">
              {r},{c}
            </span>
          </div>
        );
      })}
    </div>
  );
});

AtlasGridOverlay.displayName = "AtlasGridOverlay";

export default AtlasGridOverlay;
