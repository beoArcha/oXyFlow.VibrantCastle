import { describe, it, expect } from "bun:test";
import { buildLocationEnemies, buildLocationEntities } from "../parser/locationEntityFactory";
import type { LocationJsonSchema } from "../schema/locationSchema";
import type { DomainEnemyTemplate } from "@lib/codecs";

function createTemplate(atlasPresetId?: string): DomainEnemyTemplate {
  return {
    id: "gargoyle",
    nameKey: "enemy.gargoyle",
    defaultName: "Gargoyle",
    category: "construct",
    isDummy: false,
    isAerial: true,
    dimensions: { width: 40, height: 40 },
    stats: { health: 30, maxHealth: 30, speed: 1 } as DomainEnemyTemplate["stats"],
    atlas: atlasPresetId
      ? { presetId: atlasPresetId, defaultAnimation: "fly" }
      : undefined,
  };
}

function buildWith(template: DomainEnemyTemplate) {
  const layout = {
    solids: [],
    enemies: [{ id: "e1", monsterKey: "gargoyle", x: 10, y: 20 }],
  } as unknown as LocationJsonSchema["layout"];
  const dictionaries = { entities: {}, portals: {} } as unknown as LocationJsonSchema["dictionaries"];

  return buildLocationEnemies(layout, dictionaries, "test", false, { gargoyle: template });
}

describe("buildLocationEnemies atlas binding", () => {
  it("copies the template atlas presetId into enemy.atlasId", () => {
    const [enemy] = buildWith(createTemplate("clockwork_owl_gargoyle"));

    expect(enemy.atlasId).toBe("clockwork_owl_gargoyle");
    expect(enemy.templateId).toBe("gargoyle");
  });

  it("leaves atlasId undefined when the template has no atlas", () => {
    const [enemy] = buildWith(createTemplate());

    expect(enemy.atlasId).toBeUndefined();
  });
});

describe("buildLocationEntities lever targeting", () => {
  it("copies the lever targetGateId onto its runtime entity", () => {
    const layout = {
      solids: [],
      levers: [
        { id: "lever_a", triggerId: "trig_a", targetGateId: "gate_a", x: 1, y: 2 },
        { id: "lever_b", triggerId: "trig_b", x: 3, y: 4 },
      ],
    } as unknown as LocationJsonSchema["layout"];
    const dictionaries = { entities: {}, portals: {} } as unknown as LocationJsonSchema["dictionaries"];

    const entities = buildLocationEntities(layout, dictionaries);
    const a = entities.find((e) => e.id === "lever_a");
    const b = entities.find((e) => e.id === "lever_b");

    expect(a?.targetGateId).toBe("gate_a");
    expect(b?.targetGateId).toBeUndefined();
  });
});
