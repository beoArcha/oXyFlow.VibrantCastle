import type { TilesetKind } from "./tilesetTypes";

const SOLID_TILES: readonly string[] = [
  "top_left", "top", "top_right",
  "left", "fill", "right",
  "bottom_left", "bottom", "bottom_right",
  "ledge_left", "ledge", "ledge_right",
];

const ONEWAY_TILES: readonly string[] = ["ledge_left", "ledge", "ledge_right", "support"];

const REQUIRED: Readonly<Record<TilesetKind, readonly string[]>> = {
  solid: SOLID_TILES,
  oneway: ["ledge_left", "ledge", "ledge_right"],
};

const ALLOWED: Readonly<Record<TilesetKind, readonly string[]>> = {
  solid: SOLID_TILES,
  oneway: ONEWAY_TILES,
};

const NUMBERED = /^(.+)_(\d+)$/;

export interface ParsedTileName {
  base: string;
  /** Variant number (`fill_2` -> 2); null for a base tile. */
  variant: number | null;
}

export function parseTileName(name: string): ParsedTileName {
  const match = NUMBERED.exec(name);
  if (!match) return { base: name, variant: null };
  return { base: match[1], variant: Number(match[2]) };
}

/** Every problem with a tile list, one message each; empty when the list is valid. */
export function tileListProblems(kind: TilesetKind, tiles: readonly string[]): string[] {
  const bases = new Set(tiles.filter((name) => parseTileName(name).variant === null));
  const duplicates = new Set(tiles.filter((name, index) => tiles.indexOf(name) !== index));
  const nameProblems = tiles.flatMap((name) => nameProblem(kind, bases, name));
  const missing = REQUIRED[kind].filter((name) => !tiles.includes(name));
  return [
    ...[...duplicates].map((name) => `tile "${name}" is listed more than once`),
    ...nameProblems,
    ...missing.map((name) => `missing required ${kind} tile "${name}"`),
  ];
}

function nameProblem(kind: TilesetKind, bases: ReadonlySet<string>, name: string): string[] {
  const { base, variant } = parseTileName(name);
  if (variant === null) {
    return ALLOWED[kind].includes(name) ? [] : [`tile "${name}" is not a ${kind} tile name (allowed: ${ALLOWED[kind].join(", ")})`];
  }
  if (!ALLOWED[kind].includes(base)) return [`variant "${name}" extends "${base}", which is not a ${kind} tile`];
  if (!bases.has(base)) return [`variant "${name}" needs its base tile "${base}" in the tile list`];
  if (variant < 2) return [`variant "${name}" must be numbered from 2 (the base is variant 1)`];
  return [];
}

/** Tile names that a numbered variant of `base` may take, in listing order. */
export function variantsOf(tiles: readonly string[], base: string): string[] {
  return tiles.filter((name) => name !== base && parseTileName(name).base === base);
}
