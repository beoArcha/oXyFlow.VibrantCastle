import { spriteError } from "./errors";
import { tileListProblems } from "./tilesetNames";
import type { TilesetKind, TilesetSpriteDefinition } from "./tilesetTypes";

export type { PixelCanvas } from "./pixelCanvas";
export type { TilesetDrawFn, TilesetKind, TilesetSpriteDefinition } from "./tilesetTypes";

const ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const KINDS: readonly string[] = ["solid", "oneway"];

function shapeProblems(def: TilesetSpriteDefinition): string[] {
  const problems: string[] = [];
  if (typeof def.id !== "string" || !ID_PATTERN.test(def.id)) {
    problems.push(`id ${JSON.stringify(def.id)} must be snake_case (a-z, 0-9, _)`);
  }
  if (typeof def.description !== "string" || def.description.trim() === "") {
    problems.push("needs a one-sentence description");
  }
  if (!KINDS.includes(def.kind)) problems.push(`kind ${JSON.stringify(def.kind)} must be "solid" or "oneway"`);
  for (const tier of ["hi8bit", "hi16bit"] as const) {
    if (typeof def.draw?.[tier] !== "function") problems.push(`needs draw.${tier}(c, tile)`);
  }
  return problems;
}

function tileProblems(def: TilesetSpriteDefinition): string[] {
  const kindKnown = KINDS.includes(def.kind);
  if (!kindKnown || !Array.isArray(def.tiles)) return [];
  return tileListProblems(def.kind as TilesetKind, def.tiles);
}

/** Validates a tileset definition and returns it unchanged; every problem is reported at once. */
export function defineTileset(def: TilesetSpriteDefinition): TilesetSpriteDefinition {
  const problems = [...shapeProblems(def), ...tileProblems(def)];
  if (problems.length > 0) {
    const list = problems.map((problem) => `  - ${problem}`).join("\n");
    throw spriteError(`Tileset ${JSON.stringify(def.id)} is invalid:\n${list}`, { id: def.id, problems });
  }
  return def;
}
