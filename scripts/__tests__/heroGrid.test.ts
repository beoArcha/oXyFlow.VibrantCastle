import { describe, expect, it } from "bun:test";
import { defineHeroSprite } from "../sprites/defineHeroSprite";
import { gridProblems, loadPackedGrid } from "../sprites/heroGrid";
import { frameColumn, heroCell, type HeroGrid } from "../sprites/heroTypes";
import { DEFAULT_HERO_OUT_DIR } from "../sprites/cli";
import { aHero, hi16bitBlock, hi8bitBlock, MINIMAL_GRID } from "../sprites/__fixtures__/minimalHero";

describe("hero grid derived from the packed meta", () => {
  it("should use 126x128 and 63x64 cells when deriving the valen grid", () => {
    // Arrange
    const grid = loadPackedGrid("valen", DEFAULT_HERO_OUT_DIR);

    // Act
    const cells = { hi16bit: heroCell(grid, "hi16bit"), hi8bit: heroCell(grid, "hi8bit") };

    // Assert
    expect(cells.hi16bit).toEqual({ width: 126, height: 128 });
    expect(cells.hi8bit).toEqual({ width: 63, height: 64 });
  });

  it("should round the aurelia height up to an even 144 px when deriving cells", () => {
    // Arrange
    const grid = loadPackedGrid("aurelia", DEFAULT_HERO_OUT_DIR);

    // Act
    const cells = { hi16bit: heroCell(grid, "hi16bit"), hi8bit: heroCell(grid, "hi8bit") };

    // Assert
    expect(cells.hi16bit).toEqual({ width: 124, height: 144 });
    expect(cells.hi8bit).toEqual({ width: 62, height: 72 });
  });

  it("should start each valen attack frame after the spans of the frames before it", () => {
    // Arrange
    const { animations } = loadPackedGrid("valen", DEFAULT_HERO_OUT_DIR);

    // Act
    const columns = animations.attack.cells.map((_, frame) => frameColumn(animations.attack, frame));

    // Assert
    expect(animations.attack.cells).toEqual([1, 2, 2, 2, 2, 3, 2]);
    expect(columns).toEqual([0, 1, 3, 5, 7, 9, 12]);
  });

  it("should start each aurelia run frame after the spans of the frames before it", () => {
    // Arrange
    const { animations } = loadPackedGrid("aurelia", DEFAULT_HERO_OUT_DIR);

    // Act
    const columns = animations.run.cells.map((_, frame) => frameColumn(animations.run, frame));

    // Assert
    expect(columns).toEqual([0, 1, 2, 3, 4, 6, 7, 9, 10, 11]);
  });

  it("should keep the row order and widen the sheet to the longest row when deriving the valen grid", () => {
    // Arrange & Act
    const grid = loadPackedGrid("valen", DEFAULT_HERO_OUT_DIR);

    // Assert
    expect(grid.ordering).toEqual(["idle", "run", "jump", "fall", "attack", "dash", "cast", "crouch"]);
    expect(grid.animations.cast.row).toBe(6);
    expect(grid.columns).toBe(14);
  });

  it("should report a missing packed meta by file name when the hero has no inline grid", () => {
    // Arrange
    const load = () => loadPackedGrid("nobody", DEFAULT_HERO_OUT_DIR);

    // Act & Assert
    expect(load).toThrow(/nobody_packed_meta\.json/);
  });
});

describe("hero grid validation", () => {
  const withIdle = (idle: HeroGrid["animations"][string]): HeroGrid => ({
    ...MINIMAL_GRID,
    animations: { ...MINIMAL_GRID.animations, idle },
  });

  it("should list a span count that differs from the frame count when the grid is checked", () => {
    // Arrange
    const grid = withIdle({ row: 0, frames: 3, fps: 4, loop: true, cells: [1, 1] });

    // Act
    const problems = gridProblems(grid);

    // Assert
    expect(problems.join("\n")).toMatch(/animation "idle" needs one positive integer cell span per frame/);
  });

  it("should list a row that spans more columns than the sheet has when the grid is checked", () => {
    // Arrange
    const grid = withIdle({ row: 0, frames: 3, fps: 4, loop: true, cells: [1, 1, 1] });

    // Act
    const problems = gridProblems(grid);

    // Assert
    expect(problems.join("\n")).toMatch(/animation "idle" spans 3 columns but the sheet has 2/);
  });

  it("should reject the definition when the inline grid is invalid", () => {
    // Arrange
    const grid = withIdle({ row: 0, frames: 2, fps: 4, loop: true, cells: [2, 1] });

    // Act
    const define = () => aHero({ grid });

    // Assert
    expect(define).toThrow(/frames must all span one cell/);
  });

  it("should reject a non snake_case id when defining a hero", () => {
    // Arrange
    const define = () =>
      defineHeroSprite({ id: "Valen", description: "x", draw: { hi8bit: hi8bitBlock, hi16bit: hi16bitBlock } });

    // Act & Assert
    expect(define).toThrow(/snake_case/);
  });

  it("should reject a hero that lacks a draw function for one tier", () => {
    // Arrange
    const define = () =>
      defineHeroSprite({
        id: "valen",
        description: "x",
        draw: { hi8bit: hi8bitBlock } as unknown as { hi8bit: typeof hi8bitBlock; hi16bit: typeof hi16bitBlock },
      });

    // Act & Assert
    expect(define).toThrow(/draw\.hi8bit and draw\.hi16bit/);
  });
});
