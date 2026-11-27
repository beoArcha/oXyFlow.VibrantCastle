import { spriteError } from "./errors";
import {
  ANIMATION_ORDER,
  HI8BIT_BASE_CELL,
  HI16BIT_BASE_CELL,
  type AnimationSpec,
  type EnemySpriteDefinition,
} from "./types";

export type { AnimationName, AnimationSpec, DrawFn, EnemySpriteDefinition, SpriteKind } from "./types";
export type { PixelCanvas } from "./pixelCanvas";

const ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const KINDS = ["ground", "aerial", "static"];

function checkAnimation(id: string, name: string, spec: AnimationSpec | undefined): void {
  if (!spec) return;
  const validFrames = Number.isInteger(spec.frames) && spec.frames >= 1 && spec.frames <= 32;
  if (!validFrames || !(spec.fps > 0) || typeof spec.loop !== "boolean") {
    throw spriteError(
      `Sprite "${id}" animation "${name}" must be { frames: integer 1..32, fps: number > 0, loop: boolean }.`,
      { id, name, spec },
    );
  }
}

/** Validates the shape of an enemy sprite definition and returns it unchanged. */
export function defineEnemySprite(def: EnemySpriteDefinition): EnemySpriteDefinition {
  const { id } = def;
  if (typeof id !== "string" || !ID_PATTERN.test(id)) {
    throw spriteError(`Sprite id ${JSON.stringify(id)} must be snake_case (a-z, 0-9, _).`, { id });
  }
  if (!KINDS.includes(def.kind)) {
    throw spriteError(`Sprite "${id}" kind must be "ground", "aerial" or "static".`, { id, kind: def.kind });
  }
  const { width, height } = def.hitbox ?? { width: 0, height: 0 };
  if (!(width > 0) || !(height > 0)) {
    throw spriteError(`Sprite "${id}" hitbox needs positive width and height.`, { id, hitbox: def.hitbox });
  }
  const cells = [HI8BIT_BASE_CELL, HI16BIT_BASE_CELL].map((base) => base * def.cellScale);
  if (!cells.every((cell) => Number.isInteger(cell) && cell >= 16)) {
    throw spriteError(`Sprite "${id}" cellScale ${def.cellScale} must give whole-pixel cells (try 1 or 1.5).`, { id });
  }
  for (const name of ANIMATION_ORDER) checkAnimation(id, name, def.animations[name]);
  for (const required of ["idle", "move", "hit"] as const) {
    if (!def.animations[required]) throw spriteError(`Sprite "${id}" must define animation "${required}".`, { id });
  }
  if (typeof def.draw?.hi8bit !== "function" || typeof def.draw?.hi16bit !== "function") {
    throw spriteError(`Sprite "${id}" needs both draw.hi8bit and draw.hi16bit functions.`, { id });
  }
  return def;
}
