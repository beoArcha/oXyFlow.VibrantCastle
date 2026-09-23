import {
  CharacterAnimationTrack,
  CharacterAnimationFrame,
  CharacterSpriteQuality,
} from "../spriteTypes";
import {
  BaseExtractionMeta,
  ISpriteSheetExtractor,
} from "./ISpriteSheetExtractor";
import { PixelBoundsScanner } from "./PixelBoundsScanner";

/**
 * Extractor for humanoid characters with multiple animation rows and variable slot spans.
 * Features automated continuous island scan to prevent cell truncation and ensure rock-solid foot grounding.
 */
export class HumanoidSpriteExtractor
  implements ISpriteSheetExtractor<BaseExtractionMeta, Record<string, CharacterAnimationTrack>>
{
  public readonly supportedEntityType = "humanoid";

  public extract(
    meta: BaseExtractionMeta,
    quality: CharacterSpriteQuality,
    textureOrDimensions: { width: number; height: number } | HTMLImageElement
  ): Record<string, CharacterAnimationTrack> {
    const isImage = typeof HTMLImageElement !== "undefined" && textureOrDimensions instanceof HTMLImageElement;
    const sheetW = isImage ? (textureOrDimensions as HTMLImageElement).naturalWidth : textureOrDimensions.width || 1024;
    const sheetH = isImage ? (textureOrDimensions as HTMLImageElement).naturalHeight : textureOrDimensions.height || 683;

    const totalCols = meta.atlas?.columns ?? 12;
    const totalRows = meta.atlas?.rows ?? 8;

    const baseColW = sheetW / totalCols;
    const baseRowH = sheetH / totalRows;

    const variantScale = meta.variants?.[quality]?.scale ?? meta.scale ?? 1.0;
    const originNorm = meta.layout?.origin?.normalized ?? { x: 0.5, y: 1.0 };

    const tracks: Record<string, CharacterAnimationTrack> = {};
    const animDefinitions = meta.animations || {};

    const imageLoaded = isImage && (textureOrDimensions as HTMLImageElement).complete && (textureOrDimensions as HTMLImageElement).naturalWidth > 0;
    const rowBoundaries = imageLoaded
      ? PixelBoundsScanner.findRowBoundaries(textureOrDimensions as HTMLImageElement, totalRows)
      : Array.from({ length: totalRows + 1 }, (_, i) => Math.round(i * baseRowH));

    for (const [animKey, animDef] of Object.entries(animDefinitions)) {
      const row = Math.min(animDef.row ?? 0, Math.max(0, rowBoundaries.length - 2));
      const frameCount = animDef.frames ?? 1;
      const fps = animDef.fps ?? (animKey === "idle" ? 5 : animKey === "dash" ? 10 : 7);
      const frameDuration = Math.max(1, Math.round(60 / fps));
      const loop = animDef.loop ?? (animKey === "idle" || animKey === "run" || animKey === "crouch");

      // Resolve slot spans (1, 2, or 3 cells wide)
      const slotSpans: number[] =
        animDef.slotSpan ||
        animDef.cells ||
        Array.from({ length: frameCount }, () => 1);

      const y0 = rowBoundaries[row] !== undefined ? rowBoundaries[row] : Math.round(row * baseRowH);
      const y1 = rowBoundaries[row + 1] !== undefined ? rowBoundaries[row + 1] : Math.round((row + 1) * baseRowH);
      const rowBandHeight = Math.max(1, y1 - y0);
      const frames: CharacterAnimationFrame[] = [];

      const rowIslands = imageLoaded
        ? PixelBoundsScanner.scanRowIslands(textureOrDimensions as HTMLImageElement, y0, y1, 25, 8)
        : [];

      // If frameIndices or frameOffsets are specified (e.g. for crouch/sub-tracks), select them cleanly
      let selectedIslands = rowIslands;
      if (animDef.frameIndices && animDef.frameIndices.length > 0) {
        selectedIslands = animDef.frameIndices
          .map((idx) => rowIslands[idx])
          .filter((item): item is NonNullable<typeof item> => Boolean(item));
      } else if (animDef.frameOffset !== undefined) {
        selectedIslands = rowIslands.slice(animDef.frameOffset, animDef.frameOffset + frameCount);
      } else if (rowIslands.length > frameCount && frameCount > 0) {
        selectedIslands = rowIslands.slice(0, frameCount);
      }

      // Safe fallback for crouch if dedicated row not present in spritesheet
      if (selectedIslands.length === 0 && animKey === "crouch" && imageLoaded) {
        const jumpY0 = rowBoundaries[2] ?? Math.round(2 * baseRowH);
        const jumpY1 = rowBoundaries[3] ?? Math.round(3 * baseRowH);
        const jumpIslands = PixelBoundsScanner.scanRowIslands(textureOrDimensions as HTMLImageElement, jumpY0, jumpY1, 25, 8);
        if (jumpIslands.length >= 7) {
          selectedIslands = [jumpIslands[6], jumpIslands[7]];
        } else if (jumpIslands.length >= 1) {
          selectedIslands = [jumpIslands[jumpIslands.length - 1]];
        }
      }

      // If the row contains isolated distinct sprite islands, use them directly with registration
      if (selectedIslands.length > 0) {
        for (let i = 0; i < selectedIslands.length; i++) {
          const island = selectedIslands[i];
          const isWide = island.w > baseColW * 1.15;
          const originX = island.originX ?? Math.round(island.w * originNorm.x);
          const originY = island.originY ?? Math.round(island.h * originNorm.y);

          frames.push({
            x: island.x,
            y: island.y,
            w: island.w,
            h: island.h,
            originX,
            originY,
            isWide,
            widthMultiplier: isWide ? island.w / baseColW : 1,
          });
        }
      } else {
        // Fallback when image is not yet rendered to canvas
        let currentCol = animDef.frameOffset ?? 0;
        for (let f = 0; f < frameCount; f++) {
          const span = slotSpans[f] ?? 1;
          if (currentCol >= totalCols) break;

          const effectiveSpan = Math.min(span, totalCols - currentCol);
          const x0 = Math.round(currentCol * baseColW);
          const rawW = Math.round(effectiveSpan * baseColW);
          const rawH = rowBandHeight;

          frames.push({
            x: x0,
            y: y0,
            w: rawW,
            h: rawH,
            originX: Math.round(rawW * originNorm.x),
            originY: Math.round(rawH * originNorm.y),
            isWide: effectiveSpan > 1,
            widthMultiplier: effectiveSpan,
          });

          currentCol += effectiveSpan;
        }
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

    // Alias run <-> move
    if (tracks.run && !tracks.move) {
      tracks.move = { ...tracks.run, name: "move" as any };
    }
    if (tracks.move && !tracks.run) {
      tracks.run = { ...tracks.move, name: "run" as any };
    }

    return tracks;
  }
}

