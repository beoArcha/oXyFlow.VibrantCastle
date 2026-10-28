import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { PlayerId } from "@game/types";

/**
 * INTEGRATION TEST SUITE: End-to-End Character Selection Lifecycle
 *
 * Verifies character selection and mutual exclusion contracts across the engine stack:
 * 1. Default identity initialization (P1 = Valen).
 * 2. Dynamic character switching to Aurelia (P1 = Aurelia) with Scholar loadout.
 * 3. Complementary auto-assignment on 2P co-op spawn (P1 = Aurelia -> P2 = Valen).
 * 4. Complementary character swap (swapCharacters).
 * 5. Persistence round-trip (save/load retains character identities).
 */
describe("Given a fresh GameEngine instance", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  afterEach(() => {
    engine.stop();
  });

  describe("When initialized in single-player mode", () => {
    it("Then Player 1 defaults to Valen with Knight starting loadout", () => {
      // Given
      engine.resetLevel("courtyard");

      // When
      const p1 = engine.players[0];

      // Then
      expect(engine.players.length).toBe(1);
      expect(p1.id).toBe(PlayerId.Player1);
      expect(p1.characterId).toBe("valen");
      expect(p1.characterName).toBe("Valen");
      expect(p1.primarySpellId).toBe("solar_flare");
      expect(p1.unlockedSkills).toEqual(["solar_flare", "aegis_ward"]);
    });
  });

  describe("When Player 1 switches character to Aurelia", () => {
    it("Then Player 1 identity, spells, and skills transition to Scholar loadout", () => {
      // Given
      engine.resetLevel("courtyard");

      // When
      const success = engine.setPlayerCharacter(0, "aurelia");
      const p1 = engine.players[0];

      // Then
      expect(success).toBe(true);
      expect(p1.characterId).toBe("aurelia");
      expect(p1.characterName).toBe("Aurelia");
      expect(p1.primarySpellId).toBe("arcane_missiles");
      expect(p1.unlockedSkills).toEqual(["arcane_missiles", "ice_barrier"]);
      expect(p1.unlockedSkills).not.toContain("solar_flare");
    });
  });

  describe("When two-player co-op is enabled after Player 1 selects Aurelia", () => {
    it("Then Player 2 is automatically spawned as Valen for mutual exclusion", () => {
      // Given
      engine.resetLevel("courtyard");
      engine.setPlayerCharacter(0, "aurelia");

      // When
      engine.setTwoPlayerMode(true, true);

      // Then
      expect(engine.players.length).toBe(2);
      const [p1, p2] = engine.players;

      expect(p1.characterId).toBe("aurelia");
      expect(p2.characterId).toBe("valen");
      expect(p2.primarySpellId).toBe("solar_flare");
      expect(p2.unlockedSkills).toEqual(["solar_flare", "aegis_ward"]);
    });
  });

  describe("When characters are swapped during active two-player session", () => {
    it("Then P1 and P2 exchange identities and reset to default loadouts cleanly", () => {
      // Given
      engine.setTwoPlayerMode(true, true);
      engine.resetLevel("courtyard");
      // Initially: P1 = Valen, P2 = Aurelia
      expect(engine.players[0].characterId).toBe("valen");
      expect(engine.players[1].characterId).toBe("aurelia");

      // When
      const swapped = engine.swapCharacters();

      // Then
      expect(swapped).toBe(true);
      expect(engine.players[0].characterId).toBe("aurelia");
      expect(engine.players[0].primarySpellId).toBe("arcane_missiles");
      expect(engine.players[1].characterId).toBe("valen");
      expect(engine.players[1].primarySpellId).toBe("solar_flare");
    });
  });

  describe("When saving and reloading a game with customized character identity", () => {
    it("Then character identities and skill progressions persist accurately across save round-trip", () => {
      // Given
      engine.resetLevel("courtyard");
      engine.setPlayerCharacter(0, "aurelia");
      const p1 = engine.players[0];
      p1.health = 75;

      // When
      const savedState = engine.createSaveSnapshot();
      expect(savedState.p1CharacterId).toBe("aurelia");

      const newEngine = new GameEngine();
      newEngine.resetLevel("courtyard");
      const restoreSuccess = newEngine.restoreFromSnapshot(savedState);

      // Then
      expect(restoreSuccess).toBe(true);
      const restoredP1 = newEngine.players[0];
      expect(restoredP1.characterId).toBe("aurelia");
      expect(restoredP1.characterName).toBe("Aurelia");
      expect(restoredP1.primarySpellId).toBe("arcane_missiles");
      expect(restoredP1.unlockedSkills).toEqual(["arcane_missiles", "ice_barrier"]);
      expect(restoredP1.health).toBe(75);

      newEngine.stop();
    });
  });
});
