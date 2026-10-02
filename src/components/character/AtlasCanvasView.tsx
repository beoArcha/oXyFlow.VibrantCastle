import React from "react";
import { AnimationName } from "@game/engine/spriteTypes";
import { useI18n } from "@context/I18nContext";
import {
  AnimationRowVM,
  DEFAULT_ANIMATION_ROWS,
  ANIMATION_ROW_MAP,
  resolveAnimationRowIndex,
} from "@components/adapters";
import { AtlasGridOverlay } from "./AtlasGridOverlay";
import { AtlasRowHighlight } from "./AtlasRowHighlight";
import { AtlasRowLabels } from "./AtlasRowLabels";

// Re-exported for backwards compatibility
export { ANIMATION_ROW_MAP };
export const ROW_ANIMATION_KEYS = DEFAULT_ANIMATION_ROWS;

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
  animationRows?: readonly AnimationRowVM[];
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Presentational texture viewport for the texture atlas,
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
  animationRows = DEFAULT_ANIMATION_ROWS,
  scrollContainerRef,
}) => {
  const { t } = useI18n();
  const activeRow = resolveAnimationRowIndex(activeAnimation);
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
              rows={animationRows as any}
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

export const AtlasTextureView = AtlasCanvasView;
export type AtlasTextureViewProps = AtlasCanvasViewProps;

export default AtlasCanvasView;
