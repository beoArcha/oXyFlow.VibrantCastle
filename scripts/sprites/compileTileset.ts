import { spriteError } from "./errors";
import type { SheetImage } from "./render";
import { sheetToPng } from "./sheetPng";
import { buildTilesetMeta } from "./tilesetMeta";
import { renderTileset } from "./tilesetRender";
import type { TilesetSpriteDefinition } from "./tilesetTypes";
import { checkTileset } from "./tilesetValidate";

export interface CompiledTileset {
  hi8bitPng: Uint8Array;
  hi16bitPng: Uint8Array;
  metaJson: string;
  warnings: string[];
  sheets: { hi8bit: SheetImage; hi16bit: SheetImage };
}

/** Renders, validates and serialises one tileset without touching the disk. */
export function compileTileset(def: TilesetSpriteDefinition): CompiledTileset {
  const rendered = { hi8bit: renderTileset(def, "hi8bit"), hi16bit: renderTileset(def, "hi16bit") };
  const { problems, warnings } = checkTileset(def, rendered);
  if (problems.length > 0) {
    const list = problems.map((problem) => `  - ${problem}`).join("\n");
    throw spriteError(`Tileset "${def.id}" failed validation:\n${list}`, { id: def.id, problems });
  }
  const sheets = { hi8bit: rendered.hi8bit.sheet, hi16bit: rendered.hi16bit.sheet };
  return {
    hi8bitPng: sheetToPng(sheets.hi8bit),
    hi16bitPng: sheetToPng(sheets.hi16bit),
    metaJson: `${JSON.stringify(buildTilesetMeta(def), null, 2)}\n`,
    warnings,
    sheets,
  };
}
