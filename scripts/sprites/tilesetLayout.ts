import { MAX_TILE_COLUMNS } from "./tilesetTypes";

export interface TileCell {
  name: string;
  col: number;
  row: number;
}

export interface TileLayout {
  columns: number;
  rows: number;
  cells: TileCell[];
}

/** Packs tiles row-major in listing order; the sheet is at most MAX_TILE_COLUMNS wide. */
export function tileLayout(tiles: readonly string[]): TileLayout {
  const columns = Math.min(MAX_TILE_COLUMNS, tiles.length);
  return {
    columns,
    rows: Math.ceil(tiles.length / columns),
    cells: tiles.map((name, index) => ({ name, col: index % columns, row: Math.floor(index / columns) })),
  };
}
