import { spriteError } from "./errors";
import type { SheetImage } from "./render";
import { sheetToPng } from "./sheetPng";
import { buildPropMeta } from "./propMeta";
import { renderProp } from "./propRender";
import type { PropSpriteDefinition } from "./propTypes";
import { checkProp } from "./propValidate";

export interface CompiledProp {
  hi8bitPng: Uint8Array;
  hi16bitPng: Uint8Array;
  metaJson: string;
  warnings: string[];
  sheets: { hi8bit: SheetImage; hi16bit: SheetImage };
}

/** Renders, validates and serialises one prop without touching the disk. */
export function compileProp(def: PropSpriteDefinition): CompiledProp {
  const rendered = { hi8bit: renderProp(def, "hi8bit"), hi16bit: renderProp(def, "hi16bit") };
  const { problems, warnings } = checkProp(def, rendered);
  if (problems.length > 0) {
    const list = problems.map((problem) => `  - ${problem}`).join("\n");
    throw spriteError(`Prop "${def.id}" failed validation:\n${list}`, { id: def.id, problems });
  }
  const sheets = { hi8bit: rendered.hi8bit.sheet, hi16bit: rendered.hi16bit.sheet };
  return {
    hi8bitPng: sheetToPng(sheets.hi8bit),
    hi16bitPng: sheetToPng(sheets.hi16bit),
    metaJson: `${JSON.stringify(buildPropMeta(def), null, 2)}\n`,
    warnings,
    sheets,
  };
}
