import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  ResolvedFrameRect,
} from "../types";

export interface AnimationSourceRect {
  x: number;
  y: number;
  width: number;
  height: number;
  pivot?: { x: number; y: number };
}

/**
 * Resolves the source bounding rectangle in atlas texture coordinates for a specific animation frame.
 * Works seamlessly across:
 * - ResolvedFrameRect list (freeform rects and auto-island baked frames)
 * - Explicit frameIndices
 * - Variable slotSpan / cells widths (multi-cell wide frames)
 * - Regular sequential grid indexing
 */
export function resolveAnimationSourceRect(
  track: AtlasAnimationTrackDefinition,
  frameIdx: number,
  gridConfig: AtlasGridConfig,
  matchingTrackFrames?: ResolvedFrameRect[]
): AnimationSourceRect {
  if (matchingTrackFrames && matchingTrackFrames.length > 0) {
    const frameData = matchingTrackFrames[frameIdx % matchingTrackFrames.length];
    return {
      x: frameData.x,
      y: frameData.y,
      width: Math.max(1, frameData.width),
      height: Math.max(1, frameData.height),
      pivot: frameData.pivot,
    };
  }

  let col = 0;
  let span = 1;

  if (track.frameIndices && track.frameIndices[frameIdx] !== undefined) {
    col = track.frameIndices[frameIdx];
  } else if (track.slotSpan) {
    col = 0;
    for (let i = 0; i < frameIdx; i++) {
      col += track.slotSpan[i] || 1;
    }
    span = track.slotSpan[frameIdx] || 1;
  } else if (track.cells) {
    col = 0;
    for (let i = 0; i < frameIdx; i++) {
      col += track.cells[i] || 1;
    }
    span = track.cells[frameIdx] || 1;
  } else {
    col = frameIdx;
  }

  return {
    x: col * gridConfig.cellWidth,
    y: track.row * gridConfig.cellHeight,
    width: span * gridConfig.cellWidth,
    height: gridConfig.cellHeight,
    pivot: undefined,
  };
}
