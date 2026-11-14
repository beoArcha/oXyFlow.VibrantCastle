import { describe, it, expect } from "bun:test";
import { LocationParser, parseDecorPlacements } from "../parser/locationParser";
import type { LocationJsonSchema } from "../schema/locationSchema";

function blueprint(decor: unknown): LocationJsonSchema {
  return {
    schemaVersion: "1.0",
    id: "decor_test",
    nameKey: "n",
    descriptionKey: "d",
    openingNarrationKey: "o",
    dimensions: { width: 2000, height: 800 },
    spawnPoints: { default: { x: 100, y: 100 }, p2Offset: { x: 40, y: 0 } },
    theme: { bgGradientTop: "#000", bgGradientBottom: "#111", ambientParticle: "dust", fogColor: "#222", musicIntensity: 1 },
    parallaxBackground: { boxWidth: 2000, boxHeight: 800, layers: [] },
    dictionaries: { entities: {}, portals: {} },
    layout: { solids: [], decor: decor as never },
  };
}

describe("layout.decor", () => {
  it("is carried onto the parsed location with defaults applied and creates no entities", () => {
    const location = LocationParser.parse(
      blueprint([{ id: "a", propId: "hanging_lantern", x: 300, y: 120 }, { id: "b", propId: "x", x: 1, y: 2, layer: "front", flipX: true, phase: 2 }])
    );

    expect(location.decor).toEqual([
      { id: "a", propId: "hanging_lantern", x: 300, y: 120, layer: "back", flipX: false, phase: 0 },
      { id: "b", propId: "x", x: 1, y: 2, layer: "front", flipX: true, phase: 2 },
    ]);
    expect(location.createEntities(false)).toHaveLength(0);
  });

  it("leaves decor undefined when the layout has none", () => {
    expect(LocationParser.parse(blueprint(undefined)).decor).toBeUndefined();
  });

  it("skips malformed entries instead of failing the level", () => {
    const decor = parseDecorPlacements(
      [{ id: "ok", propId: "p", x: 1, y: 2 }, { id: "bad", propId: "p", x: "1", y: 2 }, null, { id: "l", propId: "p", x: 1, y: 2, layer: "side" }],
      "decor_test"
    );

    expect(decor?.map((d) => d.id)).toEqual(["ok"]);
  });
});
