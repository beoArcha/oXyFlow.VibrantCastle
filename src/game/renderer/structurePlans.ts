/**
 * Pure layout maths for structure sheets that are stretched or tiled to an entity rect.
 * Kept free of canvas state so the plans are unit-testable and allocation-free.
 */

/** Atlas id of the portcullis sheet that draws gate solids. */
export const PORTCULLIS_ATLAS_ID = "grand_portcullis";
/** Atlas id of the thorn strip that draws hazards. */
export const HAZARD_ATLAS_ID = "hazard_thorns";

/**
 * Where the parts of the portcullis sit inside its body box (0..1 on both axes).
 * Lintel on top, iron bays in between (one bay = the span between two cross bars), spikes at the bottom,
 * stone posts on the left and right edges.
 */
export const PORTCULLIS_SLICES = {
  lintelH: 0.09,
  spikesY: 0.92,
  spikesH: 0.08,
  postW: 0.12,
  bayY: 0.663,
  bayH: 0.217,
} as const;

export interface PortcullisLayout {
  /** Lintel height in pixels (never thinner than 8). */
  lintelH: number;
  /** Spike strip height in pixels. */
  spikesH: number;
  /** Stone post width in pixels (at least 3). */
  postW: number;
  /** Height of one tiled iron bay in pixels (at least 8). */
  bayH: number;
}

/** Fills `out` with the pixel layout of a portcullis drawn `width` px wide at the sheet's body aspect. */
export function planPortcullis(width: number, bodyAspect: number, out: PortcullisLayout): PortcullisLayout {
  const bodyH = width / bodyAspect;
  out.lintelH = Math.max(8, Math.round(PORTCULLIS_SLICES.lintelH * bodyH));
  out.spikesH = Math.max(6, Math.round(PORTCULLIS_SLICES.spikesH * bodyH));
  out.postW = Math.max(3, Math.round(PORTCULLIS_SLICES.postW * width));
  out.bayH = Math.max(8, Math.round(PORTCULLIS_SLICES.bayH * bodyH));
  return out;
}

/** Vertical lift in pixels of the iron grid for an opening progress of 0..1. */
export function gateLiftOffset(progress: number, fullHeight: number): number {
  return Math.round(Math.min(1, Math.max(0, progress)) * fullHeight);
}

/**
 * Number of thorn tiles that cover `width` without overflowing the rect: tile width is the body
 * width at the rect's height (`height * bodyAspect`), rounded up so tiles shrink instead of spilling.
 * Returns 0 when the sheet or the rect is unusable (caller draws the procedural fallback).
 */
export function hazardTileCount(width: number, height: number, bodyAspect: number): number {
  if (!(width > 0) || !(height > 0) || !(bodyAspect > 0)) return 0;
  return Math.max(1, Math.ceil(width / (height * bodyAspect) - 1e-9));
}
