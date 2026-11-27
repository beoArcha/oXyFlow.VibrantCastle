import type { BackgroundLayerTier } from "@game/locations/schema/locationSchema";
import type { WorldId } from "@game/locations/types";
import { assetsLogger } from "@game/logger/gameLogger";
import {
  resolveEffectWithDefaults,
  resolveLayerWithDefaults,
  type ParallaxBand,
  type ParallaxEffectMeta,
  type ParallaxFileTier,
  type ParallaxZoneKind,
  type ResolvedParallaxLayerMeta,
  type WorldParallaxMeta,
} from "./meta";
import type { IParallaxRegistry, ParallaxRegistryEntry } from "./render/types";

export interface ParallaxDiscoveryData {
  readonly images: Readonly<Record<string, string>>;
  readonly metas: Readonly<Record<string, unknown>>;
}

export interface ParallaxCatalogEntry extends ParallaxRegistryEntry {
  readonly worldId: string;
  readonly slot: string;
  readonly band: ParallaxBand;
  readonly meta: ResolvedParallaxLayerMeta;
  readonly zoneKind?: ParallaxZoneKind;
  readonly borrowedFrom?: string;
  readonly isFx?: boolean;
  readonly generatedByAi?: boolean;
  readonly labelPl: string;
  readonly labelEn: string;
}

interface FsLike {
  readdirSync(path: string): string[];
  existsSync(path: string): boolean;
  statSync(path: string): { isDirectory(): boolean };
  readFileSync(path: string, encoding: string): string;
}

const IMAGE_FILE_PATTERN = /^(.+)_(hi8bit|hi16bit|high)\.(png|jpg)$/;
const TIER_PRIORITY: readonly ParallaxFileTier[] = ["high", "hi16bit", "hi8bit"];

function readViteGlobs(): ParallaxDiscoveryData | null {
  try {
    const images = import.meta.glob<string>("/src/assets/parallax/*/*_*.{png,jpg}", {
      eager: true,
      query: "?url",
      import: "default",
    });
    const metas = import.meta.glob<unknown>("/src/assets/parallax/*/*_parallax_meta.json", {
      eager: true,
      import: "default",
    });
    return { images, metas };
  } catch (err: unknown) {
    assetsLogger.debug("import.meta.glob unavailable, using filesystem discovery of parallax", undefined, err);
    return null;
  }
}

function readParallaxFromDisk(): ParallaxDiscoveryData {
  const images: Record<string, string> = {};
  const metas: Record<string, unknown> = {};
  if (typeof process === "undefined") return { images, metas };
  const host = process as unknown as { getBuiltinModule?: (id: string) => unknown; cwd(): string };
  const fs = typeof host.getBuiltinModule === "function" ? (host.getBuiltinModule("node:fs") as FsLike | undefined) : undefined;
  if (!fs) return { images, metas };

  const root = `${host.cwd().replace(/\\/g, "/")}/src/assets/parallax`;
  if (!fs.existsSync(root)) return { images, metas };

  for (const dirName of fs.readdirSync(root).sort()) {
    const dir = `${root}/${dirName}`;
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir).sort()) {
      const fullPath = `${dir}/${file}`;
      if (file.endsWith("_parallax_meta.json")) metas[fullPath] = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      else if (IMAGE_FILE_PATTERN.test(file)) images[fullPath] = fullPath;
    }
  }
  return { images, metas };
}

/** Discovers all parallax meta files and tier images via Vite globs or filesystem fallback. */
export function discoverParallaxFiles(): ParallaxDiscoveryData {
  return readViteGlobs() ?? readParallaxFromDisk();
}

function formatSlotLabel(worldId: string, slot: string): string {
  return `${worldId.replace(/_/g, " ")} · ${slot.replace(/_/g, " ")}`;
}

function isWorldMeta(value: unknown): value is WorldParallaxMeta {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<WorldParallaxMeta>;
  return typeof candidate.worldId === "string" && typeof candidate.layers === "object" && candidate.layers !== null;
}

function indexImagesBySlot(images: Readonly<Record<string, string>>): Map<string, Partial<Record<ParallaxFileTier, string>>> {
  const indexed = new Map<string, Partial<Record<ParallaxFileTier, string>>>();
  for (const [rawPath, url] of Object.entries(images)) {
    const parts = rawPath.replace(/\\/g, "/").split("/");
    const folder = parts[parts.length - 2];
    const fileName = parts[parts.length - 1];
    if (!folder || !fileName) continue;

    const match = fileName.match(IMAGE_FILE_PATTERN);
    if (!match) continue;

    const stem = match[1];
    const tier = match[2] as ParallaxFileTier;
    const slotPrefix = folder === "_shared" ? "" : `${folder}_`;
    if (slotPrefix && !stem.startsWith(slotPrefix)) continue;

    const lookupKey = `${folder}:${slotPrefix ? stem.slice(slotPrefix.length) : stem}`;
    const byTier = indexed.get(lookupKey) ?? {};
    byTier[tier] = url;
    indexed.set(lookupKey, byTier);
  }
  return indexed;
}

function pickTierUrl(
  imagesBySlot: ReadonlyMap<string, Partial<Record<ParallaxFileTier, string>>>,
  lookupKey: string
): string | undefined {
  const tiers = imagesBySlot.get(lookupKey);
  if (!tiers) return undefined;
  for (const tier of TIER_PRIORITY) {
    if (tiers[tier]) return tiers[tier];
  }
  return undefined;
}

function toEffectLayerMeta(effect: ParallaxEffectMeta): ResolvedParallaxLayerMeta {
  const resolved = resolveEffectWithDefaults(effect);
  return {
    band: resolved.band,
    depth: resolved.depth,
    speed: resolved.speed,
    drift: [0, 0],
    tiling: "none",
    opacity: resolved.opacity,
    blend: resolved.blend,
    tint: null,
    opaque: false,
    source: resolved.source,
  };
}

/**
 * Meta-driven parallax asset registry with canonical keys (`<world>:far`, `<world>:var_x`,
 * `<world>:var_x@<zone>`, `<world>:fx_<id>`, `_shared:fx_<id>`) and zero aliases.
 */
export class ParallaxRegistry implements IParallaxRegistry {
  private readonly entriesByKey = new Map<string, ParallaxCatalogEntry>();
  private readonly metasByWorld = new Map<string, WorldParallaxMeta>();

  constructor(discovery: ParallaxDiscoveryData = discoverParallaxFiles()) {
    const imagesBySlot = indexImagesBySlot(discovery.images);
    const parsedMetas = Object.values(discovery.metas).filter(isWorldMeta);
    for (const meta of parsedMetas) this.metasByWorld.set(meta.worldId, meta);
    parsedMetas.sort((a, b) => a.worldId.localeCompare(b.worldId));
    for (const meta of parsedMetas) {
      this.registerWorldLayers(meta, imagesBySlot);
      this.registerWorldEffects(meta, imagesBySlot);
    }
  }

  public resolve(key: string | undefined): ParallaxCatalogEntry | undefined {
    return key ? this.entriesByKey.get(key) : undefined;
  }

  public has(key: string): boolean {
    return this.entriesByKey.has(key);
  }

  public getWorldMeta(worldId: WorldId | string): WorldParallaxMeta | undefined {
    return this.metasByWorld.get(worldId);
  }

  public getWorldIds(): readonly string[] {
    return Array.from(this.metasByWorld.keys());
  }

  public entries(): readonly ParallaxCatalogEntry[] {
    return Array.from(this.entriesByKey.values());
  }

  public keys(): readonly string[] {
    return Array.from(this.entriesByKey.keys());
  }

  public get size(): number {
    return this.entriesByKey.size;
  }

  private registerWorldLayers(
    meta: WorldParallaxMeta,
    imagesBySlot: ReadonlyMap<string, Partial<Record<ParallaxFileTier, string>>>
  ): void {
    const { worldId, layers } = meta;
    for (const [slot, rawLayer] of Object.entries(layers)) {
      const resolved = resolveLayerWithDefaults(rawLayer);
      const url = pickTierUrl(imagesBySlot, resolved.source ?? `${worldId}:${slot}`);
      if (!url) continue;

      const key = `${worldId}:${slot}`;
      const label = formatSlotLabel(worldId, slot);
      this.entriesByKey.set(key, {
        key,
        worldId,
        slot,
        band: resolved.band,
        tier: resolved.band,
        url,
        meta: resolved,
        borrowedFrom: resolved.source,
        defaultOpacity: resolved.opacity,
        defaultBlendMode: resolved.blend === "screen" ? "screen" : undefined,
        tint: resolved.tint,
        generatedByAi: url.toLowerCase().endsWith(".jpg"),
        labelPl: label,
        labelEn: label,
      });
      this.registerZoneVariants(worldId, slot, resolved, imagesBySlot);
    }
  }

  private registerZoneVariants(
    worldId: string,
    slot: string,
    baseMeta: ResolvedParallaxLayerMeta,
    imagesBySlot: ReadonlyMap<string, Partial<Record<ParallaxFileTier, string>>>
  ): void {
    if (!baseMeta.zones) return;
    for (const [zoneKey, zoneOverride] of Object.entries(baseMeta.zones)) {
      const zoneKind = zoneKey as ParallaxZoneKind;
      const url = pickTierUrl(imagesBySlot, `${worldId}:${slot}_zone_${zoneKind}`);
      if (!url) continue;

      const fullKey = `${worldId}:${slot}@${zoneKind}`;
      const opacity = zoneOverride?.opacity ?? baseMeta.opacity;
      const tint = zoneOverride?.tint ?? baseMeta.tint;
      const label = formatSlotLabel(worldId, `${slot}@${zoneKind}`);
      this.entriesByKey.set(fullKey, {
        key: fullKey,
        worldId,
        slot,
        zoneKind,
        band: baseMeta.band,
        tier: baseMeta.band,
        url,
        meta: { ...baseMeta, opacity, tint },
        defaultOpacity: opacity,
        defaultBlendMode: baseMeta.blend === "screen" ? "screen" : undefined,
        tint,
        generatedByAi: url.toLowerCase().endsWith(".jpg"),
        labelPl: label,
        labelEn: label,
      });
    }
  }

  private registerWorldEffects(
    meta: WorldParallaxMeta,
    imagesBySlot: ReadonlyMap<string, Partial<Record<ParallaxFileTier, string>>>
  ): void {
    if (!meta.effects) return;
    for (const [effectId, rawEffect] of Object.entries(meta.effects)) {
      if (rawEffect.kind !== "image" || !rawEffect.source || this.entriesByKey.has(rawEffect.source)) continue;
      const url = pickTierUrl(imagesBySlot, rawEffect.source);
      if (!url) continue;

      const [fxWorld = meta.worldId, fxSlot = effectId] = rawEffect.source.split(":");
      const resolved = resolveEffectWithDefaults(rawEffect);
      const label = formatSlotLabel(fxWorld, fxSlot);
      this.entriesByKey.set(rawEffect.source, {
        key: rawEffect.source,
        worldId: fxWorld,
        slot: fxSlot,
        band: resolved.band,
        tier: rawEffect.source.includes("throne") || rawEffect.band === "mid" ? "boss_world" : "boss_stage",
        url,
        meta: toEffectLayerMeta(rawEffect),
        isFx: true,
        defaultOpacity: resolved.opacity,
        defaultBlendMode: resolved.blend === "screen" ? "screen" : undefined,
        generatedByAi: url.toLowerCase().endsWith(".jpg"),
        labelPl: label,
        labelEn: label,
      });
    }
  }
}

export function buildParallaxRegistry(discovery?: ParallaxDiscoveryData): ParallaxRegistry {
  return new ParallaxRegistry(discovery);
}

export const defaultParallaxRegistry = new ParallaxRegistry();
