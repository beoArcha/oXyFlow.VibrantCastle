import { useState, useCallback, useMemo } from "react";
import {
  SelectedCellInfo,
  AtlasInspectorTabId,
  SlicerViewerTool,
  CreateTrackSelectionParams,
  AssignSelectionParams,
  MergeWideParams,
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  ResolvedFrameRect,
  AtlasOriginDefinition,
  AtlasMetaDoc,
  IAtlasSlicingConfig,
  IAtlasBackgroundConfig,
  AtlasAssetPreset,
} from "../types";
import { useAtlasPresets } from "./useAtlasPresets";
import { useAtlasAnimationTracks, ToggleFrameTarget } from "./useAtlasAnimationTracks";
import { useAtlasSlicingConfig, ISliceMetrics } from "./useAtlasSlicingConfig";
import { useAtlasTexture } from "./useAtlasTexture";
import { IPixelBuffer } from "@game/engine/meta/slicing/BackgroundProcessor";
import { GameBaseError, AssetError } from "@lib/errors";

export interface AtlasTracksSlice {
  tracks: AtlasAnimationTrackDefinition[];
  selectedTrackName: string | null;
  selectedFrameIndex: number | null;
  setTracks: (tracks: AtlasAnimationTrackDefinition[]) => void;
  setSelectedTrackName: (name: string | null) => void;
  setSelectedFrameIndex: (idx: number | null) => void;
  handleCreateTrackFromSelection: (sel: CreateTrackSelectionParams) => void;
  handleAssignSelectionToActiveTrack: (sel: AssignSelectionParams) => void;
  handleMergeSelectionAsWide: (sel: MergeWideParams) => void;
  handleToggleSequenceFrame: (target: ToggleFrameTarget) => void;
  handleReorderTrackFrames: (fromIdx: number, toIdx: number) => void;
  handleRemoveTrackFrame: (idx: number) => void;
  handleDuplicateTrackFrame: (idx: number) => void;
  handleReverseTrack: () => void;
  handlePingPongTrack: () => void;
  handleClearTrackFrames: () => void;
  handleFrameDelayChange: (frameIdx: number, delayMs: number) => void;
}

export interface AtlasPresetSlice {
  selectedPresetId: string;
  activePreset: AtlasAssetPreset;
  metaDoc: AtlasMetaDoc;
  imageSrc: string;
  origin: AtlasOriginDefinition;
  errorState: GameBaseError | null;
  setMetaDoc: (doc: AtlasMetaDoc) => void;
  setImageSrc: (src: string) => void;
  setOrigin: (origin: AtlasOriginDefinition) => void;
  setErrorState: (err: GameBaseError | null) => void;
  applyPreset: (preset: AtlasAssetPreset) => void;
  handleResetDefaults: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleJsonUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface AtlasTextureSlice {
  image: HTMLImageElement | null;
  pixelBuffer: IPixelBuffer | null;
  isTextureLoading: boolean;
  textureError: AssetError | null;
}

export interface AtlasSlicingSlice {
  gridConfig: AtlasGridConfig;
  setGridConfig: (grid: AtlasGridConfig) => void;
  resolvedFrames: ResolvedFrameRect[];
  setResolvedFrames: (frames: ResolvedFrameRect[]) => void;
  sliceMetrics: ISliceMetrics;
  handleMetricsChange: (metrics: ISliceMetrics) => void;
  handleErrorChange: (err: GameBaseError | null) => void;
  handleSampleBackgroundColor: (hex: string) => void;
  handleSlicingConfigChange: (config: IAtlasSlicingConfig) => void;
  handleBackgroundConfigChange: (config: IAtlasBackgroundConfig) => void;
  handleAddFreeformFrame: (box: { x: number; y: number; width: number; height: number }) => void;
  handleBakeIslands: (islands?: ResolvedFrameRect[]) => void;
  handleClusterIslandsIntoTracks: (detectedIslands?: ResolvedFrameRect[]) => void;
  handleDeleteFreeformFrame: (id: string) => void;
  handleAssignFramesToTrack: (frameIds: string[], trackName: string) => void;
}

export interface AtlasUiSlice {
  activeInspectorTab: AtlasInspectorTabId;
  setActiveInspectorTab: (tab: AtlasInspectorTabId) => void;
  viewerTool: SlicerViewerTool;
  setViewerTool: (tool: SlicerViewerTool) => void;
  isInspectorOpen: boolean;
  setIsInspectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCellInfo: SelectedCellInfo | null;
  setSelectedCellInfo: (info: SelectedCellInfo | null) => void;
}

export interface AtlasStudioStateReturn {
  // Domain Slices (Structured Architecture)
  tracksSlice: AtlasTracksSlice;
  presetSlice: AtlasPresetSlice;
  textureSlice: AtlasTextureSlice;
  slicingSlice: AtlasSlicingSlice;
  uiSlice: AtlasUiSlice;

  // Flattened convenience properties for backward compatibility
  selectedPresetId: string;
  activePreset: AtlasAssetPreset;
  metaDoc: AtlasMetaDoc;
  imageSrc: string;
  image: HTMLImageElement | null;
  pixelBuffer: IPixelBuffer | null;
  isTextureLoading: boolean;
  textureError: AssetError | null;
  gridConfig: AtlasGridConfig;
  tracks: AtlasAnimationTrackDefinition[];
  origin: AtlasOriginDefinition;
  selectedTrackName: string | null;
  selectedFrameIndex: number | null;
  selectedCellInfo: SelectedCellInfo | null;
  activeInspectorTab: AtlasInspectorTabId;
  viewerTool: SlicerViewerTool;
  isInspectorOpen: boolean;
  errorState: GameBaseError | null;
  resolvedFrames: ResolvedFrameRect[];
  sliceMetrics: ISliceMetrics;
  setSelectedTrackName: (name: string | null) => void;
  setSelectedFrameIndex: (idx: number | null) => void;
  setSelectedCellInfo: (info: SelectedCellInfo | null) => void;
  setActiveInspectorTab: (tab: AtlasInspectorTabId) => void;
  setViewerTool: (tool: SlicerViewerTool) => void;
  setIsInspectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setErrorState: (err: GameBaseError | null) => void;
  setResolvedFrames: (frames: ResolvedFrameRect[]) => void;
  setGridConfig: (grid: AtlasGridConfig) => void;
  setTracks: (tracks: AtlasAnimationTrackDefinition[]) => void;
  setOrigin: (origin: AtlasOriginDefinition) => void;
  setMetaDoc: (doc: AtlasMetaDoc) => void;
  setImageSrc: (src: string) => void;
  applyPreset: (preset: AtlasAssetPreset) => void;
  handleResetDefaults: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleJsonUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMetricsChange: (metrics: ISliceMetrics) => void;
  handleErrorChange: (err: GameBaseError | null) => void;
  handleCreateTrackFromSelection: (sel: CreateTrackSelectionParams) => void;
  handleAssignSelectionToActiveTrack: (sel: AssignSelectionParams) => void;
  handleMergeSelectionAsWide: (sel: MergeWideParams) => void;
  handleSampleBackgroundColor: (hex: string) => void;
  handleSlicingConfigChange: (config: IAtlasSlicingConfig) => void;
  handleBackgroundConfigChange: (config: IAtlasBackgroundConfig) => void;
  handleAddFreeformFrame: (box: { x: number; y: number; width: number; height: number }) => void;
  handleBakeIslands: (islands?: ResolvedFrameRect[]) => void;
  handleClusterIslandsIntoTracks: (detectedIslands?: ResolvedFrameRect[]) => void;
  handleDeleteFreeformFrame: (id: string) => void;
  handleAssignFramesToTrack: (frameIds: string[], trackName: string) => void;
  handleToggleSequenceFrame: (target: ToggleFrameTarget) => void;
  handleReorderTrackFrames: (fromIdx: number, toIdx: number) => void;
  handleRemoveTrackFrame: (idx: number) => void;
  handleDuplicateTrackFrame: (idx: number) => void;
  handleReverseTrack: () => void;
  handlePingPongTrack: () => void;
  handleClearTrackFrames: () => void;
  handleFrameDelayChange: (frameIdx: number, delayMs: number) => void;
}

/**
 * Atlas Studio State Orchestrator Hook.
 *
 * Organized into clear, testable domain slices (Single Responsibility Principle):
 * - tracksSlice: Track definitions, frame ranges, and wide multi-span assignments.
 * - presetSlice: Presets, custom texture upload, and JSON serialization.
 * - textureSlice: Texture asset loading, image element, and pixel buffer extraction.
 * - slicingSlice: Grid parameters, chroma keying, auto-islands, and freeform frames.
 * - uiSlice: Inspector docked state, active sub-tab, viewer interaction tool.
 */
export function useAtlasStudioState(): AtlasStudioStateReturn {
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

  // Memoized Domain Slices
  const tracksSlice: AtlasTracksSlice = useMemo(
    () => ({
      tracks,
      selectedTrackName,
      selectedFrameIndex,
      setTracks,
      setSelectedTrackName,
      setSelectedFrameIndex,
      handleCreateTrackFromSelection,
      handleAssignSelectionToActiveTrack,
      handleMergeSelectionAsWide,
      handleToggleSequenceFrame,
      handleReorderTrackFrames,
      handleRemoveTrackFrame,
      handleDuplicateTrackFrame,
      handleReverseTrack,
      handlePingPongTrack,
      handleClearTrackFrames,
      handleFrameDelayChange,
    }),
    [
      tracks,
      selectedTrackName,
      selectedFrameIndex,
      setTracks,
      setSelectedTrackName,
      setSelectedFrameIndex,
      handleCreateTrackFromSelection,
      handleAssignSelectionToActiveTrack,
      handleMergeSelectionAsWide,
      handleToggleSequenceFrame,
      handleReorderTrackFrames,
      handleRemoveTrackFrame,
      handleDuplicateTrackFrame,
      handleReverseTrack,
      handlePingPongTrack,
      handleClearTrackFrames,
      handleFrameDelayChange,
    ]
  );

  const presetSlice: AtlasPresetSlice = useMemo(
    () => ({
      selectedPresetId,
      activePreset,
      metaDoc,
      imageSrc,
      origin,
      errorState,
      setMetaDoc,
      setImageSrc,
      setOrigin,
      setErrorState,
      applyPreset,
      handleResetDefaults,
      handleImageUpload,
      handleJsonUpload,
    }),
    [
      selectedPresetId,
      activePreset,
      metaDoc,
      imageSrc,
      origin,
      errorState,
      setMetaDoc,
      setImageSrc,
      setOrigin,
      setErrorState,
      applyPreset,
      handleResetDefaults,
      handleImageUpload,
      handleJsonUpload,
    ]
  );

  const textureSlice: AtlasTextureSlice = useMemo(
    () => ({
      image,
      pixelBuffer,
      isTextureLoading,
      textureError,
    }),
    [image, pixelBuffer, isTextureLoading, textureError]
  );

  const slicingSlice: AtlasSlicingSlice = useMemo(
    () => ({
      gridConfig,
      setGridConfig,
      resolvedFrames,
      setResolvedFrames,
      sliceMetrics,
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
    }),
    [
      gridConfig,
      setGridConfig,
      resolvedFrames,
      setResolvedFrames,
      sliceMetrics,
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
    ]
  );

  const uiSlice: AtlasUiSlice = useMemo(
    () => ({
      activeInspectorTab,
      setActiveInspectorTab,
      viewerTool,
      setViewerTool,
      isInspectorOpen,
      setIsInspectorOpen,
      selectedCellInfo,
      setSelectedCellInfo,
    }),
    [
      activeInspectorTab,
      setActiveInspectorTab,
      viewerTool,
      setViewerTool,
      isInspectorOpen,
      setIsInspectorOpen,
      selectedCellInfo,
      setSelectedCellInfo,
    ]
  );

  return {
    // Slices
    tracksSlice,
    presetSlice,
    textureSlice,
    slicingSlice,
    uiSlice,

    // Flattened Convenience
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
