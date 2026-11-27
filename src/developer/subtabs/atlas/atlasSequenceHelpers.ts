import { defaultAtlasSlicingEngine } from "@game/engine/meta/slicing/AtlasSlicingEngine";
import type { IPixelBuffer } from "@game/engine/meta/slicing/BackgroundProcessor";
import type {
  IAnimationTrackMeta,
  IFreeformFrameRect,
  ResolvedFrameRect,
} from "@game/engine/meta/types";
import type { AtlasAssetPreset } from "./assetPresets";
import type { EditableMetaDoc } from "./atlasSlicerHelpers";
import type { CategoryFilter } from "./types";

/**
 * Filters atlas presets by category and free-text query across name, id, and tags.
 */
export function filterAtlasPresets(
  presets: readonly AtlasAssetPreset[],
  categoryFilter: CategoryFilter,
  searchQuery: string
): AtlasAssetPreset[] {
  const q = searchQuery.trim().toLowerCase();
  return presets.filter((preset) => {
    if (categoryFilter !== "all" && preset.category !== categoryFilter) {
      return false;
    }
    if (!q) return true;
    return (
      preset.name.toLowerCase().includes(q) ||
      preset.id.toLowerCase().includes(q) ||
      (preset.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
    );
  });
}

/**
 * Resolves the ordered frame sequence for the active animation track.
 */
export function resolveActiveTrackFrames(
  activeTrack: IAnimationTrackMeta | undefined,
  activeTrackName: string,
  resolvedFrames: readonly ResolvedFrameRect[]
): ResolvedFrameRect[] {
  if (!activeTrack) return resolvedFrames.slice(0, 4);

  if (activeTrack.frameIndices && activeTrack.frameIndices.length > 0) {
    return activeTrack.frameIndices
      .map((idx) => resolvedFrames[idx])
      .filter((f): f is ResolvedFrameRect => Boolean(f));
  }

  const byName = resolvedFrames.filter((f) => f.trackName === activeTrackName);
  if (byName.length > 0) return byName;

  const byRow = resolvedFrames.filter((f) => f.row === activeTrack.row);
  if (byRow.length > 0) {
    return byRow.slice(0, Math.max(1, activeTrack.frames));
  }

  return resolvedFrames.slice(0, Math.max(1, activeTrack.frames));
}

function resolveCurrentTrackIndices(
  activeTrack: IAnimationTrackMeta | undefined,
  activeTrackFrames: readonly ResolvedFrameRect[],
  resolvedFrames: readonly ResolvedFrameRect[]
): number[] {
  if (activeTrack?.frameIndices) return activeTrack.frameIndices;
  return activeTrackFrames.map((f) =>
    resolvedFrames.findIndex((resolved) => resolved.id === f.id)
  );
}

/**
 * Returns a reversed copy of the active track frame indices.
 */
export function buildReversedTrackIndices(
  activeTrack: IAnimationTrackMeta | undefined,
  activeTrackFrames: readonly ResolvedFrameRect[],
  resolvedFrames: readonly ResolvedFrameRect[]
): number[] {
  const indices = resolveCurrentTrackIndices(
    activeTrack,
    activeTrackFrames,
    resolvedFrames
  );
  return [...indices].reverse();
}

/**
 * Expands the active track frame indices into a forward-then-backward ping-pong loop.
 */
export function buildPingPongTrackIndices(
  activeTrack: IAnimationTrackMeta | undefined,
  activeTrackFrames: readonly ResolvedFrameRect[],
  resolvedFrames: readonly ResolvedFrameRect[]
): number[] {
  const base = resolveCurrentTrackIndices(
    activeTrack,
    activeTrackFrames,
    resolvedFrames
  );
  return [...base, ...base.slice(1, -1).reverse()];
}

export type MetaJsonParseResult =
  | { readonly ok: true; readonly meta: EditableMetaDoc }
  | { readonly ok: false; readonly error: string };

/**
 * Validates and parses live JSON text edited inside the JSON inspector tab.
 */
export function parseEditableMetaJson(rawText: string): MetaJsonParseResult {
  try {
    const parsed = JSON.parse(rawText) as EditableMetaDoc;
    if (parsed && parsed.atlas) {
      return { ok: true, meta: parsed };
    }
    return { ok: false, error: "Brak wymaganej sekcji 'atlas'." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Niepoprawny JSON",
    };
  }
}

/**
 * Parses an uploaded meta.json file payload.
 */
export function parseUploadedMetaJson(rawText: string): MetaJsonParseResult {
  try {
    const parsed = JSON.parse(rawText) as EditableMetaDoc;
    return { ok: true, meta: parsed };
  } catch {
    return { ok: false, error: "Nieprawidłowy plik JSON." };
  }
}

/**
 * Runs auto-island detection on the pixel buffer and converts islands to freeform rect records.
 */
export function buildBakedAutoIslandsFrames(
  meta: EditableMetaDoc,
  textureW: number,
  textureH: number,
  pixelBuffer: IPixelBuffer
): { bakedRecord: Record<string, IFreeformFrameRect>; count: number } {
  const islandFrames = defaultAtlasSlicingEngine.resolveFrames(
    {
      ...meta,
      slicing: {
        method: "auto_islands",
        autoIslands: meta.slicing.autoIslands ?? {
          minIslandPixels: 24,
          clusterYTolerance: 16,
        },
      },
    },
    textureW,
    textureH,
    pixelBuffer
  );

  const bakedRecord: Record<string, IFreeformFrameRect> = {};
  islandFrames.forEach((frame, idx) => {
    const id = frame.id || `island_${idx}`;
    bakedRecord[id] = {
      id,
      x: Math.round(frame.x),
      y: Math.round(frame.y),
      width: Math.round(frame.width),
      height: Math.round(frame.height),
    };
  });

  return { bakedRecord, count: islandFrames.length };
}
