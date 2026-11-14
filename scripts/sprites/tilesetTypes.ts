import type { PixelCanvas } from "./pixelCanvas";
import type { Tier } from "./types";

export type TilesetKind = "solid" | "oneway";

/** Draws one tile on a fresh transparent canvas of the tier's tile size. */
export type TilesetDrawFn = (c: PixelCanvas, tile: string) => void;

export interface TilesetSpriteDefinition {
  id: string;
  kind: TilesetKind;
  description: string;
  /** Tile names in sheet order (row-major); numbered variants and `support` are listed here too. */
  tiles: string[];
  draw: { hi8bit: TilesetDrawFn; hi16bit: TilesetDrawFn };
}

/** Tile edge in world units; the runtime draws hi-16bit tiles 1:1 and hi-8bit tiles 2x. */
export const WORLD_TILE = 32;

export const TILE_PIXELS: Readonly<Record<Tier, number>> = { hi8bit: 16, hi16bit: 32 };

export const MAX_TILE_COLUMNS = 8;
