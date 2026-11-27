import type {
  BossZoneSchema,
  LocationZoneSchema,
  ParallaxLayerSchema,
} from "@game/locations/schema/locationSchema";
import type { LocationDefinition } from "@game/locations/types";
import { resolveBackgroundTier } from "@game/renderer/background/parallaxTiling";
import { PARALLAX_ZONE_DEFAULTS, type ParallaxZoneKind } from "../meta";

export type ZoneLookupSource =
  | Pick<LocationDefinition, "zones" | "bossZones">
  | readonly LocationZoneSchema[]
  | undefined;

export interface ParallaxZoneMatch {
  readonly zone: LocationZoneSchema;
  readonly kind: ParallaxZoneKind;
  readonly weight: number;
  readonly ambientColor: string | null;
}

export interface MutableParallaxZoneResolution {
  zone: LocationZoneSchema | null;
  kind: ParallaxZoneKind | null;
  weight: number;
  ambientColor: string | null;
  nearKind: ParallaxZoneKind | null;
  nearAmbientColor: string | null;
  nearDistanceSq: number;
}

const ZONE_TIE_WEIGHT_EPSILON = 1e-6;

function getZoneKindPriority(kind: ParallaxZoneKind | null): number {
  if (!kind) return Number.MAX_SAFE_INTEGER;
  const order = PARALLAX_ZONE_DEFAULTS.tieBreakOrder;
  for (let i = 0; i < order.length; i++) {
    if (order[i] === kind) return i;
  }
  return order.length;
}

function computeDistanceSqToRect(
  x: number,
  y: number,
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number
): number {
  const dx =
    x < rectX
      ? rectX - x
      : x > rectX + rectW
        ? x - (rectX + rectW)
        : 0;
  const dy =
    y < rectY
      ? rectY - y
      : y > rectY + rectH
        ? y - (rectY + rectH)
        : 0;
  return dx * dx + dy * dy;
}

function computeSmoothstepWeight(distSq: number, featherPx: number): number {
  if (distSq <= 0) return 1;
  if (featherPx <= 0 || distSq >= featherPx * featherPx) return 0;
  const dist = Math.sqrt(distSq);
  const t = 1 - dist / featherPx;
  return t * t * (3 - 2 * t);
}

export function createZoneResolutionBuffer(): MutableParallaxZoneResolution {
  return {
    zone: null,
    kind: null,
    weight: 0,
    ambientColor: null,
    nearKind: null,
    nearAmbientColor: null,
    nearDistanceSq: Number.POSITIVE_INFINITY,
  };
}

export function resetZoneResolutionBuffer(out: MutableParallaxZoneResolution): void {
  out.zone = null;
  out.kind = null;
  out.weight = 0;
  out.ambientColor = null;
  out.nearKind = null;
  out.nearAmbientColor = null;
  out.nearDistanceSq = Number.POSITIVE_INFINITY;
}

function isZoneArray(source: ZoneLookupSource): source is readonly LocationZoneSchema[] {
  return Array.isArray(source);
}

function evaluateCandidateZone(
  zone: LocationZoneSchema | null,
  kind: ParallaxZoneKind,
  ambientColor: string | null,
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number,
  featherPx: number,
  pointX: number,
  pointY: number,
  preloadMarginPx: number,
  out: MutableParallaxZoneResolution
): void {
  if (rectW <= 0 || rectH <= 0) return;

  const distSq = computeDistanceSqToRect(pointX, pointY, rectX, rectY, rectW, rectH);
  const weight = computeSmoothstepWeight(distSq, featherPx);

  if (weight > 0) {
    const winsByWeight = weight > out.weight + ZONE_TIE_WEIGHT_EPSILON;
    const isWeightTie = Math.abs(weight - out.weight) <= ZONE_TIE_WEIGHT_EPSILON;
    const winsByTieBreak =
      isWeightTie && getZoneKindPriority(kind) < getZoneKindPriority(out.kind);

    if (winsByWeight || winsByTieBreak) {
      out.zone = zone;
      out.kind = kind;
      out.weight = weight;
      out.ambientColor = ambientColor;
    }
  }

  const preloadReach = Math.max(0, featherPx) + Math.max(0, preloadMarginPx);
  if (distSq <= preloadReach * preloadReach && distSq < out.nearDistanceSq) {
    out.nearKind = kind;
    out.nearAmbientColor = ambientColor;
    out.nearDistanceSq = distSq;
  }
}

function resolveLegacyBossZone(
  z: BossZoneSchema,
  pointX: number,
  pointY: number,
  preloadMarginPx: number,
  out: MutableParallaxZoneResolution
): void {
  evaluateCandidateZone(
    null,
    "boss",
    z.ambientColor ?? null,
    z.x,
    z.y,
    z.width,
    z.height,
    PARALLAX_ZONE_DEFAULTS.featherPx,
    pointX,
    pointY,
    preloadMarginPx,
    out
  );
}

/**
 * Resolves the highest-priority active zone and nearest preloadable zone into a preallocated buffer.
 * Performs zero heap allocations so it can run safely inside per-frame `render()` loops.
 */
export function resolveZoneInto(
  source: ZoneLookupSource,
  pointX: number,
  pointY: number,
  preloadMarginPx: number,
  out: MutableParallaxZoneResolution
): boolean {
  resetZoneResolutionBuffer(out);
  if (!source) return false;

  const zones: readonly LocationZoneSchema[] | undefined = isZoneArray(source)
    ? source
    : source.zones;

  if (zones && zones.length > 0) {
    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      const featherPx =
        z.featherPx !== undefined && z.featherPx >= 0
          ? z.featherPx
          : PARALLAX_ZONE_DEFAULTS.featherPx;
      evaluateCandidateZone(
        z,
        z.kind,
        z.ambientColor ?? null,
        z.x,
        z.y,
        z.width,
        z.height,
        featherPx,
        pointX,
        pointY,
        preloadMarginPx,
        out
      );
    }
    return out.weight > 0;
  }

  if (!isZoneArray(source) && source.bossZones && source.bossZones.length > 0) {
    const bossZones = source.bossZones;
    for (let i = 0; i < bossZones.length; i++) {
      resolveLegacyBossZone(bossZones[i], pointX, pointY, preloadMarginPx, out);
    }
    return out.weight > 0;
  }

  return false;
}

/**
 * Pure zone resolver: returns the active zone match (zone, kind, smoothstep weight in (0..1], ambientColor)
 * at `(pointX, pointY)`, or `null` when outside all zone feather boundaries.
 */
export function resolveActiveParallaxZone(
  source: ZoneLookupSource,
  pointX: number,
  pointY: number
): ParallaxZoneMatch | null {
  const buf = createZoneResolutionBuffer();
  if (!resolveZoneInto(source, pointX, pointY, 0, buf) || !buf.zone || !buf.kind) {
    return null;
  }
  return {
    zone: buf.zone,
    kind: buf.kind,
    weight: buf.weight,
    ambientColor: buf.ambientColor,
  };
}

/**
 * Pure convenience helper: returns the active zone kind at `(pointX, pointY)`, or `null` when outside.
 */
export function resolveActiveZoneKind(
  source: ZoneLookupSource,
  pointX: number,
  pointY: number
): ParallaxZoneKind | null {
  const buf = createZoneResolutionBuffer();
  return resolveZoneInto(source, pointX, pointY, 0, buf) ? buf.kind : null;
}

/**
 * Returns the closest dynamic combination layer (highest depth among `mid_far`, `mid`, `mid_close`, `close`),
 * excluding `far` and `fx_` / boss overlays. Only this closest layer is swapped by zones.
 */
export function resolveClosestParallaxLayer(
  layers: readonly ParallaxLayerSchema[] | undefined
): ParallaxLayerSchema | null {
  if (!layers || layers.length === 0) return null;

  let closest: ParallaxLayerSchema | null = null;
  let bestDepth = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const tier = resolveBackgroundTier(layer);
    if (tier === "far" || tier === "boss_stage" || tier === "boss_world") continue;
    const keyOrId = layer.layerKey ?? layer.id;
    if (keyOrId.includes(":fx_") || layer.id.startsWith("fx_")) continue;

    if (layer.depth >= bestDepth) {
      bestDepth = layer.depth;
      closest = layer;
    }
  }

  return closest;
}

/**
 * Builds the canonical zone variant key (`<world>:<slot>@<zoneKind>`) for a parallax layer.
 */
export function buildZoneVariantKey(
  layer: ParallaxLayerSchema,
  kind: ParallaxZoneKind
): string | undefined {
  const baseKey = layer.layerKey || layer.id;
  if (!baseKey || baseKey.includes("@")) return undefined;
  return `${baseKey}@${kind}`;
}
