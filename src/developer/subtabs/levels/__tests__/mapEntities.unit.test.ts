import { describe, expect, it } from "bun:test";
import { getLocation } from "@game/locations";
import { extractMapEntities, hitTestMapEntity } from "../mapEntities";

describe("mapEntities - Blueprint Extraction & Hit Testing", () => {
  it("should extract solids, gates, levers with link lines, portals, triggers, spawns, enemies, and hazards for courtyard", () => {
    // Arrange
    const courtyard = getLocation("courtyard");

    // Act
    const { entities, leverGateLinks } = extractMapEntities(courtyard);
    const categories = new Set(entities.map((e) => e.category));

    // Assert
    expect(categories.has("solid")).toBe(true);
    expect(categories.has("gate")).toBe(true);
    expect(categories.has("lever")).toBe(true);
    expect(categories.has("portal")).toBe(true);
    expect(categories.has("trigger")).toBe(true);
    expect(categories.has("spawn")).toBe(true);
    expect(categories.has("enemy")).toBe(true);
    expect(categories.has("hazard")).toBe(true);
    expect(leverGateLinks.length).toBeGreaterThanOrEqual(1);
    expect(leverGateLinks[0].leverId).toBe("lever_courtyard_gate");
    expect(leverGateLinks[0].gateId).toBe("courtyard_portcullis");
  });

  it("should prefer foreground interactive entities over overlapping solids during hit testing", () => {
    // Arrange
    const courtyard = getLocation("courtyard");
    const { entities } = extractMapEntities(courtyard);
    const trigger = entities.find((e) => e.id === "trig_movement");
    expect(trigger).toBeDefined();

    // Act
    const hit = hitTestMapEntity(entities, trigger!.x + 10, trigger!.y + 10);

    // Assert
    expect(hit?.id).toBe("trig_movement");
  });
});
