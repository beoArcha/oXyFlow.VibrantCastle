import React from "react";
import {
  AtlasTextureViewer,
  AtlasInspectorDock,
  AtlasStatusBar,
  AtlasHeaderToolbar,
  useAtlasStudioState,
  defaultAtlasAssetRegistry,
} from "./atlas";

export interface AtlasMetaSubTabProps {
  onNavigateToLogs?: () => void;
}

export const AtlasMetaSubTab: React.FC<AtlasMetaSubTabProps> = ({ onNavigateToLogs }) => {
  const state = useAtlasStudioState();

  if (!state.activePreset) return null;

  return (
    <div
      id="subtab-content-atlas-slicer"
      className="flex flex-col gap-3 animate-in fade-in duration-150"
    >
      {/* 1. Header Toolbar: Searchable Atlas Selector & File Buttons */}
      <AtlasHeaderToolbar
        selectedPresetId={state.selectedPresetId}
        onSelectPreset={(presetId) => {
          const resolved = defaultAtlasAssetRegistry.resolveAsset(presetId);
          if (resolved) {
            state.applyPreset({
              id: resolved.id,
              name: resolved.name,
              category: resolved.category,
              imageSrc: resolved.imageSrc,
              defaultMeta: resolved.defaultMeta,
            });
          }
        }}
        onImageUpload={state.handleImageUpload}
        onJsonUpload={state.handleJsonUpload}
        onResetDefaults={state.handleResetDefaults}
        isInspectorOpen={state.isInspectorOpen}
        onToggleInspector={() => state.setIsInspectorOpen((prev) => !prev)}
      />

      {/* 2. Unified Studio Workbench (Collapsible 2-Column Split: Viewport / Inspector Dock) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Column: Texture & Grid Slicer Viewport */}
        <div
          className={`${
            state.isInspectorOpen ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"
          } flex flex-col transition-all duration-200`}
        >
          <AtlasTextureViewer
            imageSrc={state.imageSrc}
            gridConfig={state.gridConfig}
            tracks={state.tracks}
            slicingConfig={state.metaDoc.slicing}
            backgroundConfig={state.metaDoc.backgroundConfig}
            metaDoc={state.metaDoc}
            selectedTrackName={state.selectedTrackName}
            selectedFrameIndex={state.selectedFrameIndex}
            externalTool={state.viewerTool}
            onToolChange={(tool) => state.setViewerTool(tool)}
            onError={state.handleErrorChange}
            onMetricsChange={state.handleMetricsChange}
            onResolvedFramesChange={state.setResolvedFrames}
            onAddFreeformFrame={state.handleAddFreeformFrame}
            onSelectCell={(info) => {
              state.setSelectedCellInfo(info);
              if (info.trackName) {
                state.setSelectedTrackName(info.trackName);
              }
              if (info.frameIndex !== undefined) {
                state.setSelectedFrameIndex(info.frameIndex);
              }
            }}
            onSelectTrack={(trackName) => {
              state.setSelectedTrackName(trackName);
              state.setSelectedFrameIndex(0);
            }}
            onSelectFrame={(frameIdx) => state.setSelectedFrameIndex(frameIdx)}
            onSampleBackgroundColor={state.handleSampleBackgroundColor}
            onCreateTrackFromSelection={state.handleCreateTrackFromSelection}
            onAssignSelectionToActiveTrack={state.handleAssignSelectionToActiveTrack}
            onMergeSelectionAsWide={state.handleMergeSelectionAsWide}
          />
        </div>

        {/* Right Column: Docked Inspector (collapsible) */}
        {state.isInspectorOpen && (
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col animate-in fade-in duration-150">
            <AtlasInspectorDock
              activeTab={state.activeInspectorTab}
              onTabChange={state.setActiveInspectorTab}
              imageSrc={state.imageSrc}
              assetId={state.activePreset.id}
              metaDoc={state.metaDoc}
              gridConfig={state.gridConfig}
              tracks={state.tracks}
              selectedTrackName={state.selectedTrackName}
              selectedFrameIndex={state.selectedFrameIndex}
              origin={state.origin}
              backgroundConfig={state.metaDoc.backgroundConfig}
              slicingConfig={state.metaDoc.slicing}
              resolvedFrames={state.resolvedFrames}
              onGridConfigChange={state.setGridConfig}
              onTracksChange={state.setTracks}
              onSelectTrack={(name) => {
                state.setSelectedTrackName(name);
                state.setSelectedFrameIndex(0);
              }}
              onSelectFrame={(frameIdx) => state.setSelectedFrameIndex(frameIdx)}
              onOriginChange={state.setOrigin}
              onBackgroundConfigChange={state.handleBackgroundConfigChange}
              onSlicingConfigChange={state.handleSlicingConfigChange}
              onMetaDocChange={state.setMetaDoc}
              onResetDefaults={state.handleResetDefaults}
              onRequestEyedropper={() => {
                state.setViewerTool("eyedropper");
              }}
              onBakeIslands={state.handleBakeIslands}
              onAddFreeformFrame={state.handleAddFreeformFrame}
              onDeleteFreeformFrame={state.handleDeleteFreeformFrame}
              onAssignFramesToTrack={state.handleAssignFramesToTrack}
            />
          </div>
        )}
      </div>

      {/* 3. Studio Telemetry & Status Bar */}
      <AtlasStatusBar
        assetId={state.activePreset.id}
        assetName={state.activePreset.name}
        category={state.activePreset.category}
        slicingMethod={state.metaDoc.slicing?.method || "by_count"}
        frameCount={state.sliceMetrics.frameCount}
        textureWidth={state.sliceMetrics.textureWidth}
        textureHeight={state.sliceMetrics.textureHeight}
        durationMs={state.sliceMetrics.durationMs}
        error={state.errorState}
        onClearError={() => state.setErrorState(null)}
        onNavigateToLogs={onNavigateToLogs}
      />
    </div>
  );
};

export default AtlasMetaSubTab;
