import React from "react";
import { AssetQuality } from "@game/types";
import { useI18n } from "@context/I18nContext";
import { Badge } from "@components/ui";

export interface AtlasViewerFooterProps {
  readonly imageDimensions: { readonly width: number; readonly height: number };
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly columns?: number;
  readonly rows?: number;
  readonly quality: AssetQuality;
}

/**
 * Metadata footer for AtlasSheetViewer displaying image dimensions,
 * cell resolution, total frame count, and quality level.
 */
export const AtlasViewerFooter: React.FC<AtlasViewerFooterProps> = React.memo(({
  imageDimensions,
  cellWidth,
  cellHeight,
  columns = 12,
  rows = 8,
  quality,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] text-stone-400 font-mono border-t border-stone-800/80 pt-2">
      <div className="flex items-center gap-3">
        <span>
          {t("atlasDimensions")}{" "}
          <strong className="text-amber-300">
            {imageDimensions.width} × {imageDimensions.height} px
          </strong>
        </span>
        <span>•</span>
        <span>
          {t("atlasCellSize")}{" "}
          <strong className="text-amber-300">
            {Math.round(cellWidth)} × {Math.round(cellHeight)} px
          </strong>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-stone-500">
          {columns * rows} {t("atlasGridFrames")} ({columns}×{rows})
        </span>
        <Badge variant="amber" className="text-[10px] font-bold">
          {quality.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
});

AtlasViewerFooter.displayName = "AtlasViewerFooter";

export default AtlasViewerFooter;
