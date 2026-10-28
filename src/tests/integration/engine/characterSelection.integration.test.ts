import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import defaultGameEngine, { GameEngine } from "@game/loop/engine";
import { PlayerId, InputMap } from "@game/types";
import { GameInputEngine } from "@game/loop/input";
import { createDefaultInventory } from "@game/logic/inventory";
import { SettingsStorage } from "@context/settings/settingsStorage";

class TestInputEngine extends GameInputEngine {
  private customInputs: Record<PlayerId, Partial<InputMap>> = {
    [PlayerId.Player1]: {},
    [PlayerId.Player2]: {},
  };

  public setAction(id: PlayerId, action: keyof InputMap, pressed: boolean): void {
    this.customInputs[id][action] = pressed;
  }

  public override getInputs(id: PlayerId): InputMap {
    const custom = this.customInputs[id];
    return {
      left: !!custom.left,
      right: !!custom.right,
      up: !!custom.up,
      down: !!custom.down,
      jump: !!custom.jump,
      action1: !!custom.action1,
      action2: !!custom.action2,
      magic1: !!custom.magic1,
      magic2: !!custom.magic2,
      potion1: !!custom.potion1,
      potion2: !!custom.potion2,
      potion3: !!custom.potion3,
    };
  }
}

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
 * 8. Single-player save restoration into an active two-player session collapsing topology.
 * 9. Live gameplay execution of all 4 canonical starter spells.
 * 10. Engine defaultPrimaryCharacter synchronization across level resets and settings import.
 */
describe("Given a fresh GameEngine instance", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
    defaultGameEngine.setDefaultPrimaryCharacter("valen");
  });

  afterEach(() => {
    engine.stop();
    defaultGameEngine.setDefaultPrimaryCharacter("valen");
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

    it("Then non-default unlocked skills, spell assignments, and equipment are preserved across character switches", () => {
      // Given: Valen with customized progression
      engine.resetLevel("courtyard");
      const p1 = engine.players[0];
      p1.unlockedSkills = ["solar_flare", "prismatic_shield", "valen_special_mastery"];
      p1.primarySpellId = "prismatic_shield";
      p1.secondarySpellId = "solar_flare";
      p1.skillPoints = 15;
      p1.score = 900;
      p1.inventory.backpack[1] = {
        id: "mystic_blade",
        nameKey: "item.mystic_blade",
        descriptionKey: "desc",
        type: 0 as any,
        icon: "blade.png",
        rarity: "rare",
      };

      // When: Switching to Aurelia
      expect(engine.setPlayerCharacter(0, "aurelia")).toBe(true);
      expect(p1.characterId).toBe("aurelia");
      expect(p1.primarySpellId).toBe("aether_bolt");
      expect(p1.unlockedSkills).not.toContain("valen_special_mastery");

      // Customize Aurelia's progression
      p1.unlockedSkills.push("aurelia_arcane_surge");
      p1.primarySpellId = "aether_barrier";
      p1.inventory.backpack[2] = {
        id: "sorcerer_ring",
        nameKey: "item.sorcerer_ring",
        descriptionKey: "desc",
        type: 1 as any,
        icon: "ring.png",
        rarity: "legendary",
      };

      // When: Switching back to Valen
      expect(engine.setPlayerCharacter(0, "valen")).toBe(true);
      expect(p1.characterId).toBe("valen");
      // Then: Valen's state is preserved without wipe
      expect(p1.unlockedSkills).toEqual(["solar_flare", "prismatic_shield", "valen_special_mastery"]);
      expect(p1.primarySpellId).toBe("prismatic_shield");
      expect(p1.secondarySpellId).toBe("solar_flare");
      expect(p1.skillPoints).toBe(15);
      expect(p1.score).toBe(900);
      expect(p1.inventory.backpack[1]?.id).toBe("mystic_blade");

      // When: Switching back to Aurelia
      expect(engine.setPlayerCharacter(0, "aurelia")).toBe(true);
      expect(p1.characterId).toBe("aurelia");
      // Then: Aurelia's state is also preserved without wipe
      expect(p1.unlockedSkills).toContain("aurelia_arcane_surge");
      expect(p1.primarySpellId).toBe("aether_barrier");
      expect(p1.inventory.backpack[2]?.id).toBe("sorcerer_ring");
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
    it("Then P1 and P2 exchange identities cleanly", () => {
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

  describe("When casting starter spells for both archetypes", () => {
    it("Then executes all 4 canonical starter spells successfully with proper mana consumption and effects", () => {
      const inputs = new TestInputEngine();
      const castEngine = new GameEngine({ inputs });
      castEngine.resetLevel("courtyard");
      const p1 = castEngine.players[0];

      // 1. Valen: Cast solar_flare (primary projectile spell)
      expect(p1.characterId).toBe("valen");
      expect(p1.primarySpellId).toBe("solar_flare");
      const initialManaValen = p1.mana;
      inputs.setAction(PlayerId.Player1, "magic1", true);
      castEngine.fixedUpdate(1.0);
      inputs.setAction(PlayerId.Player1, "magic1", false);

      expect(p1.mana).toBeLessThan(initialManaValen);
      expect(castEngine.projectiles.length).toBeGreaterThan(0);
      expect(castEngine.projectiles[0].skillId).toBe("solar_flare");

      // Reset timers & replenish resources
      castEngine.projectiles = [];
      p1.magicCooldown = 0;
      p1.isCasting = false;
      p1.mana = p1.maxMana;

      // 2. Valen: Cast prismatic_shield (secondary defensive spell)
      expect(p1.secondarySpellId).toBe("prismatic_shield");
      inputs.setAction(PlayerId.Player1, "magic2", true);
      castEngine.fixedUpdate(1.0);
      inputs.setAction(PlayerId.Player1, "magic2", false);

      expect(p1.mana).toBeLessThan(p1.maxMana);
      expect(p1.shieldActiveTime).toBeGreaterThan(0);

      // 3. Switch to Aurelia
      castEngine.setPlayerCharacter(0, "aurelia");
      expect(p1.characterId).toBe("aurelia");
      expect(p1.primarySpellId).toBe("aether_bolt");
      expect(p1.secondarySpellId).toBe("aether_barrier");
      p1.magicCooldown = 0;
      p1.isCasting = false;
      p1.mana = p1.maxMana;
      p1.shieldActiveTime = 0;

      // 4. Aurelia: Cast aether_bolt (primary projectile spell)
      inputs.setAction(PlayerId.Player1, "magic1", true);
      castEngine.fixedUpdate(1.0);
      inputs.setAction(PlayerId.Player1, "magic1", false);

      expect(p1.mana).toBeLessThan(p1.maxMana);
      expect(castEngine.projectiles.length).toBeGreaterThan(0);
      expect(castEngine.projectiles[0].skillId).toBe("aether_bolt");

      // Reset timers & replenish resources
      castEngine.projectiles = [];
      p1.magicCooldown = 0;
      p1.isCasting = false;
      p1.mana = p1.maxMana;

      // 5. Aurelia: Cast aether_barrier (secondary defensive spell)
      inputs.setAction(PlayerId.Player1, "magic2", true);
      castEngine.fixedUpdate(1.0);
      inputs.setAction(PlayerId.Player1, "magic2", false);

      expect(p1.mana).toBeLessThan(p1.maxMana);
      expect(p1.shieldActiveTime).toBeGreaterThan(0);

      castEngine.stop();
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

    it("Then single-player save loaded into an active two-player session collapses topology cleanly to 1P", () => {
      // Given: Active 2P engine
      engine.setTwoPlayerMode(true, true);
      engine.resetLevel("courtyard");
      expect(engine.players.length).toBe(2);
      expect(engine.settings.isTwoPlayer).toBe(true);

      // Create a 1P save snapshot with Aurelia
      const singlePlayerEngine = new GameEngine();
      singlePlayerEngine.resetLevel("courtyard");
      singlePlayerEngine.setPlayerCharacter(0, "aurelia");
      singlePlayerEngine.players[0].health = 65;
      singlePlayerEngine.players[0].score = 420;
      const onePlayerSave = singlePlayerEngine.createSaveSnapshot();
      expect(onePlayerSave.playerCount).toBe(1);
      expect(onePlayerSave.p1CharacterId).toBe("aurelia");
      singlePlayerEngine.stop();

      // When: Restoring 1P save into active 2P engine
      const restoreSuccess = engine.restoreFromSnapshot(onePlayerSave);

      // Then
      expect(restoreSuccess).toBe(true);
      expect(engine.players.length).toBe(1);
      expect(engine.settings.isTwoPlayer).toBe(false);
      expect(engine.players[0].characterId).toBe("aurelia");
      expect(engine.players[0].health).toBe(65);
      expect(engine.players[0].score).toBe(420);
      expect(engine.players[0].primarySpellId).toBe("aether_bolt");
    });
  });

  describe("When resetting levels and synchronizing preferences", () => {
    it("Then resetLevel without preserving stats respects setDefaultPrimaryCharacter", () => {
      engine.setDefaultPrimaryCharacter("aurelia");
      expect(engine.getDefaultPrimaryCharacter()).toBe("aurelia");

      // Reset without preserving stats
      engine.resetLevel("courtyard", undefined, false);
      expect(engine.players[0].characterId).toBe("aurelia");
      expect(engine.players[0].primarySpellId).toBe("aether_bolt");

      // Change default to Valen and reset
      engine.setDefaultPrimaryCharacter("valen");
      engine.resetLevel("courtyard", undefined, false);
      expect(engine.players[0].characterId).toBe("valen");
      expect(engine.players[0].primarySpellId).toBe("solar_flare");
    });

    it("Then settings import with primaryCharacter preference drives subsequent level resets", () => {
      const storage = new SettingsStorage();

      // Import settings with Aurelia
      const importedAurelia = storage.importFromJson(
        JSON.stringify({ primaryCharacter: "aurelia" })
      );
      expect(importedAurelia?.primaryCharacter).toBe("aurelia");

      // Reset defaultGameEngine level without preserving stats
      defaultGameEngine.resetLevel("courtyard", undefined, false);
      expect(defaultGameEngine.players[0].characterId).toBe("aurelia");

      // Import settings with Valen
      const importedValen = storage.importFromJson(
        JSON.stringify({ primaryCharacter: "valen" })
      );
      expect(importedValen?.primaryCharacter).toBe("valen");

      // Reset defaultGameEngine level without preserving stats
      defaultGameEngine.resetLevel("courtyard", undefined, false);
      expect(defaultGameEngine.players[0].characterId).toBe("valen");
    });
  });
});
