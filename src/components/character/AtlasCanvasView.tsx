import React from "react";
import { AnimationName } from "@game/engine/spriteTypes";
import { cn } from "@lib/utils";
import { Check } from "lucide-react";
import { useI18n } from "@context/I18nContext";

export const ANIMATION_ROW_MAP: Record<AnimationName, number> = {
  idle: 0,
  run: 1,
  move: 1,
  jump: 2,
  fall: 3,
  attack: 4,
  dash: 5,
  cast: 6,
  crouch: 7,
};

export const ROW_ANIMATION_KEYS: Array<{ row: number; name: AnimationName; labelKey: string }> = [
  { row: 0, name: "idle", labelKey: "animIdle" },
  { row: 1, name: "run", labelKey: "animRun" },
  { row: 2, name: "jump", labelKey: "animJump" },
  { row: 3, name: "fall", labelKey: "animFall" },
  { row: 4, name: "attack", labelKey: "animAttack" },
  { row: 5, name: "dash", labelKey: "animDash" },
  { row: 6, name: "cast", labelKey: "animCast" },
  { row: 7, name: "crouch", labelKey: "animCrouch" },
];

export interface AtlasCanvasViewProps {
  activeUrl: string;
  sheetType: "spritesheet" | "portraits";
  zoom: number;
  showGrid: boolean;
  showLabels: boolean;
  imageDimensions: { width: number; height: number };
  activeAnimation?: AnimationName;
  columns?: number;
  rows?: number;
  cellWidth?: number;
  cellHeight?: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Presentational canvas viewport for the texture atlas,
 * grid alignment overlay, active animation band, and row indicators.
 */
export const AtlasCanvasView: React.FC<AtlasCanvasViewProps> = React.memo(({
  activeUrl,
  sheetType,
  zoom,
  showGrid,
  showLabels,
  imageDimensions,
  activeAnimation = "idle",
  columns = 12,
  rows = 8,
  cellWidth = 128,
  cellHeight = 128,
  scrollContainerRef,
}) => {
  const { t } = useI18n();
  const activeRow = ANIMATION_ROW_MAP[activeAnimation] ?? 0;

  return (
    <div
      ref={scrollContainerRef}
      className="w-full max-h-[380px] sm:max-h-[440px] overflow-auto custom-scrollbar rounded-lg bg-[#060201] border border-stone-900 relative p-4 flex items-center justify-center min-h-[260px]"
    >
      {activeUrl ? (
        <div
          className="relative transition-all duration-150 select-none"
          style={{
            width: imageDimensions.width > 0 ? `${imageDimensions.width * zoom}px` : "auto",
            height: imageDimensions.height > 0 ? `${imageDimensions.height * zoom}px` : "auto",
          }}
        >
          {/* Raw Texture Image */}
          <img
            src={activeUrl}
            alt="Character Sprite Atlas"
            className="w-full h-full block image-rendering-pixelated pointer-events-none drop-shadow-md"
            style={{
              imageRendering: "pixelated",
            }}
          />

          {/* Grid Overlay for Spritesheet */}
          {sheetType === "spritesheet" && showGrid && imageDimensions.width > 0 && (
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
                    {/* Cell Coordinate stamp */}
                    <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono text-stone-500/60 leading-none">
                      {r},{c}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Row Highlight Band for active animation */}
          {sheetType === "spritesheet" && imageDimensions.height > 0 && (
            <div
              className="absolute left-0 right-0 border-2 border-amber-400 pointer-events-none transition-all duration-200 shadow-md"
              style={{
                top: `${activeRow * cellHeight * zoom}px`,
                height: `${cellHeight * zoom}px`,
                backgroundColor: "rgba(217, 119, 6, 0.12)",
              }}
            >
              <div className="absolute top-1 left-1.5 bg-amber-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                <Check size={10} />
                <span>
                  {ROW_ANIMATION_KEYS[activeRow]?.name.toUpperCase()} (ROW {activeRow})
                </span>
              </div>
            </div>
          )}

          {/* Side Row Labels overlay */}
          {sheetType === "spritesheet" && showLabels && imageDimensions.height > 0 && (
            <div
              className="absolute -left-28 top-0 bottom-0 flex flex-col pointer-events-none"
              style={{ width: "105px" }}
            >
              {ROW_ANIMATION_KEYS.map((item) => (
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
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center p-8 text-stone-500 text-xs">
          {t("atlasLoading")}
        </div>
      )}
    </div>
  );
});

AtlasCanvasView.displayName = "AtlasCanvasView";

export default AtlasCanvasView;
