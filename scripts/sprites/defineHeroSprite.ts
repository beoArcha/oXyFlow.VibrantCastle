import { spriteError } from "./errors";
import { assertGrid } from "./heroGrid";
import type { HeroSpriteDefinition } from "./heroTypes";

export type { HeroAnimationGrid, HeroDrawFn, HeroGrid, HeroSpriteDefinition } from "./heroTypes";
export type { PixelCanvas } from "./pixelCanvas";

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
  if (typeof def.draw?.hi8bit !== "function" || typeof def.draw?.hi16bit !== "function") {
    throw spriteError(`Hero "${id}" needs both draw.hi8bit and draw.hi16bit functions.`, { id });
  }
  if (def.grid) assertGrid(id, def.grid);
  return def;
}
