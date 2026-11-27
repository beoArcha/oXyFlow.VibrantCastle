import type {
  ParallaxBand,
  ParallaxBlendMode,
  ParallaxEffectMeta,
  ParallaxFitMode,
  ParallaxLayerMeta,
  ParallaxTilingMode,
  ParallaxVec2,
  ParallaxZoneKind,
} from "./types";

export interface ParallaxBandDefaults {
  readonly depth: number;
  readonly speed: ParallaxVec2;
  readonly drift: ParallaxVec2;
  readonly tiling: ParallaxTilingMode;
  readonly opacity: number;
  readonly blend: ParallaxBlendMode;
  readonly opaque?: boolean;
  readonly fit?: ParallaxFitMode;
  readonly overscan?: ParallaxVec2;
}

export interface ResolvedParallaxLayerMeta {
  readonly band: ParallaxBand;
  readonly depth: number;
  readonly speed: ParallaxVec2;
  readonly drift: ParallaxVec2;
  readonly tiling: ParallaxTilingMode;
  readonly opacity: number;
  readonly blend: ParallaxBlendMode;
  readonly tint: string | null;
  readonly opaque: boolean;
  readonly fit?: ParallaxFitMode;
  readonly overscan?: ParallaxVec2;
  readonly labelKey?: string;
  readonly zones?: ParallaxLayerMeta["zones"];
  readonly source?: string;
}

export interface ParallaxZoneDefaults {
  readonly featherPx: number;
  readonly opacity: number;
  readonly tint: string | null;
  readonly tieBreakOrder: readonly ParallaxZoneKind[];
}

export interface ParallaxFxDefaults {
  readonly depth: number;
  readonly speed: ParallaxVec2;
  readonly opacity: number;
  readonly blend: ParallaxBlendMode;
}

/**
 * Single source of truth for per-band depth, scroll speed, and tiling defaults.
 * Values match the baseline courtyard/location JSON factors so meta-driven rendering stays identical.
 */
export const PARALLAX_BAND_DEFAULTS: Readonly<Record<ParallaxBand, ParallaxBandDefaults>> = {
  far: {
    depth: 0.08,
    speed: [0.04, 0.02],
    drift: [0, 0],
    tiling: "none",
    opacity: 1,
    blend: "source-over",
    opaque: true,
    fit: "cover",
    overscan: [1.06, 1.03],
  },
  mid_far: {
    depth: 0.24,
    speed: [0.18, 0.07],
    drift: [0, 0],
    tiling: "repeat",
    opacity: 1,
    blend: "source-over",
  },
  mid: {
    depth: 0.45,
    speed: [0.36, 0.12],
    drift: [0, 0],
    tiling: "repeat",
    opacity: 1,
    blend: "source-over",
  },
  mid_close: {
    depth: 0.65,
    speed: [0.56, 0.18],
    drift: [0, 0],
    tiling: "repeat",
    opacity: 1,
    blend: "source-over",
  },
  close: {
    depth: 0.86,
    speed: [0.78, 0.24],
    drift: [0, 0],
    tiling: "repeat",
    opacity: 1,
    blend: "source-over",
  },
};

export const PARALLAX_ZONE_DEFAULTS: ParallaxZoneDefaults = {
  featherPx: 260,
  opacity: 1,
  tint: null,
  tieBreakOrder: ["boss", "story", "rest", "secret"],
};

export const PARALLAX_FX_DEFAULTS: ParallaxFxDefaults = {
  depth: 0.72,
  speed: [0.44, 0.14],
  opacity: 0.72,
  blend: "screen",
};

/**
 * Merges a layer meta entry with its band defaults.
 */
export function resolveLayerWithDefaults(layer: ParallaxLayerMeta): ResolvedParallaxLayerMeta {
  const defaults = PARALLAX_BAND_DEFAULTS[layer.band];
  return {
    band: layer.band,
    depth: layer.depth ?? defaults.depth,
    speed: layer.speed ?? defaults.speed,
    drift: layer.drift ?? defaults.drift,
    tiling: layer.tiling ?? defaults.tiling,
    opacity: layer.opacity ?? defaults.opacity,
    blend: layer.blend ?? defaults.blend,
    tint: layer.tint ?? null,
    opaque: layer.band === "far" ? true : (layer.opaque ?? defaults.opaque ?? false),
    fit: layer.fit ?? defaults.fit,
    overscan: layer.overscan ?? defaults.overscan,
    labelKey: layer.labelKey,
    zones: layer.zones,
    source: layer.source,
  };
}

/**
 * Merges an effect meta entry with band and fx defaults.
 */
export function resolveEffectWithDefaults(
  effect: ParallaxEffectMeta
): Required<Pick<ParallaxEffectMeta, "kind" | "band" | "depth" | "speed" | "opacity" | "blend">> &
  Pick<ParallaxEffectMeta, "source"> {
  const bandDefaults = PARALLAX_BAND_DEFAULTS[effect.band];
  const isImage = effect.kind === "image";
  return {
    kind: effect.kind,
    band: effect.band,
    depth: effect.depth ?? (isImage ? PARALLAX_FX_DEFAULTS.depth : bandDefaults.depth),
    speed: effect.speed ?? (isImage ? PARALLAX_FX_DEFAULTS.speed : bandDefaults.speed),
    opacity: effect.opacity ?? (isImage ? PARALLAX_FX_DEFAULTS.opacity : bandDefaults.opacity),
    blend: effect.blend ?? (isImage ? PARALLAX_FX_DEFAULTS.blend : bandDefaults.blend),
    source: effect.source,
  };
}
