import React from "react";
import { Grid, ZoomIn, ZoomOut, Layers, Image as ImageIcon, RotateCcw } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { Tabs, TabsList, TabsTrigger, Button } from "@components/ui";

export interface AtlasViewerToolbarProps {
  sheetType: "spritesheet" | "portraits";
  onSheetTypeChange: (type: "spritesheet" | "portraits") => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

/**
 * Toolbar control for AtlasSheetViewer.
 * Employs Tabs for category switching and Buttons for zoom/grid controls.
 */
export const AtlasViewerToolbar: React.FC<AtlasViewerToolbarProps> = React.memo(({
  sheetType,
  onSheetTypeChange,
  showGrid,
  onToggleGrid,
  showLabels,
  onToggleLabels,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
      {/* Sheet Category Toggle */}
      <Tabs
        value={sheetType}
        onValueChange={(val) => onSheetTypeChange(val as "spritesheet" | "portraits")}
      >
        <TabsList className="bg-black/60 p-1 border-stone-800">
          <TabsTrigger
            value="spritesheet"
            icon={<Layers size={13} />}
            className="py-1 px-2.5 text-xs"
          >
            {t("atlasSheetTab")}
          </TabsTrigger>
          <TabsTrigger
            value="portraits"
            icon={<ImageIcon size={13} />}
            className="py-1 px-2.5 text-xs"
          >
            {t("atlasPortraitsTab")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* View Controls: Zoom + Grid + Labels */}
      <div className="flex items-center gap-2">
        {/* Grid Toggle */}
        <Button
          size="sm"
          variant={showGrid ? "primary" : "secondary"}
          onClick={onToggleGrid}
          leftIcon={<Grid size={13} />}
          title={t("atlasToggleGrid")}
          className="px-2 py-1 min-h-[30px]"
        >
          <span className="text-[10px] hidden sm:inline">Grid</span>
        </Button>

        {/* Row Labels Toggle (only for spritesheet) */}
        {sheetType === "spritesheet" && (
          <Button
            size="sm"
            variant={showLabels ? "primary" : "secondary"}
            onClick={onToggleLabels}
            title={t("atlasToggleRows")}
            className="px-2 py-1 min-h-[30px]"
          >
            <span className="text-[10px]">Rows</span>
          </Button>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-black/60 px-1.5 py-1 rounded-lg border border-stone-800">
          <Button
            size="sm"
            variant="ghost"
            onClick={onZoomOut}
            title={t("atlasZoomOut")}
            className="p-1 min-h-0 h-6 text-stone-400 hover:text-stone-200"
            aria-label={t("atlasZoomOut")}
          >
            <ZoomOut size={13} />
          </Button>

          <span className="text-[10px] font-mono font-bold text-amber-400 w-10 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>

          <Button
            size="sm"
            variant="ghost"
            onClick={onZoomIn}
            title={t("atlasZoomIn")}
            className="p-1 min-h-0 h-6 text-stone-400 hover:text-stone-200"
            aria-label={t("atlasZoomIn")}
          >
            <ZoomIn size={13} />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onResetZoom}
            title={t("atlasResetZoom")}
            className="px-1.5 py-0.5 min-h-0 h-6 text-[9px] font-mono text-stone-400 hover:text-amber-300 border-l border-stone-800 rounded-none"
            leftIcon={<RotateCcw size={10} />}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
});

AtlasViewerToolbar.displayName = "AtlasViewerToolbar";

export default AtlasViewerToolbar;
