import { AssetQuality } from "@game/types";

export interface IAtlasAnimationTrack {
  frames?: number;
  fps?: number;
  loop?: boolean;
  frameIndices?: readonly number[] | number[];
  slotSpan?: readonly number[] | number[];
  cells?: readonly number[] | number[];
  startCol?: number;
  widthCells?: number;
  row?: number;
}

export interface IAtlasMetaLike {
  atlas?: { columns?: number; rows?: number };
  layout?: {
    anchor?: { x: number; y: number };
    origin?: { type?: string; normalized?: { x: number; y: number } };
    bodyBox?: { x: number; y: number; w: number; h: number };
    naturalFacing?: "left" | "right";
    defaultFacing?: "left" | "right";
    [key: string]: unknown;
  };
  backgroundConfig?: {
    removeAtRuntime?: boolean;
    colorHex?: string;
    tolerance?: number;
  };
  anchor?: { x: number; y: number };
  naturalFacing?: "left" | "right";
  defaultFacing?: "left" | "right";
  states?: unknown;
  animations?: unknown;
  variants?: unknown;
}

/**
 * Resolves state animation aliases (e.g. inactive -> idle).
 */
export function resolveAnimationKeyFromStates(meta: IAtlasMetaLike, currentKey: string): string {
  if (!meta.states || typeof meta.states !== "object") return currentKey;
  const statesContainer = meta.states as Record<string, unknown>;
  const rawStates = "states" in statesContainer && typeof statesContainer.states === "object" && statesContainer.states !== null
    ? (statesContainer.states as Record<string, unknown>)
    : statesContainer;

  const targetState = rawStates[currentKey];
  if (targetState && typeof targetState === "object" && "animation" in targetState && typeof targetState.animation === "string") {
    return targetState.animation;
  }
  return currentKey;
}

function readAnimationsRecord(meta: IAtlasMetaLike): Record<string, unknown> | null {
  if (!meta.animations || typeof meta.animations !== "object") return null;
  const animsContainer = meta.animations as Record<string, unknown>;
  return "animations" in animsContainer &&
    typeof animsContainer.animations === "object" &&
    animsContainer.animations !== null
    ? (animsContainer.animations as Record<string, unknown>)
    : animsContainer;
}

/**
 * Number of leading frames that actually exist: zero entries in slotSpan/cells mean "no frame".
 * frameIndices-driven tracks keep their declared frame count.
 */
export function resolveEffectiveFrameCount(track: IAtlasAnimationTrack | null): number {
  const declared = track?.frames ?? 1;
  if (!track || track.frameIndices) return declared;
  const spans = track.slotSpan && track.slotSpan.length > 0 ? track.slotSpan : track.cells;
  if (!spans || spans.length === 0) return declared;
  const limit = Math.min(declared, spans.length);
  let count = 0;
  while (count < limit && spans[count] > 0) count++;
  return count;
}

/**
 * True only when the (state-aliased) animation is explicitly defined with at least one frame;
 * unlike resolveAnimationTrack it never falls back to the first track.
 */
export function hasAnimationTrack(meta: IAtlasMetaLike, animationName: string): boolean {
  const animKey = resolveAnimationKeyFromStates(meta, animationName);
  const rawAnims = readAnimationsRecord(meta);
  let track: unknown = rawAnims ? rawAnims[animKey] : undefined;
  if (!track || typeof track !== "object") {
    track = meta.layout && typeof meta.layout === "object" ? meta.layout[animKey] : undefined;
  }
  if (!track || typeof track !== "object") return false;
  return resolveEffectiveFrameCount(track as IAtlasAnimationTrack) > 0;
}

/**
 * Resolves an animation track from either animations dictionary or layout animations.
 */
export function resolveAnimationTrack(meta: IAtlasMetaLike, animKey: string): IAtlasAnimationTrack | null {
  if (!meta.animations || typeof meta.animations !== "object") return null;
  const animsContainer = meta.animations as Record<string, unknown>;
  const rawAnims = "animations" in animsContainer && typeof animsContainer.animations === "object" && animsContainer.animations !== null
    ? (animsContainer.animations as Record<string, unknown>)
    : animsContainer;

  let firstAnim: IAtlasAnimationTrack | null = null;
  for (const k in rawAnims) {
    const val = rawAnims[k];
    if (val && typeof val === "object") {
      firstAnim = val as IAtlasAnimationTrack;
      break;
    }
  }

  const selected = rawAnims[animKey];
  if (selected && typeof selected === "object") {
    return selected as IAtlasAnimationTrack;
  }

  if (meta.layout && typeof meta.layout === "object") {
    const layoutAnim = meta.layout[animKey];
    if (layoutAnim && typeof layoutAnim === "object") {
      return layoutAnim as IAtlasAnimationTrack;
    }
  }

  return firstAnim;
}

/**
 * Resolves normalized sprite origin anchor (defaulting to bottom-center {x: 0.5, y: 1.0}).
 */
export function resolveAnchor(meta: IAtlasMetaLike): { x: number; y: number } {
  if (meta.anchor && typeof meta.anchor.x === "number" && typeof meta.anchor.y === "number") {
    return { x: meta.anchor.x, y: meta.anchor.y };
  }
  if (meta.layout?.anchor) {
    return { x: meta.layout.anchor.x, y: meta.layout.anchor.y };
  }
  if (meta.layout?.origin?.normalized) {
    return { x: meta.layout.origin.normalized.x, y: meta.layout.origin.normalized.y };
  }
  return { x: 0.5, y: 1.0 };
}

/**
 * Resolves asset scale multiplier for the active quality tier.
 */
export function resolveVariantScale(meta: IAtlasMetaLike, quality: AssetQuality): number {
  if (!meta.variants || typeof meta.variants !== "object") return 1.0;
  const variantsContainer = meta.variants as Record<string, unknown>;
  const rawVariants = "variants" in variantsContainer && typeof variantsContainer.variants === "object" && variantsContainer.variants !== null
    ? (variantsContainer.variants as Record<string, unknown>)
    : variantsContainer;

  const targetVariant = rawVariants[quality];
  if (targetVariant && typeof targetVariant === "object" && "scale" in targetVariant && typeof targetVariant.scale === "number") {
    return targetVariant.scale;
  }
  return 1.0;
}

/**
 * Resolves the natural facing direction of the sprite asset.
 */
export function resolveFacingDirection(meta: IAtlasMetaLike): "left" | "right" {
  if (meta.naturalFacing === "left" || meta.defaultFacing === "left") return "left";
  if (meta.naturalFacing === "right" || meta.defaultFacing === "right") return "right";
  if (meta.layout?.naturalFacing === "left" || meta.layout?.defaultFacing === "left") return "left";
  if (meta.layout?.naturalFacing === "right" || meta.layout?.defaultFacing === "right") return "right";
  return "right";
}

/** Body bounding box of one cell in normalized coordinates, ready for scale and anchor maths. */
export interface BodyMetrics {
  /** Body left edge as a fraction of the cell width. */
  x: number;
  /** Body top edge as a fraction of the cell height. */
  y: number;
  /** Body width as a fraction of the cell width. */
  width: number;
  /** Body height as a fraction of the cell height. */
  height: number;
  /** Horizontal body centre inside the first cell. */
  centerX: number;
  /** Body bottom inside the cell (feet-origin sheets). */
  footY: number;
  /** Vertical body centre inside the cell (centre-origin sheets). */
  centerY: number;
}

/** Per-meta values computed once so render() does no lookups or allocations. */
export interface AtlasRenderInfo {
  cols: number;
  rows: number;
  anchorX: number;
  anchorY: number;
  groundAnchored: boolean;
  facing: "left" | "right";
  /** Present when the meta carries `layout.bodyBox`. */
  body: BodyMetrics | null;
}

const renderInfoCache = new WeakMap<object, AtlasRenderInfo>();

function resolveBodyMetrics(meta: IAtlasMetaLike): BodyMetrics | null {
  const box = meta.layout?.bodyBox;
  if (!box || !(box.w > 0) || !(box.h > 0)) return null;
  return {
    x: box.x,
    y: box.y,
    width: box.w,
    height: box.h,
    centerX: box.x + box.w / 2,
    footY: box.y + box.h,
    centerY: box.y + box.h / 2,
  };
}

export function getAtlasRenderInfo(meta: IAtlasMetaLike): AtlasRenderInfo {
  const cached = renderInfoCache.get(meta);
  if (cached) return cached;
  const anchor = resolveAnchor(meta);
  const info: AtlasRenderInfo = {
    cols: meta.atlas?.columns || 6,
    rows: meta.atlas?.rows || 4,
    anchorX: anchor.x,
    anchorY: anchor.y,
    groundAnchored: meta.layout?.origin?.type === "feet" || anchor.y >= 0.8,
    facing: resolveFacingDirection(meta),
    body: resolveBodyMetrics(meta),
  };
  renderInfoCache.set(meta, info);
  return info;
}

/** First sheet column of a frame. */
export function resolveFrameColumn(track: IAtlasAnimationTrack | null, frame: number): number {
  if (track?.frameIndices && track.frameIndices[frame] !== undefined) return track.frameIndices[frame];
  const spans = track?.slotSpan && track.slotSpan.length > 0 ? track.slotSpan : track?.cells;
  if (spans && spans.length > 0) {
    let col = 0;
    for (let i = 0; i < frame; i++) col += spans[i];
    return col;
  }
  if (track?.startCol !== undefined) return track.startCol + frame * (track.widthCells || 1);
  return frame;
}

/** Number of sheet columns a frame covers. */
export function resolveFrameSpan(track: IAtlasAnimationTrack | null, frame: number): number {
  if (track?.frameIndices && track.frameIndices[frame] !== undefined) return 1;
  const spans = track?.slotSpan && track.slotSpan.length > 0 ? track.slotSpan : track?.cells;
  if (spans && spans.length > 0) return spans[frame];
  if (track?.startCol !== undefined) return track.widthCells || 1;
  return 1;
}
