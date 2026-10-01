import { useState, useCallback } from "react";
import {
  SelectedCellInfo,
  AtlasInspectorTabId,
  SlicerViewerTool,
  CreateTrackSelectionParams,
  AssignSelectionParams,
  MergeWideParams,
} from "./types";
import {
  useAtlasPresets,
  useAtlasAnimationTracks,
  useAtlasSlicingConfig,
  useAtlasTexture,
} from "./hooks";

/**
 * Atlas Studio State Orchestrator Hook.
 *
 * Decomposed into specialized domain slice hooks (Single Responsibility Principle):
 * - useAtlasPresets: Presets, custom texture upload, and JSON serialization.
 * - useAtlasAnimationTracks: Track definitions, frame ranges, and wide multi-span assignments.
 * - useAtlasSlicingConfig: Grid parameters, chroma keying, auto-islands, and freeform frames.
 */
export function useAtlasStudioState() {
  // 1. Animation Tracks Slice
  const {
    tracks,
    selectedTrackName,
    selectedFrameIndex,
    setTracks,
    setSelectedTrackName,
    setSelectedFrameIndex,
    parseTracksFromMeta,
    handleCreateTrackFromSelection: createTrackSelection,
    handleAssignSelectionToActiveTrack: assignSelectionToTrack,
    handleMergeSelectionAsWide: mergeSelectionAsWide,
    handleToggleSequenceFrame,
    handleReorderTrackFrames,
    handleRemoveTrackFrame,
    handleDuplicateTrackFrame,
    handleReverseTrack,
    handlePingPongTrack,
    handleClearTrackFrames,
    handleFrameDelayChange,
  } = useAtlasAnimationTracks();

  // 2. Presets & Texture Assets Slice
  const {
    selectedPresetId,
    activePreset,
    metaDoc,
    imageSrc,
    gridConfig,
    origin,
    errorState,
    setMetaDoc,
    setImageSrc,
    setGridConfig,
    setOrigin,
    setErrorState,
    applyPreset,
    handleResetDefaults,
    handleImageUpload,
    handleJsonUpload,
  } = useAtlasPresets({
    parseTracksFromMeta,
    onTracksParsed: useCallback(
      (newTracks, activeTrackName) => {
        setTracks(newTracks);
        setSelectedTrackName(activeTrackName);
        setSelectedFrameIndex(0);
      },
      [setSelectedFrameIndex, setSelectedTrackName, setTracks]
    ),
  });

  // 3. Texture Asset & Pixel Buffer Slice (Single Source of Truth)
  const {
    image,
    pixelBuffer,
    isLoading: isTextureLoading,
    error: textureError,
  } = useAtlasTexture(imageSrc);

  // 4. UI Layout & Tooling State Slice
  const [activeInspectorTab, setActiveInspectorTab] = useState<AtlasInspectorTabId>("slicing");
  const [viewerTool, setViewerTool] = useState<SlicerViewerTool>("select");
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [selectedCellInfo, setSelectedCellInfo] = useState<SelectedCellInfo | null>(null);

  // 5. Slicing & Background Configuration Slice
  const {
    resolvedFrames,
    sliceMetrics,
    setResolvedFrames,
    handleMetricsChange,
    handleErrorChange,
    handleSampleBackgroundColor,
    handleSlicingConfigChange,
    handleBackgroundConfigChange,
    handleAddFreeformFrame,
    handleBakeIslands,
    handleClusterIslandsIntoTracks,
    handleDeleteFreeformFrame,
    handleAssignFramesToTrack,
  } = useAtlasSlicingConfig({
    metaDoc,
    setMetaDoc,
    setTracks,
    setSelectedTrackName,
    setSelectedFrameIndex,
    setActiveInspectorTab,
    setErrorState,
    gridRows: gridConfig.rows,
  });

  // Track selection action adapters with grid context
  const handleCreateTrackFromSelection = useCallback(
    (sel: CreateTrackSelectionParams) => {
      createTrackSelection(sel, gridConfig.rows, gridConfig.cellWidth);
      setActiveInspectorTab("slicing");
    },
    [createTrackSelection, gridConfig.rows, gridConfig.cellWidth]
  );

  const handleAssignSelectionToActiveTrack = useCallback(
    (sel: AssignSelectionParams) => {
      assignSelectionToTrack(sel, gridConfig.cellWidth);
    },
    [assignSelectionToTrack, gridConfig.cellWidth]
  );

  const handleMergeSelectionAsWide = useCallback(
    (sel: MergeWideParams) => {
      mergeSelectionAsWide(sel);
      setActiveInspectorTab("slicing");
    },
    [mergeSelectionAsWide]
  );

  return {
    selectedPresetId,
    activePreset,
    metaDoc,
    imageSrc,
    image,
    pixelBuffer,
    isTextureLoading,
    textureError,
    gridConfig,
    tracks,
    origin,
    selectedTrackName,
    selectedFrameIndex,
    selectedCellInfo,
    activeInspectorTab,
    viewerTool,
    isInspectorOpen,
    errorState,
    resolvedFrames,
    sliceMetrics,
    setSelectedTrackName,
    setSelectedFrameIndex,
    setSelectedCellInfo,
    setActiveInspectorTab,
    setViewerTool,
    setIsInspectorOpen,
    setErrorState,
    setResolvedFrames,
    setGridConfig,
    setTracks,
    setOrigin,
    setMetaDoc,
    setImageSrc,
    applyPreset,
    handleResetDefaults,
    handleImageUpload,
    handleJsonUpload,
    handleMetricsChange,
    handleErrorChange,
    handleCreateTrackFromSelection,
    handleAssignSelectionToActiveTrack,
    handleMergeSelectionAsWide,
    handleSampleBackgroundColor,
    handleSlicingConfigChange,
    handleBackgroundConfigChange,
    handleAddFreeformFrame,
    handleBakeIslands,
    handleClusterIslandsIntoTracks,
    handleDeleteFreeformFrame,
    handleAssignFramesToTrack,
    handleToggleSequenceFrame,
    handleReorderTrackFrames,
    handleRemoveTrackFrame,
    handleDuplicateTrackFrame,
    handleReverseTrack,
    handlePingPongTrack,
    handleClearTrackFrames,
    handleFrameDelayChange,
  };
}

export default useAtlasStudioState;
