import { spriteError } from "./errors";
import type { PixelCanvas } from "./pixelCanvas";

export type SpriteKind = "ground" | "aerial" | "static";
export type Tier = "hi8bit" | "hi16bit";

/** Human-readable tier names used in compiler messages and docs. */
export const TIER_LABEL: Readonly<Record<Tier, string>> = { hi8bit: "hi-8bit", hi16bit: "hi-16bit" };
export type AnimationName = "idle" | "move" | "hit" | "attack" | "death" | "fly" | "bestiary";

export const ANIMATION_ORDER: readonly AnimationName[] = ["idle", "move", "hit", "attack", "death"];

export interface AnimationSpec {
  frames: number;
  fps: number;
  loop: boolean;
}

export type DrawFn = (c: PixelCanvas, anim: AnimationName, frame: number) => void;

export interface EnemySpriteDefinition {
  id: string;
  kind: SpriteKind;
  description: string;
  hitbox: { width: number; height: number };
  cellScale: number;
  /** Optional custom row order for PNG-backed enemies whose meta uses non-default track names. */
  animationOrder?: readonly AnimationName[];
  /** Optional existing meta document to preserve while updating SVG variant entries. */
  baseMeta?: Record<string, unknown>;
  /** Optional state aliases merged onto baseMeta.states. */
  metaStates?: Record<string, { animation: string }>;
  animations: Partial<Record<AnimationName, AnimationSpec>>;
  draw: { hi8bit: DrawFn; hi16bit: DrawFn };
}

export const HI8BIT_BASE_CELL = 48;
export const HI16BIT_BASE_CELL = 96;

export function cellSize(def: EnemySpriteDefinition, tier: Tier): number {
  return (tier === "hi8bit" ? HI8BIT_BASE_CELL : HI16BIT_BASE_CELL) * def.cellScale;
}

export function definedAnimations(def: EnemySpriteDefinition): AnimationName[] {
  const order = def.animationOrder ?? ANIMATION_ORDER;
  return order.filter((name) => def.animations[name] !== undefined);
}

export function specOf(def: EnemySpriteDefinition, name: AnimationName): AnimationSpec {
  const spec = def.animations[name];
  if (!spec) throw spriteError(`Sprite "${def.id}" has no animation "${name}".`, { id: def.id, name });
  return spec;
}
