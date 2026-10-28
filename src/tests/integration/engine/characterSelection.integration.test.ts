import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { PlayerId } from "@game/types";
import { createDefaultInventory } from "@game/logic/inventory";

/**
 * INTEGRATION TEST SUITE: End-to-End Character Selection Lifecycle
 *
 * Verifies character selection and mutual exclusion contracts across the engine stack:
 * 1. Default identity initialization (P1 = Valen).
 * 2. Dynamic character switching to Aurelia (P1 = Aurelia) with Scholar loadout.
 * 3. Complementary auto-assignment on 2P co-op spawn (P1 = Aurelia -> P2 = Valen).
 * 4. Complementary character swap (swapCharacters).
 * 5. Persistence round-trip (save/load retains character identities).
 * 6. Non-destructive progression preservation across character switches.
 * 7. Two-player session topology restoration including dead P2 (health = 0).
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
      expect(p1.unlockedSkills).toEqual(["solar_flare", "prismatic_shield"]);
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
      expect(p1.primarySpellId).toBe("aether_bolt");
      expect(p1.unlockedSkills).toEqual(["aether_bolt", "aether_barrier"]);
      expect(p1.unlockedSkills).not.toContain("solar_flare");
    });

    it("Then skill points, score, and progression are non-destructively preserved", () => {
      // Given
      engine.resetLevel("courtyard");
      const p1 = engine.players[0];
      p1.skillPoints = 7;
      p1.score = 350;
      p1.inventory = createDefaultInventory();

      // When switching character to Aurelia
      const success = engine.setPlayerCharacter(0, "aurelia");

      // Then
      expect(success).toBe(true);
      expect(p1.characterId).toBe("aurelia");
      expect(p1.skillPoints).toBe(7);
      expect(p1.score).toBe(350);
      expect(p1.maxHealth).toBeGreaterThan(0);
      expect(p1.maxMana).toBeGreaterThan(0);
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
      expect(p2.unlockedSkills).toEqual(["solar_flare", "prismatic_shield"]);
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
      expect(engine.players[0].primarySpellId).toBe("aether_bolt");
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
      expect(restoredP1.primarySpellId).toBe("aether_bolt");
      expect(restoredP1.unlockedSkills).toEqual(["aether_bolt", "aether_barrier"]);
      expect(restoredP1.health).toBe(75);

      newEngine.stop();
    });

    it("Then two-player co-op session shape and dead Player 2 vitals restore accurately", () => {
      // Given a 2P session with dead P2 (health = 0)
      engine.setTwoPlayerMode(true, true);
      engine.resetLevel("courtyard");
      expect(engine.players.length).toBe(2);

      const [p1, p2] = engine.players;
      p1.health = 80;
      p2.health = 0; // dead P2
      p2.skillPoints = 3;

      // When
      const savedState = engine.createSaveSnapshot();
      expect(savedState.playerCount).toBe(2);
      expect(savedState.p2Health).toBe(0);
      expect(savedState.p2SkillPoints).toBe(3);

      // Restore into fresh single-player engine instance
      const newEngine = new GameEngine();
      newEngine.resetLevel("courtyard");
      expect(newEngine.players.length).toBe(1);

      const restoreSuccess = newEngine.restoreFromSnapshot(savedState);

      // Then
      expect(restoreSuccess).toBe(true);
      expect(newEngine.players.length).toBe(2);
      expect(newEngine.settings.isTwoPlayer).toBe(true);

      const [restoredP1, restoredP2] = newEngine.players;
      expect(restoredP1.health).toBe(80);
      expect(restoredP2.health).toBe(0);
      expect(restoredP2.skillPoints).toBe(3);

      newEngine.stop();
    });
  });
});
