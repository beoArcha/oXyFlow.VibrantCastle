import { describe, expect, it } from "bun:test";
import { compileHeroSprite } from "../sprites/compileHero";
import { DEFAULT_HERO_OUT_DIR } from "../sprites/cli";
import type { HeroDrawFn } from "../sprites/heroTypes";
import { aHero, drawBlock, hi16bitBlock, hi8bitBlock, VALID_BLOCK } from "../sprites/__fixtures__/minimalHero";

const compileOf = (overrides: Parameters<typeof aHero>[0]) => () =>
  compileHeroSprite(aHero(overrides), DEFAULT_HERO_OUT_DIR);

describe("hero validation errors", () => {
  it("should name tier, animation and frame when a frame is empty", () => {
    // Arrange
    const hi16bit: HeroDrawFn = (c, anim, frame, span) => {
      if (anim === "attack") return;
      hi16bitBlock(c, anim, frame, span);
    };

    // Act
    const compile = compileOf({ draw: { hi8bit: hi8bitBlock, hi16bit } });

    // Assert
    expect(compile).toThrow(/hi-16bit animation "attack" frame 0: frame is empty/);
  });

  it("should report feet off the floor when an idle frame does not reach the bottom row", () => {
    // Arrange
    const hi8bit: HeroDrawFn = (c) => drawBlock(c, { ...VALID_BLOCK, y: VALID_BLOCK.y - 2 }, 1, "#888");

    // Act
    const compile = compileOf({ draw: { hi8bit, hi16bit: hi16bitBlock } });

    // Assert
    expect(compile).toThrow(/hi-8bit animation "idle" frame 0: lowest opaque row is y=21 but a grounded animation must reach the bottom row y=23/);
  });

  it("should accept floating feet when the animation is a jump", () => {
    // Arrange & Act
    const compiled = compileHeroSprite(aHero(), DEFAULT_HERO_OUT_DIR);

    // Assert
    expect(compiled.warnings).toEqual([]);
  });

  it("should report the right edge of a wide slot when opaque pixels touch its last column", () => {
    // Arrange
    const hi8bit: HeroDrawFn = (c, anim, frame, span) => {
      if (anim !== "attack") return hi8bitBlock(c, anim, frame, span);
      drawBlock(c, { ...VALID_BLOCK, w: c.width - VALID_BLOCK.x }, 1, "#888");
    };

    // Act
    const compile = compileOf({ draw: { hi8bit, hi16bit: hi16bitBlock } });

    // Assert
    expect(compile).toThrow(/hi-8bit animation "attack" frame 0: opaque pixels touch the right edge/);
  });

  it("should report the left and top edge when opaque pixels touch x = 0 and y = 0", () => {
    // Arrange
    const hi16bit: HeroDrawFn = (c) => drawBlock(c, { x: 0, y: 0, w: 8, h: 24 }, 2, "#a99");

    // Act
    const compile = compileOf({ draw: { hi8bit: hi8bitBlock, hi16bit } });

    // Assert
    expect(compile).toThrow(/hi-16bit animation "idle" frame 0: opaque pixels touch the left edge/);
    expect(compile).toThrow(/hi-16bit animation "idle" frame 0: opaque pixels touch the top edge/);
  });

  it("should reject a hi-16bit frame that is the hi-8bit frame scaled by two", () => {
    // Arrange
    const hi16bit: HeroDrawFn = (c, anim, frame) =>
      drawBlock(c, { ...VALID_BLOCK, y: VALID_BLOCK.y + (anim === "jump" ? -4 : 0) }, 2, "#888", frame);

    // Act
    const compile = compileOf({ draw: { hi8bit: hi8bitBlock, hi16bit } });

    // Assert
    expect(compile).toThrow(/hi-16bit animation "idle" frame 1: identical to the hi-8bit frame after scaling/);
  });

  it("should reject an idle body below 55 % of the cell height", () => {
    // Arrange
    const hi8bit: HeroDrawFn = (c, anim, frame, span) => {
      if (anim !== "idle") return hi8bitBlock(c, anim, frame, span);
      drawBlock(c, { ...VALID_BLOCK, y: 14, h: 10 }, 1, "#888", frame);
    };

    // Act
    const compile = compileOf({ draw: { hi8bit, hi16bit: hi16bitBlock } });

    // Assert
    expect(compile).toThrow(/hi-8bit idle body is only 10 px tall; it must fill at least 14 px of the 24 px cell height/);
  });

  it("should list every problem at once when several frames are invalid", () => {
    // Arrange
    const hi16bit: HeroDrawFn = (c, anim, frame, span) => {
      if (anim === "jump") return;
      hi16bitBlock(c, anim, frame, span);
      if (anim === "idle" && frame === 1) c.clear(0, 40, 40, 8);
    };

    // Act
    const compile = compileOf({ draw: { hi8bit: hi8bitBlock, hi16bit } });

    // Assert
    expect(compile).toThrow(/animation "idle" frame 1: lowest opaque row[\s\S]*animation "jump" frame 0: frame is empty/);
  });

  it("should warn when two consecutive frames are identical", () => {
    // Arrange
    const still: HeroDrawFn = (c, anim, _frame, span) => hi8bitBlock(c, anim, 0, span);
    const stillDetailed: HeroDrawFn = (c, anim, _frame, span) => hi16bitBlock(c, anim, 0, span);

    // Act
    const { warnings } = compileHeroSprite(
      aHero({ draw: { hi8bit: still, hi16bit: stillDetailed } }),
      DEFAULT_HERO_OUT_DIR,
    );

    // Assert
    expect(warnings).toEqual([
      'hi-8bit animation "idle" frame 1: identical to the previous frame; animate something or lower the frame count.',
      'hi-16bit animation "idle" frame 1: identical to the previous frame; animate something or lower the frame count.',
    ]);
  });
});
