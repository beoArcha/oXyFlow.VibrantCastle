import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AssetError, ErrorCode } from "../src/lib/errors";
import { decodePngFile, encodePngBuffer } from "./lib/png";
import { describePlan, planSheet, repackSheet } from "./atlas/repack";
import { formatMetaJson, type JsonObject } from "./atlas/metaBuilder";
import { parseSheetMeta } from "./atlas/parseMeta";
import { renderOverlay } from "./atlas/overlay";
import type { Rect } from "./atlas/islands";
import type { RepackConfig, SheetConfig } from "./atlas/repackTypes";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ASSET_ROOT = resolve(SCRIPT_DIR, "../src/assets");
const CONFIG_PATH = resolve(SCRIPT_DIR, "atlas/repack.config.json");

export function loadRepackConfig(): RepackConfig {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as RepackConfig;
}

export interface SheetPaths {
  sourceImage: string;
  sourceMeta: string;
  packedImage: string;
  packedMeta: string;
  packedImageName: string;
}

export function sheetPaths(id: string, config: SheetConfig): SheetPaths {
  const dir = join(ASSET_ROOT, config.directory);
  return {
    sourceImage: join(dir, `${id}_high.png`),
    sourceMeta: join(dir, `${id}_meta.json`),
    packedImage: join(dir, `${id}_packed_high.png`),
    packedMeta: join(dir, `${id}_packed_meta.json`),
    packedImageName: `${id}_packed_high.png`,
  };
}

function runSheet(id: string, config: SheetConfig, dryRun: boolean, overlayDir: string | undefined): void {
  const paths = sheetPaths(id, config);
  const source = decodePngFile(paths.sourceImage);
  const originalMeta = JSON.parse(readFileSync(paths.sourceMeta, "utf8")) as JsonObject;

  if (dryRun) {
    const plan = planSheet(source, originalMeta, config);
    console.log(describePlan(id, source, plan.rows, plan.layout).join("\n"));
    return;
  }

  const result = repackSheet(source, originalMeta, config, paths.packedImageName);
  writeFileSync(paths.packedImage, encodePngBuffer(result.image));
  writeFileSync(paths.packedMeta, formatMetaJson(result.meta));
  if (overlayDir) {
    const bodyBox = (result.meta.layout as { bodyBox?: Rect }).bodyBox;
    const overlay = renderOverlay(result.image, parseSheetMeta(result.meta), bodyBox);
    writeFileSync(join(overlayDir, `${id}_overlay.png`), encodePngBuffer(overlay));
  }
  console.log(describePlan(id, source, result.rows, result.layout).join("\n"));
  console.log(
    `  bytes: ${statSync(paths.sourceImage).size} -> ${statSync(paths.packedImage).size}; wrote ${paths.packedImage} and ${paths.packedMeta}`
  );
}

function main(args: string[]): void {
  const dryRun = args.includes("--dry-run");
  const overlayIndex = args.indexOf("--overlay");
  const overlayDir = overlayIndex >= 0 ? args[overlayIndex + 1] : undefined;
  const target = args.find((arg, i) => !arg.startsWith("--") && i !== overlayIndex + 1);
  const { sheets } = loadRepackConfig();
  const ids = args.includes("--all") ? Object.keys(sheets) : target ? [target] : [];
  if (ids.length === 0) {
    console.error("Usage: bun scripts/repack-atlas.ts <atlasId>|--all [--dry-run] [--overlay <dir>]");
    process.exitCode = 1;
    return;
  }
  for (const id of ids) {
    const config = sheets[id];
    if (!config || !existsSync(sheetPaths(id, config).sourceImage)) {
      throw new AssetError(`Unknown atlas '${id}' (configured: ${Object.keys(sheets).join(", ")})`, ErrorCode.ASSET_NOT_FOUND, {
        details: { id },
      });
    }
    runSheet(id, config, dryRun, overlayDir);
  }
}

if (import.meta.main) main(process.argv.slice(2));
