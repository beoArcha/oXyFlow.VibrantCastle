import React, { useState, useEffect, useRef, useCallback } from "react";
import { AssetQuality } from "@game/types";
import { AnimationName } from "@game/engine/spriteTypes";
import { resolveAtlasSheetMetaVM } from "../character.mapper";
import { cn } from "@lib/utils";
import { Card } from "@ui";
import { ImageDimensions } from "../types";
import { AtlasSheetType } from "./types";
import { AtlasViewerToolbar } from "./AtlasViewerToolbar";
import { AtlasCanvasView } from "./AtlasCanvasView";
import { AtlasViewerFooter } from "./AtlasViewerFooter";

export interface AtlasSheetViewerProps {
  readonly characterId: string;
  readonly quality: AssetQuality;
  readonly activeAnimation?: AnimationName;
  readonly className?: string;
}

/**
 * Composite viewer for character spritesheets and portrait emotion grids.
 * Orchestrates viewport state and composes toolbar, canvas viewport, and metadata footer.
 */
export const AtlasSheetViewer: React.FC<AtlasSheetViewerProps> = React.memo(({
  characterId,
  quality,
  activeAnimation = "idle",
  className = "",
}) => {
  const [sheetType, setSheetType] = useState<AtlasSheetType>("spritesheet");
  const [zoom, setZoom] = useState<number>(0.75); // 0.75x default fits comfortably
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({
    width: 0,
    height: 0,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Resolve texture URL and grid configuration via adapter
  const meta = resolveAtlasSheetMetaVM(characterId, quality);
  const activeUrl = sheetType === "spritesheet" ? meta.spritesheetUrl : meta.portraitsGridUrl;
  const activeGrid = sheetType === "spritesheet" ? meta.spritesheetGrid : meta.portraitsGrid;

  useEffect(() => {
    if (!activeUrl) return;
    let isCancelled = false;
    const img = new Image();
    img.src = activeUrl;
    img.onload = () => {
      if (!isCancelled) {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    return () => {
      isCancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [activeUrl]);

  const columns = activeGrid.columns;
  const rows = activeGrid.rows;
  const cellWidth = imageDimensions.width > 0 ? imageDimensions.width / columns : activeGrid.cellWidth;
  const cellHeight = imageDimensions.height > 0 ? imageDimensions.height / rows : activeGrid.cellHeight;

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(1.5, Math.round((z + 0.15) * 100) / 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.35, Math.round((z - 0.15) * 100) / 100));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(0.75);
  }, []);

  const handleToggleGrid = useCallback(() => {
    setShowGrid((g) => !g);
  }, []);

  const handleToggleLabels = useCallback(() => {
    setShowLabels((l) => !l);
  }, []);

  return (
    <Card variant="subtle" className={cn("flex flex-col gap-2.5 p-3", className)}>
      <AtlasViewerToolbar
        sheetType={sheetType}
        onSheetTypeChange={setSheetType}
        showGrid={showGrid}
        onToggleGrid={handleToggleGrid}
        showLabels={showLabels}
        onToggleLabels={handleToggleLabels}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      <AtlasCanvasView
        activeUrl={activeUrl}
        sheetType={sheetType}
        zoom={zoom}
        showGrid={showGrid}
        showLabels={showLabels}
        imageDimensions={imageDimensions}
        activeAnimation={activeAnimation}
        columns={columns}
        rows={rows}
        cellWidth={cellWidth}
        cellHeight={cellHeight}
        animationRows={meta.animationRows}
        scrollContainerRef={scrollContainerRef}
      />

      <AtlasViewerFooter
        imageDimensions={imageDimensions}
        cellWidth={cellWidth}
        cellHeight={cellHeight}
        columns={columns}
        rows={rows}
        quality={quality}
      />
    </Card>
  );
});

AtlasSheetViewer.displayName = "AtlasSheetViewer";

export default AtlasSheetViewer;
