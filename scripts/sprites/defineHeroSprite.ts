import { spriteError } from "./errors";
import { assertGrid } from "./heroGrid";
import type { HeroSpriteDefinition } from "./heroTypes";

export type { HeroAnimationGrid, HeroDrawFn, HeroGrid, HeroSpriteDefinition } from "./heroTypes";
export type { PixelCanvas } from "./pixelCanvas";

function assertPaintedSource(id: string, def: HeroSpriteDefinition): void {
  const { source, draw } = def;
  if (source?.kind !== "painted") throw spriteError(`Hero "${id}": source.kind must be "painted".`, { id });
  const { hi8bit, hi16bit } = source.colors ?? {};
  if (![hi8bit, hi16bit].every((n) => Number.isInteger(n) && n >= 2 && n <= 256)) {
    throw spriteError(`Hero "${id}": source.colors needs integer palette sizes from 2 to 256 for hi8bit and hi16bit.`, { id });
  }
  if (source.dither !== undefined && source.dither !== false) {
    throw spriteError(`Hero "${id}": dithering is not implemented, leave source.dither unset or false.`, { id });
  }
  for (const tier of ["hi8bit", "hi16bit"] as const) {
    if (draw?.[tier] !== undefined && typeof draw[tier] !== "function") {
      throw spriteError(`Hero "${id}": draw.${tier} must be a function.`, { id, tier });
    }
  }
}

const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

/** Validates the shape of a hero sprite definition and returns it unchanged. */
export function defineHeroSprite(def: HeroSpriteDefinition): HeroSpriteDefinition {
  const { id } = def;
  if (typeof id !== "string" || !ID_PATTERN.test(id)) {
    throw spriteError(`Sprite id ${JSON.stringify(id)} must be snake_case (a-z, 0-9, _).`, { id });
  }
  if (typeof def.description !== "string" || def.description.trim() === "") {
    throw spriteError(`Hero "${id}" needs a one-sentence description.`, { id });
  }
  if (def.source) assertPaintedSource(id, def);
  else if (typeof def.draw?.hi8bit !== "function" || typeof def.draw?.hi16bit !== "function") {
    throw spriteError(`Hero "${id}" needs both draw.hi8bit and draw.hi16bit functions (or a painted source).`, { id });
  }
  if (def.grid) assertGrid(id, def.grid);
  return def;
}
