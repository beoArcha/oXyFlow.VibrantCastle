import { describe, it, expect } from "bun:test";
import { LevelDesigner } from "../levels";
import { PlayerId } from "../../types";

describe("LevelDesigner Character Selection and Instantiation", () => {
  it("creates Valen with solar_flare and prismatic_shield spells", () => {
    const valen = LevelDesigner.createPlayerEntity(PlayerId.Player1, "valen", 100, 200);

    expect(valen.id).toBe(PlayerId.Player1);
    expect(valen.characterId).toBe("valen");
    expect(valen.characterName).toBe("Valen");
    expect(valen.primarySpellId).toBe("solar_flare");
    expect(valen.secondarySpellId).toBe("prismatic_shield");
    expect(valen.unlockedSkills).toContain("solar_flare");
    expect(valen.unlockedSkills).toContain("prismatic_shield");
    expect(valen.x).toBe(100);
    expect(valen.y).toBe(200);
  });

  it("creates Aurelia with aether_bolt and aether_barrier spells", () => {
    const aurelia = LevelDesigner.createPlayerEntity(PlayerId.Player2, "aurelia", 150, 250);

    expect(aurelia.id).toBe(PlayerId.Player2);
    expect(aurelia.characterId).toBe("aurelia");
    expect(aurelia.characterName).toBe("Aurelia");
    expect(aurelia.primarySpellId).toBe("aether_bolt");
    expect(aurelia.secondarySpellId).toBe("aether_barrier");
    expect(aurelia.unlockedSkills).toContain("aether_bolt");
    expect(aurelia.unlockedSkills).toContain("aether_barrier");
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
    expect(state.players[0].primarySpellId).toBe("aether_bolt");

    expect(state.players[1].characterId).toBe("valen");
    expect(state.players[1].characterName).toBe("Valen");
    expect(state.players[1].primarySpellId).toBe("solar_flare");
  });
});
