import React from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Grid as GridIcon,
  Layers,
  Square,
  Pipette,
  MousePointer,
  Hand,
  Sparkles,
} from "lucide-react";
import { Button, Badge } from "@components/ui";
import { useI18n } from "@hooks/useI18n";
import { SlicerViewerTool } from "../types";

export interface AtlasViewportToolbarProps {
  zoom: number;
  activeTool: SlicerViewerTool;
  showGrid: boolean;
  showTracks: boolean;
  showMargins?: boolean;
  showFrames: boolean;
  previewChroma: boolean;
  textureWidth?: number;
  textureHeight?: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoomReset: () => void;
  onToolChange: (tool: SlicerViewerTool) => void;
  onToggleGrid: () => void;
  onToggleTracks: () => void;
  onToggleMargins?: () => void;
  onToggleFrames: () => void;
  onToggleChroma: () => void;
}

export const AtlasViewportToolbar: React.FC<AtlasViewportToolbarProps> = ({
  zoom,
  activeTool,
  showGrid,
  showTracks,
  showMargins = true,
  showFrames,
  previewChroma,
  textureWidth,
  textureHeight,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomReset,
  onToolChange,
  onToggleGrid,
  onToggleTracks,
  onToggleMargins,
  onToggleFrames,
  onToggleChroma,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#120603] rounded-xl border border-stone-800">
      {/* Tools: Select, Pan, Eyedropper */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={activeTool === "select" ? "primary" : "secondary"}
          onClick={() => onToolChange("select")}
          title={t("atlasStudioToolSelect")}
          className="h-7 px-2"
        >
          <MousePointer size={12} className="mr-1" />
          <span className="text-[11px]">{t("atlasStudioToolSelect")}</span>
        </Button>

        <Button
          size="sm"
          variant={activeTool === "pan" ? "primary" : "secondary"}
          onClick={() => onToolChange("pan")}
          title={t("atlasStudioToolPan")}
          className="h-7 px-2"
        >
          <Hand size={12} className="mr-1" />
          <span className="text-[11px]">{t("atlasStudioToolPan")}</span>
        </Button>

        <Button
          size="sm"
          variant={activeTool === "eyedropper" ? "primary" : "secondary"}
          onClick={() => onToolChange("eyedropper")}
          title={t("atlasStudioToolEyedropper")}
          className="h-7 px-2"
        >
          <Pipette size={12} className="mr-1 text-cyan-400" />
          <span className="text-[11px]">{t("atlasStudioToolEyedropper")}</span>
        </Button>
      </div>

      {/* Layer Visibility Toggles */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={showGrid ? "primary" : "secondary"}
          onClick={onToggleGrid}
          title={t("atlasStudioToggleGrid")}
          className="h-7 px-2 text-[11px]"
        >
          <GridIcon size={12} className="mr-1" />
          {t("atlasStudioGridShort")}
        </Button>

        <Button
          size="sm"
          variant={showTracks ? "primary" : "secondary"}
          onClick={onToggleTracks}
          title={t("atlasStudioToggleTracks")}
          className="h-7 px-2 text-[11px]"
        >
          <Layers size={12} className="mr-1" />
          {t("atlasStudioTracksShort")}
        </Button>

        {onToggleMargins && (
          <Button
            size="sm"
            variant={showMargins ? "primary" : "secondary"}
            onClick={onToggleMargins}
            title={t("atlasStudioToggleMargins")}
            className="h-7 px-2 text-[11px]"
          >
            <Square size={12} className="mr-1 text-sky-400" />
            {t("atlasStudioToggleMargins")}
          </Button>
        )}

        <Button
          size="sm"
          variant={showFrames ? "primary" : "secondary"}
          onClick={onToggleFrames}
          title={t("atlasStudioToggleFrames")}
          className="h-7 px-2 text-[11px]"
        >
          <Square size={12} className="mr-1" />
          {t("atlasStudioFramesShort")}
        </Button>

        <Button
          size="sm"
          variant={previewChroma ? "primary" : "secondary"}
          onClick={onToggleChroma}
          title={t("atlasStudioToggleChroma")}
          className="h-7 px-2 text-[11px]"
        >
          <Sparkles size={12} className="mr-1 text-yellow-400" />
          {t("atlasStudioChromaShort")}
        </Button>
      </div>

      {/* Zoom Controls & Dimension Readout */}
      <div className="flex items-center gap-1.5">
        {textureWidth && textureHeight && (
          <span className="text-[10px] font-mono text-stone-400 mr-1 hidden sm:inline">
            {textureWidth}×{textureHeight}px
          </span>
        )}

        <Badge variant="stone" className="font-mono text-[10px] h-6 px-1.5">
          {Math.round(zoom * 100)}%
        </Badge>

        <Button size="sm" variant="ghost" onClick={onZoomOut} className="h-7 px-1.5">
          <ZoomOut size={13} />
        </Button>
        <Button size="sm" variant="ghost" onClick={onZoomIn} className="h-7 px-1.5">
          <ZoomIn size={13} />
        </Button>
        <Button size="sm" variant="ghost" onClick={onZoomFit} className="h-7 px-1.5" title="Fit">
          <Maximize2 size={13} />
        </Button>
        <Button size="sm" variant="ghost" onClick={onZoomReset} className="h-7 px-1.5" title="Reset">
          <RotateCcw size={13} />
        </Button>
      </div>
    </div>
  );
};

export default AtlasViewportToolbar;
