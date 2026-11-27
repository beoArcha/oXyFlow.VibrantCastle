import type { WorldId } from "../../locations/types";

export type ParallaxFileTier = "hi8bit" | "hi16bit" | "high";

export type ParallaxQualityTier = "low" | "mid" | "high";

export type ParallaxBand = "far" | "mid_far" | "mid" | "mid_close" | "close";

export type ParallaxZoneKind = "boss" | "rest" | "secret" | "story";

export type ParallaxTilingMode = "none" | "repeat" | "mirror";

export type ParallaxBlendMode = "source-over" | "screen";

export type ParallaxFitMode = "cover";

export type ParallaxVec2 = readonly [number, number];

export type ParallaxSeamVerdict = "pass" | "warn";

export interface ParallaxPlaceholderColors {
  readonly top: string;
  readonly bottom: string;
  readonly silhouette: string;
}

export interface ParallaxZoneOverride {
  readonly tint?: string | null;
  readonly opacity?: number;
}

export interface ParallaxLayerMeta {
  readonly band: ParallaxBand;
  readonly depth?: number;
  readonly speed?: ParallaxVec2;
  readonly drift?: ParallaxVec2;
  readonly opaque?: boolean;
  readonly fit?: ParallaxFitMode;
  readonly overscan?: ParallaxVec2;
  readonly tiling?: ParallaxTilingMode;
  readonly opacity?: number;
  readonly tint?: string | null;
  readonly blend?: ParallaxBlendMode;
  readonly labelKey?: string;
  readonly zones?: Readonly<Partial<Record<ParallaxZoneKind, ParallaxZoneOverride>>>;
  /** Borrowed layer reference (`<worldId>:<slot>`) when no local image file exists. */
  readonly source?: string;
}

export interface ParallaxEffectMeta {
  readonly kind: "procedural" | "image";
  readonly band: ParallaxBand;
  readonly depth?: number;
  readonly speed?: ParallaxVec2;
  readonly source?: string;
  readonly blend?: ParallaxBlendMode;
  readonly opacity?: number;
}

export type ParallaxTierStats = readonly [width: number, height: number, sizeKb: number];

export type ParallaxSeamStats = readonly [
  seamDiff: number,
  neighbourDiff: number,
  verdict: ParallaxSeamVerdict,
];

export interface ParallaxGeneratedEntry {
  readonly tiers: Readonly<Partial<Record<ParallaxFileTier, ParallaxTierStats>>>;
  readonly seam?: ParallaxSeamStats;
  readonly avg: string;
}

export interface WorldParallaxMeta {
  readonly worldId: WorldId;
  readonly placeholder: ParallaxPlaceholderColors;
  readonly layers: Readonly<Record<string, ParallaxLayerMeta>>;
  readonly effects?: Readonly<Record<string, ParallaxEffectMeta>>;
  readonly generated: Readonly<Record<string, ParallaxGeneratedEntry>>;
}
