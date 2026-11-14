import type { AssetQuality } from "../../types";
import { assetsLogger } from "../../logger/gameLogger";
import type { AtlasFileMap } from "../atlas/atlasTypes";
import type {
  AnimationName,
  CharacterProgressionTier,
  SpriteAnimationTrack,
  SpriteAtlasMap,
  SpriteFrame,
} from "../spriteTypes";
import { parseHeroPixelMeta, type HeroPixelMeta, type HeroPixelVariant } from "./heroPixelMeta";

export type HeroPixelQuality = Extract<AssetQuality, "low" | "mid">;

const PIXEL_QUALITIES: readonly HeroPixelQuality[] = ["low", "mid"];

function frameSlot(cells: readonly number[], frame: number): { column: number; span: number } {
  let column = 0;
  for (let i = 0; i < frame; i++) column += cells[i] ?? 1;
  return { column, span: cells[frame] ?? 1 };
}

/**
 * Slices one animation by the compiled frame rects. The frame is the tight opaque rect; its origin is
 * the feet: bottom of the rect (like the painted island bottom) and the body column of the slot's first
 * cell, so wide frames reach to the right of the body exactly like the painted wide frames.
 */
function buildTrack(name: string, meta: HeroPixelMeta, variant: HeroPixelVariant): SpriteAnimationTrack {
  const anim = meta.grid.animations[name];
  const frames: SpriteFrame[] = [];
  const { cellWidth, cellHeight } = variant;
  const feetInCell = meta.originX * cellWidth;

  for (let f = 0; f < anim.frames; f++) {
    const { column, span } = frameSlot(anim.cells, f);
    const slotX = column * cellWidth;
    const rect = variant.frameRects[`${name}_${f}`] ?? {
      x: slotX,
      y: anim.row * cellHeight,
      width: span * cellWidth,
      height: cellHeight,
    };
    frames.push({
      x: rect.x,
      y: rect.y,
      w: rect.width,
      h: rect.height,
      originX: slotX + feetInCell - rect.x,
      originY: rect.height,
      isWide: span > 1,
      widthMultiplier: span,
    });
  }

  return {
    name: name as AnimationName,
    frameCount: frames.length,
    frameDuration: Math.max(1, Math.round(60 / anim.fps)),
    loop: anim.loop,
    row: anim.row,
    fps: anim.fps,
    supportsWide: frames.some((frame) => frame.isWide === true),
    frames,
  };
}

/** Builds the hero sprite map of one pixel tier (`low` = hi-8bit, `mid` = hi-16bit) from its meta. */
export function buildHeroPixelSpriteMap(
  meta: HeroPixelMeta,
  quality: HeroPixelQuality,
  imageUrl: string,
  tier: CharacterProgressionTier = 1
): SpriteAtlasMap | null {
  const variant = meta.variants[quality];
  if (!variant) return null;

  const tracks: Record<string, SpriteAnimationTrack> = {};
  for (const name of meta.grid.ordering) tracks[name] = buildTrack(name, meta, variant);
  if (tracks.run && !tracks.move) tracks.move = { ...tracks.run, name: "move" };
  if (tracks.move && !tracks.run) tracks.run = { ...tracks.move, name: "run" };

  return {
    meta: {
      characterId: meta.characterId,
      quality,
      tier,
      imageUrl,
      sheetWidth: variant.sheetWidth,
      sheetHeight: variant.sheetHeight,
      cellWidth: variant.cellWidth,
      cellHeight: variant.cellHeight,
      inset: { top: 0, bottom: 0, left: 0, right: 0 },
      innerPadding: 0,
      characterSize: variant.cellHeight,
      scale: variant.scale,
      originX: Math.round(variant.cellWidth * meta.originX),
      originY: variant.cellHeight,
      offsetX: 0,
      offsetY: 0,
      art: "pixel",
      referenceRowHeight: meta.grid.packedCell.height * variant.scale,
      columns: meta.grid.columns,
    },
    animations: tracks as unknown as Record<AnimationName, SpriteAnimationTrack>,
  };
}

function findByPath<T>(files: Readonly<Record<string, T>>, suffix: string): T | undefined {
  for (const [path, value] of Object.entries(files)) {
    if (path.replace(/\\/g, "/").endsWith(suffix)) return value;
  }
  return undefined;
}

/**
 * Pixel tiers of one hero found in the discovered files: `low` when `<id>_pixel_meta.json` and the
 * hi-8bit PNG exist, `mid` when it and the hi-16bit PNG exist. Missing or broken files give no entry,
 * so the caller keeps the painted tier for it.
 */
export function buildHeroPixelSpriteMaps(
  characterId: string,
  files: AtlasFileMap,
  tier: CharacterProgressionTier = 1
): Partial<Record<HeroPixelQuality, SpriteAtlasMap>> {
  const result: Partial<Record<HeroPixelQuality, SpriteAtlasMap>> = {};
  const raw = findByPath(files.metas, `/${characterId}/${characterId}_pixel_meta.json`);
  if (raw === undefined) return result;

  const meta = parseHeroPixelMeta(raw);
  if (!meta) {
    assetsLogger.warn(`Pixel meta of hero '${characterId}' is invalid, keeping painted tiers`);
    return result;
  }

  for (const quality of PIXEL_QUALITIES) {
    const variant = meta.variants[quality];
    if (!variant) continue;
    const url = findByPath(files.images, `/${characterId}/${variant.file}`);
    if (url === undefined) continue;
    const map = buildHeroPixelSpriteMap(meta, quality, url, tier);
    if (map) result[quality] = map;
  }
  return result;
}

/**
 * Hero sprite maps for every quality: pixel tiers where the compiled art exists, painted otherwise.
 * `high` is always the painted map.
 */
export function composeHeroSpriteMaps(
  pixel: Partial<Record<HeroPixelQuality, SpriteAtlasMap>>,
  painted: Record<AssetQuality, () => SpriteAtlasMap>
): Record<AssetQuality, SpriteAtlasMap> {
  return {
    low: pixel.low ?? painted.low(),
    mid: pixel.mid ?? painted.mid(),
    high: painted.high(),
  };
}
