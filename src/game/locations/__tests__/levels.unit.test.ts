import { describe, it, expect } from "bun:test";
import { LevelDesigner } from "../levels";
import { PlayerId } from "../../types";

describe("LevelDesigner Character Selection and Instantiation", () => {
  it("creates Valen with solar_flare and aegis_ward spells", () => {
    const valen = LevelDesigner.createPlayerEntity(PlayerId.Player1, "valen", 100, 200);

    expect(valen.id).toBe(PlayerId.Player1);
    expect(valen.characterId).toBe("valen");
    expect(valen.characterName).toBe("Valen");
    expect(valen.primarySpellId).toBe("solar_flare");
    expect(valen.secondarySpellId).toBe("aegis_ward");
    expect(valen.unlockedSkills).toContain("solar_flare");
    expect(valen.unlockedSkills).toContain("aegis_ward");
    expect(valen.x).toBe(100);
    expect(valen.y).toBe(200);
  });

  it("creates Aurelia with arcane_missiles and ice_barrier spells", () => {
    const aurelia = LevelDesigner.createPlayerEntity(PlayerId.Player2, "aurelia", 150, 250);

    expect(aurelia.id).toBe(PlayerId.Player2);
    expect(aurelia.characterId).toBe("aurelia");
    expect(aurelia.characterName).toBe("Aurelia");
    expect(aurelia.primarySpellId).toBe("arcane_missiles");
    expect(aurelia.secondarySpellId).toBe("ice_barrier");
    expect(aurelia.unlockedSkills).toContain("arcane_missiles");
    expect(aurelia.unlockedSkills).toContain("ice_barrier");
    expect(aurelia.x).toBe(150);
    expect(aurelia.y).toBe(250);
  });

  it("creates location state with default P1 as Valen and P2 as Aurelia in 2P mode", () => {
    const state = LevelDesigner.createLocationState("courtyard", true);

    expect(state.players.length).toBe(2);
    expect(state.players[0].characterId).toBe("valen");
    expect(state.players[0].characterName).toBe("Valen");
    expect(state.players[1].characterId).toBe("aurelia");
    expect(state.players[1].characterName).toBe("Aurelia");
  });

  it("creates location state with swapped characters when p1CharacterId is aurelia", () => {
    const state = LevelDesigner.createLocationState("courtyard", true, undefined, undefined, "aurelia");

    expect(state.players.length).toBe(2);
    expect(state.players[0].characterId).toBe("aurelia");
    expect(state.players[0].characterName).toBe("Aurelia");
    expect(state.players[0].primarySpellId).toBe("arcane_missiles");

    expect(state.players[1].characterId).toBe("valen");
    expect(state.players[1].characterName).toBe("Valen");
    expect(state.players[1].primarySpellId).toBe("solar_flare");
  });
});
