import { spriteError } from "./errors";
import {
  STRUCTURE_ANIMATION_ORDER,
  type StructureAnimationName,
  type StructureAnimationSpec,
  type StructureCellSize,
  type StructureSpriteDefinition,
} from "./structureTypes";

export { STRUCTURE_ANIMATION_ORDER } from "./structureTypes";
export type {
  RgbaFrameBuffer,
  StructureAnimationName,
  StructureAnimationSpec,
  StructureCellSize,
  StructureHighDrawFn,
  StructurePixelDrawFn,
  StructureSpriteDefinition,
} from "./structureTypes";

const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

function checkCell(id: string, tier: string, size: StructureCellSize | undefined): void {
  if (!size || !Number.isInteger(size.width) || !Number.isInteger(size.height) || size.width < 16 || size.height < 16) {
    throw spriteError(`Structure "${id}" ${tier} cellSize must be integers >= 16.`, { id, tier, size });
  }
}

function checkAnimation(id: string, name: string, spec: StructureAnimationSpec | undefined): void {
  if (!spec) {
    throw spriteError(`Structure "${id}" must define animation "${name}".`, { id, name });
  }
  const validFrames = Number.isInteger(spec.frames) && spec.frames >= 1 && spec.frames <= 32;
  if (!validFrames || !(spec.fps > 0) || typeof spec.loop !== "boolean") {
    throw spriteError(
      `Structure "${id}" animation "${name}" must be { frames: integer 1..32, fps: number > 0, loop: boolean }.`,
      { id, name, spec },
    );
  }
}

/** Validates a multi-tier structure sprite definition and returns it unchanged. */
export function defineStructureSprite<A extends string = StructureAnimationName>(
  def: StructureSpriteDefinition<A>,
): StructureSpriteDefinition<A> {
  const { id } = def;
  if (typeof id !== "string" || !ID_PATTERN.test(id)) {
    throw spriteError(`Structure id ${JSON.stringify(id)} must be snake_case (a-z, 0-9, _).`, { id });
  }
  if (!def.description || def.description.trim() === "") {
    throw spriteError(`Structure "${id}" needs a description.`, { id });
  }
  if (!(def.hitbox?.width > 0) || !(def.hitbox?.height > 0)) {
    throw spriteError(`Structure "${id}" hitbox needs positive width and height.`, { id });
  }
  checkCell(id, "hi8bit", def.cellSize?.hi8bit);
  checkCell(id, "hi16bit", def.cellSize?.hi16bit);
  checkCell(id, "high", def.cellSize?.high);

  const order = def.animationOrder ?? (STRUCTURE_ANIMATION_ORDER as readonly A[]);
  if (order.length === 0) {
    throw spriteError(`Structure "${id}" animationOrder must not be empty.`, { id });
  }
  for (const name of order) {
    checkAnimation(id, name, def.animations?.[name]);
  }
  if (typeof def.draw?.hi8bit !== "function" || typeof def.draw?.hi16bit !== "function") {
    throw spriteError(`Structure "${id}" needs draw.hi8bit and draw.hi16bit functions.`, { id });
  }
  if (!def.pngBacked && typeof def.draw?.high !== "function") {
    throw spriteError(`Structure "${id}" needs draw.high unless pngBacked is true.`, { id });
  }
  return def;
}
