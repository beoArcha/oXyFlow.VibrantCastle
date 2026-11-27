import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePngBuffer, type RgbaImage } from "../lib/png";
import { measureHorizontalSeam, seamVerdict } from "./seamMetrics";
import { readJpgInfo } from "./jpgInfo";
import { AssetError, ErrorCode } from "../../src/lib/errors";
import type { WorldId } from "../../src/game/locations/types";
import type {
  ParallaxBand,
  ParallaxEffectMeta,
  ParallaxFileTier,
  ParallaxGeneratedEntry,
  ParallaxLayerMeta,
  ParallaxSeamStats,
  ParallaxTierStats,
  ParallaxZoneKind,
  ParallaxZoneOverride,
  WorldParallaxMeta,
} from "../../src/game/parallax/meta";

const PARALLAX_ROOT = fileURLToPath(new URL("../../src/assets/parallax", import.meta.url));
const LOCATIONS_ROOT = fileURLToPath(new URL("../../src/data/locations", import.meta.url));

export const WORLD_IDS: readonly WorldId[] = [
  "courtyard",
  "thorn_chasm",
  "ashen_catacombs",
  "clocktower",
  "alchemist_library",
  "aether_sanctuary",
  "grand_bastion",
  "eclipse_crown",
];

const VARIATION_BANDS: ReadonlyArray<{ readonly slot: string; readonly band: ParallaxBand }> = [
  { slot: "var_a", band: "mid_far" },
  { slot: "var_b", band: "mid" },
  { slot: "var_c", band: "mid_close" },
  { slot: "var_d", band: "close" },
];

const BORROWED_SOURCES: Readonly<Partial<Record<WorldId, Readonly<Record<string, string>>>>> = {
  ashen_catacombs: {
    var_a: "thorn_chasm:var_a",
    var_c: "grand_bastion:var_c",
    var_d: "courtyard:var_d",
  },
  alchemist_library: {
    var_a: "aether_sanctuary:var_a",
    var_c: "clocktower:var_c",
    var_d: "aether_sanctuary:var_d",
  },
  eclipse_crown: {
    var_a: "grand_bastion:var_a",
    var_c: "aether_sanctuary:var_c",
    var_d: "grand_bastion:var_d",
  },
};

const TIER_ORDER: readonly ParallaxFileTier[] = ["hi8bit", "hi16bit", "high"];

interface LocationParallaxLayer {
  readonly tier?: string;
  readonly depth: number;
  readonly scrollSpeedX: number;
  readonly scrollSpeedY: number;
  readonly opacity?: number;
  readonly blendMode?: string;
  readonly mirrorTile?: boolean;
}

interface LocationJson {
  readonly worldId: WorldId;
  readonly theme: {
    readonly bgGradientTop: string;
    readonly bgGradientBottom: string;
  };
  readonly parallaxBackground?: {
    readonly layers: readonly LocationParallaxLayer[];
  };
}

interface ParsedParallaxFile {
  readonly slot: string;
  readonly baseSlot: string;
  readonly zoneKind?: ParallaxZoneKind;
  readonly tier: ParallaxFileTier;
  readonly ext: "png" | "jpg";
  readonly filePath: string;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function toHexByte(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");
}

/**
 * Computes average RGB hex (`#rrggbb`, no alpha) across visible pixels.
 */
export function computePngAverageHex(image: RgbaImage): string {
  const { data } = image;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
    count++;
  }

  if (count === 0) return "#000000";
  return `#${toHexByte(rSum / count)}${toHexByte(gSum / count)}${toHexByte(bSum / count)}`;
}

function parseWorldAssetFile(worldId: WorldId, fileName: string, worldDir: string): ParsedParallaxFile | null {
  if (fileName === `${worldId}_parallax_meta.json`) return null;

  const prefix = `${worldId}_`;
  if (!fileName.startsWith(prefix)) return null;

  const match = fileName.slice(prefix.length).match(/^(.+)_(hi8bit|hi16bit|high)\.(png|jpg)$/);
  if (!match) return null;

  const slot = match[1];
  const tier = match[2] as ParallaxFileTier;
  const ext = match[3] as "png" | "jpg";
  const zoneMatch = slot.match(/^(var_[a-e])_zone_(boss|rest|secret|story)$/);

  return {
    slot,
    baseSlot: zoneMatch ? zoneMatch[1] : slot,
    zoneKind: zoneMatch ? (zoneMatch[2] as ParallaxZoneKind) : undefined,
    tier,
    ext,
    filePath: join(worldDir, fileName),
  };
}

function collectWorldFiles(worldId: WorldId, parallaxRoot: string): ParsedParallaxFile[] {
  const worldDir = join(parallaxRoot, worldId);
  if (!existsSync(worldDir)) {
    throw new AssetError(`Missing parallax world directory: ${worldDir}`, ErrorCode.ASSET_NOT_FOUND, {
      details: { worldId, worldDir },
    });
  }

  const parsed: ParsedParallaxFile[] = [];
  for (const entry of readdirSync(worldDir).sort()) {
    const file = parseWorldAssetFile(worldId, entry, worldDir);
    if (file) parsed.push(file);
  }
  return parsed;
}

function inspectSlotFiles(files: readonly ParsedParallaxFile[]): {
  generated: ParallaxGeneratedEntry;
  isPng: boolean;
  seamStats?: ParallaxSeamStats;
} {
  const tiers: Partial<Record<ParallaxFileTier, ParallaxTierStats>> = {};
  let bestFile: ParsedParallaxFile | undefined;

  for (const tier of TIER_ORDER) {
    const match = files.find((f) => f.tier === tier);
    if (!match) continue;
    const sizeKb = Math.round(statSync(match.filePath).size / 1024);

    if (match.ext === "png") {
      const img = decodePngBuffer(readFileSync(match.filePath));
      tiers[tier] = [img.width, img.height, sizeKb];
    } else {
      const jpg = readJpgInfo(match.filePath);
      tiers[tier] = [jpg.width, jpg.height, sizeKb];
    }
    bestFile = match;
  }

  if (!bestFile) {
    throw new AssetError("Cannot inspect empty parallax slot file list", ErrorCode.ASSET_NOT_FOUND);
  }

  if (bestFile.ext === "jpg") {
    const jpg = readJpgInfo(bestFile.filePath);
    return {
      isPng: false,
      generated: { tiers, avg: jpg.avgHex },
    };
  }

  const img = decodePngBuffer(readFileSync(bestFile.filePath));
  const avg = computePngAverageHex(img);
  let seamStats: ParallaxSeamStats | undefined;

  if (bestFile.slot.startsWith("var_")) {
    const measurement = measureHorizontalSeam(img);
    seamStats = [round1(measurement.seamDiff), round1(measurement.neighbourDiff), seamVerdict(measurement)];
  }

  return {
    isPng: true,
    seamStats,
    generated: seamStats ? { tiers, seam: seamStats, avg } : { tiers, avg },
  };
}

function buildLayerRecord(
  worldId: WorldId,
  location: LocationJson,
  filesBySlot: ReadonlyMap<string, ParsedParallaxFile[]>,
  generatedMap: Readonly<Record<string, ParallaxGeneratedEntry>>
): Record<string, ParallaxLayerMeta> {
  const layersByTier = new Map<string, LocationParallaxLayer>();
  for (const layer of location.parallaxBackground?.layers ?? []) {
    if (layer.tier) layersByTier.set(layer.tier, layer);
  }

  const layers: Record<string, ParallaxLayerMeta> = {};
  const farJson = layersByTier.get("far");
  layers.far = {
    band: "far",
    depth: farJson?.depth ?? 0.08,
    speed: farJson ? [farJson.scrollSpeedX, farJson.scrollSpeedY] : [0.04, 0.02],
    opaque: true,
    fit: "cover",
    overscan: [1.06, 1.03],
  };

  for (const { slot, band } of VARIATION_BANDS) {
    const jsonLayer = layersByTier.get(band);
    const localFiles = filesBySlot.get(slot);
    const borrowedSource = BORROWED_SOURCES[worldId]?.[slot];

    if (!localFiles && borrowedSource) {
      layers[slot] = {
        band,
        source: borrowedSource,
        ...(jsonLayer ? { depth: jsonLayer.depth, speed: [jsonLayer.scrollSpeedX, jsonLayer.scrollSpeedY] } : {}),
        ...(jsonLayer?.opacity !== undefined ? { opacity: jsonLayer.opacity } : {}),
      };
      continue;
    }

    const gen = generatedMap[slot];
    const tiling = gen?.seam
      ? gen.seam[2] === "warn"
        ? "mirror"
        : "repeat"
      : jsonLayer?.mirrorTile
        ? "mirror"
        : "repeat";

    const zoneEntries: Partial<Record<ParallaxZoneKind, ParallaxZoneOverride>> = {};
    for (const [candidateSlot, candidateFiles] of filesBySlot) {
      const zoneKind = candidateFiles[0]?.zoneKind;
      if (candidateFiles[0]?.baseSlot === slot && zoneKind && candidateSlot !== slot) {
        zoneEntries[zoneKind] = {};
      }
    }

    layers[slot] = {
      band,
      ...(jsonLayer ? { depth: jsonLayer.depth, speed: [jsonLayer.scrollSpeedX, jsonLayer.scrollSpeedY] } : {}),
      tiling,
      ...(jsonLayer?.opacity !== undefined ? { opacity: jsonLayer.opacity } : {}),
      ...(jsonLayer?.blendMode === "screen" ? { blend: "screen" as const } : {}),
      ...(Object.keys(zoneEntries).length > 0 ? { zones: zoneEntries } : {}),
    };
  }

  return layers;
}

function buildEffectsRecord(
  worldId: WorldId,
  location: LocationJson
): Record<string, ParallaxEffectMeta> | undefined {
  const effects: Record<string, ParallaxEffectMeta> = {};

  for (const layer of location.parallaxBackground?.layers ?? []) {
    if (layer.tier === "boss_stage") {
      effects.sigil = {
        kind: "image",
        band: "mid_close",
        source: "_shared:fx_sigil",
        depth: layer.depth,
        speed: [layer.scrollSpeedX, layer.scrollSpeedY],
        ...(layer.opacity !== undefined ? { opacity: layer.opacity } : {}),
        blend: "screen",
      };
    } else if (layer.tier === "boss_world") {
      effects.throne = {
        kind: "image",
        band: "mid",
        source: `${worldId}:fx_throne`,
        depth: layer.depth,
        speed: [layer.scrollSpeedX, layer.scrollSpeedY],
        ...(layer.opacity !== undefined ? { opacity: layer.opacity } : {}),
        blend: "screen",
      };
    }
  }

  return Object.keys(effects).length > 0 ? effects : undefined;
}

function sortGenerated(generated: Record<string, ParallaxGeneratedEntry>): Record<string, ParallaxGeneratedEntry> {
  const sorted: Record<string, ParallaxGeneratedEntry> = {};
  for (const key of Object.keys(generated).sort()) {
    sorted[key] = generated[key];
  }
  return sorted;
}

export function buildWorldParallaxMeta(
  worldId: WorldId,
  existingMeta?: WorldParallaxMeta,
  parallaxRoot: string = PARALLAX_ROOT,
  locationsRoot: string = LOCATIONS_ROOT
): WorldParallaxMeta {
  const files = collectWorldFiles(worldId, parallaxRoot);
  const filesBySlot = new Map<string, ParsedParallaxFile[]>();

  for (const file of files) {
    const list = filesBySlot.get(file.slot) ?? [];
    list.push(file);
    filesBySlot.set(file.slot, list);
  }

  const generatedRaw: Record<string, ParallaxGeneratedEntry> = {};
  for (const [slot, slotFiles] of filesBySlot) {
    generatedRaw[slot] = inspectSlotFiles(slotFiles).generated;
  }
  const generated = sortGenerated(generatedRaw);

  if (existingMeta) {
    return {
      worldId: existingMeta.worldId,
      placeholder: existingMeta.placeholder,
      layers: existingMeta.layers,
      ...(existingMeta.effects ? { effects: existingMeta.effects } : {}),
      generated,
    };
  }

  const locationPath = join(locationsRoot, `${worldId}.json`);
  const location = JSON.parse(readFileSync(locationPath, "utf-8")) as LocationJson;
  const farAvg = generated.far?.avg ?? location.theme.bgGradientBottom;

  const layers = buildLayerRecord(worldId, location, filesBySlot, generated);
  const effects = buildEffectsRecord(worldId, location);

  return {
    worldId,
    placeholder: {
      top: location.theme.bgGradientTop,
      bottom: location.theme.bgGradientBottom,
      silhouette: farAvg,
    },
    layers,
    ...(effects ? { effects } : {}),
    generated,
  };
}

export function metaFilePathFor(worldId: WorldId, parallaxRoot: string = PARALLAX_ROOT): string {
  return join(parallaxRoot, worldId, `${worldId}_parallax_meta.json`);
}

function main(): void {
  for (const worldId of WORLD_IDS) {
    const outPath = metaFilePathFor(worldId);
    const existing = existsSync(outPath)
      ? (JSON.parse(readFileSync(outPath, "utf-8")) as WorldParallaxMeta)
      : undefined;
    const meta = buildWorldParallaxMeta(worldId, existing);
    writeFileSync(outPath, `${JSON.stringify(meta, null, 2)}\n`, "utf-8");
    console.log(`wrote ${worldId}_parallax_meta.json (${Object.keys(meta.generated).length} generated entries)`);
  }
}

if (import.meta.main) main();
