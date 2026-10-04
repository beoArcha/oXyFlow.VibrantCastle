import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { PlayerId } from "@game/types";
import { LocationId } from "@game/locations/types";
import { LOCATION_REGISTRY } from "@game/locations/registry";

/**
 * INTEGRATION TEST SUITE: Level Loading & World Spawning
 *
 * Verifies end-to-end level loading from data definitions into live engine simulation:
 * 1. All 5 canonical location definitions load and instantiate collision geometry.
 * 2. Player spawns accurately within room boundaries in single-player and co-op modes.
 * 3. Enemies instantiate from monster templates within map geometry bounds.
 * 4. Room transitions via portals update location state and lifecycle cleanly.
 */
describe("Level Loading and Spawning Integration Tests", () => {
  let engine: GameEngine;

  const CANONICAL_LEVELS: LocationId[] = [
    "courtyard",
    "thorn_chasm",
    "clocktower",
    "aether_sanctuary",
    "grand_bastion",
  ];

  beforeEach(() => {
    engine = new GameEngine();
  });

  afterEach(() => {
    engine.stop();
  });

  describe("Canonical Location Loading", () => {
    for (const locationId of CANONICAL_LEVELS) {
      it(`loads level "${locationId}" from @data and initializes world boundaries`, () => {
        engine.resetLevel(locationId);

        expect(engine.currentLocationId).toBe(locationId);
        expect(engine.currentLocation).toBeDefined();

        const loc = engine.currentLocation!;
        expect(loc.width).toBeGreaterThan(0);
        expect(loc.height).toBeGreaterThan(0);
        expect(engine.entities.length).toBeGreaterThan(0);

        // Verify Player 1 was spawned within room bounds
        expect(engine.players.length).toBe(1);
        const p1 = engine.players[0];
        expect(p1.id).toBe(PlayerId.Player1);
        expect(p1.x).toBeGreaterThanOrEqual(0);
        expect(p1.x).toBeLessThanOrEqual(loc.width);
        expect(p1.y).toBeGreaterThanOrEqual(0);
        expect(p1.y).toBeLessThanOrEqual(loc.height);
        expect(p1.health).toBeGreaterThan(0);
      });
    }
  });

  describe("Co-op Two-Player Spawning", () => {
    it("spawns both Player 1 and Player 2 when two-player mode is enabled", () => {
      engine.setTwoPlayerMode(true, true);
      engine.resetLevel("courtyard");

      expect(engine.players.length).toBe(2);

      const [p1, p2] = engine.players;
      expect(p1.id).toBe(PlayerId.Player1);
      expect(p2.id).toBe(PlayerId.Player2);

      expect(p1.characterId).toBe("valen");
      expect(p2.characterId).toBe("aurelia");

      expect(p1.health).toBeGreaterThan(0);
      expect(p2.health).toBeGreaterThan(0);
    });
  });

  describe("Enemy Spawning Invariants", () => {
    it("instantiates level enemies with positive health within map boundaries", () => {
      engine.resetLevel("courtyard");

      const loc = engine.currentLocation!;
      expect(engine.enemies.length).toBeGreaterThan(0);

      for (const enemy of engine.enemies) {
        expect(enemy.id).toBeDefined();
        expect(enemy.health).toBeGreaterThan(0);
        expect(enemy.maxHealth).toBeGreaterThanOrEqual(enemy.health);
        expect(enemy.width).toBeGreaterThan(0);
        expect(enemy.height).toBeGreaterThan(0);

        // Position invariants
        expect(enemy.x).toBeGreaterThanOrEqual(0);
        expect(enemy.x).toBeLessThanOrEqual(loc.width);
        expect(enemy.y).toBeGreaterThanOrEqual(0);
        expect(enemy.y).toBeLessThanOrEqual(loc.height);
      }
    });
  });

  describe("Portal Transition Routing", () => {
    it("transitions between connected locations via portal destination navigation", () => {
      engine.resetLevel("courtyard");
      const courtyardDef = LOCATION_REGISTRY["courtyard"];
      expect(courtyardDef.portals).toBeDefined();
      expect(courtyardDef.portals!.length).toBeGreaterThan(0);

      const firstPortal = courtyardDef.portals![0];
      const targetLocationId = firstPortal.targetLocationId;

      // Navigate to destination location
      engine.resetLevel(targetLocationId);
      expect(engine.currentLocationId).toBe(targetLocationId);

      // Verify new room is initialized
      const newLoc = engine.currentLocation!;
      expect(newLoc.id).toBe(targetLocationId);
      expect(engine.players.length).toBeGreaterThanOrEqual(1);
    });
  });
});
