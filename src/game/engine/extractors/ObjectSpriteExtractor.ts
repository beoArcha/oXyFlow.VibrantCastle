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
import { defaultAtlasSlicingEngine } from "../meta/slicing/AtlasSlicingEngine";

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

    // If metadata explicitly defines a slicing strategy, use unified AtlasSlicingEngine
    if (meta.slicing && meta.slicing.method) {
      return this.extractFromSlicingEngine(meta, sheetW, sheetH, objectId);
    }

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

  /**
   * Slices interactive object animations using the unified AtlasSlicingEngine.
   */
  private extractFromSlicingEngine(
    meta: BaseExtractionMeta,
    sheetW: number,
    sheetH: number,
    objectId: string
  ): ExtractedObjectResult {
    const resolvedFrames = defaultAtlasSlicingEngine.resolveFrames(meta, sheetW, sheetH);
    const animations: Record<string, CharacterAnimationTrack> = {};
    const animDefinitions = meta.animations || {};

    const framesByTrack: Map<string, typeof resolvedFrames> = new Map();
    resolvedFrames.forEach((rf) => {
      const track = rf.trackName || "idle";
      if (!framesByTrack.has(track)) {
        framesByTrack.set(track, []);
      }
      framesByTrack.get(track)!.push(rf);
    });

    let defaultAnim = "idle";

    // 1. Process defined tracks
    for (const [animKey, animDef] of Object.entries(animDefinitions)) {
      const trackResolved = framesByTrack.get(animKey) || [];
      trackResolved.sort((a, b) => (a.frameIndex ?? 0) - (b.frameIndex ?? 0));

      const fps = animDef.fps ?? 8;
      const frameDuration = Math.max(1, Math.round(60 / fps));
      const loop = animDef.loop ?? true;
      const anchor = animDef.anchor || "bottom_center";

      const frames: CharacterAnimationFrame[] = trackResolved.map((rf) => {
        const originX = rf.pivot ? Math.round(rf.width * rf.pivot.x) : Math.round(rf.width * 0.5);
        const originY = rf.pivot
          ? Math.round(rf.height * rf.pivot.y)
          : anchor === "center"
          ? Math.round(rf.height * 0.5)
          : rf.height;

        return {
          x: rf.x,
          y: rf.y,
          w: rf.width,
          h: rf.height,
          originX,
          originY,
          isWide: false,
          widthMultiplier: 1,
        };
      });

      animations[animKey] = {
        name: animKey as any,
        frameCount: frames.length,
        frameDuration,
        loop,
        row: animDef.row ?? 0,
        fps,
        supportsWide: false,
        frames,
      };

      if (!defaultAnim) defaultAnim = animKey;
    }

    // 2. Also register any additional tracks found in resolvedFrames
    for (const [trackName, trackResolved] of framesByTrack.entries()) {
      if (!animations[trackName] && trackResolved.length > 0) {
        trackResolved.sort((a, b) => (a.frameIndex ?? 0) - (b.frameIndex ?? 0));
        const fps = 8;
        const frameDuration = Math.max(1, Math.round(60 / fps));
        const loop = true;

        const frames: CharacterAnimationFrame[] = trackResolved.map((rf) => {
          const originX = rf.pivot ? Math.round(rf.width * rf.pivot.x) : Math.round(rf.width * 0.5);
          const originY = rf.pivot ? Math.round(rf.height * rf.pivot.y) : rf.height;

          return {
            x: rf.x,
            y: rf.y,
            w: rf.width,
            h: rf.height,
            originX,
            originY,
            isWide: false,
            widthMultiplier: 1,
          };
        });

        animations[trackName] = {
          name: trackName as any,
          frameCount: frames.length,
          frameDuration,
          loop,
          row: trackResolved[0]?.row ?? 0,
          fps,
          supportsWide: false,
          frames,
        };

        if (!defaultAnim) defaultAnim = trackName;
      }
    }

    return {
      objectId,
      textureUrl: "",
      animations,
      defaultAnimation: defaultAnim || "idle",
      anchor: (meta.animations?.idle?.anchor as any) || "bottom_center",
    };
  }
}
