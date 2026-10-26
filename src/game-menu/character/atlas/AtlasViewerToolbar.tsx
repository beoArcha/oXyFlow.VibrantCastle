import React from "react";
import { Grid, ZoomIn, ZoomOut, Layers, Image as ImageIcon, RotateCcw } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { Tabs, TabsList, TabsTrigger, Button, Tooltip, Text } from "@ui";
import {
  AtlasSheetType,
  AtlasZoomControlsProps,
  AtlasOverlayTogglesProps,
} from "./types";

export interface AtlasViewerToolbarProps
  extends AtlasZoomControlsProps,
  AtlasOverlayTogglesProps {
  readonly sheetType: AtlasSheetType;
  readonly onSheetTypeChange: (type: AtlasSheetType) => void;
}

/**
 * Toolbar control for AtlasSheetViewer.
 * Employs Tabs for category switching and Buttons wrapped in Tooltips for zoom/grid controls.
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

      <div className="flex items-center gap-2">
        <Tooltip content={t("atlasToggleGrid")}>
          <Button
            size="sm"
            variant={showGrid ? "primary" : "secondary"}
            onClick={onToggleGrid}
            leftIcon={<Grid size={13} />}
            aria-label={t("atlasToggleGrid")}
            className="px-2 py-1 min-h-[30px]"
          >
            <span className="text-[10px] hidden sm:inline">{t("atlasGridLabel")}</span>
          </Button>
        </Tooltip>

        {sheetType === "spritesheet" && (
          <Tooltip content={t("atlasToggleRows")}>
            <Button
              size="sm"
              variant={showLabels ? "primary" : "secondary"}
              onClick={onToggleLabels}
              aria-label={t("atlasToggleRows")}
              className="px-2 py-1 min-h-[30px]"
            >
              <span className="text-[10px]">{t("atlasRowsLabel")}</span>
            </Button>
          </Tooltip>
        )}

        <div className="flex items-center gap-1 bg-black/60 px-1.5 py-1 rounded-lg border border-stone-800">
          <Tooltip content={t("atlasZoomOut")}>
            <Button
              size="sm"
              variant="ghost"
              onClick={onZoomOut}
              className="p-1 min-h-0 h-6 text-stone-400 hover:text-stone-200"
              aria-label={t("atlasZoomOut")}
            >
              <ZoomOut size={13} />
            </Button>
          </Tooltip>

          <Text family="mono" weight="bold" size="2xs" variant="primary" className="w-10 text-center select-none">
            {Math.round(zoom * 100)}%
          </Text>

          <Tooltip content={t("atlasZoomIn")}>
            <Button
              size="sm"
              variant="ghost"
              onClick={onZoomIn}
              className="p-1 min-h-0 h-6 text-stone-400 hover:text-stone-200"
              aria-label={t("atlasZoomIn")}
            >
              <ZoomIn size={13} />
            </Button>
          </Tooltip>

          <Tooltip content={t("atlasResetZoom")}>
            <Button
              size="sm"
              variant="ghost"
              onClick={onResetZoom}
              className="px-1.5 py-0.5 min-h-0 h-6 text-stone-400 hover:text-amber-300 border-l border-stone-800 rounded-none"
              leftIcon={<RotateCcw size={10} />}
              aria-label={t("atlasResetZoom")}
            >
              <Text family="mono" size="3xs" className="text-inherit">
                {t("atlasResetLabel")}
              </Text>
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});

AtlasViewerToolbar.displayName = "AtlasViewerToolbar";

export default AtlasViewerToolbar;
