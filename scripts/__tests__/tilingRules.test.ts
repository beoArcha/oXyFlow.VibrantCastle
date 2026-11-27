import { describe, expect, it } from "bun:test";
import { decodePngBuffer } from "../lib/png";
import { compileTileset } from "../sprites/compileTileset";
import { defineTileset } from "../sprites/defineTileset";
import { renderTilingDemo } from "../sprites/tilingDemo";
import sampleTileset from "../sprites/__fixtures__/sample_tileset";
import { blockBaseNames, chooseTile, stripBaseNames } from "../sprites/tilingRules";

describe("thin platform strip rules", () => {
  it("should use left, middle and right ledge names when the strip is wider than one cell", () => {
    // Arrange & Act
    const names = stripBaseNames(4);

    // Assert
    expect(names).toEqual(["ledge_left", "ledge", "ledge", "ledge_right"]);
  });

  it("should use the middle ledge name only when the strip is one cell wide", () => {
    // Arrange & Act
    const names = stripBaseNames(1);

    // Assert
    expect(names).toEqual(["ledge"]);
  });
});

describe("tall platform block rules", () => {
  it("should place top, fill and bottom corners and edges when the block has several columns", () => {
    // Arrange & Act
    const rows = blockBaseNames(3, 3);

    // Assert
    expect(rows).toEqual([
      ["top_left", "top", "top_right"],
      ["left", "fill", "right"],
      ["bottom_left", "bottom", "bottom_right"],
    ]);
  });

  it("should use middle names only when the block is one cell wide", () => {
    // Arrange & Act
    const rows = blockBaseNames(1, 3);

    // Assert
    expect(rows).toEqual([["top"], ["fill"], ["bottom"]]);
  });
});

describe("variant choice", () => {
  it("should choose only the base or its numbered variants when a variant is listed", () => {
    // Arrange
    const tiles = ["fill", "fill_2", "fill_3"];
    const positions = Array.from({ length: 40 }, (_, index) => index);

    // Act
    const chosen = positions.map((col) => chooseTile(tiles, "fill", col, 1, 0, 0));

    // Assert
    expect(chosen.every((name) => tiles.includes(name))).toBe(true);
  });

  it("should return the same tile for the same position when called twice", () => {
    // Arrange
    const tiles = ["fill", "fill_2"];

    // Act
    const first = chooseTile(tiles, "fill", 3, 2, 96, 64);
    const second = chooseTile(tiles, "fill", 3, 2, 96, 64);

    // Assert
    expect(first).toBe(second);
  });

  it("should return the base tile when the base has no variants", () => {
    // Arrange
    const tiles = ["ledge_left", "ledge", "ledge_right"];

    // Act
    const chosen = chooseTile(tiles, "ledge_left", 7, 0, 0, 0);

    // Assert
    expect(chosen).toBe("ledge_left");
  });
});

describe("tiling demo sheet", () => {
  it("should size the solid demo as two panels of strip and block when the tileset is solid", () => {
    // Arrange
    const { sheets } = compileTileset(sampleTileset);

    // Act
    const png = decodePngBuffer(renderTilingDemo(sampleTileset, sheets));

    // Assert
    expect([png.width, png.height]).toEqual([672, 736]);
  });

  it("should size the oneway demo as two strips when the tileset is oneway", () => {
    // Arrange
    const ledges = defineTileset({
      id: "ledge_test",
      kind: "oneway",
      description: "A three-tile ledge.",
      tiles: ["ledge_left", "ledge", "ledge_right"],
      draw: {
        hi8bit: (c) => c.rect(0, 0, c.width, c.height / 2, "#999"),
        hi16bit: (c) => {
          c.rect(0, 0, c.width, c.height / 2, "#999");
          c.px(3, 2, "#333");
        },
      },
    });
    const { sheets } = compileTileset(ledges);

    // Act
    const png = decodePngBuffer(renderTilingDemo(ledges, sheets));

    // Assert
    expect([png.width, png.height]).toEqual([672, 192]);
  });
});
