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
  readonly activeUrl: string;
  readonly sheetType: "spritesheet" | "portraits";
  readonly zoom: number;
  readonly showGrid: boolean;
  readonly showLabels: boolean;
  readonly imageDimensions: { readonly width: number; readonly height: number };
  readonly activeAnimation?: AnimationName;
  readonly columns?: number;
  readonly rows?: number;
  readonly cellWidth?: number;
  readonly cellHeight?: number;
  readonly animationRows?: readonly AnimationRowVM[];
  readonly scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
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
  cellWidth = 64,
  cellHeight = 64,
  animationRows = DEFAULT_ANIMATION_ROWS,
  scrollContainerRef,
}) => {
  const { t } = useI18n();

  // Resolve row mapping via adapter
  const activeRow = resolveAnimationRowIndex(activeAnimation, animationRows);

  return (
    <div
      ref={scrollContainerRef}
      tabIndex={0}
      role="region"
      aria-label="Atlas texture view"
      className="relative w-full h-[400px] overflow-auto rounded-lg bg-[#080201] border border-amber-900/40 p-4 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
    >
      <div
        className="relative mx-auto transition-transform origin-top-left"
        style={{
          width: `${imageDimensions.width * zoom}px`,
          height: `${imageDimensions.height * zoom}px`,
          marginLeft: showLabels && sheetType === "spritesheet" ? "110px" : "auto",
        }}
      >
        {/* Loading Indicator */}
        {!activeUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-stone-500">
            {t("atlasLoading")}
          </div>
        )}

        {/* Scaled Texture Atlas Image */}
        {activeUrl && (
          <img
            src={activeUrl}
            alt="Texture Atlas"
            className="w-full h-full object-contain pointer-events-none select-none block image-rendering-pixelated"
          />
        )}

        {/* 12x8 Frame Grid Overlay */}
        {showGrid && imageDimensions.width > 0 && (
          <AtlasGridOverlay
            columns={columns}
            rows={rows}
            activeRow={sheetType === "spritesheet" ? activeRow : -1}
          />
        )}

        {/* Active Animation Row Highlighting (only for spritesheet) */}
        {sheetType === "spritesheet" && (
          <AtlasRowHighlight
            activeRow={activeRow}
            animationName={activeAnimation}
            cellHeight={cellHeight}
            zoom={zoom}
          />
        )}

        {/* Side Row Labels (only for spritesheet) */}
        {showLabels && sheetType === "spritesheet" && (
          <AtlasRowLabels
            rows={animationRows}
            activeRow={activeRow}
            cellHeight={cellHeight}
            zoom={zoom}
          />
        )}
      </div>
    </div>
  );
});

AtlasCanvasView.displayName = "AtlasCanvasView";

// Alias for backwards compatibility
export const AtlasTextureView = AtlasCanvasView;

export default AtlasCanvasView;
