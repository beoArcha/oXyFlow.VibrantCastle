import { defineEnemySprite } from "../defineEnemySprite";
import type { PixelCanvas } from "../pixelCanvas";
import type { DrawFn, EnemySpriteDefinition } from "../types";

interface BodyShape {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Fills one rectangle; `scale` multiplies every coordinate (1 = hi-8bit cell, 2 = hi-16bit cell). */
export function drawBlock(c: PixelCanvas, body: BodyShape, scale: number, color: string, frame = 0): void {
  c.rect((body.x + frame) * scale, body.y * scale, body.w * scale, body.h * scale, color);
}

/** Valid 20x30 ground block in hi-8bit units: feet on the bottom row, aspect 0.67, frames shift by 1 px. */
export const VALID_BODY: BodyShape = { x: 14, y: 18, w: 20, h: 30 };

export const hi8bitBlock: DrawFn = (c, _anim, frame) => drawBlock(c, VALID_BODY, 1, "#888", frame);
export const hi16bitBlock: DrawFn = (c, _anim, frame) => drawBlock(c, VALID_BODY, 2, "#a99", frame);

/** Smallest definition that compiles; override single fields to build a failing case. */
export function aSprite(overrides: Partial<EnemySpriteDefinition> = {}): EnemySpriteDefinition {
  return defineEnemySprite({
    id: "test_block",
    kind: "ground",
    description: "Minimal block used by compiler tests.",
    hitbox: { width: 42, height: 62 },
    cellScale: 1,
    animations: {
      idle: { frames: 2, fps: 4, loop: true },
      move: { frames: 2, fps: 8, loop: true },
      hit: { frames: 1, fps: 10, loop: false },
    },
    draw: { hi8bit: hi8bitBlock, hi16bit: hi16bitBlock },
    ...overrides,
  });
}
