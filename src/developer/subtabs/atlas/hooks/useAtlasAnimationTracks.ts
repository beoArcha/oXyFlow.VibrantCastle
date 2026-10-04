import { useState, useCallback } from "react";
import {
  AtlasAnimationTrackDefinition,
  AtlasMetaDoc,
  AtlasTrackType,
  CreateTrackSelectionParams,
  AssignSelectionParams,
  MergeWideParams,
} from "../types";

export type ToggleFrameTarget = { col: number; row: number };

/**
 * Parses animation tracks from an AtlasMetaDoc safely without `any` casts.
 */
export function parseTracksFromMeta(doc: AtlasMetaDoc): AtlasAnimationTrackDefinition[] {
  const list: AtlasAnimationTrackDefinition[] = [];
  if (doc.animations) {
    Object.entries(doc.animations).forEach(([name, data]) => {
      if (data && typeof data === "object" && typeof data.row === "number") {
        const trackType: AtlasTrackType = data.frameIndices
          ? "indexed"
          : data.slotSpan
          ? "grid"
          : "grid";

        list.push({
          name,
          type: trackType,
          row: data.row ?? 0,
          frames: data.frames ?? 1,
          fps: data.fps ?? 8,
          loop: data.loop !== undefined ? data.loop : true,
          wide: data.wide,
          slotSpan: data.slotSpan,
          cells: data.cells,
          frameIndices: data.frameIndices,
        });
      }
    });
  }

  if (list.length === 0 && doc.layout) {
    const layoutEntries = Object.entries(doc.layout) as [string, unknown][];
    layoutEntries.forEach(([name, data]) => {
      if (
        data &&
        typeof data === "object" &&
        "row" in data &&
        typeof (data as { row: number }).row === "number"
      ) {
        const typedData = data as { row: number; frames?: number; widthCells?: number };
        const animInfo = doc.animations?.[name] || {};
        list.push({
          name,
          type: "grid",
          row: typedData.row,
          frames: typedData.frames ?? 1,
          fps: animInfo.fps ?? 8,
          loop: animInfo.loop !== undefined ? animInfo.loop : true,
          slotSpan: typedData.widthCells
            ? Array(typedData.frames ?? 1).fill(typedData.widthCells)
            : undefined,
        });
      }
    });
  }

  return list;
}

/**
 * Domain slice hook managing animation tracks, active track selection, and frame navigation.
 */
export function useAtlasAnimationTracks() {
  const [tracks, setTracks] = useState<AtlasAnimationTrackDefinition[]>([]);
  const [selectedTrackName, setSelectedTrackName] = useState<string | null>(null);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(0);

  const handleCreateTrackFromSelection = useCallback(
    (sel: CreateTrackSelectionParams, gridRows: number, cellWidth: number) => {
      const newName = `anim_${tracks.length + 1}`;
      const row = sel.row !== undefined ? sel.row : Math.min(gridRows - 1, tracks.length);
      const frames = Math.max(1, Math.round(sel.width / Math.max(1, cellWidth)));
      const newTrack: AtlasAnimationTrackDefinition = {
        name: newName,
        type: "grid",
        row,
        frames,
        fps: 8,
        loop: true,
      };
      setTracks((prev) => [...prev, newTrack]);
      setSelectedTrackName(newName);
      setSelectedFrameIndex(0);
      return newName;
    },
    [tracks.length]
  );

  const handleAssignSelectionToActiveTrack = useCallback(
    (sel: AssignSelectionParams, cellWidth: number) => {
      if (!selectedTrackName) return;
      const frames = Math.max(1, Math.round(sel.width / Math.max(1, cellWidth)));
      const row = sel.row !== undefined ? sel.row : 0;
      setTracks((prev) =>
        prev.map((tr) => (tr.name === selectedTrackName ? { ...tr, row, frames } : tr))
      );
    },
    [selectedTrackName]
  );

  const handleMergeSelectionAsWide = useCallback(
    (sel: MergeWideParams) => {
      if (!selectedTrackName) return;
      setTracks((prev) =>
        prev.map((tr) => {
          if (tr.name !== selectedTrackName) return tr;
          const targetFrame = selectedFrameIndex ?? 0;
          const spans = tr.slotSpan ? [...tr.slotSpan] : Array(tr.frames).fill(1);
          if (targetFrame < spans.length) {
            spans[targetFrame] = sel.span;
          }
          return {
            ...tr,
            wide: true,
            slotSpan: spans,
          };
        })
      );
    },
    [selectedTrackName, selectedFrameIndex]
  );

  const handleToggleSequenceFrame = useCallback(
    (target: { col: number; row: number }) => {
      if (!selectedTrackName) return;
      setTracks((prev) =>
        prev.map((tr) => {
          if (tr.name !== selectedTrackName) return tr;
          const currentIndices = tr.frameIndices
            ? [...tr.frameIndices]
            : Array.from({ length: tr.frames }, (_, i) => i);

          const existingIdx = currentIndices.lastIndexOf(target.col);
          if (existingIdx !== -1 && currentIndices.length > 1) {
            currentIndices.splice(existingIdx, 1);
          } else {
            currentIndices.push(target.col);
          }

          return {
            ...tr,
            type: "indexed" as AtlasTrackType,
            row: tr.row ?? target.row,
            frames: currentIndices.length,
            frameIndices: currentIndices,
          };
        })
      );
    },
    [selectedTrackName]
  );

  const handleReorderTrackFrames = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (!selectedTrackName) return;
      setTracks((prev) =>
        prev.map((tr) => {
          if (tr.name !== selectedTrackName) return tr;
          const list = tr.frameIndices
            ? [...tr.frameIndices]
            : Array.from({ length: tr.frames }, (_, i) => i);
          if (fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx >= list.length) {
            return tr;
          }
          const [moved] = list.splice(fromIdx, 1);
          list.splice(toIdx, 0, moved);
          return {
            ...tr,
            frames: list.length,
            frameIndices: list,
          };
        })
      );
    },
    [selectedTrackName]
  );

  const handleRemoveTrackFrame = useCallback(
    (frameIdx: number) => {
      if (!selectedTrackName) return;
      setTracks((prev) =>
        prev.map((tr) => {
          if (tr.name !== selectedTrackName) return tr;
          const list = tr.frameIndices
            ? [...tr.frameIndices]
            : Array.from({ length: tr.frames }, (_, i) => i);
          if (frameIdx < 0 || frameIdx >= list.length) return tr;
          list.splice(frameIdx, 1);
          return {
            ...tr,
            frames: Math.max(1, list.length),
            frameIndices: list.length > 0 ? list : [0],
          };
        })
      );
    },
    [selectedTrackName]
  );

  const handleDuplicateTrackFrame = useCallback(
    (frameIdx: number) => {
      if (!selectedTrackName) return;
      setTracks((prev) =>
        prev.map((tr) => {
          if (tr.name !== selectedTrackName) return tr;
          const list = tr.frameIndices
            ? [...tr.frameIndices]
            : Array.from({ length: tr.frames }, (_, i) => i);
          if (frameIdx < 0 || frameIdx >= list.length) return tr;
          const val = list[frameIdx];
          list.splice(frameIdx + 1, 0, val);
          return {
            ...tr,
            frames: list.length,
            frameIndices: list,
          };
        })
      );
    },
    [selectedTrackName]
  );

  const handleReverseTrack = useCallback(() => {
    if (!selectedTrackName) return;
    setTracks((prev) =>
      prev.map((tr) => {
        if (tr.name !== selectedTrackName) return tr;
        const list = tr.frameIndices
          ? [...tr.frameIndices]
          : Array.from({ length: tr.frames }, (_, i) => i);
        list.reverse();
        return {
          ...tr,
          frames: list.length,
          frameIndices: list,
        };
      })
    );
  }, [selectedTrackName]);

  const handlePingPongTrack = useCallback(() => {
    if (!selectedTrackName) return;
    setTracks((prev) =>
      prev.map((tr) => {
        if (tr.name !== selectedTrackName) return tr;
        const base = tr.frameIndices
          ? [...tr.frameIndices]
          : Array.from({ length: tr.frames }, (_, i) => i);
        if (base.length <= 1) return tr;
        const middleReversed = base.slice(1, -1).reverse();
        const pingPongList = [...base, ...middleReversed];
        return {
          ...tr,
          pingPong: !tr.pingPong,
          frames: pingPongList.length,
          frameIndices: pingPongList,
        };
      })
    );
  }, [selectedTrackName]);

  const handleClearTrackFrames = useCallback(() => {
    if (!selectedTrackName) return;
    setTracks((prev) =>
      prev.map((tr) => {
        if (tr.name !== selectedTrackName) return tr;
        return {
          ...tr,
          frames: 1,
          frameIndices: [0],
        };
      })
    );
  }, [selectedTrackName]);

  const handleFrameDelayChange = useCallback(
    (frameIdx: number, delayMs: number) => {
      if (!selectedTrackName) return;
      setTracks((prev) =>
        prev.map((tr) => {
          if (tr.name !== selectedTrackName) return tr;
          const delays = tr.frameDelays ? [...tr.frameDelays] : Array(tr.frames).fill(0);
          delays[frameIdx] = delayMs;
          return {
            ...tr,
            frameDelays: delays,
          };
        })
      );
    },
    [selectedTrackName]
  );

  return {
    tracks,
    selectedTrackName,
    selectedFrameIndex,
    setTracks,
    setSelectedTrackName,
    setSelectedFrameIndex,
    parseTracksFromMeta,
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
  };
}

export default useAtlasAnimationTracks;
