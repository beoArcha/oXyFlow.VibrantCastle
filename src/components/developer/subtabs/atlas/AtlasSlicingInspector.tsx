import React, { useState, useMemo } from "react";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  IAtlasSlicingConfig,
  SlicingMethod,
  ResolvedFrameRect,
} from "./types";
import { IFreeformFrameRect } from "../../../../game/engine/meta/types";
import {
  SlicingMethodTabs,
  SlicingGridConfigCard,
  SlicingAutoIslandsCard,
  SlicingTrackAssignmentBar,
  SlicingFreeformTable,
  SlicingTracksManager,
} from "./slicing";

export interface AtlasSlicingInspectorProps {
  slicingConfig?: IAtlasSlicingConfig;
  gridConfig: AtlasGridConfig;
  tracks: AtlasAnimationTrackDefinition[];
  selectedTrackName: string | null;
  resolvedFrames?: ResolvedFrameRect[];
  selectedFrameIndex?: number | null;
  onSlicingConfigChange: (config: IAtlasSlicingConfig) => void;
  onGridConfigChange: (grid: AtlasGridConfig) => void;
  onTracksChange: (tracks: AtlasAnimationTrackDefinition[]) => void;
  onSelectTrack: (trackName: string) => void;
  onSelectFrame?: (frameIdx: number) => void;
  onBakeIslands?: (islands: ResolvedFrameRect[]) => void;
  onAddFreeformFrame?: (frame: {
    x: number;
    y: number;
    width: number;
    height: number;
    id?: string;
    trackName?: string;
    pivot?: { x: number; y: number };
  }) => void;
  onUpdateFreeformFrame?: (id: string, updates: Partial<ResolvedFrameRect>) => void;
  onDeleteFreeformFrame?: (id: string) => void;
  onAssignFramesToTrack?: (frameIds: string[], trackName: string) => void;
}

/**
 * AtlasSlicingInspector Orchestrator Component.
 *
 * Responsibilities:
 * - Orchestrates modular slicing strategies (Grid, Auto-Islands, Freeform).
 * - Manages frame selection state and track assignment.
 * - Conforms to SRP (<200 lines).
 */
export const AtlasSlicingInspector: React.FC<AtlasSlicingInspectorProps> = ({
  slicingConfig,
  gridConfig,
  tracks,
  selectedTrackName,
  resolvedFrames = [],
  onSlicingConfigChange,
  onGridConfigChange,
  onTracksChange,
  onSelectTrack,
  onSelectFrame,
  onBakeIslands,
  onAddFreeformFrame,
  onUpdateFreeformFrame,
  onDeleteFreeformFrame,
  onAssignFramesToTrack,
}) => {
  const currentMethod: SlicingMethod = slicingConfig?.method || "by_count";

  // State for interactive island & freeform frames assignment
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>([]);
  const [newTrackName, setNewTrackName] = useState<string>("");
  const [bakeSuccess, setBakeSuccess] = useState<boolean>(false);

  // Normalized freeform frames list
  const freeformFramesList: IFreeformFrameRect[] = useMemo(() => {
    const f = slicingConfig?.frames || slicingConfig?.freeformFrames;
    if (!f) return [];
    if (Array.isArray(f)) return f;
    return Object.entries(f).map(([key, val]) => {
      const item = val as IFreeformFrameRect;
      return { ...item, id: item?.id || key };
    });
  }, [slicingConfig]);

  // Detected islands from resolved frames or pre-baked frames
  const detectedIslands: ResolvedFrameRect[] = useMemo(() => {
    if (resolvedFrames && resolvedFrames.length > 0) return resolvedFrames;
    return freeformFramesList.map((f, idx) => ({
      id: f.id || `frame_${idx}`,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      trackName: f.trackName,
      frameIndex: f.frameIndex,
      pivot: f.pivot,
    }));
  }, [resolvedFrames, freeformFramesList]);

  // Bake all detected islands into static frames (Zero CPU runtime flood-fill guarantee)
  const handleBakeAllIslands = () => {
    if (detectedIslands.length === 0) return;
    if (onBakeIslands) {
      onBakeIslands(detectedIslands);
    } else {
      const baked: IFreeformFrameRect[] = detectedIslands.map((isl, idx) => ({
        id: isl.id || `island_${idx}`,
        x: Math.round(isl.x),
        y: Math.round(isl.y),
        width: Math.round(isl.width),
        height: Math.round(isl.height),
        trackName: isl.trackName,
        frameIndex: isl.frameIndex,
        pivot: isl.pivot || { x: 0.5, y: 1.0 },
      }));
      onSlicingConfigChange({
        ...slicingConfig,
        method: "auto_islands",
        frames: baked,
      });
    }
    setBakeSuccess(true);
    setTimeout(() => setBakeSuccess(false), 3000);
  };

  // Assign selected frame IDs to a track
  const handleAssignSelectedToTrack = (trackName: string) => {
    if (!trackName || selectedFrameIds.length === 0) return;
    if (onAssignFramesToTrack) {
      onAssignFramesToTrack(selectedFrameIds, trackName);
    } else {
      let assignedIdx = 0;
      const updated = freeformFramesList.map((f) => {
        if (selectedFrameIds.includes(f.id!)) {
          return { ...f, trackName, frameIndex: assignedIdx++ };
        }
        return f;
      });
      onSlicingConfigChange({
        ...slicingConfig,
        method: currentMethod,
        frames: updated,
      });
      if (!tracks.find((t) => t.name === trackName)) {
        onTracksChange([
          ...tracks,
          {
            name: trackName,
            row: Math.min(gridConfig.rows - 1, tracks.length),
            frames: selectedFrameIds.length,
            fps: 8,
            loop: true,
          },
        ]);
      }
    }
    setSelectedFrameIds([]);
  };

  const handleCreateTrackFromSelected = () => {
    const name = newTrackName.trim() || `anim_${tracks.length + 1}`;
    handleAssignSelectedToTrack(name);
    setNewTrackName("");
    onSelectTrack(name);
  };

  const handleAddFreeformFrameAction = () => {
    const newId = `frame_${freeformFramesList.length + 1}`;
    if (onAddFreeformFrame) {
      onAddFreeformFrame({
        id: newId,
        x: 0,
        y: 0,
        width: gridConfig.cellWidth,
        height: gridConfig.cellHeight,
        pivot: { x: 0.5, y: 1.0 },
      });
    } else {
      const newFrame: IFreeformFrameRect = {
        id: newId,
        x: 0,
        y: 0,
        width: gridConfig.cellWidth,
        height: gridConfig.cellHeight,
        pivot: { x: 0.5, y: 1.0 },
      };
      onSlicingConfigChange({
        ...slicingConfig,
        method: "freeform_rects",
        frames: [...freeformFramesList, newFrame],
      });
    }
  };

  const handleDeleteFreeformFrameAction = (id: string) => {
    if (onDeleteFreeformFrame) {
      onDeleteFreeformFrame(id);
    } else {
      const remaining = freeformFramesList.filter((f) => f.id !== id);
      onSlicingConfigChange({
        ...slicingConfig,
        method: currentMethod,
        frames: remaining,
      });
    }
    setSelectedFrameIds((prev) => prev.filter((item) => item !== id));
  };

  const handleUpdateFrameField = (id: string, field: keyof IFreeformFrameRect, val: any) => {
    if (onUpdateFreeformFrame) {
      onUpdateFreeformFrame(id, { [field]: val });
    } else {
      const updated = freeformFramesList.map((f) => {
        if (f.id === id) {
          return { ...f, [field]: val };
        }
        return f;
      });
      onSlicingConfigChange({
        ...slicingConfig,
        method: currentMethod,
        frames: updated,
      });
    }
  };

  const handleMethodChange = (newMethod: SlicingMethod) => {
    onSlicingConfigChange({
      ...slicingConfig,
      method: newMethod,
    });
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* 1. Slicing Strategy Tabs */}
      <SlicingMethodTabs
        currentMethod={currentMethod}
        onMethodChange={handleMethodChange}
      />

      {/* 2. Strategy-Specific Config Panel */}
      {(currentMethod === "by_count" || currentMethod === "by_cell_size") && (
        <SlicingGridConfigCard
          gridConfig={gridConfig}
          method={currentMethod}
          onGridConfigChange={onGridConfigChange}
        />
      )}

      {currentMethod === "auto_islands" && (
        <SlicingAutoIslandsCard
          slicingConfig={slicingConfig}
          detectedIslands={detectedIslands}
          bakeSuccess={bakeSuccess}
          onBakeAllIslands={handleBakeAllIslands}
          onSlicingConfigChange={onSlicingConfigChange}
        />
      )}

      {currentMethod === "freeform_rects" && (
        <SlicingFreeformTable
          frames={freeformFramesList}
          selectedFrameIds={selectedFrameIds}
          onToggleSelectFrame={(id) =>
            setSelectedFrameIds((prev) =>
              prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
            )
          }
          onSelectAll={(ids) => setSelectedFrameIds(ids)}
          onDeselectAll={() => setSelectedFrameIds([])}
          onAddFrame={handleAddFreeformFrameAction}
          onUpdateFrameField={handleUpdateFrameField}
          onDeleteFrame={handleDeleteFreeformFrameAction}
          onSelectFrame={onSelectFrame}
        />
      )}

      {/* 3. Floating Track Assignment Bar (shown when frames are selected) */}
      <SlicingTrackAssignmentBar
        selectedFrameIds={selectedFrameIds}
        tracks={tracks}
        newTrackName={newTrackName}
        onNewTrackNameChange={setNewTrackName}
        onAssignSelectedToTrack={handleAssignSelectedToTrack}
        onCreateTrackFromSelected={handleCreateTrackFromSelected}
        onClearSelection={() => setSelectedFrameIds([])}
      />

      {/* 4. Animation Tracks Manager */}
      <SlicingTracksManager
        tracks={tracks}
        selectedTrackName={selectedTrackName}
        maxRows={gridConfig.rows}
        onTracksChange={onTracksChange}
        onSelectTrack={onSelectTrack}
      />
    </div>
  );
};

export default AtlasSlicingInspector;
