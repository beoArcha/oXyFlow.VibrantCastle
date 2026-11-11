import { spriteError } from "./errors";
import type { PixelCanvas } from "./pixelCanvas";

export type SpriteKind = "ground" | "aerial" | "static";
export type Tier = "nes" | "snes";
export type AnimationName = "idle" | "move" | "hit" | "attack" | "death";

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
  animations: {
    idle: AnimationSpec;
    move: AnimationSpec;
    hit: AnimationSpec;
    attack?: AnimationSpec;
    death?: AnimationSpec;
  };
  draw: { nes: DrawFn; snes: DrawFn };
}

export const NES_BASE_CELL = 48;
export const SNES_BASE_CELL = 96;

export function cellSize(def: EnemySpriteDefinition, tier: Tier): number {
  return (tier === "nes" ? NES_BASE_CELL : SNES_BASE_CELL) * def.cellScale;
}

export function definedAnimations(def: EnemySpriteDefinition): AnimationName[] {
  return ANIMATION_ORDER.filter((name) => def.animations[name] !== undefined);
}

export function specOf(def: EnemySpriteDefinition, name: AnimationName): AnimationSpec {
  const spec = def.animations[name];
  if (!spec) throw spriteError(`Sprite "${def.id}" has no animation "${name}".`, { id: def.id, name });
  return spec;
}
