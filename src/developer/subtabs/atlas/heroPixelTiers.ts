import { buildHeroPixelSpriteMaps, discoverHeroPixelFiles, parseHeroPixelMeta } from "@game/engine/heroPixel";
import type { HeroPixelMeta, HeroPixelQuality, HeroPixelVariant } from "@game/engine/heroPixel";
import type { AtlasFileMap } from "@game/engine/atlas/atlasTypes";
import type { AtlasMetaDoc, AtlasPresetItem } from "./types";

/** Atlas Studio quality tier of a hero sheet: `low` = hi-8bit, `mid` = hi-16bit, `high` = painted. */
export type AtlasHeroTier = "low" | "mid" | "high";

export const ATLAS_HERO_TIER_ORDER: readonly AtlasHeroTier[] = ["low", "mid", "high"];

let cachedFiles: AtlasFileMap | null = null;

function defaultFiles(): AtlasFileMap {
  cachedFiles ??= discoverHeroPixelFiles();
  return cachedFiles;
}

function findMeta(files: AtlasFileMap, heroId: string): HeroPixelMeta | null {
  const suffix = `/${heroId}/${heroId}_pixel_meta.json`;
  for (const [path, raw] of Object.entries(files.metas)) {
    if (path.split("\\").join("/").endsWith(suffix)) return parseHeroPixelMeta(raw);
  }
  return null;
}

/**
 * Tiers selectable for a hero: hi-8bit / hi-16bit when compiled pixel sheets exist, plus the painted
 * tier. Empty when the hero has no pixel tier, so the toggle stays hidden.
 */
export function listHeroTiers(heroId: string, files: AtlasFileMap = defaultFiles()): AtlasHeroTier[] {
  const meta = findMeta(files, heroId);
  if (!meta) return [];
  const maps = buildHeroPixelSpriteMaps(heroId, files);
  const pixel = (["low", "mid"] as const).filter((q) => maps[q] !== undefined);
  return pixel.length === 0 ? [] : [...pixel, "high"];
}

function pixelMetaDoc(base: AtlasMetaDoc, meta: HeroPixelMeta, variant: HeroPixelVariant): AtlasMetaDoc {
  const animations: NonNullable<AtlasMetaDoc["animations"]> = {};
  for (const name of meta.grid.ordering) {
    const anim = meta.grid.animations[name];
    animations[name] = {
      row: anim.row,
      frames: anim.frames,
      fps: anim.fps,
      loop: anim.loop,
      slotSpan: [...anim.cells],
      cells: [...anim.cells],
      wide: anim.cells.some((span) => span > 1),
    };
  }
  const { cellWidth, cellHeight, scale } = variant;
  return {
    ...base,
    atlas: {
      ...base.atlas,
      columns: Math.round(variant.sheetWidth / cellWidth),
      rows: Math.round(variant.sheetHeight / cellHeight),
      cellWidth,
      cellHeight,
    },
    variants: { ...base.variants, high: { cellWidth, cellHeight, scale } },
    animations,
    // Picked up by useAtlasPresets, which slices by these tight rects instead of the grid.
    ...({ frameRects: variant.frameRects } as object),
  };
}

/**
 * Preset of one tier: the painted preset itself for `high` (or a hero without pixel art), otherwise the
 * compiled sheet with its pixel meta animations and `frameRects`.
 */
export function buildHeroTierPreset(
  base: AtlasPresetItem,
  tier: AtlasHeroTier,
  files: AtlasFileMap = defaultFiles()
): AtlasPresetItem {
  if (tier === "high") return base;
  const meta = findMeta(files, base.id);
  const map = buildHeroPixelSpriteMaps(base.id, files)[tier as HeroPixelQuality];
  const variant = meta?.variants[tier];
  if (!meta || !map || !variant) return base;
  return { ...base, imageSrc: map.meta.imageUrl, defaultMeta: pixelMetaDoc(base.defaultMeta, meta, variant) };
}
