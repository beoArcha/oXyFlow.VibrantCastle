import { CharacterPortraitMood, CharacterSpriteQuality } from "../spriteTypes";
import {
  BaseExtractionMeta,
  ExtractedPortraitResult,
  ISpriteSheetExtractor,
} from "./ISpriteSheetExtractor";
import { PixelBoundsScanner } from "./PixelBoundsScanner";
import { defaultAtlasSlicingEngine } from "../meta/slicing/AtlasSlicingEngine";

/**
 * Extractor for character portrait grids (e.g. 5x5 emotional expression matrices).
 * Uses automatic dynamic matrix scanning to extract perfectly framed faces with zero bleed.
 */
export class PortraitSpriteExtractor
  implements ISpriteSheetExtractor<BaseExtractionMeta, ExtractedPortraitResult>
{
  public readonly supportedEntityType = "portrait";

  public extract(
    meta: BaseExtractionMeta,
    _quality: CharacterSpriteQuality,
    textureOrDimensions: { width: number; height: number } | HTMLImageElement
  ): ExtractedPortraitResult {
    const characterId = meta.characterId || "character";
    const portraitsConfig = meta.portraits;

    const isImage = typeof HTMLImageElement !== "undefined" && textureOrDimensions instanceof HTMLImageElement;
    const sheetW = isImage ? (textureOrDimensions as HTMLImageElement).naturalWidth : textureOrDimensions.width || 1160;
    const sheetH = isImage ? (textureOrDimensions as HTMLImageElement).naturalHeight : textureOrDimensions.height || 1350;

    const cols = portraitsConfig?.columns ?? 5;
    const rows = portraitsConfig?.rows ?? 5;

    const cellW = sheetW / cols;
    const cellH = sheetH / rows;

    // If metadata explicitly defines a slicing strategy, use unified AtlasSlicingEngine
    if (meta.slicing && meta.slicing.method) {
      return this.extractFromSlicingEngine(meta, sheetW, sheetH, cols, rows, cellW, cellH, characterId);
    }

    const moodMap: Record<string, { x: number; y: number; width: number; height: number }> = {};
    const moods: CharacterPortraitMood[] = [];

    const mapMatrix = portraitsConfig?.map;
    const imageLoaded = isImage && (textureOrDimensions as HTMLImageElement).complete && (textureOrDimensions as HTMLImageElement).naturalWidth > 0;
    const detectedMatrix = imageLoaded
      ? PixelBoundsScanner.scanMatrixGrid(textureOrDimensions as HTMLImageElement, rows, cols, 25)
      : [];

    if (Array.isArray(mapMatrix)) {
      for (let r = 0; r < Math.min(rows, mapMatrix.length); r++) {
        const rowItems = mapMatrix[r];
        if (!Array.isArray(rowItems)) continue;

        for (let c = 0; c < Math.min(cols, rowItems.length); c++) {
          const moodName = String(rowItems[c] || `mood_${r}_${c}`).trim();
          if (!moodName) continue;

          let gx: number, gy: number, gw: number, gh: number;

          if (detectedMatrix[r] && detectedMatrix[r][c] && detectedMatrix[r][c].hasContent) {
            const box = detectedMatrix[r][c];
            gx = box.x;
            gy = box.y;
            gw = box.w;
            gh = box.h;
          } else {
            const rawX = c * cellW;
            const rawY = r * cellH;
            gx = Math.round(rawX + cellW * 0.05);
            gy = Math.round(rawY + cellH * 0.05);
            gw = Math.round(cellW * 0.9);
            gh = Math.round(cellH * 0.9);
          }

          moodMap[moodName] = { x: gx, y: gy, width: gw, height: gh };
          moods.push({
            id: moodName,
            mood: moodName,
            description: moodName.replace(/_/g, " "),
            name: moodName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            row: r,
            col: c,
            gridX: gx,
            gridY: gy,
            gridWidth: gw,
            gridHeight: gh,
          });
        }
      }
    }

    return {
      characterId,
      gridUrl: "",
      columns: cols,
      rows,
      cellWidth: Math.round(cellW),
      cellHeight: Math.round(cellH),
      moods,
      moodMap,
    };
  }

  /**
   * Slices emotional portrait matrix using the unified AtlasSlicingEngine.
   */
  private extractFromSlicingEngine(
    meta: BaseExtractionMeta,
    sheetW: number,
    sheetH: number,
    cols: number,
    rows: number,
    cellW: number,
    cellH: number,
    characterId: string
  ): ExtractedPortraitResult {
    const resolvedFrames = defaultAtlasSlicingEngine.resolveFrames(meta, sheetW, sheetH);
    const moodMap: Record<string, { x: number; y: number; width: number; height: number }> = {};
    const moods: CharacterPortraitMood[] = [];
    const mapMatrix = meta.portraits?.map;

    if (Array.isArray(mapMatrix)) {
      for (let r = 0; r < Math.min(rows, mapMatrix.length); r++) {
        const rowItems = mapMatrix[r];
        if (!Array.isArray(rowItems)) continue;

        for (let c = 0; c < Math.min(cols, rowItems.length); c++) {
          const moodName = String(rowItems[c] || `mood_${r}_${c}`).trim();
          if (!moodName) continue;

          // Match by id (moodName), or row/col, or index
          const rf =
            resolvedFrames.find((f) => f.id === moodName) ||
            resolvedFrames.find((f) => f.row === r && f.col === c) ||
            resolvedFrames[r * cols + c];

          const gx = rf ? rf.x : Math.round(c * cellW + cellW * 0.05);
          const gy = rf ? rf.y : Math.round(r * cellH + cellH * 0.05);
          const gw = rf ? rf.width : Math.round(cellW * 0.9);
          const gh = rf ? rf.height : Math.round(cellH * 0.9);

          moodMap[moodName] = { x: gx, y: gy, width: gw, height: gh };
          moods.push({
            id: moodName,
            mood: moodName,
            description: moodName.replace(/_/g, " "),
            name: moodName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            row: r,
            col: c,
            gridX: gx,
            gridY: gy,
            gridWidth: gw,
            gridHeight: gh,
          });
        }
      }
    } else {
      // If no matrix map defined, map resolved frames directly
      resolvedFrames.forEach((rf, idx) => {
        const moodName = rf.id || `mood_${idx}`;
        moodMap[moodName] = { x: rf.x, y: rf.y, width: rf.width, height: rf.height };
        moods.push({
          id: moodName,
          mood: moodName,
          description: moodName.replace(/_/g, " "),
          name: moodName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          row: rf.row ?? Math.floor(idx / cols),
          col: rf.col ?? (idx % cols),
          gridX: rf.x,
          gridY: rf.y,
          gridWidth: rf.width,
          gridHeight: rf.height,
        });
      });
    }

    return {
      characterId,
      gridUrl: "",
      columns: cols,
      rows,
      cellWidth: Math.round(cellW),
      cellHeight: Math.round(cellH),
      moods,
      moodMap,
    };
  }
}

