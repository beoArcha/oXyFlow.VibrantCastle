import type { AssetQuality } from "../types";
import type { CharacterAssetManifest, CharacterProgressionTier, SpriteAtlasMap } from "./spriteTypes";
import { SpriteExtractorFactory } from "./extractors";

const QUALITIES: readonly AssetQuality[] = ["low", "mid", "high"];
const TIERS: readonly CharacterProgressionTier[] = [1, 2, 3];

/**
 * Runs the registered sprite extractors on a freshly loaded character texture to produce
 * pixel-perfect portrait moods and animation frames.
 */
export function extractCharacterTextures(
  manifests: Iterable<CharacterAssetManifest>,
  getSpriteMap: (id: string, quality: AssetQuality, tier: CharacterProgressionTier) => SpriteAtlasMap | null,
  imageUrl: string,
  img: HTMLImageElement
): void {
  for (const manifest of manifests) {
    if (manifest.portraitsGridUrl === imageUrl && manifest.meta) {
      const portraitExtractor = SpriteExtractorFactory.getExtractor("portrait");
      const extracted = portraitExtractor.extract(manifest.meta, "high", img);
      manifest.portraits = extracted.moods;
      manifest.portraitsGridCellWidth = extracted.cellWidth;
      manifest.portraitsGridCellHeight = extracted.cellHeight;
    }

    for (const quality of QUALITIES) {
      for (const tier of TIERS) {
        const sMap = getSpriteMap(manifest.id, quality, tier);
        // Pixel sheets are sliced by their compiled frame rects, never by scanning the painted meta
        if (!sMap || sMap.meta.art === "pixel" || sMap.meta.imageUrl !== imageUrl || !manifest.meta) continue;
        const humanoidExtractor = SpriteExtractorFactory.getExtractor("humanoid");
        const updatedTracks = humanoidExtractor.extract(manifest.meta, quality, img);
        sMap.animations = updatedTracks as unknown as typeof sMap.animations;
      }
    }
  }
}
