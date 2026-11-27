import { resolveVariantTier } from "@game/engine/atlas/atlasVariantResolver";
import type { BackgroundLayerTier } from "@game/locations/schema/locationSchema";
import type { WorldId } from "@game/locations/types";
import { assetsLogger } from "@game/logger/gameLogger";
import type { ResolvedParallaxQuality } from "@game/types";
import {
  resolveEffectWithDefaults,
  resolveLayerWithDefaults,
  type ParallaxBand,
  type ParallaxEffectMeta,
  type ParallaxFileTier,
  type ParallaxQualityTier,
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

interface StoredParallaxSlot {
  readonly base: ParallaxCatalogEntry;
  readonly byQualityTier: Readonly<Partial<Record<ParallaxQualityTier, ParallaxCatalogEntry>>>;
}

const IMAGE_FILE_PATTERN = /^(.+)_(hi8bit|hi16bit|high)\.(png|jpg)$/;
const FILE_TO_QUALITY_TIER: Readonly<Record<ParallaxFileTier, ParallaxQualityTier>> = {
  hi8bit: "low",
  hi16bit: "mid",
  high: "high",
};
const QUALITY_TIERS: readonly ParallaxQualityTier[] = ["low", "mid", "high"];

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

function indexImagesBySlot(
  images: Readonly<Record<string, string>>
): Map<string, Partial<Record<ParallaxQualityTier, string>>> {
  const indexed = new Map<string, Partial<Record<ParallaxQualityTier, string>>>();
  for (const [rawPath, url] of Object.entries(images)) {
    const parts = rawPath.replace(/\\/g, "/").split("/");
    const folder = parts[parts.length - 2];
    const fileName = parts[parts.length - 1];
    if (!folder || !fileName) continue;

    const match = fileName.match(IMAGE_FILE_PATTERN);
    if (!match) continue;

    const stem = match[1];
    const fileTier = match[2] as ParallaxFileTier;
    const qualityTier = FILE_TO_QUALITY_TIER[fileTier];
    const slotPrefix = folder === "_shared" ? "" : `${folder}_`;
    if (slotPrefix && !stem.startsWith(slotPrefix)) continue;

    const lookupKey = `${folder}:${slotPrefix ? stem.slice(slotPrefix.length) : stem}`;
    const byTier = indexed.get(lookupKey) ?? {};
    byTier[qualityTier] = url;
    indexed.set(lookupKey, byTier);
  }
  return indexed;
}

type CatalogEntryTemplate = Omit<ParallaxCatalogEntry, "url" | "resolvedTier" | "variants" | "generatedByAi">;

function buildSlotRecord(
  template: CatalogEntryTemplate,
  variants: Partial<Record<ParallaxQualityTier, string>> | undefined
): StoredParallaxSlot | null {
  if (!variants) return null;

  const frozenVariants: Partial<Record<ParallaxQualityTier, string>> = { ...variants };
  const byQualityTier: Partial<Record<ParallaxQualityTier, ParallaxCatalogEntry>> = {};
  const entryByResolvedTier: Partial<Record<ParallaxQualityTier, ParallaxCatalogEntry>> = {};

  for (const requested of QUALITY_TIERS) {
    const pickedTier = resolveVariantTier(frozenVariants, requested);
    if (!pickedTier) continue;
    const url = frozenVariants[pickedTier];
    if (!url) continue;

    let entry = entryByResolvedTier[pickedTier];
    if (!entry) {
      entry = {
        ...template,
        url,
        resolvedTier: pickedTier,
        variants: frozenVariants,
        generatedByAi: url.toLowerCase().endsWith(".jpg"),
      };
      entryByResolvedTier[pickedTier] = entry;
    }
    byQualityTier[requested] = entry;
  }

  const base = byQualityTier.high ?? byQualityTier.mid ?? byQualityTier.low;
  if (!base) return null;
  return { base, byQualityTier };
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
  private readonly slotsByKey = new Map<string, StoredParallaxSlot>();
  private readonly metasByWorld = new Map<string, WorldParallaxMeta>();
  private readonly qualityListeners = new Set<(quality: ResolvedParallaxQuality) => void>();
  private parallaxQuality: ResolvedParallaxQuality;

  constructor(
    discovery: ParallaxDiscoveryData = discoverParallaxFiles(),
    initialQuality: ResolvedParallaxQuality = "high"
  ) {
    this.parallaxQuality = initialQuality;
    const imagesBySlot = indexImagesBySlot(discovery.images);
    const parsedMetas = Object.values(discovery.metas).filter(isWorldMeta);
    for (const meta of parsedMetas) this.metasByWorld.set(meta.worldId, meta);
    parsedMetas.sort((a, b) => a.worldId.localeCompare(b.worldId));
    for (const meta of parsedMetas) {
      this.registerWorldLayers(meta, imagesBySlot);
      this.registerWorldEffects(meta, imagesBySlot);
    }
  }

  public getParallaxQuality(): ResolvedParallaxQuality {
    return this.parallaxQuality;
  }

  public setParallaxQuality(quality: ResolvedParallaxQuality): boolean {
    if (quality === this.parallaxQuality) return false;
    this.parallaxQuality = quality;
    for (const listener of [...this.qualityListeners]) {
      listener(quality);
    }
    return true;
  }

  public subscribeQuality(listener: (quality: ResolvedParallaxQuality) => void): () => void {
    this.qualityListeners.add(listener);
    return () => this.qualityListeners.delete(listener);
  }

  public resolve(
    key: string | undefined,
    qualityOverride?: ResolvedParallaxQuality
  ): ParallaxCatalogEntry | undefined {
    if (!key) return undefined;
    const slot = this.slotsByKey.get(key);
    if (!slot) return undefined;

    const quality = qualityOverride ?? this.parallaxQuality;
    if (quality === "off") return undefined;
    if (quality === "simplified") {
      if (slot.base.band !== "far" || slot.base.isFx) return undefined;
      return slot.byQualityTier.low;
    }
    return slot.byQualityTier[quality];
  }

  public resolveForTier(
    key: string | undefined,
    tier: ParallaxQualityTier
  ): ParallaxCatalogEntry | undefined {
    if (!key) return undefined;
    return this.slotsByKey.get(key)?.byQualityTier[tier];
  }

  public has(key: string): boolean {
    return this.slotsByKey.has(key);
  }

  public getWorldMeta(worldId: WorldId | string): WorldParallaxMeta | undefined {
    return this.metasByWorld.get(worldId);
  }

  public getWorldIds(): readonly string[] {
    return Array.from(this.metasByWorld.keys());
  }

  public entries(): readonly ParallaxCatalogEntry[] {
    const tier: ParallaxQualityTier =
      this.parallaxQuality === "off" || this.parallaxQuality === "simplified"
        ? "high"
        : this.parallaxQuality;
    const out: ParallaxCatalogEntry[] = [];
    for (const slot of this.slotsByKey.values()) {
      out.push(slot.byQualityTier[tier] ?? slot.base);
    }
    return out;
  }

  public keys(): readonly string[] {
    return Array.from(this.slotsByKey.keys());
  }

  public get size(): number {
    return this.slotsByKey.size;
  }

  private registerWorldLayers(
    meta: WorldParallaxMeta,
    imagesBySlot: ReadonlyMap<string, Partial<Record<ParallaxQualityTier, string>>>
  ): void {
    const { worldId, layers } = meta;
    for (const [slot, rawLayer] of Object.entries(layers)) {
      const resolved = resolveLayerWithDefaults(rawLayer);
      const key = `${worldId}:${slot}`;
      const label = formatSlotLabel(worldId, slot);
      const record = buildSlotRecord(
        {
          key,
          worldId,
          slot,
          band: resolved.band,
          tier: resolved.band,
          meta: resolved,
          borrowedFrom: resolved.source,
          defaultOpacity: resolved.opacity,
          defaultBlendMode: resolved.blend === "screen" ? "screen" : undefined,
          tint: resolved.tint,
          labelPl: label,
          labelEn: label,
        },
        imagesBySlot.get(resolved.source ?? key)
      );
      if (!record) continue;

      this.slotsByKey.set(key, record);
      this.registerZoneVariants(worldId, slot, resolved, imagesBySlot);
    }
  }

  private registerZoneVariants(
    worldId: string,
    slot: string,
    baseMeta: ResolvedParallaxLayerMeta,
    imagesBySlot: ReadonlyMap<string, Partial<Record<ParallaxQualityTier, string>>>
  ): void {
    if (!baseMeta.zones) return;
    for (const [zoneKey, zoneOverride] of Object.entries(baseMeta.zones)) {
      const zoneKind = zoneKey as ParallaxZoneKind;
      const fullKey = `${worldId}:${slot}@${zoneKind}`;
      const opacity = zoneOverride?.opacity ?? baseMeta.opacity;
      const tint = zoneOverride?.tint ?? baseMeta.tint;
      const label = formatSlotLabel(worldId, `${slot}@${zoneKind}`);
      const record = buildSlotRecord(
        {
          key: fullKey,
          worldId,
          slot,
          zoneKind,
          band: baseMeta.band,
          tier: baseMeta.band,
          meta: { ...baseMeta, opacity, tint },
          defaultOpacity: opacity,
          defaultBlendMode: baseMeta.blend === "screen" ? "screen" : undefined,
          tint,
          labelPl: label,
          labelEn: label,
        },
        imagesBySlot.get(`${worldId}:${slot}_zone_${zoneKind}`)
      );
      if (record) {
        this.slotsByKey.set(fullKey, record);
      }
    }
  }

  private registerWorldEffects(
    meta: WorldParallaxMeta,
    imagesBySlot: ReadonlyMap<string, Partial<Record<ParallaxQualityTier, string>>>
  ): void {
    if (!meta.effects) return;
    for (const [effectId, rawEffect] of Object.entries(meta.effects)) {
      if (rawEffect.kind !== "image" || !rawEffect.source || this.slotsByKey.has(rawEffect.source)) continue;

      const [fxWorld = meta.worldId, fxSlot = effectId] = rawEffect.source.split(":");
      const resolved = resolveEffectWithDefaults(rawEffect);
      const label = formatSlotLabel(fxWorld, fxSlot);
      const record = buildSlotRecord(
        {
          key: rawEffect.source,
          worldId: fxWorld,
          slot: fxSlot,
          band: resolved.band,
          tier: rawEffect.source.includes("throne") || rawEffect.band === "mid" ? "boss_world" : "boss_stage",
          meta: toEffectLayerMeta(rawEffect),
          isFx: true,
          defaultOpacity: resolved.opacity,
          defaultBlendMode: resolved.blend === "screen" ? "screen" : undefined,
          labelPl: label,
          labelEn: label,
        },
        imagesBySlot.get(rawEffect.source)
      );
      if (record) {
        this.slotsByKey.set(rawEffect.source, record);
      }
    }
  }
}

export function buildParallaxRegistry(
  discovery?: ParallaxDiscoveryData,
  initialQuality?: ResolvedParallaxQuality
): ParallaxRegistry {
  return new ParallaxRegistry(discovery, initialQuality);
}

export const defaultParallaxRegistry = new ParallaxRegistry();
