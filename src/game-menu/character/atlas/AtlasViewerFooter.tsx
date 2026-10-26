import React from "react";
import { AssetQuality } from "@game/types";
import { useI18n } from "@context/I18nContext";
import { Badge, Text } from "@ui";
import { ImageDimensions } from "../types";

export interface AtlasViewerFooterProps {
  readonly imageDimensions: ImageDimensions;
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
    <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] text-stone-400 border-t border-stone-800/80 pt-2">
      <div className="flex items-center gap-3">
        <Text family="mono" size="2xs" variant="muted">
          {t("atlasDimensions")}{" "}
          <Text family="mono" weight="bold" size="2xs" variant="amber">
            {imageDimensions.width} × {imageDimensions.height} px
          </Text>
        </Text>
        <span>•</span>
        <Text family="mono" size="2xs" variant="muted">
          {t("atlasCellSize")}{" "}
          <Text family="mono" weight="bold" size="2xs" variant="amber">
            {Math.round(cellWidth)} × {Math.round(cellHeight)} px
          </Text>
        </Text>
      </div>

      <div className="flex items-center gap-2">
        <Text family="mono" size="2xs" className="text-stone-500">
          {columns * rows} {t("atlasGridFrames")} ({columns}×{rows})
        </Text>
        <Badge variant="amber" className="text-[10px]">
          <Text weight="bold" size="2xs" className="text-inherit">
            {quality.toUpperCase()}
          </Text>
        </Badge>
      </div>
    </div>
  );
});

AtlasViewerFooter.displayName = "AtlasViewerFooter";

export default AtlasViewerFooter;
