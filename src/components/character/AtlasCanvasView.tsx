import React from "react";
import { AnimationName } from "@game/engine/spriteTypes";
import { useI18n } from "@context/I18nContext";
import { AtlasGridOverlay } from "./AtlasGridOverlay";
import { AtlasRowHighlight } from "./AtlasRowHighlight";
import { AtlasRowLabels } from "./AtlasRowLabels";

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
  cellHeight = 128,
  scrollContainerRef,
}) => {
  const { t } = useI18n();
  const activeRow = ANIMATION_ROW_MAP[activeAnimation] ?? 0;
  const isSpritesheet = sheetType === "spritesheet";

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
          {isSpritesheet && showGrid && imageDimensions.width > 0 && (
            <AtlasGridOverlay
              columns={columns}
              rows={rows}
              activeRow={activeRow}
            />
          )}

          {/* Row Highlight Band for active animation */}
          {isSpritesheet && imageDimensions.height > 0 && (
            <AtlasRowHighlight
              activeRow={activeRow}
              animationName={activeAnimation}
              cellHeight={cellHeight}
              zoom={zoom}
            />
          )}

          {/* Side Row Labels overlay */}
          {isSpritesheet && showLabels && imageDimensions.height > 0 && (
            <AtlasRowLabels
              rows={ROW_ANIMATION_KEYS}
              activeRow={activeRow}
              cellHeight={cellHeight}
              zoom={zoom}
            />
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
