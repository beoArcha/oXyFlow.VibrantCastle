import { isHexColor } from "./colors";
import { spriteError } from "./errors";
import { MAX_PROP_FRAMES, PROP_ANCHORS, type PropSpriteDefinition } from "./propTypes";

export type { PixelCanvas } from "./pixelCanvas";
export { MAX_PROP_FRAMES, PROP_ANCHORS, propFrameSize } from "./propTypes";
export type { PropAnchor, PropDrawFn, PropGlow, PropSpriteDefinition } from "./propTypes";

const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

const isPositiveNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

function sizeProblems(size: unknown): string[] {
  const width = (size as { width?: unknown } | undefined)?.width;
  const height = (size as { height?: unknown } | undefined)?.height;
  const problems: string[] = [];
  for (const [axis, value] of [["width", width], ["height", height]] as const) {
    if (!isPositiveNumber(value) || !Number.isInteger(value) || value % 2 !== 0) {
      problems.push(`size.${axis} ${JSON.stringify(value)} must be a positive even whole number of world units`);
    }
  }
  return problems;
}

function glowProblems(def: PropSpriteDefinition): string[] {
  const glow = def.glow;
  if (glow === undefined) return [];
  const problems: string[] = [];
  if (!isHexColor(glow.color)) problems.push(`glow.color ${JSON.stringify(glow.color)} must be "#rgb" or "#rrggbb"`);
  if (!isPositiveNumber(glow.radius)) problems.push(`glow.radius ${JSON.stringify(glow.radius)} must be greater than 0`);
  const { width, height } = def.size ?? { width: 0, height: 0 };
  const inside = (value: unknown, limit: number): boolean => typeof value === "number" && value >= 0 && value < limit;
  if (!inside(glow.x, width)) problems.push(`glow.x ${JSON.stringify(glow.x)} must lie inside the sprite (0..${width - 1})`);
  if (!inside(glow.y, height)) problems.push(`glow.y ${JSON.stringify(glow.y)} must lie inside the sprite (0..${height - 1})`);
  if (glow.flicker !== undefined && typeof glow.flicker !== "boolean") problems.push("glow.flicker must be true or false");
  return problems;
}

function shapeProblems(def: PropSpriteDefinition): string[] {
  const problems: string[] = [];
  if (typeof def.id !== "string" || !ID_PATTERN.test(def.id)) {
    problems.push(`id ${JSON.stringify(def.id)} must be snake_case (a-z, 0-9, _)`);
  }
  if (typeof def.description !== "string" || def.description.trim() === "") {
    problems.push("needs a one-sentence description");
  }
  problems.push(...sizeProblems(def.size));
  if (!PROP_ANCHORS.includes(def.anchor)) {
    problems.push(`anchor ${JSON.stringify(def.anchor)} must be "bottom", "top" or "center"`);
  }
  if (!Number.isInteger(def.frames) || def.frames < 1 || def.frames > MAX_PROP_FRAMES) {
    problems.push(`frames ${JSON.stringify(def.frames)} must be a whole number from 1 to ${MAX_PROP_FRAMES}`);
  }
  if (!isPositiveNumber(def.fps)) problems.push(`fps ${JSON.stringify(def.fps)} must be greater than 0`);
  problems.push(...glowProblems(def));
  for (const tier of ["hi8bit", "hi16bit"] as const) {
    if (typeof def.draw?.[tier] !== "function") problems.push(`needs draw.${tier}(c, frame)`);
  }
  return problems;
}

/** Validates a prop definition and returns it unchanged; every problem is reported at once. */
export function defineProp(def: PropSpriteDefinition): PropSpriteDefinition {
  const problems = shapeProblems(def);
  if (problems.length > 0) {
    const list = problems.map((problem) => `  - ${problem}`).join("\n");
    throw spriteError(`Prop ${JSON.stringify(def.id)} is invalid:\n${list}`, { id: def.id, problems });
  }
  return def;
}
