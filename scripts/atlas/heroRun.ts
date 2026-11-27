import { readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodePngFile, encodePngBuffer } from "../lib/png";
import { checkHeroSheet, flaggedFrames } from "./heroFrameCheck";
import { describeHero, repackHero, type HeroTier } from "./hero";
import { renderHeroOverlay } from "./heroOverlay";
import { formatMetaJson, type JsonObject } from "./metaBuilder";
import type { HeroConfig } from "./repackTypes";
import type { BaseExtractionMeta } from "../../src/game/engine/extractors/ISpriteSheetExtractor";

const TIERS: HeroTier[] = ["low", "mid", "high"];

export function heroPaths(assetRoot: string, config: HeroConfig): {
  sourceImage: string;
  sourceMeta: string;
  packedMeta: string;
  packedImage: (tier: HeroTier) => string;
} {
  const dir = join(assetRoot, config.directory);
  return {
    sourceImage: join(dir, `${config.sourceStem}_high.png`),
    sourceMeta: join(dir, config.metaFile),
    packedMeta: join(dir, config.packedMetaFile),
    packedImage: (tier) => join(dir, `${config.sourceStem}_${tier}_packed.png`),
  };
}

export function runHero(id: string, config: HeroConfig, assetRoot: string, dryRun: boolean, overlayDir: string | undefined): void {
  const paths = heroPaths(assetRoot, config);
  const source = decodePngFile(paths.sourceImage);
  const originalMeta = JSON.parse(readFileSync(paths.sourceMeta, "utf8")) as JsonObject;
  const result = repackHero(source, originalMeta, config);
  console.log(describeHero(id, source, result).join("\n"));
  if (dryRun) return;

  writeFileSync(paths.packedMeta, formatMetaJson(result.meta));
  const animationOrder = config.rows.map((row) => row.animation);
  for (const tier of TIERS) {
    const sheet = result.sheets[tier];
    writeFileSync(paths.packedImage(tier), encodePngBuffer(sheet));
    const report = checkHeroSheet(sheet, result.meta as BaseExtractionMeta, tier);
    console.log(
      `  ${tier}: ${sheet.width}x${sheet.height}, ${statSync(paths.packedImage(tier)).size} bytes, ` +
        `${report.frames.length} frames, ${flaggedFrames(report).length} flagged, ${report.countMismatches.length} count mismatches`
    );
    if (overlayDir) {
      writeFileSync(join(overlayDir, `${id}_${tier}_overlay.png`), encodePngBuffer(renderHeroOverlay(sheet, report.frames, animationOrder)));
    }
  }
}
