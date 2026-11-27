import React, { useState, useMemo, useRef } from "react";
import { Card, CardHeader, CardContent, Tabs, TabItem, Alert } from "@ui";
import { AtlasPresetPicker } from "./AtlasPresetPicker";
import { AtlasTextureViewer } from "./AtlasTextureViewer";
import { AtlasAnimationPreview } from "./AtlasAnimationPreview";
import { AtlasSlicingInspector } from "./AtlasSlicingInspector";
import { AtlasBackgroundPanel } from "./AtlasBackgroundPanel";
import { AtlasJsonExportPanel } from "./AtlasJsonExportPanel";
import { AtlasSlicerLogStrip } from "./AtlasSlicerLogStrip";
import {
  useAtlasSlicerState,
  useAtlasViewport,
  useAtlasPlayback,
} from "./hooks";
import { INSPECTOR_TABS, type InspectorTabId } from "./types";

export interface AtlasSlicerSubtabProps {
  readonly onOpenLogs?: () => void;
}

/**
 * Full Atlas Slicer, Live Animation Preview & Alpha Chroma Baker.
 * All toolbar/preset/action buttons enforce `whitespace-nowrap shrink-0` so labels
 * always render cleanly on a single line without wrapping or clipping.
 */
export const AtlasSlicerSubtab: React.FC<AtlasSlicerSubtabProps> = ({
  onOpenLogs,
}) => {
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<InspectorTabId>("preview");
  const [logStripOpen, setLogStripOpen] = useState(false);

  const resetCallbacksRef = useRef<() => void>(() => {});

  const slicer = useAtlasSlicerState({
    onPresetSelected: () => resetCallbacksRef.current(),
  });

  const viewport = useAtlasViewport({
    loadedImage: slicer.loadedImage,
    chromaCanvas: slicer.chromaCanvas,
    textureW: slicer.textureW,
    textureH: slicer.textureH,
    meta: slicer.meta,
    activeTrack: slicer.activeTrack,
    resolvedFrames: slicer.resolvedFrames,
    onSampleBackgroundAt: slicer.handleSampleBackgroundAt,
    onAppendSequenceFrame: slicer.handleAppendSequenceFrame,
  });

  const playback = useAtlasPlayback({
    loadedImage: slicer.loadedImage,
    chromaCanvas: slicer.chromaCanvas,
    activeTrack: slicer.activeTrack,
    activeTrackFrames: slicer.activeTrackFrames,
    anchorX: slicer.meta.layout.anchor.x,
    anchorY: slicer.meta.layout.anchor.y,
  });

  resetCallbacksRef.current = () => {
    viewport.resetViewportOnPreset();
    playback.resetPlayhead();
  };

  const inspectorTabs = useMemo<TabItem<InspectorTabId>[]>(
    () => [...INSPECTOR_TABS],
    []
  );

  return (
    <div id="subtab-content-atlas-slicer" className="flex flex-col gap-3">
      <AtlasPresetPicker
        categoryFilter={slicer.categoryFilter}
        onCategoryFilterChange={slicer.setCategoryFilter}
        presetSearch={slicer.presetSearch}
        onPresetSearchChange={slicer.setPresetSearch}
        filteredPresets={slicer.filteredPresets}
        activePresetId={slicer.activePreset?.id}
        hasCustomImage={Boolean(slicer.customImageSrc)}
        onSelectPreset={slicer.handleSelectPreset}
        onUploadImage={slicer.handleUploadImage}
        onUploadMeta={slicer.handleUploadMeta}
      />

      {slicer.statusNotice && (
        <Alert variant="success" title={slicer.statusNotice} />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <AtlasTextureViewer
          sheetCanvasRef={viewport.sheetCanvasRef}
          toolMode={viewport.toolMode}
          onToolModeChange={viewport.setToolMode}
          inspectorOpen={inspectorOpen}
          onToggleInspector={() => setInspectorOpen((v) => !v)}
          showGrid={viewport.showGrid}
          onToggleGrid={() => viewport.setShowGrid((v) => !v)}
          showTracks={viewport.showTracks}
          onToggleTracks={() => viewport.setShowTracks((v) => !v)}
          showMargins={viewport.showMargins}
          onToggleMargins={() => viewport.setShowMargins((v) => !v)}
          showFrames={viewport.showFrames}
          onToggleFrames={() => viewport.setShowFrames((v) => !v)}
          showChromaPreview={slicer.showChromaPreview}
          onToggleChromaPreview={() => slicer.setShowChromaPreview((v) => !v)}
          frameCount={slicer.resolvedFrames.length}
          zoom={viewport.zoom}
          onFitCanvas={viewport.handleFitCanvas}
          onResetZoom={viewport.handleResetZoom}
          onZoomOut={viewport.handleZoomOut}
          onZoomIn={viewport.handleZoomIn}
          onCanvasMouseDown={viewport.handleCanvasMouseDown}
          onCanvasMouseMove={viewport.handleCanvasMouseMove}
          onStopPanning={viewport.stopPanning}
          textureW={slicer.textureW}
          textureH={slicer.textureH}
          cursorCoords={viewport.cursorCoords}
          selectedFrameObj={viewport.selectedFrameObj}
        />

        {inspectorOpen && (
          <Card variant="subtle" className="xl:col-span-5 flex flex-col">
            <CardHeader className="pb-2">
              <Tabs<InspectorTabId>
                items={inspectorTabs}
                activeId={inspectorTab}
                onChange={setInspectorTab}
              />
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {inspectorTab === "preview" && (
                <AtlasAnimationPreview
                  previewCanvasRef={playback.previewCanvasRef}
                  animations={slicer.meta.animations}
                  activeTrackName={slicer.activeTrackName}
                  activeTrack={slicer.activeTrack}
                  activeTrackFrames={slicer.activeTrackFrames}
                  anchor={slicer.meta.layout.anchor}
                  isPlaying={playback.isPlaying}
                  playheadIdx={playback.playheadIdx}
                  previewScale={playback.previewScale}
                  flipX={playback.flipX}
                  showGroundLine={playback.showGroundLine}
                  onionSkin={playback.onionSkin}
                  onSelectTrack={(name) => {
                    slicer.setActiveTrackName(name);
                    playback.resetPlayhead();
                  }}
                  onStepPrev={playback.stepPrev}
                  onTogglePlay={playback.togglePlay}
                  onStepNext={playback.stepNext}
                  onPreviewScaleChange={playback.setPreviewScale}
                  onToggleFlipX={() => playback.setFlipX((v) => !v)}
                  onToggleGroundLine={() => playback.setShowGroundLine((v) => !v)}
                  onToggleOnionSkin={() => playback.setOnionSkin((v) => !v)}
                  onUpdateMeta={slicer.updateMeta}
                  onReverseTrack={slicer.handleReverseTrack}
                  onPingPongTrack={slicer.handlePingPongTrack}
                  onSelectFilmstripFrame={(idx, frameId) => {
                    playback.setIsPlaying(false);
                    playback.setPlayheadIdx(idx);
                    viewport.setSelectedFrameId(frameId);
                  }}
                />
              )}

              {inspectorTab === "slicing" && (
                <AtlasSlicingInspector
                  meta={slicer.meta}
                  activeTrackName={slicer.activeTrackName}
                  activeTrack={slicer.activeTrack}
                  newTrackName={slicer.newTrackName}
                  onNewTrackNameChange={slicer.setNewTrackName}
                  onUpdateMeta={slicer.updateMeta}
                  onBakeAutoIslands={slicer.handleBakeAutoIslands}
                  onAddTrack={slicer.handleAddTrack}
                  onDeleteActiveTrack={slicer.handleDeleteActiveTrack}
                />
              )}

              {inspectorTab === "chroma" && (
                <AtlasBackgroundPanel
                  backgroundConfig={slicer.meta.backgroundConfig}
                  chromaFeather={slicer.chromaFeather}
                  showChromaPreview={slicer.showChromaPreview}
                  onUpdateMeta={slicer.updateMeta}
                  onAutoDetectBackground={slicer.handleAutoDetectBackground}
                  onEnableChromaPreview={() => slicer.setShowChromaPreview(true)}
                  onChromaPreviewChange={slicer.setShowChromaPreview}
                  onChromaFeatherChange={slicer.setChromaFeather}
                  onBakeCleanPng={slicer.handleBakeCleanPng}
                />
              )}

              {inspectorTab === "json" && (
                <AtlasJsonExportPanel
                  jsonDraft={slicer.jsonDraft}
                  jsonError={slicer.jsonError}
                  onJsonDraftChange={slicer.handleJsonDraftChange}
                  onCopyJson={slicer.handleCopyJson}
                  onDownloadJson={slicer.handleDownloadJson}
                  onResetPreset={() =>
                    slicer.activePreset &&
                    slicer.handleSelectPreset(slicer.activePreset.id)
                  }
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <AtlasSlicerLogStrip
        slicerLogs={slicer.slicerLogs}
        isOpen={logStripOpen}
        onToggleOpen={() => setLogStripOpen((v) => !v)}
        onOpenLogs={onOpenLogs}
      />
    </div>
  );
};

AtlasSlicerSubtab.displayName = "AtlasSlicerSubtab";
export default AtlasSlicerSubtab;
