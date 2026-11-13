import {
  AnimationName,
  CharacterAssetManifest,
  CharacterPortraitMood,
  SpriteAtlasMap,
  SpriteFrame,
  SpriteSheetTexture,
} from "./spriteTypes";
import { PixelBoundsScanner } from "./extractors";

/** Number of animation rows of a painted sheet; its row height is the unit of the on-screen scale. */
const PAINTED_SHEET_ROWS = 8;

export interface ResolvedFrameResult {
  texture: SpriteSheetTexture | null;
  /** Source rectangle and feet origin in `texture` pixels. */
  frame: SpriteFrame | null;
  /** Height in `texture` pixels of one painted `mid` row (the on-screen scale reference); 0 without a texture. */
  rowHeight: number;
}

export interface ResolvedPortrait {
  texture: HTMLImageElement | null;
  imageUrl: string;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  isMain: boolean;
  moodId?: string;
  description?: string;
}

/**
 * Resolves a character portrait and sub-rectangle coordinates:
 * - If mood is omitted, "main", or not found: uses *_main.png (full main portrait)
 * - If mood matches an expression in character metadata: slices from *_portraits.png (mood face)
 */
export function resolveCharacterPortrait(
  manifest: CharacterAssetManifest,
  moodId: string | undefined,
  getTexture: (url: string) => HTMLImageElement | null,
  ensureTextureLoading: (url: string) => void
): ResolvedPortrait {
  if (!moodId || moodId === "main") {
    return createMainPortraitFallback(manifest, getTexture, ensureTextureLoading);
  }

  const moodObj: CharacterPortraitMood | undefined = manifest.portraits.find(
    (p) => p.id === moodId || p.mood === moodId
  );

  if (!moodObj) {
    return createMainPortraitFallback(manifest, getTexture, ensureTextureLoading);
  }

  const gridUrl = manifest.portraitsGridUrl;
  const texture = getTexture(gridUrl);
  if (!texture) {
    ensureTextureLoading(gridUrl);
  }

  const cols = manifest.portraitsGridColumns || 5;
  const rows = manifest.portraitsGridRows || 5;
  const cellBaseW = manifest.portraitsGridCellWidth || 232;
  const cellBaseH = manifest.portraitsGridCellHeight || 270;

  let sx = 0;
  let sy = 0;
  let sw = cellBaseW;
  let sh = cellBaseH;

  if (typeof moodObj.gridX === "number" && typeof moodObj.gridWidth === "number" && moodObj.gridWidth > 0) {
    sx = moodObj.gridX;
    sy = moodObj.gridY ?? 0;
    sw = moodObj.gridWidth;
    sh = moodObj.gridHeight ?? cellBaseH;
  } else if (texture && texture.complete && texture.naturalWidth > 0) {
    const rawW = texture.naturalWidth / cols;
    const rawH = texture.naturalHeight / rows;
    const box = PixelBoundsScanner.scanImageRegion(
      texture,
      moodObj.col * rawW,
      moodObj.row * rawH,
      rawW,
      rawH,
      25
    );
    if (box.hasContent) {
      sx = box.x;
      sy = box.y;
      sw = box.w;
      sh = box.h;
    } else {
      sx = Math.round(moodObj.col * rawW + rawW * 0.08);
      sy = Math.round(moodObj.row * rawH + rawH * 0.1);
      sw = Math.round(rawW * 0.84);
      sh = Math.round(rawH * 0.82);
    }
  } else {
    sx = Math.round(moodObj.col * cellBaseW + cellBaseW * 0.08);
    sy = Math.round(moodObj.row * cellBaseH + cellBaseH * 0.1);
    sw = Math.round(cellBaseW * 0.84);
    sh = Math.round(cellBaseH * 0.82);
  }

  return {
    texture,
    imageUrl: gridUrl,
    sx,
    sy,
    sw,
    sh,
    isMain: false,
    moodId: moodObj.id,
    description: moodObj.description,
  };
}

function createMainPortraitFallback(
  manifest: CharacterAssetManifest,
  getTexture: (url: string) => HTMLImageElement | null,
  ensureTextureLoading: (url: string) => void
): ResolvedPortrait {
  const texture = getTexture(manifest.portraitUrl);
  if (!texture) {
    ensureTextureLoading(manifest.portraitUrl);
  }
  return {
    texture,
    imageUrl: manifest.portraitUrl,
    sx: 0,
    sy: 0,
    sw: texture?.naturalWidth || 1024,
    sh: texture?.naturalHeight || 1536,
    isMain: true,
  };
}

interface ScaledFrame {
  readonly textureWidth: number;
  readonly textureHeight: number;
  readonly frame: SpriteFrame;
}

/** Scaled copies by source frame, so a sheet that differs from its nominal size allocates once per frame. */
const scaledFrames = new WeakMap<SpriteFrame, ScaledFrame>();

/**
 * Dynamically adapts sprite frame bounding box if the loaded sheet resolution
 * differs from the nominal sheet dimensions defined in metadata (painted PNGs
 * resized by the bundler, pixel SVG sheets rasterised at an integer scale).
 */
export function adaptFrameResolution(
  baseFrame: SpriteFrame,
  texture: { readonly width: number; readonly height: number } | null,
  nominalSheetWidth?: number,
  nominalSheetHeight?: number
): SpriteFrame {
  if (!texture || texture.width <= 0 || texture.height <= 0) return baseFrame;

  const natW = texture.width;
  const natH = texture.height;
  const sheetW = nominalSheetWidth || natW;
  const sheetH = nominalSheetHeight || natH;

  if (Math.abs(natW - sheetW) <= 1 && Math.abs(natH - sheetH) <= 1) {
    return baseFrame;
  }

  const cached = scaledFrames.get(baseFrame);
  if (cached && cached.textureWidth === natW && cached.textureHeight === natH) return cached.frame;

  const scaleX = natW / sheetW;
  const scaleY = natH / sheetH;

  const frame: SpriteFrame = {
    x: baseFrame.x * scaleX,
    y: baseFrame.y * scaleY,
    w: baseFrame.w * scaleX,
    h: baseFrame.h * scaleY,
    originX: baseFrame.originX * scaleX,
    originY: baseFrame.originY * scaleY,
    isWide: baseFrame.isWide,
    widthMultiplier: baseFrame.widthMultiplier,
  };
  scaledFrames.set(baseFrame, { textureWidth: natW, textureHeight: natH, frame });
  return frame;
}

function resolveRowHeight(spriteMap: SpriteAtlasMap, texture: SpriteSheetTexture): number {
  const { art, referenceRowHeight, sheetHeight } = spriteMap.meta;
  if (art === "pixel" && referenceRowHeight && sheetHeight > 0) {
    return referenceRowHeight * (texture.height / sheetHeight);
  }
  return texture.height / PAINTED_SHEET_ROWS;
}

/**
 * Resolves frame metadata and scaled resolution for character animations.
 */
export function resolveAnimationFrame(
  spriteMap: SpriteAtlasMap | null | undefined,
  animName: AnimationName,
  frameIndex: number,
  getSheet: (map: SpriteAtlasMap) => SpriteSheetTexture | null,
  ensureSheetLoading: (map: SpriteAtlasMap) => void
): ResolvedFrameResult {
  if (!spriteMap) return { texture: null, frame: null, rowHeight: 0 };

  const resolvedName =
    animName === "move" && !spriteMap.animations.move
      ? "run"
      : animName === "run" && !spriteMap.animations.run
      ? "move"
      : animName;

  const animTrack = spriteMap.animations[resolvedName] || spriteMap.animations.idle;
  const safeIdx = Math.abs(frameIndex) % Math.max(1, animTrack.frameCount);
  const baseFrame = animTrack.frames[safeIdx] || animTrack.frames[0];
  const texture = getSheet(spriteMap);

  if (!texture) {
    ensureSheetLoading(spriteMap);
  }

  const rowHeight = texture ? resolveRowHeight(spriteMap, texture) : 0;
  if (!baseFrame) return { texture, frame: null, rowHeight };

  const adapted = adaptFrameResolution(
    baseFrame,
    texture,
    spriteMap.meta.sheetWidth,
    spriteMap.meta.sheetHeight
  );

  return { texture, frame: adapted, rowHeight };
}
