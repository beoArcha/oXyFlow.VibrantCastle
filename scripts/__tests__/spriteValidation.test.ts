import { describe, expect, it } from "bun:test";
import { compileEnemySprite } from "../sprites/compileSprite";
import { aSprite, drawBlock, hi8bitBlock, hi16bitBlock, VALID_BODY } from "../sprites/__fixtures__/minimalSprite";
import { defineEnemySprite } from "../sprites/defineEnemySprite";
import type { DrawFn } from "../sprites/types";

const compileOf = (overrides: Parameters<typeof aSprite>[0]) => () => compileEnemySprite(aSprite(overrides));

const hi16bitWith =
  (body: { x: number; y: number; w: number; h: number }): DrawFn =>
  (c, _anim, frame) =>
    drawBlock(c, body, 2, "#a99", frame);

const hi8bitWith =
  (body: { x: number; y: number; w: number; h: number }): DrawFn =>
  (c, _anim, frame) =>
    drawBlock(c, body, 1, "#888", frame);

describe("sprite validation errors", () => {
  it("should name tier, animation and frame when a frame is empty", () => {
    // Arrange
    const hi16bit: DrawFn = (c, anim, frame) => {
      if (anim === "move" && frame === 1) return;
      hi16bitBlock(c, anim, frame);
    };

    // Act
    const compile = compileOf({ draw: { hi8bit: hi8bitBlock, hi16bit } });

    // Assert
    expect(compile).toThrow(/hi-16bit animation "move" frame 1: frame is empty/);
  });

  it("should report the left edge when opaque pixels touch x = 0", () => {
    // Arrange
    const hi16bit = hi16bitWith({ ...VALID_BODY, x: 0 });

    // Act
    const compile = compileOf({ draw: { hi8bit: hi8bitBlock, hi16bit } });

    // Assert
    expect(compile).toThrow(/hi-16bit animation "idle" frame 0: opaque pixels touch the left edge/);
  });

  it("should report the right edge when opaque pixels touch the last column", () => {
    // Arrange
    const hi8bit: DrawFn = (c) => drawBlock(c, { x: 28, y: 18, w: 20, h: 30 }, 1, "#888");

    // Act
    const compile = compileOf({ draw: { hi8bit, hi16bit: hi16bitBlock } });

    // Assert
    expect(compile).toThrow(/hi-8bit animation "idle" frame 0: opaque pixels touch the right edge/);
  });

  it("should report the top edge when opaque pixels touch y = 0", () => {
    // Arrange
    const hi16bit = hi16bitWith({ x: 14, y: 0, w: 20, h: 30 });

    // Act
    const compile = compileOf({ draw: { hi8bit: hi8bitBlock, hi16bit } });

    // Assert
    expect(compile).toThrow(/hi-16bit animation "idle" frame 0: opaque pixels touch the top edge/);
  });

  it("should require feet on the bottom row when a ground sprite floats", () => {
    // Arrange
    const hi16bit = hi16bitWith({ x: 14, y: 14, w: 20, h: 30 });

    // Act
    const compile = compileOf({ draw: { hi8bit: hi8bitBlock, hi16bit } });

    // Assert
    expect(compile).toThrow(/hi-16bit animation "idle" frame 0: lowest opaque row is y=87 but a ground sprite must reach the bottom row y=95/);
  });

  it("should allow a floating body when the sprite is aerial", () => {
    // Arrange
    const hi16bit = hi16bitWith({ x: 14, y: 14, w: 20, h: 30 });
    const hi8bit = hi8bitWith({ x: 14, y: 7, w: 10, h: 15 });

    // Act
    const compiled = compileEnemySprite(aSprite({ kind: "aerial", draw: { hi8bit, hi16bit } }));

    // Assert
    expect(JSON.parse(compiled.metaJson).layout.origin.type).toBe("center");
  });

  it("should reject a hi-16bit frame when it equals the hi-8bit frame after scaling", () => {
    // Arrange
    const hi16bit: DrawFn = (c, _anim, frame) => drawBlock(c, VALID_BODY, 2, "#888", frame);

    // Act
    const compile = compileOf({ draw: { hi8bit: hi8bitBlock, hi16bit } });

    // Assert
    expect(compile).toThrow(/hi-16bit animation "idle" frame 0: identical to the hi-8bit frame after scaling/);
  });

  it("should reject a body that is much wider than the hitbox aspect", () => {
    // Arrange
    const hi16bit = hi16bitWith({ x: 8, y: 18, w: 32, h: 30 });

    // Act
    const compile = compileOf({ draw: { hi8bit: hi8bitBlock, hi16bit } });

    // Assert
    expect(compile).toThrow(/hi-16bit idle body is \d+x60 px \(aspect 1\.\d+\).*narrower or taller/);
  });

  it("should reject a short body when a tall ground hitbox leaves the cell mostly empty", () => {
    // Arrange
    const hi16bit = hi16bitWith({ x: 14, y: 33, w: 10, h: 15 });

    // Act
    const compile = compileOf({ draw: { hi8bit: hi8bitBlock, hi16bit } });

    // Assert
    expect(compile).toThrow(/hi-16bit idle body is only 30 px tall.*at least 53 px/);
  });

  it("should reject a narrow body when the hitbox is wider than tall", () => {
    // Arrange
    const wide = { hitbox: { width: 62, height: 42 } };
    const hi8bit = hi8bitWith({ x: 14, y: 28, w: 14, h: 20 });

    // Act
    const compile = compileOf({ ...wide, draw: { hi8bit, hi16bit: hi16bitBlock } });

    // Assert
    expect(compile).toThrow(/hi-8bit idle body is only \d+ px wide.*at least 27 px/);
  });

  it("should list every violation in one message when several rules fail", () => {
    // Arrange
    const hi16bit = hi16bitWith({ x: 0, y: 0, w: 20, h: 30 });

    // Act
    const compile = compileOf({ draw: { hi8bit: hi8bitBlock, hi16bit } });

    // Assert
    expect(compile).toThrow(/left edge[\s\S]*top edge[\s\S]*bottom row/);
  });

  it("should name the failing call when a draw function paints outside the cell", () => {
    // Arrange
    const hi8bit: DrawFn = (c) => c.rect(40, 10, 20, 5, "#fff");

    // Act
    const compile = compileOf({ draw: { hi8bit, hi16bit: hi16bitBlock } });

    // Assert
    expect(compile).toThrow(/hi-8bit animation "idle" frame 0: rect\(40, 10, 20, 5\)/);
  });
});

describe("sprite validation warnings", () => {
  it("should warn when the body centre drifts more than 10% of the cell between frames", () => {
    // Arrange
    const hi16bit: DrawFn = (c, _anim, frame) => drawBlock(c, { ...VALID_BODY, x: 14 + frame * 6 }, 2, "#a99");

    // Act
    const { warnings } = compileEnemySprite(aSprite({ draw: { hi8bit: hi8bitBlock, hi16bit } }));

    // Assert
    expect(warnings.some((w) => /hi-16bit animation "idle": body centre drifts/.test(w))).toBe(true);
  });

  it("should warn when two consecutive frames are identical", () => {
    // Arrange
    const hi16bit: DrawFn = (c) => drawBlock(c, VALID_BODY, 2, "#a99");

    // Act
    const { warnings } = compileEnemySprite(aSprite({ draw: { hi8bit: hi8bitBlock, hi16bit } }));

    // Assert
    expect(warnings.some((w) => /hi-16bit animation "idle" frame 1: identical to the previous frame/.test(w))).toBe(true);
  });

  it("should produce no warnings when frames move a little", () => {
    // Arrange
    const def = aSprite();

    // Act
    const { warnings } = compileEnemySprite(def);

    // Assert
    expect(warnings).toEqual([]);
  });
});

describe("defineEnemySprite shape checks", () => {
  it("should throw when a required animation is missing", () => {
    // Arrange
    const build = () =>
      defineEnemySprite({
        ...aSprite(),
        animations: { idle: { frames: 1, fps: 1, loop: true }, move: { frames: 1, fps: 1, loop: true } },
      } as never);

    // Act & Assert
    expect(build).toThrow(/must define animation "hit"/);
  });

  it("should throw when the id is not snake_case", () => {
    // Arrange
    const build = () => aSprite({ id: "Bad-Id" });

    // Act & Assert
    expect(build).toThrow(/snake_case/);
  });
});
