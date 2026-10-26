import React, { useState } from "react";
import { Grid as GridIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  SelectedCellInfo,
  AtlasMetaDoc,
  IAtlasSlicingConfig,
  IAtlasBackgroundConfig,
  ResolvedFrameRect,
  SlicerViewerTool,
} from "./types";
import {
  AtlasViewportToolbar,
  AtlasSelectionFloatingAction,
  AtlasViewerStatusBar,
  AtlasTextureCanvas,
  useAtlasViewerInteractions,
  useAtlasResolvedFrames,
} from "./viewer";
import { GameBaseError } from "@lib/errors";

import { IPixelBuffer } from "@game/engine/meta/slicing";

export type { SlicerViewerTool };

export interface AtlasTextureViewerProps {
  imageSrc: string;
  image?: HTMLImageElement | null;
  pixelBuffer?: IPixelBuffer | null;
  gridConfig?: AtlasGridConfig;
  tracks?: AtlasAnimationTrackDefinition[];
  slicingConfig?: IAtlasSlicingConfig;
  backgroundConfig?: IAtlasBackgroundConfig;
  metaDoc?: AtlasMetaDoc;
  selectedTrackName: string | null;
  selectedFrameIndex: number | null;
  onSelectCell?: (info: SelectedCellInfo) => void;
  onSelectTrack?: (trackName: string) => void;
  onSelectFrame?: (frameIndex: number) => void;
  onSampleBackgroundColor?: (hex: string) => void;
  onToggleSequenceFrame?: (target: {
    hit?: ResolvedFrameRect | null;
    col: number;
    row: number;
    x: number;
    y: number;
  }) => void;
  onCreateTrackFromSelection?: (selection: {
    x: number;
    y: number;
    width: number;
    height: number;
    row?: number;
    framesCount?: number;
  }) => void;
  onAssignSelectionToActiveTrack?: (selection: {
    x: number;
    y: number;
    width: number;
    height: number;
    row?: number;
  }) => void;
  onMergeSelectionAsWide?: (selection: {
    x: number;
    y: number;
    width: number;
    height: number;
    span: number;
  }) => void;
  onAddFreeformFrame?: (frame: {
    x: number;
    y: number;
    width: number;
    height: number;
    id?: string;
    trackName?: string;
    pivot?: { x: number; y: number };
  }) => void;
  onResolvedFramesChange?: (frames: ResolvedFrameRect[]) => void;
  externalTool?: SlicerViewerTool;
  onToolChange?: (tool: SlicerViewerTool) => void;
  onMetricsChange?: (metrics: {
    frameCount: number;
    durationMs: number;
    textureWidth: number;
    textureHeight: number;
  }) => void;
  onError?: (error: GameBaseError | null) => void;
}

export const AtlasTextureViewer: React.FC<AtlasTextureViewerProps> = ({
  imageSrc,
  image: externalImage,
  pixelBuffer: externalPixelBuffer,
  gridConfig,
  tracks = [],
  slicingConfig,
  backgroundConfig,
  metaDoc,
  selectedTrackName,
  selectedFrameIndex,
  onSelectCell,
  onSelectTrack,
  onSelectFrame,
  onSampleBackgroundColor,
  onToggleSequenceFrame,
  onCreateTrackFromSelection,
  onAssignSelectionToActiveTrack,
  onMergeSelectionAsWide,
  onAddFreeformFrame,
  onResolvedFramesChange,
  externalTool,
  onToolChange,
  onMetricsChange,
  onError,
}) => {
  const { t } = useI18n();

  // Layer visibility toggles
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTracks, setShowTracks] = useState<boolean>(true);
  const [showMargins, setShowMargins] = useState<boolean>(true);
  const [showFrames, setShowFrames] = useState<boolean>(true);
  const [previewChroma, setPreviewChroma] = useState<boolean>(false);

  // Hook managing texture image loading and frame slicing resolution
  const { image, pixelBuffer, resolvedFrames, isLoading } = useAtlasResolvedFrames({
    imageSrc,
    image: externalImage,
    pixelBuffer: externalPixelBuffer,
    gridConfig,
    tracks,
    slicingConfig,
    backgroundConfig,
    metaDoc,
    onMetricsChange,
    onResolvedFramesChange,
    onError,
  });

  // Hook handling zoom, pan, hotkeys, dragging marquee and coordinate translation
  const {
    containerRef,
    canvasRef,
    zoom,
    panOffset,
    activeTool,
    setActiveTool,
    isSpacePressed,
    isPanning,
    dragStart,
    dragCurrent,
    activeSelection,
    setActiveSelection,
    hoverInfo,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleFitToContainer,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useAtlasViewerInteractions({
    image,
    pixelBuffer,
    gridConfig,
    resolvedFrames,
    externalTool,
    onToolChange,
    onSampleBackgroundColor,
    onSelectTrack,
    onSelectFrame,
    onSelectCell,
    onToggleSequenceFrame,
  });

  return (
    <Card variant="default" className="flex flex-col flex-1 min-h-[460px] select-none">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
        <div className="flex items-center gap-2">
          <CardTitle icon={<GridIcon className="w-4 h-4 text-amber-400" />}>
            {t("atlasStudioViewerTitle")}
          </CardTitle>
          {image && (
            <Badge variant="stone">
              {image.naturalWidth} × {image.naturalHeight}px
            </Badge>
          )}
          {gridConfig && (
            <Badge variant="amber">
              {gridConfig.columns} {t("atlasStudioColsShort")} × {gridConfig.rows} {t("atlasStudioRowsShort")}
            </Badge>
          )}
          {slicingConfig?.method && (
            <Badge variant="purple" className="text-[10px]">
              <Text as="span" family="mono" size="3xs" uppercase>
                {slicingConfig.method}
              </Text>
            </Badge>
          )}
          <Badge variant="green" className="text-[10px]">
            {resolvedFrames.length} {t("atlasStudioFrameInfo") || "klatek"}
          </Badge>
        </div>

        <AtlasViewportToolbar
          zoom={zoom}
          activeTool={activeTool}
          showGrid={showGrid}
          showTracks={showTracks}
          showMargins={showMargins}
          showFrames={showFrames}
          previewChroma={previewChroma}
          textureWidth={image?.naturalWidth}
          textureHeight={image?.naturalHeight}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomFit={handleFitToContainer}
          onZoomReset={handleZoomReset}
          onToolChange={setActiveTool}
          onToggleGrid={() => setShowGrid((v) => !v)}
          onToggleTracks={() => setShowTracks((v) => !v)}
          onToggleMargins={() => setShowMargins((v) => !v)}
          onToggleFrames={() => setShowFrames((v) => !v)}
          onToggleChroma={() => setPreviewChroma((v) => !v)}
        />
      </CardHeader>

      <CardContent className="flex flex-col flex-1 p-2 gap-2 relative">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`relative flex-1 min-h-[360px] max-h-[580px] overflow-hidden rounded-lg border border-stone-800 bg-[#0c0806] custom-scrollbar p-2 flex items-center justify-center select-none ${isPanning || activeTool === "pan" || isSpacePressed
            ? "cursor-grab active:cursor-grabbing"
            : activeTool === "eyedropper"
              ? "cursor-crosshair"
              : activeTool === "sequence"
                ? "cursor-pointer"
                : "cursor-crosshair"
            }`}
          style={{
            backgroundImage:
              "radial-gradient(#24140e 1px, transparent 1px), radial-gradient(#180a06 1px, #0a0402 1px)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
        >
          <AtlasTextureCanvas
            canvasRef={canvasRef}
            image={image}
            zoom={zoom}
            panOffset={panOffset}
            isPanning={isPanning}
            previewChroma={previewChroma}
            pixelBuffer={pixelBuffer}
            backgroundConfig={backgroundConfig}
            showGrid={showGrid}
            showTracks={showTracks}
            showMargins={showMargins}
            showFrames={showFrames}
            gridConfig={gridConfig}
            resolvedFrames={resolvedFrames}
            tracks={tracks}
            selectedTrackName={selectedTrackName}
            selectedFrameIndex={selectedFrameIndex}
            dragStart={dragStart}
            dragCurrent={dragCurrent}
            activeSelection={activeSelection}
            isLoading={isLoading}
          />

          {activeSelection && (
            <AtlasSelectionFloatingAction
              activeSelection={activeSelection}
              gridConfig={gridConfig}
              selectedTrackName={selectedTrackName}
              onCreateTrackFromSelection={onCreateTrackFromSelection}
              onAssignSelectionToActiveTrack={onAssignSelectionToActiveTrack}
              onMergeSelectionAsWide={onMergeSelectionAsWide}
              onAddFreeformFrame={onAddFreeformFrame}
              onClose={() => setActiveSelection(null)}
            />
          )}
        </div>

        <AtlasViewerStatusBar
          hoverInfo={hoverInfo}
          gridConfig={gridConfig}
          frameCount={resolvedFrames.length}
        />
      </CardContent>
    </Card>
  );
};

export default AtlasTextureViewer;
