import { describe, expect, it } from "bun:test";
import type { LocationZoneSchema, ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import {
  buildZoneVariantKey,
  resolveActiveParallaxZone,
  resolveActiveZoneKind,
  resolveClosestParallaxLayer,
} from "../zoneResolver";

function makeZone(overrides: Partial<LocationZoneSchema> = {}): LocationZoneSchema {
  return {
    id: "zone_1",
    kind: "boss",
    x: 1000,
    y: 400,
    width: 400,
    height: 300,
    featherPx: 200,
    ambientColor: "rgba(245, 158, 11, 0.22)",
    ...overrides,
  };
}

function makeLayer(overrides: Partial<ParallaxLayerSchema> = {}): ParallaxLayerSchema {
  return {
    id: "layer",
    name: "Layer",
    type: "image",
    depth: 0.45,
    scrollSpeedX: 0.36,
    scrollSpeedY: 0.12,
    ...overrides,
  };
}

describe("Parallax Zone Resolver", () => {
  describe("Resolver Edges & Smoothstep Feather", () => {
    it("should return null when zones are empty or point is beyond feather distance", () => {
      // Arrange
      const zones = [makeZone({ x: 1000, y: 400, width: 400, height: 300, featherPx: 200 })];

      // Act & Assert
      expect(resolveActiveParallaxZone(undefined, 1200, 550)).toBeNull();
      expect(resolveActiveParallaxZone([], 1200, 550)).toBeNull();
      expect(resolveActiveZoneKind(zones, 799, 550)).toBeNull();
      expect(resolveActiveZoneKind(zones, 800, 550)).toBeNull(); // Exact outer feather boundary -> weight 0
      expect(resolveActiveZoneKind(zones, 1600, 550)).toBeNull();
      expect(resolveActiveZoneKind(zones, 1200, 200)).toBeNull();
      expect(resolveActiveZoneKind(zones, 1200, 900)).toBeNull();
    });

    it("should return weight 1 inside the zone and on all four exact rectangle edges", () => {
      // Arrange
      const zones = [makeZone({ x: 1000, y: 400, width: 400, height: 300, featherPx: 200 })];

      // Act & Assert
      expect(resolveActiveParallaxZone(zones, 1200, 550)?.weight).toBe(1);
      expect(resolveActiveParallaxZone(zones, 1000, 400)?.weight).toBe(1);
      expect(resolveActiveParallaxZone(zones, 1400, 400)?.weight).toBe(1);
      expect(resolveActiveParallaxZone(zones, 1000, 700)?.weight).toBe(1);
      expect(resolveActiveParallaxZone(zones, 1400, 700)?.weight).toBe(1);
    });

    it("should compute smoothstep feather weight at midpoint and circular corner distance", () => {
      // Arrange
      const zones = [makeZone({ x: 1000, y: 400, width: 400, height: 300, featherPx: 200 })];

      // Act
      const midEdge = resolveActiveParallaxZone(zones, 900, 550);
      const quarterIn = resolveActiveParallaxZone(zones, 950, 550);
      // Corner offset (dx = 120, dy = 160 -> dist = 200 == featherPx -> outside)
      const cornerOutside = resolveActiveParallaxZone(zones, 1000 - 120, 400 - 160);
      // Corner offset (dx = 60, dy = 80 -> dist = 100 -> t = 0.5 -> weight = 0.5)
      const cornerMid = resolveActiveParallaxZone(zones, 1000 - 60, 400 - 80);

      // Assert
      expect(midEdge?.weight).toBeCloseTo(0.5, 5);
      expect(quarterIn?.weight).toBeCloseTo(0.84375, 5); // t = 0.75 -> 0.75^2 * (3 - 1.5)
      expect(cornerOutside).toBeNull();
      expect(cornerMid?.weight).toBeCloseTo(0.5, 5);
    });

    it("should enforce a crisp boundary when featherPx is 0", () => {
      // Arrange
      const zones = [makeZone({ x: 500, y: 200, width: 200, height: 200, featherPx: 0 })];

      // Act & Assert
      expect(resolveActiveParallaxZone(zones, 500, 300)?.weight).toBe(1);
      expect(resolveActiveParallaxZone(zones, 499.5, 300)).toBeNull();
    });
  });

  describe("Overlapping Zones & Priority Tie-Breaking", () => {
    it("should pick the zone with higher spatial weight when two zones overlap at different strengths", () => {
      // Arrange
      const zones: LocationZoneSchema[] = [
        makeZone({ id: "boss_zone", kind: "boss", x: 1000, y: 400, width: 200, height: 200, featherPx: 200 }),
        makeZone({ id: "rest_zone", kind: "rest", x: 1300, y: 400, width: 200, height: 200, featherPx: 200 }),
      ];

      // Act: at x = 1320, inside rest_zone (w = 1) and inside boss_zone's feather (dist = 120, w < 1)
      const active = resolveActiveParallaxZone(zones, 1320, 500);

      // Assert
      expect(active?.kind).toBe("rest");
      expect(active?.weight).toBe(1);
    });

    it("should break equal-weight ties using boss > story > rest > secret order", () => {
      // Arrange
      const rect = { x: 100, y: 100, width: 300, height: 300, featherPx: 100 };
      const allFour: LocationZoneSchema[] = [
        makeZone({ id: "z_secret", kind: "secret", ...rect }),
        makeZone({ id: "z_rest", kind: "rest", ...rect }),
        makeZone({ id: "z_story", kind: "story", ...rect }),
        makeZone({ id: "z_boss", kind: "boss", ...rect }),
      ];

      // Act & Assert
      expect(resolveActiveZoneKind(allFour, 250, 250)).toBe("boss");
      expect(resolveActiveZoneKind(allFour.slice(0, 3), 250, 250)).toBe("story");
      expect(resolveActiveZoneKind(allFour.slice(0, 2), 250, 250)).toBe("rest");
      expect(resolveActiveZoneKind(allFour.slice(0, 1), 250, 250)).toBe("secret");
    });

    it("should fall back to legacy bossZones when location.zones is absent", () => {
      // Arrange
      const legacyLocation = {
        bossZones: [{ id: "legacy_boss", scope: "stage" as const, x: 400, y: 100, width: 300, height: 300 }],
      };

      // Act & Assert
      expect(resolveActiveZoneKind(legacyLocation, 550, 250)).toBe("boss");
      expect(resolveActiveZoneKind(legacyLocation, 50, 250)).toBeNull();
    });
  });

  describe("Closest Layer Selection & Variant Key Builder", () => {
    it("should select the highest-depth dynamic layer and ignore far, boss_*, and fx_* layers", () => {
      // Arrange
      const layers: ParallaxLayerSchema[] = [
        makeLayer({ id: "courtyard:far", tier: "far", layerKey: "courtyard:far", depth: 0.08 }),
        makeLayer({ id: "courtyard:var_a", tier: "mid_far", layerKey: "courtyard:var_a", depth: 0.24 }),
        makeLayer({ id: "courtyard:var_b", tier: "mid", layerKey: "courtyard:var_b", depth: 0.45 }),
        makeLayer({ id: "_shared:fx_sigil", tier: "boss_stage", layerKey: "_shared:fx_sigil", depth: 0.99 }),
        makeLayer({ id: "courtyard:fx_dust", tier: "close", layerKey: "courtyard:fx_dust", depth: 0.98 }),
        makeLayer({ id: "courtyard:var_c", tier: "mid_close", layerKey: "courtyard:var_c", depth: 0.65 }),
      ];

      // Act
      const closest = resolveClosestParallaxLayer(layers);

      // Assert
      expect(closest?.layerKey).toBe("courtyard:var_c");
      expect(buildZoneVariantKey(closest!, "rest")).toBe("courtyard:var_c@rest");
    });
  });
});
