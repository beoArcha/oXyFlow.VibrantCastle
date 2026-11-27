import { describe, it, expect } from "bun:test";
import { computeBossScopeIntensity } from "../bossZoneIntensity";
import type { LocationDefinition } from "@game/locations/types";

function makeLocationWithZones(): LocationDefinition {
  return {
    id: "boss_test",
    nameKey: "locName",
    descriptionKey: "locDesc",
    openingNarrationKey: "locOpen",
    width: 4000,
    height: 1000,
    spawnPoint: { x: 100, y: 500 },
    p2SpawnOffset: { x: 40, y: 0 },
    theme: {
      bgGradientTop: "#111111",
      bgGradientBottom: "#000000",
      ambientParticle: "dust",
      fogColor: "#000000",
      musicIntensity: 1,
    },
    bossZones: [
      { id: "stage_arena", scope: "stage", x: 1000, y: 200, width: 400, height: 400 },
    ],
    createEntities: () => [],
    createEnemies: () => [],
  };
}

describe("computeBossScopeIntensity", () => {
  it("should return 1 when camera center is inside the matching boss zone", () => {
    // Arrange
    const location = makeLocationWithZones();

    // Act
    const intensity = computeBossScopeIntensity(location, "stage", 700, 100, 1000, 600);

    // Assert
    expect(intensity).toBe(1);
  });

  it("should return a smooth intermediate value inside the 260px feather", () => {
    // Arrange
    const location = makeLocationWithZones();

    // Act
    const intensity = computeBossScopeIntensity(location, "stage", 370, 100, 1000, 600);

    // Assert
    expect(intensity).toBeGreaterThan(0);
    expect(intensity).toBeLessThan(1);
  });

  it("should return 0 outside the feather distance", () => {
    // Arrange
    const location = makeLocationWithZones();

    // Act
    const intensity = computeBossScopeIntensity(location, "stage", 0, 100, 1000, 600);

    // Assert
    expect(intensity).toBe(0);
  });

  it("should honor forceBossScope override regardless of camera position", () => {
    // Arrange
    const location = makeLocationWithZones();

    // Act
    const intensity = computeBossScopeIntensity(location, "world", 0, 0, 1000, 600, "world");

    // Assert
    expect(intensity).toBe(1);
  });
});
