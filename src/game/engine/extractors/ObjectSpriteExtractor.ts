import {
  CharacterAnimationFrame,
  CharacterAnimationTrack,
  CharacterSpriteQuality,
} from "../spriteTypes";
import {
  BaseExtractionMeta,
  ExtractedObjectResult,
  ISpriteSheetExtractor,
} from "./ISpriteSheetExtractor";

/**
 * Extractor for environmental & interactive game objects (lamps, portals, switches, chests).
 * Supports cyclic idling, activation triggers, and customizable anchor pivots (center vs bottom_center).
 */
export class ObjectSpriteExtractor
  implements ISpriteSheetExtractor<BaseExtractionMeta, ExtractedObjectResult>
{
  public readonly supportedEntityType = "interactive_object";

  public extract(
    meta: BaseExtractionMeta,
    _quality: CharacterSpriteQuality,
    dimensions: { width: number; height: number }
  ): ExtractedObjectResult {
    const objectId = meta.objectId || meta.characterId || "prop";
    const totalCols = meta.atlas?.columns ?? 6;
    const totalRows = meta.atlas?.rows ?? 1;
    const sheetW = dimensions.width || 384;
    const sheetH = dimensions.height || 64;

    const baseColW = sheetW / totalCols;
    const baseRowH = sheetH / totalRows;

    const animations: Record<string, CharacterAnimationTrack> = {};
    const animDefinitions = meta.animations || {
      idle: { row: 0, frames: totalCols, fps: 8, loop: true },
    };

    let defaultAnim = "idle";

    for (const [animKey, animDef] of Object.entries(animDefinitions)) {
      const row = animDef.row ?? 0;
      const frameCount = animDef.frames ?? totalCols;
      const fps = animDef.fps ?? 8;
      const frameDuration = Math.max(1, Math.round(60 / fps));
      const loop = animDef.loop ?? true;
      const anchor = animDef.anchor || "bottom_center";

      const frames: CharacterAnimationFrame[] = [];

      for (let f = 0; f < frameCount; f++) {
        const fx = Math.round(f * baseColW);
        const fy = Math.round(row * baseRowH);
        const fw = Math.round(baseColW);
        const fh = Math.round(baseRowH);

        const originX = Math.round(fw * 0.5);
        const originY = anchor === "center" ? Math.round(fh * 0.5) : fh;

        frames.push({
          x: fx,
          y: fy,
          w: fw,
          h: fh,
          originX,
          originY,
          isWide: false,
          widthMultiplier: 1,
        });
      }

      animations[animKey] = {
        name: animKey as any,
        frameCount: frames.length,
        frameDuration,
        loop,
        row,
        fps,
        supportsWide: false,
        frames,
      };

      if (!defaultAnim) defaultAnim = animKey;
    }

    return {
      objectId,
      textureUrl: "",
      animations,
      defaultAnimation: defaultAnim,
      anchor: (meta.animations?.idle?.anchor as any) || "bottom_center",
    };
  }
}
