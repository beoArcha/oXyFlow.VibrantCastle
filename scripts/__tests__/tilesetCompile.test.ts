import { describe, expect, it } from "bun:test";
import { decodePngBuffer } from "../lib/png";
import { compileTileset } from "../sprites/compileTileset";
import { defineTileset, type PixelCanvas, type TilesetSpriteDefinition } from "../sprites/defineTileset";
import sampleTileset from "../sprites/__fixtures__/sample_tileset";

const SOLID_TILES = [
  "top_left", "top", "top_right",
  "left", "fill", "right",
  "bottom_left", "bottom", "bottom_right",
  "ledge_left", "ledge", "ledge_right",
];

const solidFill = (c: PixelCanvas) => c.rect(0, 0, c.width, c.height, "#777");
const topHalfFill = (c: PixelCanvas) => c.rect(0, 0, c.width, c.height / 2, "#999");
const topHalfFillDetailed = (c: PixelCanvas) => {
  topHalfFill(c);
  c.px(3, 2, "#333");
};

function solidWith(draw: (c: PixelCanvas, tile: string) => void): TilesetSpriteDefinition {
  return defineTileset({
    id: "stone_test",
    kind: "solid",
    description: "A test stone.",
    tiles: [...SOLID_TILES],
    draw: { hi8bit: draw, hi16bit: draw },
  });
}

function thrownMessage(action: () => unknown): string {
  try {
    action();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return "";
}

describe("sample tileset compilation", () => {
  it("should compile without warnings when using the worked example", () => {
    // Arrange & Act
    const { warnings } = compileTileset(sampleTileset);

    // Assert
    expect(warnings).toEqual([]);
  });

  it("should write the meta with the tier files, world tile and grid when compiled", () => {
    // Arrange & Act
    const meta = JSON.parse(compileTileset(sampleTileset).metaJson);

    // Assert
    expect(meta).toMatchObject({
      tilesetId: "sample_tileset",
      kind: "solid",
      worldTile: 32,
      columns: 8,
      rows: 2,
      variants: {
        low: { file: "sample_tileset_hi8bit.png", tile: 16 },
        mid: { file: "sample_tileset_hi16bit.png", tile: 32 },
      },
    });
  });

  it("should place tiles row-major in listing order when compiled", () => {
    // Arrange & Act
    const { tiles } = JSON.parse(compileTileset(sampleTileset).metaJson);

    // Assert
    expect(tiles).toEqual({
      top_left: { col: 0, row: 0 },
      top: { col: 1, row: 0 },
      top_right: { col: 2, row: 0 },
      left: { col: 3, row: 0 },
      fill: { col: 4, row: 0 },
      fill_2: { col: 5, row: 0 },
      right: { col: 6, row: 0 },
      bottom_left: { col: 7, row: 0 },
      bottom: { col: 0, row: 1 },
      bottom_right: { col: 1, row: 1 },
      ledge_left: { col: 2, row: 1 },
      ledge: { col: 3, row: 1 },
      ledge_right: { col: 4, row: 1 },
    });
  });

  it("should size each PNG sheet as its grid times the tile size when compiled", () => {
    // Arrange
    const compiled = compileTileset(sampleTileset);

    // Act
    const low = decodePngBuffer(compiled.hi8bitPng);
    const mid = decodePngBuffer(compiled.hi16bitPng);

    // Assert
    expect([low.width, low.height]).toEqual([8 * 16, 2 * 16]);
    expect([mid.width, mid.height]).toEqual([8 * 32, 2 * 32]);
  });

  it("should produce identical bytes when the same tileset is compiled twice", () => {
    // Arrange
    const first = compileTileset(sampleTileset);

    // Act
    const second = compileTileset(sampleTileset);

    // Assert
    expect(Buffer.from(first.hi8bitPng).equals(Buffer.from(second.hi8bitPng))).toBe(true);
    expect(Buffer.from(first.hi16bitPng).equals(Buffer.from(second.hi16bitPng))).toBe(true);
    expect(first.metaJson).toBe(second.metaJson);
  });
});

describe("tileset sheet columns", () => {
  it("should use one column per tile when the tileset has fewer than eight tiles", () => {
    // Arrange
    const def = defineTileset({
      id: "ledge_test",
      kind: "oneway",
      description: "A three-tile ledge.",
      tiles: ["ledge_left", "ledge", "ledge_right"],
      draw: { hi8bit: topHalfFill, hi16bit: topHalfFillDetailed },
    });

    // Act
    const meta = JSON.parse(compileTileset(def).metaJson);

    // Assert
    expect([meta.columns, meta.rows]).toEqual([3, 1]);
  });
});

describe("tileset validation failures", () => {
  it("should name both tiers and the tile when a tile is empty", () => {
    // Arrange
    const def = solidWith((c, tile) => {
      if (tile !== "fill") solidFill(c);
    });

    // Act
    const message = thrownMessage(() => compileTileset(def));

    // Assert
    expect(message).toContain('hi-8bit tile "fill" is empty');
    expect(message).toContain('hi-16bit tile "fill" is empty');
  });

  it("should reject the tileset when the hi-16bit tile is identical to the hi-8bit tile scaled 2x", () => {
    // Arrange
    const def = solidWith(solidFill);

    // Act
    const message = thrownMessage(() => compileTileset(def));

    // Assert
    expect(message).toContain('hi-16bit tile "top" is identical to hi-8bit scaled 2x');
  });

  it("should reject a solid tile that has transparent pixels when it must be opaque", () => {
    // Arrange
    const def = solidWith((c) => {
      solidFill(c);
      c.clear(0, 0, 1, 1);
    });

    // Act
    const message = thrownMessage(() => compileTileset(def));

    // Assert
    expect(message).toContain('hi-8bit tile "top_left" must be fully opaque: 1 of 256 pixels are transparent');
  });

  it("should name the tier and tile when a draw call leaves the tile", () => {
    // Arrange
    const def = solidWith((c, tile) => {
      if (tile === "left") c.rect(0, 0, c.width + 1, 1, "#777");
      else solidFill(c);
    });

    // Act
    const message = thrownMessage(() => compileTileset(def));

    // Assert
    expect(message).toContain('hi-8bit tile "left": rect(0, 0, 17, 1)');
  });
});

describe("oneway ledge tiles", () => {
  const onewayLedges = (hi8bit: (c: PixelCanvas) => void, hi16bit: (c: PixelCanvas) => void) =>
    defineTileset({
      id: "ledge_test",
      kind: "oneway",
      description: "A three-tile ledge.",
      tiles: ["ledge_left", "ledge", "ledge_right"],
      draw: { hi8bit, hi16bit },
    });

  it("should accept transparent pixels below the walking surface when the tile is a oneway ledge", () => {
    // Arrange
    const def = onewayLedges(topHalfFill, topHalfFillDetailed);

    // Act
    const compile = () => compileTileset(def);

    // Assert
    expect(compile).not.toThrow();
  });

  it("should warn about the seam without failing when a ledge edge does not continue", () => {
    // Arrange
    const notch = (c: PixelCanvas) => c.rect(0, 0, c.width - 1, c.height / 2, "#999");
    const def = onewayLedges(notch, notch);

    // Act
    const { warnings } = compileTileset(def);

    // Assert
    expect(warnings.some((line) => line.includes('hi-8bit seam: "ledge" meets "ledge" on 8 of 16 rows'))).toBe(true);
  });
});
