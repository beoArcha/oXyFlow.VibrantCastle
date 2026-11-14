import { AssetError, ErrorCode } from "@lib/errors";

/**
 * Contract of `<id>_tiles_meta.json`, written by the tileset compiler (`scripts/sprites/tilesets`).
 * See `docs/manifesto/PARALLAX_AND_RENDERING.md` (platform tilesets).
 */
export type TilesetKind = "solid" | "oneway";

export interface TileCell {
  readonly col: number;
  readonly row: number;
}

export interface TilesetVariantMeta {
  readonly file: string;
  /** Tile size in sheet pixels. */
  readonly tile: number;
}

export interface TilesetMeta {
  readonly tilesetId: string;
  readonly kind: TilesetKind;
  /** Tile size in world units. */
  readonly worldTile: number;
  readonly columns: number;
  readonly rows: number;
  /** hi-8bit is `low`, hi-16bit is `mid`; either may be absent. */
  readonly variants: { readonly low?: TilesetVariantMeta; readonly mid?: TilesetVariantMeta };
  readonly tiles: Readonly<Record<string, TileCell>>;
  /** Base tile name to its cells: the base first, then `<base>_2`, `<base>_3`... in numeric order. */
  readonly choices: Readonly<Record<string, readonly TileCell[]>>;
}

export const REQUIRED_TILES: Readonly<Record<TilesetKind, readonly string[]>> = {
  solid: [
    "top_left", "top", "top_right",
    "left", "fill", "right",
    "bottom_left", "bottom", "bottom_right",
    "ledge_left", "ledge", "ledge_right",
  ],
  oneway: ["ledge_left", "ledge", "ledge_right"],
};

type Rec = Record<string, unknown>;

const isRecord = (value: unknown): value is Rec => typeof value === "object" && value !== null && !Array.isArray(value);
const isPositiveInt = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value > 0;
const isIndex = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;

function corrupted(tilesetId: string, reason: string): AssetError {
  return new AssetError(`Tileset meta '${tilesetId}' is invalid: ${reason}`, ErrorCode.ASSET_CORRUPTED, {
    details: { tilesetId, reason },
  });
}

function parseVariant(tilesetId: string, name: string, raw: unknown): TilesetVariantMeta {
  if (!isRecord(raw) || typeof raw.file !== "string" || raw.file.length === 0 || !isPositiveInt(raw.tile)) {
    throw corrupted(tilesetId, `variant '${name}' needs a file and an integer tile size`);
  }
  return { file: raw.file, tile: raw.tile };
}

const VARIANT_SUFFIX = /^(.+)_(\d+)$/;

function buildChoices(tiles: Record<string, TileCell>): Record<string, TileCell[]> {
  const extras: Record<string, { n: number; cell: TileCell }[]> = {};
  const choices: Record<string, TileCell[]> = {};
  for (const name of Object.keys(tiles)) {
    const match = VARIANT_SUFFIX.exec(name);
    if (match && match[1] in tiles) {
      (extras[match[1]] ??= []).push({ n: Number(match[2]), cell: tiles[name] });
    }
  }
  for (const name of Object.keys(tiles)) {
    const match = VARIANT_SUFFIX.exec(name);
    if (match && match[1] in tiles) continue;
    const more = (extras[name] ?? []).sort((a, b) => a.n - b.n).map((e) => e.cell);
    choices[name] = [tiles[name], ...more];
  }
  return choices;
}

/** Validates a tileset meta document. Throws an `AssetError` (ASSET_CORRUPTED) when it is not usable. */
export function parseTilesetMeta(raw: unknown): TilesetMeta {
  if (!isRecord(raw) || typeof raw.tilesetId !== "string" || raw.tilesetId.length === 0) {
    throw corrupted("<unknown>", "missing tilesetId");
  }
  const id = raw.tilesetId;
  if (raw.kind !== "solid" && raw.kind !== "oneway") throw corrupted(id, "kind must be 'solid' or 'oneway'");
  const kind: TilesetKind = raw.kind;
  if (!isPositiveInt(raw.worldTile) || !isPositiveInt(raw.columns) || !isPositiveInt(raw.rows)) {
    throw corrupted(id, "worldTile, columns and rows must be positive integers");
  }
  if (!isRecord(raw.variants)) throw corrupted(id, "variants is missing");
  const low = raw.variants.low === undefined ? undefined : parseVariant(id, "low", raw.variants.low);
  const mid = raw.variants.mid === undefined ? undefined : parseVariant(id, "mid", raw.variants.mid);
  if (!low && !mid) throw corrupted(id, "no low or mid variant");
  if (!isRecord(raw.tiles)) throw corrupted(id, "tiles is missing");

  const tiles: Record<string, TileCell> = {};
  for (const [name, cell] of Object.entries(raw.tiles)) {
    if (!isRecord(cell) || !isIndex(cell.col) || !isIndex(cell.row)) throw corrupted(id, `tile '${name}' needs col and row`);
    if (cell.col >= raw.columns || cell.row >= raw.rows) throw corrupted(id, `tile '${name}' is outside the grid`);
    tiles[name] = { col: cell.col, row: cell.row };
  }
  for (const name of REQUIRED_TILES[kind]) {
    if (!(name in tiles)) throw corrupted(id, `missing required tile '${name}' for kind '${kind}'`);
  }
  return {
    tilesetId: id,
    kind,
    worldTile: raw.worldTile,
    columns: raw.columns,
    rows: raw.rows,
    variants: { low, mid },
    tiles,
    choices: buildChoices(tiles),
  };
}
