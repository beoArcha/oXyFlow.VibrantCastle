import {
  CharacterAnimationFrame,
  CharacterAnimationTrack,
  CharacterSpriteQuality,
} from "../spriteTypes";
import {
  BaseExtractionMeta,
  ISpriteSheetExtractor,
} from "./ISpriteSheetExtractor";
import { defaultAtlasSlicingEngine } from "../meta/slicing/AtlasSlicingEngine";

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

    // If metadata explicitly defines a slicing strategy, use unified AtlasSlicingEngine
    if (meta.slicing && meta.slicing.method) {
      return this.extractFromSlicingEngine(meta, sheetW, sheetH, baseColW);
    }

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

  /**
   * Slices monster animations using the unified AtlasSlicingEngine.
   */
  private extractFromSlicingEngine(
    meta: BaseExtractionMeta,
    sheetW: number,
    sheetH: number,
    baseColW: number
  ): Record<string, CharacterAnimationTrack> {
    const resolvedFrames = defaultAtlasSlicingEngine.resolveFrames(meta, sheetW, sheetH);
    const tracks: Record<string, CharacterAnimationTrack> = {};
    const animDefinitions = meta.animations || {};

    const framesByTrack: Map<string, typeof resolvedFrames> = new Map();
    resolvedFrames.forEach((rf) => {
      const track = rf.trackName || "idle";
      if (!framesByTrack.has(track)) {
        framesByTrack.set(track, []);
      }
      framesByTrack.get(track)!.push(rf);
    });

    for (const [animKey, animDef] of Object.entries(animDefinitions)) {
      const trackResolved = framesByTrack.get(animKey) || [];
      trackResolved.sort((a, b) => (a.frameIndex ?? 0) - (b.frameIndex ?? 0));

      const fps = animDef.fps ?? 6;
      const frameDuration = Math.max(1, Math.round(60 / fps));
      const loop = animDef.loop ?? true;

      const frames: CharacterAnimationFrame[] = trackResolved.map((rf) => {
        const isWide = rf.width > baseColW * 1.15;
        const originX = rf.pivot ? Math.round(rf.width * rf.pivot.x) : Math.round(rf.width * 0.5);
        const originY = rf.pivot
          ? Math.round(rf.height * rf.pivot.y)
          : animDef.anchor === "center"
          ? Math.round(rf.height * 0.5)
          : rf.height;

        return {
          x: rf.x,
          y: rf.y,
          w: rf.width,
          h: rf.height,
          originX,
          originY,
          isWide,
          widthMultiplier: isWide ? rf.width / baseColW : 1,
        };
      });

      tracks[animKey] = {
        name: animKey as any,
        frameCount: frames.length,
        frameDuration,
        loop,
        row: animDef.row ?? 0,
        fps,
        supportsWide: frames.some((f) => f.isWide),
        frames,
      };
    }

    for (const [trackName, trackResolved] of framesByTrack.entries()) {
      if (!tracks[trackName] && trackResolved.length > 0) {
        trackResolved.sort((a, b) => (a.frameIndex ?? 0) - (b.frameIndex ?? 0));
        const fps = 6;
        const frameDuration = Math.max(1, Math.round(60 / fps));
        const loop = true;

        const frames: CharacterAnimationFrame[] = trackResolved.map((rf) => {
          const isWide = rf.width > baseColW * 1.15;
          const originX = rf.pivot ? Math.round(rf.width * rf.pivot.x) : Math.round(rf.width * 0.5);
          const originY = rf.pivot ? Math.round(rf.height * rf.pivot.y) : rf.height;

          return {
            x: rf.x,
            y: rf.y,
            w: rf.width,
            h: rf.height,
            originX,
            originY,
            isWide,
            widthMultiplier: isWide ? rf.width / baseColW : 1,
          };
        });

        tracks[trackName] = {
          name: trackName as any,
          frameCount: frames.length,
          frameDuration,
          loop,
          row: trackResolved[0]?.row ?? 0,
          fps,
          supportsWide: frames.some((f) => f.isWide),
          frames,
        };
      }
    }

    return tracks;
  }
}
