import { useState, useCallback } from "react";
import {
  AtlasAnimationTrackDefinition,
  AtlasMetaDoc,
  AtlasTrackType,
} from "../types";

export interface CreateTrackSelectionParams {
  x: number;
  y: number;
  width: number;
  height: number;
  row?: number;
  framesCount?: number;
}

export interface AssignSelectionParams {
  x: number;
  y: number;
  width: number;
  height: number;
  row?: number;
}

export interface MergeWideParams {
  x: number;
  y: number;
  width: number;
  height: number;
  span: number;
}

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
  };
}

export default useAtlasAnimationTracks;
