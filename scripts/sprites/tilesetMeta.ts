import { tileLayout } from "./tilesetLayout";
import { TILE_PIXELS, WORLD_TILE, type TilesetKind, type TilesetSpriteDefinition } from "./tilesetTypes";

interface TileVariantMeta {
  file: string;
  tile: number;
}

export interface TilesetMeta {
  tilesetId: string;
  kind: TilesetKind;
  worldTile: number;
  columns: number;
  rows: number;
  variants: { low: TileVariantMeta; mid: TileVariantMeta };
  tiles: Record<string, { col: number; row: number }>;
}

export function buildTilesetMeta(def: TilesetSpriteDefinition): TilesetMeta {
  const { columns, rows, cells } = tileLayout(def.tiles);
  return {
    tilesetId: def.id,
    kind: def.kind,
    worldTile: WORLD_TILE,
    columns,
    rows,
    variants: {
      low: { file: `${def.id}_hi8bit.png`, tile: TILE_PIXELS.hi8bit },
      mid: { file: `${def.id}_hi16bit.png`, tile: TILE_PIXELS.hi16bit },
    },
    tiles: Object.fromEntries(cells.map((cell) => [cell.name, { col: cell.col, row: cell.row }])),
  };
}
