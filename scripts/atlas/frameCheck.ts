import type { RgbaImage } from "../lib/png";
import {
  resolveAnimationTrack,
  type IAtlasAnimationTrack,
  type IAtlasMetaLike,
} from "../../src/game/renderer/atlasMetadataResolver";
import { OPAQUE_ALPHA, type Rect } from "./islands";

export type FrameStatus = "ok" | "crosses-border" | "empty";

export interface FrameReport {
  animation: string;
  frame: number;
  rect: Rect;
  status: FrameStatus;
}

export function listAnimationNames(meta: IAtlasMetaLike): string[] {
  if (!meta.animations || typeof meta.animations !== "object") return [];
  const container = meta.animations as Record<string, unknown>;
  const nested = container.animations;
  const tracks = typeof nested === "object" && nested !== null ? (nested as Record<string, unknown>) : container;
  return Object.keys(tracks).filter((key) => typeof tracks[key] === "object" && tracks[key] !== null);
}

function resolveColumnAndSpan(track: IAtlasAnimationTrack | null, frame: number): { col: number; span: number } {
  if (track?.frameIndices && track.frameIndices[frame] !== undefined) {
    return { col: track.frameIndices[frame], span: 1 };
  }
  const spans = track?.slotSpan && track.slotSpan.length > 0 ? track.slotSpan : track?.cells;
  if (spans && spans.length > 0) {
    let col = 0;
    for (let i = 0; i < frame; i++) col += spans[i] || 1;
    return { col, span: spans[frame] || 1 };
  }
  if (track?.startCol !== undefined) {
    return { col: track.startCol + frame * (track.widthCells || 1), span: track.widthCells || 1 };
  }
  return { col: frame, span: 1 };
}

/** Mirrors the source-rect arithmetic of `AtlasSpriteRenderer.render` (uniform grid over the natural size). */
export function computeFrameRect(meta: IAtlasMetaLike, naturalWidth: number, naturalHeight: number, animation: string, frame: number): Rect {
  const track = resolveAnimationTrack(meta, animation);
  const cols = meta.atlas?.columns || 6;
  const rows = meta.atlas?.rows || 4;
  const cellW = naturalWidth / cols;
  const cellH = naturalHeight / rows;
  const { col, span } = resolveColumnAndSpan(track, frame);
  return { x: col * cellW, y: (track?.row ?? 0) * cellH, w: span * cellW, h: cellH };
}

function isOpaque(image: RgbaImage, x: number, y: number): boolean {
  return image.data[(y * image.width + x) * 4 + 3] > OPAQUE_ALPHA;
}

function pixelBounds(image: RgbaImage, rect: Rect): { x0: number; y0: number; x1: number; y1: number } {
  return {
    x0: Math.max(0, Math.floor(rect.x)),
    y0: Math.max(0, Math.floor(rect.y)),
    x1: Math.min(image.width - 1, Math.ceil(rect.x + rect.w) - 1),
    y1: Math.min(image.height - 1, Math.ceil(rect.y + rect.h) - 1),
  };
}

function borderHasOpaque(image: RgbaImage, b: { x0: number; y0: number; x1: number; y1: number }): boolean {
  for (let x = b.x0; x <= b.x1; x++) {
    if (isOpaque(image, x, b.y0) || isOpaque(image, x, b.y1)) return true;
  }
  for (let y = b.y0; y <= b.y1; y++) {
    if (isOpaque(image, b.x0, y) || isOpaque(image, b.x1, y)) return true;
  }
  return false;
}

function interiorHasOpaque(image: RgbaImage, b: { x0: number; y0: number; x1: number; y1: number }): boolean {
  for (let y = b.y0; y <= b.y1; y++) {
    for (let x = b.x0; x <= b.x1; x++) {
      if (isOpaque(image, x, y)) return true;
    }
  }
  return false;
}

export function classifyRect(image: RgbaImage, rect: Rect): FrameStatus {
  const bounds = pixelBounds(image, rect);
  if (borderHasOpaque(image, bounds)) return "crosses-border";
  return interiorHasOpaque(image, bounds) ? "ok" : "empty";
}

export function checkFrames(image: RgbaImage, meta: IAtlasMetaLike): FrameReport[] {
  const reports: FrameReport[] = [];
  for (const animation of listAnimationNames(meta)) {
    const frames = resolveAnimationTrack(meta, animation)?.frames ?? 1;
    for (let frame = 0; frame < frames; frame++) {
      const rect = computeFrameRect(meta, image.width, image.height, animation, frame);
      reports.push({ animation, frame, rect, status: classifyRect(image, rect) });
    }
  }
  return reports;
}

export function brokenFrames(reports: readonly FrameReport[]): FrameReport[] {
  return reports.filter((report) => report.status !== "ok");
}
