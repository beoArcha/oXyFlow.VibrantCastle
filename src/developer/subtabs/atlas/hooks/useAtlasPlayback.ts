import { useState, useRef, useEffect, useCallback } from "react";
import type { IAnimationTrackMeta, ResolvedFrameRect } from "@game/engine/meta/types";
import { renderAnimationPreviewCanvas } from "../atlasCanvasRenderer";

export interface UseAtlasPlaybackOptions {
  readonly loadedImage: HTMLImageElement | null;
  readonly chromaCanvas: HTMLCanvasElement | null;
  readonly activeTrack: IAnimationTrackMeta | undefined;
  readonly activeTrackFrames: readonly ResolvedFrameRect[];
  readonly anchorX: number;
  readonly anchorY: number;
}

/**
 * Manages live animation preview playback, onion skinning, and Canvas 2D preview rendering.
 */
export function useAtlasPlayback(options: UseAtlasPlaybackOptions) {
  const {
    loadedImage,
    chromaCanvas,
    activeTrack,
    activeTrackFrames,
    anchorX,
    anchorY,
  } = options;

  const [isPlaying, setIsPlaying] = useState(true);
  const [playheadIdx, setPlayheadIdx] = useState(0);
  const [previewScale, setPreviewScale] = useState(1.5);
  const [flipX, setFlipX] = useState(false);
  const [showGroundLine, setShowGroundLine] = useState(true);
  const [onionSkin, setOnionSkin] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isPlaying || activeTrackFrames.length <= 1) return;
    const fps = Math.max(1, activeTrack?.fps ?? 8);
    const intervalMs = Math.round(1000 / fps);
    const id = window.setInterval(() => {
      setPlayheadIdx((prev) => {
        const next = prev + 1;
        if (next >= activeTrackFrames.length) {
          return activeTrack?.loop === false ? prev : 0;
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [isPlaying, activeTrack?.fps, activeTrack?.loop, activeTrackFrames.length]);

  useEffect(() => {
    if (playheadIdx >= activeTrackFrames.length && activeTrackFrames.length > 0) {
      setPlayheadIdx(0);
    }
  }, [activeTrackFrames.length, playheadIdx]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderAnimationPreviewCanvas(ctx, canvas.width, canvas.height, {
      source: chromaCanvas ?? loadedImage,
      activeTrackFrames,
      playheadIdx,
      previewScale,
      flipX,
      showGroundLine,
      onionSkin,
      anchorX,
      anchorY,
    });
  }, [
    loadedImage,
    chromaCanvas,
    activeTrackFrames,
    playheadIdx,
    previewScale,
    flipX,
    showGroundLine,
    onionSkin,
    anchorX,
    anchorY,
  ]);

  const stepPrev = useCallback(() => {
    const len = Math.max(1, activeTrackFrames.length);
    setPlayheadIdx((p) => (p - 1 + len) % len);
  }, [activeTrackFrames.length]);

  const stepNext = useCallback(() => {
    const len = Math.max(1, activeTrackFrames.length);
    setPlayheadIdx((p) => (p + 1) % len);
  }, [activeTrackFrames.length]);

  const togglePlay = useCallback(() => {
    setIsPlaying((v) => !v);
  }, []);

  const resetPlayhead = useCallback(() => {
    setPlayheadIdx(0);
  }, []);

  return {
    previewCanvasRef,
    isPlaying,
    setIsPlaying,
    playheadIdx,
    setPlayheadIdx,
    previewScale,
    setPreviewScale,
    flipX,
    setFlipX,
    showGroundLine,
    setShowGroundLine,
    onionSkin,
    setOnionSkin,
    stepPrev,
    stepNext,
    togglePlay,
    resetPlayhead,
  };
}
