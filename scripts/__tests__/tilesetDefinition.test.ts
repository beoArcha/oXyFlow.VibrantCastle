import { describe, expect, it } from "bun:test";
import { defineTileset, type TilesetSpriteDefinition } from "../sprites/defineTileset";
import sampleTileset from "../sprites/__fixtures__/sample_tileset";

const SOLID_TILES = [
  "top_left", "top", "top_right",
  "left", "fill", "right",
  "bottom_left", "bottom", "bottom_right",
  "ledge_left", "ledge", "ledge_right",
];

const drawNothing = () => {};

function aTileset(overrides: Partial<TilesetSpriteDefinition> = {}): TilesetSpriteDefinition {
  return {
    id: "stone_test",
    kind: "solid",
    description: "A test stone.",
    tiles: [...SOLID_TILES],
    draw: { hi8bit: drawNothing, hi16bit: drawNothing },
    ...overrides,
  };
}

function thrownMessage(action: () => unknown): string {
  try {
    action();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return "";
}

describe("defineTileset", () => {
  it("should return the definition unchanged when the sample tileset is valid", () => {
    // Arrange & Act
    const defined = defineTileset(sampleTileset);

    // Assert
    expect(defined).toBe(sampleTileset);
  });

  it("should accept a oneway tileset with a numbered ledge variant and support", () => {
    // Arrange
    const def = aTileset({ kind: "oneway", tiles: ["ledge_left", "ledge", "ledge_right", "ledge_2", "support"] });

    // Act
    const message = thrownMessage(() => defineTileset(def));

    // Assert
    expect(message).toBe("");
  });

  it("should reject the definition when a required solid tile is missing", () => {
    // Arrange
    const def = aTileset({ tiles: SOLID_TILES.filter((name) => name !== "ledge_right") });

    // Act
    const message = thrownMessage(() => defineTileset(def));

    // Assert
    expect(message).toContain('missing required solid tile "ledge_right"');
  });

  it("should reject a variant whose base tile is not in the tile list", () => {
    // Arrange
    const def = aTileset({ tiles: [...SOLID_TILES.filter((name) => name !== "fill"), "fill_2"] });

    // Act
    const message = thrownMessage(() => defineTileset(def));

    // Assert
    expect(message).toContain('variant "fill_2" needs its base tile "fill" in the tile list');
  });

  it("should reject a numbered variant that starts at 1 when the base is listed", () => {
    // Arrange
    const def = aTileset({ tiles: [...SOLID_TILES, "fill_1"] });

    // Act
    const message = thrownMessage(() => defineTileset(def));

    // Assert
    expect(message).toContain('variant "fill_1" must be numbered from 2');
  });

  it("should reject support on a solid tileset when support is oneway only", () => {
    // Arrange
    const def = aTileset({ tiles: [...SOLID_TILES, "support"] });

    // Act
    const message = thrownMessage(() => defineTileset(def));

    // Assert
    expect(message).toContain('tile "support" is not a solid tile name');
  });

  it("should reject a tile name listed twice when the list repeats it", () => {
    // Arrange
    const def = aTileset({ tiles: [...SOLID_TILES, "fill"] });

    // Act
    const message = thrownMessage(() => defineTileset(def));

    // Assert
    expect(message).toContain('tile "fill" is listed more than once');
  });

  it("should reject a tileset id that is not snake_case when it contains a dash", () => {
    // Arrange
    const def = aTileset({ id: "stone-test" });

    // Act
    const message = thrownMessage(() => defineTileset(def));

    // Assert
    expect(message).toContain('id "stone-test" must be snake_case');
  });

  it("should reject the definition when a hi-16bit draw function is missing", () => {
    // Arrange
    const def = { ...aTileset(), draw: { hi8bit: drawNothing } } as unknown as TilesetSpriteDefinition;

    // Act
    const message = thrownMessage(() => defineTileset(def));

    // Assert
    expect(message).toContain("needs draw.hi16bit(c, tile)");
  });

  it("should list every problem in one error when several are present", () => {
    // Arrange
    const def = aTileset({ id: "Stone", tiles: SOLID_TILES.slice(1) });

    // Act
    const message = thrownMessage(() => defineTileset(def));

    // Assert
    expect(message).toContain('id "Stone" must be snake_case');
    expect(message).toContain('missing required solid tile "top_left"');
  });
});
