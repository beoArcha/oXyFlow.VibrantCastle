import { describe, expect, it } from "bun:test";
import type { LocationJsonSchema } from "@game/locations/schema/locationSchema";
import {
  buildLocationTextPatch,
  suggestNarrationKey,
  suggestTriggerId,
} from "../mapTextPatch";

function makeBlueprint(overrides?: Partial<LocationJsonSchema>): LocationJsonSchema {
  return {
    schemaVersion: "1.0",
    id: "courtyard",
    nameKey: "locationCourtyardName",
    descriptionKey: "locationCourtyardDesc",
    openingNarrationKey: "narrationOpening",
    dimensions: { width: 4800, height: 1040 },
    spawnPoints: { default: { x: 140, y: 780 }, p2Offset: { x: 46, y: 0 } },
    theme: {
      bgGradientTop: "#111111",
      bgGradientBottom: "#222222",
      ambientParticle: "leaf",
      fogColor: "rgba(0,0,0,0.1)",
      musicIntensity: 0.2,
    },
    dictionaries: {
      entities: {},
      portals: {
        to_thorn_chasm: {
          id: "to_thorn_chasm",
          labelKey: "portalToThornChasm",
          defaultLabel: "To Thorn Chasm",
          targetLocationId: "thorn_chasm",
          activation: "interact",
        },
      },
    },
    layout: {
      solids: [],
      triggers: [
        {
          id: "trig_movement",
          x: 360,
          y: 720,
          width: 120,
          height: 140,
          triggerId: "trainingMovementSuccess",
        },
      ],
      portals: [
        {
          id: "portal_exit_chasm",
          portalKey: "to_thorn_chasm",
          x: 4610,
          y: 732,
          width: 84,
          height: 128,
        },
      ],
    },
    ...overrides,
  };
}

describe("mapTextPatch - Key Suggestion & Patch Builder", () => {
  it("should suggest the next free narr_<locationId>_<beat>_<n> key when collisions exist", () => {
    // Arrange
    const existing = new Set([
      "narr_courtyard_gate_1",
      "narr_courtyard_gate_2",
    ]);

    // Act
    const key = suggestNarrationKey("courtyard", "Gate!", existing);

    // Assert
    expect(key).toBe("narr_courtyard_gate_3");
  });

  it("should suggest an unused trigger id when previous ids exist", () => {
    // Arrange
    const existing = new Set(["trig_narr_1"]);

    // Act
    const id = suggestTriggerId("narr", existing);

    // Assert
    expect(id).toBe("trig_narr_2");
  });

  it("should build an add patch and i18n entries when creating a narration trigger without mutating input", () => {
    // Arrange
    const blueprint = makeBlueprint();
    const snapshotBefore = JSON.stringify(blueprint);

    // Act
    const patch = buildLocationTextPatch(blueprint, {
      triggers: [
        {
          kind: "create",
          id: "trig_narr_1",
          x: 1200,
          y: 680,
          width: 180,
          height: 140,
          triggerId: "narr_courtyard_gate_1",
          oneShot: true,
          plText: "Stara brama drży pod ciężarem trybów.",
          enText: "The old gate shudders under iron gears.",
        },
      ],
      portals: [],
    });

    // Assert
    expect(JSON.stringify(blueprint)).toBe(snapshotBefore);
    expect(patch.targetFile).toBe("src/data/locations/courtyard.json");
    expect(patch.jsonPatch).toEqual([
      {
        op: "add",
        path: "/layout/triggers/-",
        value: {
          id: "trig_narr_1",
          x: 1200,
          y: 680,
          width: 180,
          height: 140,
          triggerId: "narr_courtyard_gate_1",
          oneShot: true,
        },
      },
    ]);
    expect(patch.layoutDiff.addedTriggers).toHaveLength(1);
    expect(patch.i18n.pl).toEqual({
      narr_courtyard_gate_1: "Stara brama drży pod ciężarem trybów.",
    });
    expect(patch.i18n.en).toEqual({
      narr_courtyard_gate_1: "The old gate shudders under iron gears.",
    });
  });

  it("should initialize /layout/triggers when blueprint has no triggers array", () => {
    // Arrange
    const blueprint = makeBlueprint({
      id: "thorn_chasm",
      layout: { solids: [] },
    });

    // Act
    const patch = buildLocationTextPatch(blueprint, {
      triggers: [
        {
          kind: "create",
          id: "trig_narr_1",
          x: 300,
          y: 500,
          width: 120,
          height: 140,
          triggerId: "narr_thorn_chasm_intro_1",
          plText: "Ciernie błyszczą w mgle.",
          enText: "Thorns gleam through the mist.",
        },
      ],
      portals: [],
    });

    // Assert
    expect(patch.jsonPatch).toEqual([
      {
        op: "add",
        path: "/layout/triggers",
        value: [
          {
            id: "trig_narr_1",
            x: 300,
            y: 500,
            width: 120,
            height: 140,
            triggerId: "narr_thorn_chasm_intro_1",
          },
        ],
      },
    ]);
  });

  it("should emit a replace patch and updated i18n entries when editing an existing trigger", () => {
    // Arrange
    const blueprint = makeBlueprint();

    // Act
    const patch = buildLocationTextPatch(blueprint, {
      triggers: [
        {
          kind: "edit",
          id: "trig_movement",
          originalIndex: 0,
          x: 360,
          y: 720,
          width: 120,
          height: 140,
          triggerId: "narr_courtyard_move_1",
          oneShot: true,
          plText: "Zwinny krok otwiera drogę.",
          enText: "An agile step opens the path.",
        },
      ],
      portals: [],
    });

    // Assert
    expect(patch.jsonPatch).toEqual([
      {
        op: "replace",
        path: "/layout/triggers/0",
        value: {
          id: "trig_movement",
          x: 360,
          y: 720,
          width: 120,
          height: 140,
          triggerId: "narr_courtyard_move_1",
          oneShot: true,
        },
      },
    ]);
    expect(patch.layoutDiff.updatedTriggers).toHaveLength(1);
    expect(patch.layoutDiff.updatedTriggers[0].before.triggerId).toBe("trainingMovementSuccess");
    expect(patch.layoutDiff.updatedTriggers[0].after.triggerId).toBe("narr_courtyard_move_1");
    expect(patch.i18n).toEqual({
      pl: { narr_courtyard_move_1: "Zwinny krok otwiera drogę." },
      en: { narr_courtyard_move_1: "An agile step opens the path." },
    });
  });

  it("should emit a replace patch and i18n entries when editing an existing portal text", () => {
    // Arrange
    const blueprint = makeBlueprint();

    // Act
    const patch = buildLocationTextPatch(blueprint, {
      triggers: [],
      portals: [
        {
          id: "portal_exit_chasm",
          originalIndex: 0,
          portalKey: "to_thorn_chasm",
          labelKey: "portalToThornChasm",
          plText: "Przejście do Rozpadliny Cierni",
          enText: "Passage to Thorn Chasm",
        },
      ],
    });

    // Assert
    expect(patch.jsonPatch).toEqual([
      {
        op: "replace",
        path: "/layout/portals/0",
        value: {
          id: "portal_exit_chasm",
          portalKey: "to_thorn_chasm",
          x: 4610,
          y: 732,
          width: 84,
          height: 128,
          labelKey: "portalToThornChasm",
          defaultLabel: "Passage to Thorn Chasm",
        },
      },
    ]);
    expect(patch.layoutDiff.updatedPortals).toHaveLength(1);
    expect(patch.i18n).toEqual({
      pl: { portalToThornChasm: "Przejście do Rozpadliny Cierni" },
      en: { portalToThornChasm: "Passage to Thorn Chasm" },
    });
  });
});
