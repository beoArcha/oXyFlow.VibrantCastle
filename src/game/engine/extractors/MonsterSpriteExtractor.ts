import {
  CharacterAnimationFrame,
  CharacterAnimationTrack,
  CharacterSpriteQuality,
} from "../spriteTypes";
import {
  BaseExtractionMeta,
  ISpriteSheetExtractor,
} from "./ISpriteSheetExtractor";

/**
 * Extractor for monsters, beasts, and quadruped animals.
 * Supports wider bounding hitboxes and floating/flying hover pivots.
 */
export class MonsterSpriteExtractor
  implements ISpriteSheetExtractor<BaseExtractionMeta, Record<string, CharacterAnimationTrack>>
{
  public readonly supportedEntityType = "monster";

  public extract(
    meta: BaseExtractionMeta,
    quality: CharacterSpriteQuality,
    dimensions: { width: number; height: number }
  ): Record<string, CharacterAnimationTrack> {
    const totalCols = meta.atlas?.columns ?? 8;
    const totalRows = meta.atlas?.rows ?? 4;
    const sheetW = dimensions.width || 1024;
    const sheetH = dimensions.height || 512;

    const baseColW = sheetW / totalCols;
    const baseRowH = sheetH / totalRows;

    const tracks: Record<string, CharacterAnimationTrack> = {};
    const animDefinitions = meta.animations || {};

    for (const [animKey, animDef] of Object.entries(animDefinitions)) {
      const row = animDef.row ?? 0;
      const frameCount = animDef.frames ?? 1;
      const fps = animDef.fps ?? 6;
      const frameDuration = Math.max(1, Math.round(60 / fps));
      const loop = animDef.loop ?? true;
      const slotSpans: number[] =
        animDef.slotSpan ||
        animDef.cells ||
        Array.from({ length: frameCount }, () => 1);

      let currentCol = 0;
      const frames: CharacterAnimationFrame[] = [];

      for (let f = 0; f < frameCount; f++) {
        const span = slotSpans[f] ?? 1;
        if (currentCol >= totalCols) break;

        const effectiveSpan = Math.min(span, totalCols - currentCol);
        const fx = Math.round(currentCol * baseColW);
        const fy = Math.round(row * baseRowH);
        const fw = Math.round(effectiveSpan * baseColW);
        const fh = Math.round(baseRowH);

        const originX = Math.round(fw * 0.5);
        const originY = animDef.anchor === "center" ? Math.round(fh * 0.5) : fh;

        frames.push({
          x: fx,
          y: fy,
          w: fw,
          h: fh,
          originX,
          originY,
          isWide: effectiveSpan > 1,
          widthMultiplier: effectiveSpan,
        });

        currentCol += effectiveSpan;
      }

      tracks[animKey] = {
        name: animKey as any,
        frameCount: frames.length,
        frameDuration,
        loop,
        row,
        fps,
        supportsWide: frames.some((f) => f.isWide),
        frames,
      };
    }

    return tracks;
  }
}
