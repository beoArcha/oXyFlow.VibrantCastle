import { useState, useMemo, useCallback } from "react";
import type { ResolvedFrameRect } from "@game/engine/meta/types";
import type { EditableMetaDoc } from "../atlasSlicerHelpers";
import {
  resolveActiveTrackFrames,
  buildReversedTrackIndices,
  buildPingPongTrackIndices,
} from "../atlasSequenceHelpers";

export interface UseAtlasTrackActionsOptions {
  readonly initialTrackName: string;
  readonly meta: EditableMetaDoc;
  readonly resolvedFrames: readonly ResolvedFrameRect[];
  readonly updateMeta: (updater: (prev: EditableMetaDoc) => EditableMetaDoc) => void;
}

/**
 * Manages active animation track selection, sequence editing, and track creation/deletion.
 */
export function useAtlasTrackActions(options: UseAtlasTrackActionsOptions) {
  const { initialTrackName, meta, resolvedFrames, updateMeta } = options;

  const [activeTrackName, setActiveTrackName] = useState<string>(initialTrackName);
  const [newTrackName, setNewTrackName] = useState("");

  const activeTrack = meta.animations[activeTrackName] ?? Object.values(meta.animations)[0];

  const activeTrackFrames = useMemo<ResolvedFrameRect[]>(
    () => resolveActiveTrackFrames(activeTrack, activeTrackName, resolvedFrames),
    [activeTrack, activeTrackName, resolvedFrames]
  );

  const handleAppendSequenceFrame = useCallback(
    (frameId: string) => {
      if (!activeTrackName) return;
      const idx = resolvedFrames.findIndex((f) => f.id === frameId);
      if (idx < 0) return;
      updateMeta((prev) => {
        const track = prev.animations[activeTrackName];
        if (!track) return prev;
        const existing = track.frameIndices ?? [];
        return {
          ...prev,
          animations: {
            ...prev.animations,
            [activeTrackName]: {
              ...track,
              frameIndices: [...existing, idx],
              frames: existing.length + 1,
            },
          },
        };
      });
    },
    [activeTrackName, resolvedFrames, updateMeta]
  );

  const handleReverseTrack = useCallback(() => {
    const reversed = buildReversedTrackIndices(
      activeTrack,
      activeTrackFrames,
      resolvedFrames
    );
    updateMeta((prev) => ({
      ...prev,
      animations: {
        ...prev.animations,
        [activeTrackName]: {
          ...prev.animations[activeTrackName],
          frameIndices: reversed,
          frames: reversed.length,
        },
      },
    }));
  }, [activeTrack, activeTrackFrames, resolvedFrames, activeTrackName, updateMeta]);

  const handlePingPongTrack = useCallback(() => {
    const pingPong = buildPingPongTrackIndices(
      activeTrack,
      activeTrackFrames,
      resolvedFrames
    );
    updateMeta((prev) => ({
      ...prev,
      animations: {
        ...prev.animations,
        [activeTrackName]: {
          ...prev.animations[activeTrackName],
          frameIndices: pingPong,
          frames: pingPong.length,
        },
      },
    }));
  }, [activeTrack, activeTrackFrames, resolvedFrames, activeTrackName, updateMeta]);

  const handleAddTrack = useCallback(() => {
    const clean = newTrackName.trim();
    if (!clean) return;
    updateMeta((prev) => ({
      ...prev,
      animations: {
        ...prev.animations,
        [clean]: { row: 0, frames: 4, fps: 10, loop: true },
      },
    }));
    setActiveTrackName(clean);
    setNewTrackName("");
  }, [newTrackName, updateMeta]);

  const handleDeleteActiveTrack = useCallback(() => {
    updateMeta((prev) => {
      const copy = { ...prev.animations };
      delete copy[activeTrackName];
      return { ...prev, animations: copy };
    });
    const remaining = Object.keys(meta.animations).filter(
      (k) => k !== activeTrackName
    );
    setActiveTrackName(remaining[0] ?? "idle");
  }, [activeTrackName, meta.animations, updateMeta]);

  return {
    activeTrackName,
    setActiveTrackName,
    newTrackName,
    setNewTrackName,
    activeTrack,
    activeTrackFrames,
    handleAppendSequenceFrame,
    handleReverseTrack,
    handlePingPongTrack,
    handleAddTrack,
    handleDeleteActiveTrack,
  };
}
