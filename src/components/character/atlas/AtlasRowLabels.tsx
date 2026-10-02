import React from "react";
import { cn } from "@lib/utils";
import { useI18n } from "@context/I18nContext";
import { AnimationName } from "@game/engine/spriteTypes";

import { RowAnimationKey } from "./types";

export type { RowAnimationKey };

export interface AtlasRowLabelsProps {
  readonly rows: readonly RowAnimationKey[];
  readonly activeRow: number;
  readonly cellHeight: number;
  readonly zoom: number;
}

/**
 * Side row label tags indicating animation state names alongside the spritesheet.
 */
export const AtlasRowLabels: React.FC<AtlasRowLabelsProps> = React.memo(({
  rows,
  activeRow,
  cellHeight,
  zoom,
}) => {
  const { t } = useI18n();

  return (
    <div
      className="absolute -left-28 top-0 bottom-0 flex flex-col pointer-events-none"
      style={{ width: "105px" }}
    >
      {rows.map((item) => (
        <div
          key={item.row}
          className="flex items-center justify-end pr-2"
          style={{ height: `${cellHeight * zoom}px` }}
        >
          <span
            className={cn(
              "text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded transition-colors whitespace-nowrap",
              item.row === activeRow
                ? "bg-amber-600 text-white font-bold shadow-xs"
                : "text-stone-400 bg-black/70 border border-stone-800"
            )}
          >
            {item.row === activeRow ? "▶ " : ""}
            {t(item.labelKey)}
          </span>
        </div>
      ))}
    </div>
  );
});

AtlasRowLabels.displayName = "AtlasRowLabels";

export default AtlasRowLabels;
