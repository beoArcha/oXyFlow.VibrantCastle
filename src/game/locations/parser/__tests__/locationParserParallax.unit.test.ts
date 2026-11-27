import { describe, expect, it } from "bun:test";
import { ParserError } from "@lib/errors";
import { LocationParser } from "../locationParser";
import type { LocationJsonSchema } from "../../schema/locationSchema";

function makeBlueprint(overrides: Partial<LocationJsonSchema> = {}): LocationJsonSchema {
  return {
    schemaVersion: "1.0",
    id: "courtyard",
    worldId: "courtyard",
    nameKey: "locName",
    descriptionKey: "locDesc",
    openingNarrationKey: "locOpen",
    dimensions: { width: 4800, height: 1040 },
    spawnPoints: { default: { x: 100, y: 500 }, p2Offset: { x: 40, y: 0 } },
    theme: {
      bgGradientTop: "#2c1e33",
      bgGradientBottom: "#d97706",
      ambientParticle: "leaf",
      fogColor: "rgba(251, 191, 36, 0.08)",
      musicIntensity: 0.25,
    },
    parallax: {
      layers: ["var_a", "var_b"],
      overrides: { var_b: { opacity: 0.8 } },
      box: { width: 5400, height: 1160 },
    },
    zones: [
      {
        id: "courtyard_trial_square",
        kind: "boss",
        scope: "stage",
        x: 2660,
        y: 180,
        width: 580,
        height: 540,
        effects: ["sigil"],
        featherPx: 260,
      },
    ],
    dictionaries: { entities: {}, portals: {} },
    layout: { solids: [] },
    ...overrides,
  };
}

describe("LocationParser - Parallax & Zones", () => {
  it("should expand implicit far, selected variations, overrides, and zone effects without mutating blueprint", () => {
    // Arrange
    const blueprint = makeBlueprint();
    Object.freeze(blueprint);
    Object.freeze(blueprint.parallax);
    Object.freeze(blueprint.parallax!.layers);
    Object.freeze(blueprint.zones);

    // Act
    const parsed = LocationParser.parse(blueprint);
    const layers = parsed.parallaxBackground?.layers ?? [];

    // Assert
    expect(parsed.parallax).toEqual(blueprint.parallax);
    expect(parsed.zones).toEqual(blueprint.zones);
    expect(layers.map((l) => l.layerKey)).toEqual([
      "courtyard:far",
      "courtyard:var_a",
      "courtyard:var_b",
      "_shared:fx_sigil",
    ]);
    expect(layers[0].opaque).toBe(true);
    expect(layers[2].opacity).toBe(0.8);
    expect(layers.every((l) => l.imageUrl === undefined)).toBe(true);
    expect(parsed.bossZones?.length).toBe(1);
    expect(parsed.bossZones?.[0].scope).toBe("stage");
  });

  it("should throw ParserError when parallax.layers references an unknown slot", () => {
    // Arrange
    const blueprint = makeBlueprint({
      parallax: { layers: ["var_missing"] },
    });

    // Act & Assert
    expect(() => LocationParser.parse(blueprint)).toThrow(ParserError);
  });

  it("should throw ParserError when parallax.layers explicitly lists far", () => {
    // Arrange
    const blueprint = makeBlueprint({
      parallax: { layers: ["far"] },
    });

    // Act & Assert
    expect(() => LocationParser.parse(blueprint)).toThrow(ParserError);
  });
});
