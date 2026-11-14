import type { TilesetKind } from "../tilesetMeta";

const SOLID = [
  "top_left", "top", "top_right", "left", "fill", "right",
  "bottom_left", "bottom", "bottom_right", "ledge_left", "ledge", "ledge_right",
];
const ONEWAY = ["ledge_left", "ledge", "ledge_right"];

/** Inline tileset meta in the contract shape: 4 columns, tiles packed row-major in listing order. */
export function createTilesetMetaJson(
  tilesetId = "test_stone",
  kind: TilesetKind = "solid",
  extraTiles: readonly string[] = []
): Record<string, unknown> {
  const names = [...(kind === "solid" ? SOLID : ONEWAY), ...extraTiles];
  const columns = 4;
  const rows = Math.ceil(names.length / columns);
  const tiles: Record<string, { col: number; row: number }> = {};
  names.forEach((name, i) => {
    tiles[name] = { col: i % columns, row: Math.floor(i / columns) };
  });
  return {
    tilesetId,
    kind,
    worldTile: 32,
    columns,
    rows,
    variants: {
      low: { file: `${tilesetId}_hi8bit.png`, tile: 16 },
      mid: { file: `${tilesetId}_hi16bit.png`, tile: 32 },
    },
    tiles,
  };
}
