import {
  CharacterAssetManifest,
  CharacterProgressionTier,
  CharacterTierManifest,
  SpriteAtlasMap,
  AnimationName,
  SpriteAnimationTrack,
  SpriteInset,
  CharacterPortraitMood,
} from "./spriteTypes";
import { AssetQuality } from "../types";
import { SpriteExtractorFactory } from "./extractors";

// Import Vite-bundled character assets from src/assets/characters (strictly immutable source)
import valenMainPng from "@assets/characters/valen/valen_main.png";
import valenPortraitsPng from "@assets/characters/valen/valen_portraits.png";
import valenLowPng from "@assets/characters/valen/valen_level_1_low.png";
import valenMidPng from "@assets/characters/valen/valen_level_1_mid.png";
import valenHighPng from "@assets/characters/valen/valen_level_1_high.png";
import valenMetaJson from "@assets/characters/valen/valen_meta.json";

import aureliaMainPng from "@assets/characters/aurelia/aurelia_main.png";
import aureliaPortraitsPng from "@assets/characters/aurelia/aurelia_portraits.png";
import aureliaLowPng from "@assets/characters/aurelia/aurelia_level_1_low.png";
import aureliaMidPng from "@assets/characters/aurelia/aurelia_level_1_mid.png";
import aureliaHighPng from "@assets/characters/aurelia/aurelia_level_1_high.png";
import aureliaMetaJson from "@assets/characters/aurelia/aurelia_meta.json";

interface ICharacterVariantLike {
  scale?: number;
  cellWidth?: number;
  cellHeight?: number;
}

/**
 * Resolves exact atlas sheet dimensions based on bundled spritesheet asset characteristics
 */
function getAtlasDimensions(
  characterId: string,
  quality: AssetQuality,
  metaJson: Record<string, unknown>
): { cellWidth: number; cellHeight: number; sheetWidth: number; sheetHeight: number; scale: number } {
  const variants = metaJson.variants as Record<string, ICharacterVariantLike> | undefined;
  const variant = variants?.[quality] || variants?.mid;
  const scale = variant?.scale ?? (quality === "low" ? 0.67 : quality === "high" ? 1.5 : 1);

  if (characterId === "valen") {
    if (quality === "high") {
      return { cellWidth: 128, cellHeight: 128, sheetWidth: 1536, sheetHeight: 1024, scale: 1.5 };
    } else if (quality === "low") {
      return { cellWidth: 64, cellHeight: 64, sheetWidth: 768, sheetHeight: 512, scale: 0.67 };
    } else {
      return { cellWidth: 1024 / 12, cellHeight: 683 / 8, sheetWidth: 1024, sheetHeight: 683, scale: 1.0 };
    }
  } else if (characterId === "aurelia") {
    if (quality === "low") {
      return { cellWidth: 687 / 12, cellHeight: 573 / 8, sheetWidth: 687, sheetHeight: 573, scale: 0.67 };
    } else {
      return { cellWidth: 1374 / 12, cellHeight: 1145 / 8, sheetWidth: 1374, sheetHeight: 1145, scale: quality === "high" ? 1.5 : 1.0 };
    }
  }

  const defaultCellSize = quality === "low" ? 64 : quality === "high" ? 128 : 96;
  const cellWidth = variant?.cellWidth ?? defaultCellSize;
  const cellHeight = variant?.cellHeight ?? defaultCellSize;
  return {
    cellWidth,
    cellHeight,
    sheetWidth: cellWidth * 12,
    sheetHeight: cellHeight * 8,
    scale,
  };
}

/**
 * Builds a SpriteAtlasMap directly using the SpriteExtractorFactory.
 */
function buildSpriteMapFromMeta(
  characterId: string,
  metaJson: Record<string, unknown>,
  quality: AssetQuality,
  imageUrl: string,
  tier: CharacterProgressionTier = 1
): SpriteAtlasMap {
  const variants = metaJson.variants as Record<string, ICharacterVariantLike> | undefined;
  const variant = variants?.[quality] || variants?.mid;
  const { cellWidth, cellHeight, sheetWidth, sheetHeight, scale } = getAtlasDimensions(
    characterId,
    quality,
    metaJson
  );

  const inset: SpriteInset = { top: 0, bottom: 0, left: 0, right: 0 };
  const innerPadding = 0;
  const characterSize = cellHeight;
  const originX = Math.round(cellWidth * 0.5);
  const originY = cellHeight;

  // Extract animation tracks via SpriteExtractorFactory
  const extractedTracks = SpriteExtractorFactory.extract(
    { ...metaJson, characterId },
    quality,
    { width: sheetWidth, height: sheetHeight }
  );

  const animations = extractedTracks as unknown as Record<AnimationName, SpriteAnimationTrack>;

  return {
    meta: {
      characterId,
      quality,
      tier,
      imageUrl,
      sheetWidth,
      sheetHeight,
      cellWidth,
      cellHeight,
      inset,
      innerPadding,
      characterSize,
      scale,
      originX,
      originY,
      offsetX: 0,
      offsetY: 0,
    },
    animations,
  };
}

function buildTierManifest(
  _characterId: string,
  tier: CharacterProgressionTier,
  tierName: string,
  title: string,
  mainPortraitUrl: string,
  portraitsGridUrl: string,
  spriteMaps: Record<AssetQuality, SpriteAtlasMap>
): CharacterTierManifest {
  return {
    tier,
    tierName,
    title,
    portraitUrl: mainPortraitUrl,
    portraitThumbUrl: mainPortraitUrl,
    portraitsGridUrl,
    spriteMaps,
  };
}

/**
 * Valen - Master Duelist & Arcanist manifest definition.
 */
const valenSpriteMaps: Record<AssetQuality, SpriteAtlasMap> = {
  low: buildSpriteMapFromMeta("valen", valenMetaJson, "low", valenLowPng, 1),
  mid: buildSpriteMapFromMeta("valen", valenMetaJson, "mid", valenMidPng, 1),
  high: buildSpriteMapFromMeta("valen", valenMetaJson, "high", valenHighPng, 1),
};

export const VALEN_TIER_1 = buildTierManifest(
  "valen",
  1,
  "Novice Swordsman",
  "Adept Szkarłatnego Ostrza",
  valenMainPng,
  valenPortraitsPng,
  valenSpriteMaps
);
export const VALEN_TIER_2 = buildTierManifest(
  "valen",
  2,
  "Battle Sage",
  "Szkarłatny Mistrz Szermierki",
  valenMainPng,
  valenPortraitsPng,
  valenSpriteMaps
);
export const VALEN_TIER_3 = buildTierManifest(
  "valen",
  3,
  "Master Arcanist",
  "Mistrz Astralnego Ostrza",
  valenMainPng,
  valenPortraitsPng,
  valenSpriteMaps
);

const valenPortraitsExtracted = SpriteExtractorFactory.getExtractor("portrait").extract(
  valenMetaJson,
  "high",
  { width: 1161, height: 1354 }
);

export const VALEN_MANIFEST: CharacterAssetManifest = {
  id: "valen",
  name: "Valen",
  title: "Szkarłatny Szermierz i Uczony",
  portraitUrl: valenMainPng,
  portraitThumbUrl: valenMainPng,
  portraitsGridUrl: valenPortraitsPng,
  portraitsGridCellWidth: valenPortraitsExtracted.cellWidth,
  portraitsGridCellHeight: valenPortraitsExtracted.cellHeight,
  portraitsGridColumns: valenPortraitsExtracted.columns,
  portraitsGridRows: valenPortraitsExtracted.rows,
  portraitsGridSpacing: 0,
  portraits: valenPortraitsExtracted.moods,
  spriteMaps: valenSpriteMaps,
  tiers: {
    1: VALEN_TIER_1,
    2: VALEN_TIER_2,
    3: VALEN_TIER_3,
  },
  meta: valenMetaJson,
};

/**
 * Aurelia - Shadow Weaver & Guardian manifest definition.
 */
const aureliaSpriteMaps: Record<AssetQuality, SpriteAtlasMap> = {
  low: buildSpriteMapFromMeta("aurelia", aureliaMetaJson, "low", aureliaLowPng, 1),
  mid: buildSpriteMapFromMeta("aurelia", aureliaMetaJson, "mid", aureliaMidPng, 1),
  high: buildSpriteMapFromMeta("aurelia", aureliaMetaJson, "high", aureliaHighPng, 1),
};

const aureliaPortraitsExtracted = SpriteExtractorFactory.getExtractor("portrait").extract(
  aureliaMetaJson,
  "high",
  { width: 1175, height: 1339 }
);

export const AURELIA_TIER_1 = buildTierManifest(
  "aurelia",
  1,
  "Shadow Apprentice",
  "Uczennica Płomienia Cienia",
  aureliaMainPng,
  aureliaPortraitsPng,
  aureliaSpriteMaps
);
export const AURELIA_TIER_2 = buildTierManifest(
  "aurelia",
  2,
  "Adept Riftblade",
  "Strażniczka Cienia i Szczelin",
  aureliaMainPng,
  aureliaPortraitsPng,
  aureliaSpriteMaps
);
export const AURELIA_TIER_3 = buildTierManifest(
  "aurelia",
  3,
  "Void Arcanist",
  "Mistrzyni Kosmicznej Próżni",
  aureliaMainPng,
  aureliaPortraitsPng,
  aureliaSpriteMaps
);

export const AURELIA_MANIFEST: CharacterAssetManifest = {
  id: "aurelia",
  name: "Aurelia",
  title: "Strażniczka Cienia i Szczelin",
  portraitUrl: aureliaMainPng,
  portraitThumbUrl: aureliaMainPng,
  portraitsGridUrl: aureliaPortraitsPng,
  portraitsGridCellWidth: aureliaPortraitsExtracted.cellWidth,
  portraitsGridCellHeight: aureliaPortraitsExtracted.cellHeight,
  portraitsGridColumns: aureliaPortraitsExtracted.columns,
  portraitsGridRows: aureliaPortraitsExtracted.rows,
  portraitsGridSpacing: 0,
  portraits: aureliaPortraitsExtracted.moods,
  spriteMaps: aureliaSpriteMaps,
  tiers: {
    1: AURELIA_TIER_1,
    2: AURELIA_TIER_2,
    3: AURELIA_TIER_3,
  },
  meta: aureliaMetaJson,
};

export const CHARACTER_MANIFESTS: Record<string, CharacterAssetManifest> = {
  valen: VALEN_MANIFEST,
  aurelia: AURELIA_MANIFEST,
};
