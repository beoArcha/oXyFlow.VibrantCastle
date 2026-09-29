import React, { useState, useEffect, useRef, useCallback } from "react";
import { AssetQuality } from "@game/types";
import { AnimationName } from "@game/engine/spriteTypes";
import { assetLoader } from "@game/engine/assetLoader";
import { cn } from "@lib/utils";
import { AtlasViewerToolbar } from "./AtlasViewerToolbar";
import { AtlasCanvasView } from "./AtlasCanvasView";
import { AtlasViewerFooter } from "./AtlasViewerFooter";

export interface AtlasSheetViewerProps {
  characterId: string;
  quality: AssetQuality;
  activeAnimation?: AnimationName;
  className?: string;
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
  const [sheetType, setSheetType] = useState<"spritesheet" | "portraits">("spritesheet");
  const [zoom, setZoom] = useState<number>(0.75); // 0.75x default fits comfortably
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Resolve texture URL from assetLoader and manifest
  const manifest = assetLoader.getCharacterManifest(characterId);
  const spriteMap = assetLoader.getActiveSpriteMap(characterId, quality);

  const spritesheetUrl = spriteMap?.meta.imageUrl || "";
  const portraitsUrl = manifest?.portraitsGridUrl || "";
  const activeUrl = sheetType === "spritesheet" ? spritesheetUrl : portraitsUrl;

  useEffect(() => {
    if (!activeUrl) return;
    const img = new Image();
    img.src = activeUrl;
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [activeUrl]);

  const columns = 12;
  const rows = 8;
  const cellWidth = imageDimensions.width > 0 ? imageDimensions.width / columns : 128;
  const cellHeight = imageDimensions.height > 0 ? imageDimensions.height / rows : 128;

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
    <div className={cn("flex flex-col gap-2.5 bg-[#0e0402] p-3 rounded-xl border border-amber-900/40", className)}>
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
    </div>
  );
});

AtlasSheetViewer.displayName = "AtlasSheetViewer";

export default AtlasSheetViewer;

