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
    origin?: { normalized?: { x: number; y: number } };
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
