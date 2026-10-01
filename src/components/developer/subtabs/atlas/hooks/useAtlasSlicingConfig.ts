import { useState, useCallback, useMemo } from "react";
import {
  ResolvedFrameRect,
  IAtlasSlicingConfig,
  IAtlasBackgroundConfig,
  AtlasMetaDoc,
  AtlasAnimationTrackDefinition,
  AtlasInspectorTabId,
} from "../types";
import { LoggerManager } from "@lib/logger";
import { GameBaseError } from "@lib/errors";
import { AutoIslandSlicingStrategy } from "@game/engine/meta/slicing";

export interface FreeformFrameInput {
  x: number;
  y: number;
  width: number;
  height: number;
  id?: string;
  trackName?: string;
  pivot?: { x: number; y: number };
}

export interface ISliceMetrics {
  frameCount: number;
  durationMs: number;
  textureWidth?: number;
  textureHeight?: number;
}

export interface UseAtlasSlicingConfigOptions {
  metaDoc: AtlasMetaDoc;
  setMetaDoc: React.Dispatch<React.SetStateAction<AtlasMetaDoc>>;
  setTracks: React.Dispatch<React.SetStateAction<AtlasAnimationTrackDefinition[]>>;
  setSelectedTrackName: (name: string | null) => void;
  setSelectedFrameIndex: (idx: number) => void;
  setActiveInspectorTab: (tab: AtlasInspectorTabId) => void;
  setErrorState: (err: GameBaseError | null) => void;
  gridRows: number;
}

/**
 * Domain slice hook managing texture slicing parameters, chroma-key background,
 * freeform frame definitions, and auto-island baking.
 */
export function useAtlasSlicingConfig({
  setMetaDoc,
  setTracks,
  setSelectedTrackName,
  setSelectedFrameIndex,
  setActiveInspectorTab,
  setErrorState,
  gridRows,
}: UseAtlasSlicingConfigOptions) {
  const studioLogger = useMemo(() => LoggerManager.getInstance().getLogger("AtlasStudio"), []);

  const [resolvedFrames, setResolvedFrames] = useState<ResolvedFrameRect[]>([]);
  const [sliceMetrics, setSliceMetrics] = useState<ISliceMetrics>({
    frameCount: 0,
    durationMs: 0,
  });

  const handleMetricsChange = useCallback(
    (metrics: ISliceMetrics) => {
      setSliceMetrics((prev) => {
        if (
          prev.frameCount === metrics.frameCount &&
          prev.textureWidth === metrics.textureWidth &&
          prev.textureHeight === metrics.textureHeight &&
          Math.abs(prev.durationMs - metrics.durationMs) < 0.5
        ) {
          return prev;
        }
        return metrics;
      });
    },
    []
  );

  const handleErrorChange = useCallback(
    (err: GameBaseError | null) => {
      setErrorState(err);
    },
    [setErrorState]
  );

  const handleSampleBackgroundColor = useCallback(
    (hex: string) => {
      setMetaDoc((prev) => ({
        ...prev,
        backgroundConfig: {
          mode: "color",
          colorHex: hex,
          tolerance: prev.backgroundConfig?.tolerance ?? 15,
          removeAtRuntime: prev.backgroundConfig?.removeAtRuntime ?? true,
        },
      }));
      setActiveInspectorTab("background");
    },
    [setActiveInspectorTab, setMetaDoc]
  );

  const handleSlicingConfigChange = useCallback(
    (config: IAtlasSlicingConfig) => {
      setMetaDoc((prev) => ({
        ...prev,
        slicing: config,
      }));
    },
    [setMetaDoc]
  );

  const handleBackgroundConfigChange = useCallback(
    (config: IAtlasBackgroundConfig) => {
      setMetaDoc((prev) => ({
        ...prev,
        backgroundConfig: config,
      }));
    },
    [setMetaDoc]
  );

  const handleAddFreeformFrame = useCallback(
    (frame: FreeformFrameInput) => {
      setMetaDoc((prev) => {
        const currentFrames = Array.isArray(prev.slicing?.frames)
          ? [...prev.slicing.frames]
          : [];
        const newId = frame.id || `frame_${currentFrames.length + 1}`;
        const newFrame = {
          id: newId,
          x: Math.round(frame.x),
          y: Math.round(frame.y),
          width: Math.round(frame.width),
          height: Math.round(frame.height),
          trackName: frame.trackName,
          pivot: frame.pivot || { x: 0.5, y: 1.0 },
        };
        const updatedFrames = [...currentFrames, newFrame];
        return {
          ...prev,
          slicing: {
            ...(prev.slicing || { method: "freeform_rects" }),
            method: prev.slicing?.method === "auto_islands" ? "auto_islands" : "freeform_rects",
            frames: updatedFrames,
          },
        };
      });
      studioLogger.info(
        `Added freeform frame: ${frame.id || "new frame"} [${frame.width}x${frame.height}]`
      );
    },
    [setMetaDoc, studioLogger]
  );

  const handleBakeIslands = useCallback(
    (islands?: ResolvedFrameRect[]) => {
      const targetIslands = islands || resolvedFrames;
      const bakedFrames = targetIslands.map((isl, idx) => ({
        id: isl.id || `island_${idx}`,
        x: Math.round(isl.x),
        y: Math.round(isl.y),
        width: Math.round(isl.width),
        height: Math.round(isl.height),
        trackName: isl.trackName,
        frameIndex: isl.frameIndex,
        pivot: isl.pivot || { x: 0.5, y: 1.0 },
      }));

      setMetaDoc((prev) => ({
        ...prev,
        slicing: {
          ...(prev.slicing || { method: "auto_islands" }),
          method: "auto_islands",
          frames: bakedFrames,
        },
      }));

      studioLogger.info(
        `Baked ${bakedFrames.length} auto-island frames into static slicing frames`
      );
    },
    [resolvedFrames, setMetaDoc, studioLogger]
  );

  const handleClusterIslandsIntoTracks = useCallback(
    (detectedIslands?: ResolvedFrameRect[]) => {
      const islands = detectedIslands || resolvedFrames;
      if (islands.length === 0) return;
      const clusters = AutoIslandSlicingStrategy.clusterIslandsIntoRows(islands);
      if (clusters.length === 0) return;

      const newTracks: AtlasAnimationTrackDefinition[] = clusters.map((c) => ({
        name: c.trackName,
        type: "freeform",
        row: c.row,
        frames: c.frames.length,
        fps: 8,
        loop: true,
      }));

      const allClusterFrames = clusters.flatMap((c) =>
        c.frames.map((f) => ({
          id: f.id,
          x: Math.round(f.x),
          y: Math.round(f.y),
          width: Math.round(f.width),
          height: Math.round(f.height),
          trackName: f.trackName,
          frameIndex: f.frameIndex,
          pivot: f.pivot || { x: 0.5, y: 1.0 },
        }))
      );

      setTracks(newTracks);
      setSelectedTrackName(newTracks[0]?.name || null);
      setSelectedFrameIndex(0);

      setMetaDoc((prev) => ({
        ...prev,
        slicing: {
          ...(prev.slicing || { method: "auto_islands" }),
          method: "auto_islands",
          frames: allClusterFrames,
        },
      }));

      studioLogger.info(
        `Clustered ${islands.length} islands into ${newTracks.length} animation tracks`
      );
    },
    [resolvedFrames, setTracks, setSelectedTrackName, setSelectedFrameIndex, setMetaDoc, studioLogger]
  );

  const handleDeleteFreeformFrame = useCallback(
    (id: string) => {
      setMetaDoc((prev) => {
        if (!Array.isArray(prev.slicing?.frames)) return prev;
        return {
          ...prev,
          slicing: {
            ...prev.slicing,
            frames: prev.slicing.frames.filter((f) => f.id !== id),
          },
        };
      });
      studioLogger.info(`Deleted freeform frame: ${id}`);
    },
    [setMetaDoc, studioLogger]
  );

  const handleAssignFramesToTrack = useCallback(
    (frameIds: string[], trackName: string) => {
      if (!trackName || frameIds.length === 0) return;

      setMetaDoc((prev) => {
        const currentFrames = Array.isArray(prev.slicing?.frames)
          ? [...prev.slicing.frames]
          : resolvedFrames.map((rf, idx) => ({
              id: rf.id || `frame_${idx}`,
              x: rf.x,
              y: rf.y,
              width: rf.width,
              height: rf.height,
              trackName: rf.trackName,
              frameIndex: rf.frameIndex,
              pivot: rf.pivot || { x: 0.5, y: 1.0 },
            }));

        let assignedIndex = 0;
        const updated = currentFrames.map((f) => {
          if (frameIds.includes(f.id!)) {
            return {
              ...f,
              trackName,
              frameIndex: assignedIndex++,
            };
          }
          return f;
        });

        return {
          ...prev,
          slicing: {
            ...(prev.slicing || { method: "freeform_rects" }),
            frames: updated,
          },
        };
      });

      setTracks((prev) => {
        const exists = prev.find((t) => t.name === trackName);
        if (exists) {
          return prev.map((t) =>
            t.name === trackName ? { ...t, frames: Math.max(t.frames, frameIds.length) } : t
          );
        }
        return [
          ...prev,
          {
            name: trackName,
            row: Math.min(gridRows - 1, prev.length),
            frames: frameIds.length,
            fps: 8,
            loop: true,
          },
        ];
      });

      setSelectedTrackName(trackName);
      setSelectedFrameIndex(0);
      studioLogger.info(`Assigned ${frameIds.length} frames to track '${trackName}'`);
    },
    [gridRows, resolvedFrames, setMetaDoc, setSelectedFrameIndex, setSelectedTrackName, setTracks, studioLogger]
  );

  return {
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
  };
}

export default useAtlasSlicingConfig;
