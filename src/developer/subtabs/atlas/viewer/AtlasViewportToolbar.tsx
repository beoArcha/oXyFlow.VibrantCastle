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
  ListOrdered,
} from "lucide-react";
import {
  Button,
  Badge,
  ActionBar,
  SegmentedControl,
  SegmentedControlOption,
  IconButton,
  Tooltip,
  KbdKey,
} from "@ui";
import { useI18n } from "@context/I18nContext";
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

  const toolOptions: SegmentedControlOption<SlicerViewerTool>[] = [
    {
      value: "select",
      label: t("atlasStudioToolSelect"),
      icon: <MousePointer size={12} />,
      tooltipContent: (
        <div className="flex items-center gap-1.5">
          <span>{t("atlasStudioToolSelect")}</span>
          <KbdKey variant="amber">V</KbdKey>
        </div>
      ),
    },
    {
      value: "pan",
      label: t("atlasStudioToolPan"),
      icon: <Hand size={12} />,
      tooltipContent: (
        <div className="flex items-center gap-1.5">
          <span>{t("atlasStudioToolPan")}</span>
          <KbdKey variant="amber">H</KbdKey>
        </div>
      ),
    },
    {
      value: "eyedropper",
      label: t("atlasStudioToolEyedropper"),
      icon: <Pipette size={12} className="text-cyan-400" />,
      tooltipContent: (
        <div className="flex items-center gap-1.5">
          <span>{t("atlasStudioToolEyedropper")}</span>
          <KbdKey variant="amber">I</KbdKey>
        </div>
      ),
    },
    {
      value: "sequence",
      label: t("atlasStudioToolSequence"),
      icon: <ListOrdered size={12} className="text-amber-400" />,
      tooltipContent: (
        <div className="flex items-center gap-1.5">
          <span>{t("atlasStudioToolSequence")}</span>
        </div>
      ),
    },
  ];

  return (
    <ActionBar
      variant="banner"
      bordered={false}
      className="flex-wrap items-center justify-between gap-2 p-2 bg-[#120603] border-stone-800"
    >
      {/* Tools: Select, Pan, Eyedropper, Sequence */}
      <SegmentedControl<SlicerViewerTool>
        options={toolOptions}
        value={activeTool}
        onChange={onToolChange}
        size="sm"
      />

      {/* Layer Visibility Toggles */}
      <div className="flex items-center gap-1">
        <Tooltip content={t("atlasStudioToggleGrid")}>
          <Button
            size="sm"
            variant={showGrid ? "primary" : "secondary"}
            onClick={onToggleGrid}
            aria-label={t("atlasStudioToggleGrid")}
            className="h-7 px-2 text-[11px]"
          >
            <GridIcon size={12} className="mr-1" />
            {t("atlasStudioGridShort")}
          </Button>
        </Tooltip>

        <Tooltip content={t("atlasStudioToggleTracks")}>
          <Button
            size="sm"
            variant={showTracks ? "primary" : "secondary"}
            onClick={onToggleTracks}
            aria-label={t("atlasStudioToggleTracks")}
            className="h-7 px-2 text-[11px]"
          >
            <Layers size={12} className="mr-1" />
            {t("atlasStudioTracksShort")}
          </Button>
        </Tooltip>

        {onToggleMargins && (
          <Tooltip content={t("atlasStudioToggleMargins")}>
            <Button
              size="sm"
              variant={showMargins ? "primary" : "secondary"}
              onClick={onToggleMargins}
              aria-label={t("atlasStudioToggleMargins")}
              className="h-7 px-2 text-[11px]"
            >
              <Square size={12} className="mr-1 text-sky-400" />
              {t("atlasStudioToggleMargins")}
            </Button>
          </Tooltip>
        )}

        <Tooltip content={t("atlasStudioToggleFrames")}>
          <Button
            size="sm"
            variant={showFrames ? "primary" : "secondary"}
            onClick={onToggleFrames}
            aria-label={t("atlasStudioToggleFrames")}
            className="h-7 px-2 text-[11px]"
          >
            <Square size={12} className="mr-1" />
            {t("atlasStudioFramesShort")}
          </Button>
        </Tooltip>

        <Tooltip content={t("atlasStudioToggleChroma")}>
          <Button
            size="sm"
            variant={previewChroma ? "primary" : "secondary"}
            onClick={onToggleChroma}
            aria-label={t("atlasStudioToggleChroma")}
            className="h-7 px-2 text-[11px]"
          >
            <Sparkles size={12} className="mr-1 text-yellow-400" />
            {t("atlasStudioChromaShort")}
          </Button>
        </Tooltip>
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

        <IconButton
          size="xs"
          variant="ghost"
          onClick={onZoomOut}
          aria-label={t("atlasStudioZoom")}
          tooltipContent={t("atlasStudioZoom")}
          icon={<ZoomOut size={13} />}
        />
        <IconButton
          size="xs"
          variant="ghost"
          onClick={onZoomIn}
          aria-label={t("atlasStudioZoom")}
          tooltipContent={t("atlasStudioZoom")}
          icon={<ZoomIn size={13} />}
        />
        <IconButton
          size="xs"
          variant="ghost"
          onClick={onZoomFit}
          aria-label={t("atlasStudioZoomFit")}
          tooltipContent={t("atlasStudioZoomFit")}
          icon={<Maximize2 size={13} />}
        />
        <IconButton
          size="xs"
          variant="ghost"
          onClick={onZoomReset}
          aria-label={t("atlasStudioZoomReset")}
          tooltipContent={t("atlasStudioZoomReset")}
          icon={<RotateCcw size={13} />}
        />
      </div>
    </ActionBar>
  );
};

export default AtlasViewportToolbar;
