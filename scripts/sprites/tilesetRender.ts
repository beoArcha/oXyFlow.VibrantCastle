import { spriteError } from "./errors";
import { PixelCanvas, TRANSPARENT } from "./pixelCanvas";
import { blit, type SheetImage } from "./render";
import { tileLayout } from "./tilesetLayout";
import { TILE_PIXELS, type TilesetSpriteDefinition } from "./tilesetTypes";
import { TIER_LABEL, type Tier } from "./types";

export interface RenderedTileset {
  sheet: SheetImage;
  /** Authored canvases in listing order; the identity check compares these, not the tier-snapped sheet. */
  canvases: PixelCanvas[];
}

function drawTile(def: TilesetSpriteDefinition, tier: Tier, name: string): PixelCanvas {
  const size = TILE_PIXELS[tier];
  const canvas = new PixelCanvas(size, size);
  try {
    def.draw[tier](canvas, name);
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw spriteError(
      `Tileset "${def.id}" ${TIER_LABEL[tier]} tile "${name}": ${reason}`,
      { id: def.id, tier, tile: name },
      cause,
    );
  }
  return canvas;
}

/** Draws every tile of one tier and packs them into a snapped sheet in listing order. */
export function renderTileset(def: TilesetSpriteDefinition, tier: Tier): RenderedTileset {
  const size = TILE_PIXELS[tier];
  const { columns, rows, cells } = tileLayout(def.tiles);
  const width = columns * size;
  const height = rows * size;
  const pixels = new Int32Array(width * height).fill(TRANSPARENT);
  const canvases = cells.map((cell) => {
    const canvas = drawTile(def, tier, cell.name);
    blit(canvas, pixels, width, cell.col * size, cell.row * size, tier);
    return canvas;
  });
  return { sheet: { tier, cell: size, cellHeight: size, columns, rows, width, height, pixels }, canvases };
}
