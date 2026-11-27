import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { WorldId } from "../../src/game/locations/types";
import type { WorldParallaxMeta } from "../../src/game/parallax/meta";
import { decodePngBuffer, encodePngBuffer, type RgbaImage } from "../lib/png";
import { WORLD_IDS } from "./buildMeta";
import {
  downscaleArea,
  gradeBossVariant,
  gradeRestVariant,
  quantizeRgba,
  widenToWidth,
  type ParallaxQuantTier,
} from "./imageOps";

const DEFAULT_PARALLAX_ROOT = fileURLToPath(new URL("../../src/assets/parallax", import.meta.url));
const DEFAULT_SHEET_DIR = join(tmpdir(), "vc-parallax-sheets");

const TIER_LIMITS: Readonly<Record<ParallaxQuantTier, { farMaxW: number; farMaxH: number; varMaxW: number; varMaxH: number; scale: number; maxColors: number }>> = {
  hi16bit: { farMaxW: 1024, farMaxH: 576, varMaxW: 1280, varMaxH: 512, scale: 0.5, maxColors: 160 },
  hi8bit: { farMaxW: 512, farMaxH: 288, varMaxW: 640, varMaxH: 256, scale: 0.25, maxColors: 24 },
};

const THORN_CHASM_VAR_B_WIDTH = 2172;

export interface DeriveOptions {
  readonly check?: boolean;
  readonly worlds?: readonly WorldId[];
  readonly parallaxRoot?: string;
  readonly log?: (line: string) => void;
}

export interface WorldSizeStats {
  readonly worldId: WorldId;
  readonly highKb: number;
  readonly midKb: number;
  readonly lowKb: number;
  readonly addedKb: number;
  readonly ratioPct: number;
}

export interface DeriveResult {
  readonly exitCode: number;
  readonly stats: readonly WorldSizeStats[];
  readonly totalAddedKb: number;
  readonly outOfSyncFiles: readonly string[];
}

interface PlannedOutput {
  readonly worldId: WorldId;
  readonly slot: string;
  readonly tier: "high" | ParallaxQuantTier;
  readonly filePath: string;
  readonly bytes: Buffer;
}

function roundToMultipleOf8(value: number): number {
  return Math.max(8, Math.round(value / 8) * 8);
}

/**
 * Computes target dimensions preserving aspect ratio, fitting doc caps with width a multiple of 8.
 */
export function resolveTargetDimensions(
  srcW: number,
  srcH: number,
  isFar: boolean,
  tier: ParallaxQuantTier
): { width: number; height: number } {
  const limits = TIER_LIMITS[tier];
  const maxW = isFar ? limits.farMaxW : limits.varMaxW;
  const maxH = isFar ? limits.farMaxH : limits.varMaxH;

  let width = Math.min(maxW, roundToMultipleOf8(srcW * limits.scale));
  let height = Math.max(1, Math.round((srcH * width) / srcW));

  if (height > maxH) {
    height = maxH;
    width = Math.min(maxW, roundToMultipleOf8((srcW * height) / srcH));
  }

  return { width, height };
}

function readMeta(worldId: WorldId, parallaxRoot: string): WorldParallaxMeta {
  const metaPath = join(parallaxRoot, worldId, `${worldId}_parallax_meta.json`);
  return JSON.parse(readFileSync(metaPath, "utf-8")) as WorldParallaxMeta;
}

function findClosestSlot(meta: WorldParallaxMeta): string {
  let closestSlot = "var_d";
  let bestDepth = -Infinity;

  for (const [slot, layer] of Object.entries(meta.layers)) {
    if (slot === "far") continue;
    const depth = layer.depth ?? 0;
    if (depth >= bestDepth) {
      bestDepth = depth;
      closestSlot = slot;
    }
  }
  return closestSlot;
}

function resolveSourcePngForSlot(
  worldId: WorldId,
  slot: string,
  meta: WorldParallaxMeta,
  parallaxRoot: string,
  overriddenHighImages: ReadonlyMap<string, RgbaImage>
): RgbaImage | null {
  const layer = meta.layers[slot];
  if (layer?.source) {
    const [srcWorld, srcSlot] = layer.source.split(":");
    const key = `${srcWorld}/${srcSlot}`;
    const mem = overriddenHighImages.get(key);
    if (mem) return mem;
    const srcPath = join(parallaxRoot, srcWorld, `${srcWorld}_${srcSlot}_high.png`);
    return existsSync(srcPath) ? decodePngBuffer(readFileSync(srcPath)) : null;
  }

  const mem = overriddenHighImages.get(`${worldId}/${slot}`);
  if (mem) return mem;
  const localPath = join(parallaxRoot, worldId, `${worldId}_${slot}_high.png`);
  return existsSync(localPath) ? decodePngBuffer(readFileSync(localPath)) : null;
}

function deriveLowerTierPng(source: RgbaImage, isFar: boolean, tier: ParallaxQuantTier): Buffer {
  const { width, height } = resolveTargetDimensions(source.width, source.height, isFar, tier);
  const downscaled = downscaleArea(source, width, height, isFar);
  const quantized = quantizeRgba(downscaled, TIER_LIMITS[tier].maxColors, tier, isFar);

  if (isFar) {
    return encodePngBuffer(quantized, { colorType: 2, filter: "paeth", compressionLevel: 6 });
  }
  return encodePngBuffer(quantized, { colorType: 3, compressionLevel: 6 });
}

function buildWorldOutputs(
  worldId: WorldId,
  parallaxRoot: string,
  overriddenHighImages: Map<string, RgbaImage>
): PlannedOutput[] {
  const worldDir = join(parallaxRoot, worldId);
  const meta = readMeta(worldId, parallaxRoot);
  const outputs: PlannedOutput[] = [];

  if (worldId === "thorn_chasm") {
    const varBPath = join(worldDir, "thorn_chasm_var_b_high.png");
    const rawVarB = decodePngBuffer(readFileSync(varBPath));
    const fixedVarB = rawVarB.width < THORN_CHASM_VAR_B_WIDTH ? widenToWidth(rawVarB, THORN_CHASM_VAR_B_WIDTH) : rawVarB;
    overriddenHighImages.set("thorn_chasm/var_b", fixedVarB);
    if (rawVarB.width < THORN_CHASM_VAR_B_WIDTH) {
      outputs.push({
        worldId,
        slot: "var_b",
        tier: "high",
        filePath: varBPath,
        bytes: encodePngBuffer(fixedVarB, { colorType: 6, filter: "paeth", compressionLevel: 6 }),
      });
    }
  }

  const closestSlot = findClosestSlot(meta);
  const closestImage = resolveSourcePngForSlot(worldId, closestSlot, meta, parallaxRoot, overriddenHighImages);
  if (closestImage) {
    const bossImage = gradeBossVariant(closestImage);
    const restImage = gradeRestVariant(closestImage);
    const bossSlot = `${closestSlot}_zone_boss`;
    const restSlot = `${closestSlot}_zone_rest`;

    overriddenHighImages.set(`${worldId}/${bossSlot}`, bossImage);
    overriddenHighImages.set(`${worldId}/${restSlot}`, restImage);

    outputs.push({
      worldId,
      slot: bossSlot,
      tier: "high",
      filePath: join(worldDir, `${worldId}_${bossSlot}_high.png`),
      bytes: encodePngBuffer(bossImage, { colorType: 6, filter: "paeth", compressionLevel: 6 }),
    });
    outputs.push({
      worldId,
      slot: restSlot,
      tier: "high",
      filePath: join(worldDir, `${worldId}_${restSlot}_high.png`),
      bytes: encodePngBuffer(restImage, { colorType: 6, filter: "paeth", compressionLevel: 6 }),
    });
  }

  const diskHighs = readdirSync(worldDir)
    .filter((f) => f.startsWith(`${worldId}_`) && f.endsWith("_high.png"))
    .map((f) => f.slice(`${worldId}_`.length, -"_high.png".length));

  const slotSet = new Set<string>(diskHighs);
  for (const key of overriddenHighImages.keys()) {
    if (key.startsWith(`${worldId}/`)) {
      slotSet.add(key.slice(worldId.length + 1));
    }
  }

  for (const slot of [...slotSet].sort()) {
    const mem = overriddenHighImages.get(`${worldId}/${slot}`);
    const source = mem ?? decodePngBuffer(readFileSync(join(worldDir, `${worldId}_${slot}_high.png`)));
    const isFar = slot === "far";

    for (const tier of ["hi16bit", "hi8bit"] as const) {
      outputs.push({
        worldId,
        slot,
        tier,
        filePath: join(worldDir, `${worldId}_${slot}_${tier}.png`),
        bytes: deriveLowerTierPng(source, isFar, tier),
      });
    }
  }

  return outputs;
}

function summarizeWorldStats(
  worldIds: readonly WorldId[],
  parallaxRoot: string,
  outputs: readonly PlannedOutput[],
  newHighPaths: ReadonlySet<string>
): { stats: WorldSizeStats[]; totalAddedKb: number } {
  const outputMap = new Map<string, number>();
  for (const o of outputs) outputMap.set(o.filePath, o.bytes.length);

  const stats: WorldSizeStats[] = [];
  let totalAddedBytes = 0;

  for (const worldId of worldIds) {
    const worldDir = join(parallaxRoot, worldId);
    const files = new Set<string>(readdirSync(worldDir));
    for (const o of outputs) {
      if (o.worldId === worldId) files.add(o.filePath.split(/[\\/]/).pop() ?? "");
    }

    let highBytes = 0;
    let midBytes = 0;
    let lowBytes = 0;
    let addedBytes = 0;

    for (const file of files) {
      if (!file.endsWith(".png") && !file.endsWith(".jpg")) continue;
      const fullPath = join(worldDir, file);
      const size = outputMap.get(fullPath) ?? (existsSync(fullPath) ? readFileSync(fullPath).length : 0);

      if (file.endsWith("_high.png") || file.endsWith("_high.jpg")) {
        highBytes += size;
        if (newHighPaths.has(fullPath)) addedBytes += size;
      } else if (file.endsWith("_hi16bit.png")) {
        midBytes += size;
        addedBytes += size;
      } else if (file.endsWith("_hi8bit.png")) {
        lowBytes += size;
        addedBytes += size;
      }
    }

    totalAddedBytes += addedBytes;
    const highKb = Math.round(highBytes / 1024);
    const midKb = Math.round(midBytes / 1024);
    const lowKb = Math.round(lowBytes / 1024);
    const ratioPct = highBytes > 0 ? Math.round(((midBytes + lowBytes) / highBytes) * 1000) / 10 : 0;

    stats.push({
      worldId,
      highKb,
      midKb,
      lowKb,
      addedKb: Math.round(addedBytes / 1024),
      ratioPct,
    });
  }

  return { stats, totalAddedKb: Math.round(totalAddedBytes / 1024) };
}

/**
 * Generates or verifies derived parallax tiers (`hi16bit`, `hi8bit`) and close-layer zone variants.
 */
export function runDeriveTiers(options: DeriveOptions = {}): DeriveResult {
  const parallaxRoot = options.parallaxRoot ?? DEFAULT_PARALLAX_ROOT;
  const worlds = options.worlds ?? WORLD_IDS;
  const checkOnly = Boolean(options.check);
  const log = options.log ?? ((line: string) => console.log(line));

  const overriddenHighImages = new Map<string, RgbaImage>();
  const allOutputs: PlannedOutput[] = [];

  for (const worldId of worlds) {
    allOutputs.push(...buildWorldOutputs(worldId, parallaxRoot, overriddenHighImages));
  }

  const newHighPaths = new Set<string>();
  for (const output of allOutputs) {
    if (output.tier === "high" && !existsSync(output.filePath)) {
      newHighPaths.add(output.filePath);
    }
  }

  const outOfSyncFiles: string[] = [];
  if (checkOnly) {
    for (const output of allOutputs) {
      if (!existsSync(output.filePath)) {
        outOfSyncFiles.push(output.filePath);
        log(`missing: ${output.filePath}`);
        continue;
      }
      const existing = readFileSync(output.filePath);
      if (Buffer.compare(existing, output.bytes) !== 0) {
        outOfSyncFiles.push(output.filePath);
        log(`out of date: ${output.filePath}`);
      }
    }
  } else {
    for (const output of allOutputs) {
      writeFileSync(output.filePath, output.bytes);
    }
  }

  const { stats, totalAddedKb } = summarizeWorldStats(worlds, parallaxRoot, allOutputs, newHighPaths);
  for (const s of stats) {
    log(
      `${s.worldId.padEnd(20)} high=${String(s.highKb).padStart(5)}KB  mid=${String(s.midKb).padStart(4)}KB  low=${String(s.lowKb).padStart(4)}KB  (low+mid)/high=${s.ratioPct.toFixed(1)}%`
    );
  }
  log(`total derived/added: ${totalAddedKb} KB (${allOutputs.length} files)`);

  return {
    exitCode: outOfSyncFiles.length > 0 ? 1 : 0,
    stats,
    totalAddedKb,
    outOfSyncFiles,
  };
}

function parseArgs(argv: readonly string[]): { check: boolean; worlds?: WorldId[]; sheetsOutDir?: string } {
  let check = false;
  let worlds: WorldId[] | undefined;
  let sheetsOutDir: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--check") {
      check = true;
    } else if (arg === "--world" && argv[i + 1]) {
      worlds = [argv[++i] as WorldId];
    } else if (arg === "--sheets") {
      sheetsOutDir = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : DEFAULT_SHEET_DIR;
    }
  }
  return { check, worlds, sheetsOutDir };
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  const result = runDeriveTiers({ check: parsed.check, worlds: parsed.worlds });

  if (parsed.sheetsOutDir && !parsed.check) {
    const { generateWorldContactSheets } = await import("./contactSheet");
    mkdirSync(parsed.sheetsOutDir, { recursive: true });
    const paths = generateWorldContactSheets(parsed.sheetsOutDir, parsed.worlds);
    for (const path of paths) console.log(`sheet: ${path}`);
  }

  process.exitCode = result.exitCode;
}

if (import.meta.main) {
  await main();
}
