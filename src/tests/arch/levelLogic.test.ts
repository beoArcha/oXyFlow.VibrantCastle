import { describe, it, expect } from "bun:test";
import { CANONICAL_ENEMY_REGISTRY } from "@game/locations/parser/locationParser";
import { validateLocation, type Violation } from "./helpers/levelLogic";
import { loadLocationCatalog } from "./helpers/levelLogic/catalog";
import { DESIGN_LIMITS } from "./helpers/levelLogic/constants";
import { dashedFlatGap, simulateJump } from "./helpers/levelLogic/envelope";
import { KNOWN_LEVEL_DEFECTS } from "./helpers/levelLogic/knownLevelDefects";
import {
  aBlueprint,
  aGround,
  aSolid,
  GROUND_TOP,
  PLAYER_SPAWN,
  SYNTHETIC_ENEMIES,
  WORLD_WIDTH,
  type BlueprintOptions,
} from "./helpers/levelLogic/syntheticBlueprint";

/**
 * ARCHITECTURAL TEST SUITE: Logical Map Validation
 *
 * A location can satisfy its JSON schema and still be unplayable: platforms the player cannot reach,
 * levers locked behind their own gate, enemies floating in air. Every blueprint is simulated against the
 * player's movement envelope. ERRORs that predate this suite live in knownLevelDefects.ts; fixing a map
 * requires deleting the matching entry.
 */
const catalog = loadLocationCatalog();

const check = (options: BlueprintOptions): Violation[] =>
  validateLocation(aBlueprint(options), SYNTHETIC_ENEMIES);
const has = (violations: Violation[], code: string, subject: string): boolean =>
  violations.some((v) => v.code === code && v.subject === subject);
const keyOf = (v: { code: string; subject: string }): string => `${v.code} ${v.subject}`;

describe("Level logic: shipped locations", () => {
  it("should only list known defects for locations that exist", () => {
    // Arrange
    const listed = Object.keys(KNOWN_LEVEL_DEFECTS);

    // Act
    const unknown = listed.filter((id) => !catalog[id]);

    // Assert
    expect(unknown).toEqual([]);
  });

  for (const id of Object.keys(catalog).sort()) {
    describe(`location ${id}`, () => {
      const found = validateLocation(catalog[id], CANONICAL_ENEMY_REGISTRY, catalog);
      const known = new Set((KNOWN_LEVEL_DEFECTS[id] ?? []).map(keyOf));

      it("should have no ERROR violations outside the known-defects list", () => {
        // Arrange
        const errors = found.filter((v) => v.severity === "error");

        // Act
        const fresh = errors.filter((v) => !known.has(keyOf(v))).map((v) => `${keyOf(v)}: ${v.message}`);

        // Assert
        expect(fresh).toEqual([]);
      });

      it("should have no stale entries in the known-defects list", () => {
        // Arrange
        const occurring = new Set(found.filter((v) => v.severity === "error").map(keyOf));

        // Act
        const stale = [...known].filter((k) => !occurring.has(k));

        // Assert
        expect(stale).toEqual([]);
      });
    });
  }
});

describe("Level logic: movement envelope", () => {
  it("should keep the design rise limit just below the 60 Hz full-hold apex", () => {
    // Arrange
    // The limit is the lowest apex across tick rates (30 Hz integrates ~4px lower than 60 Hz).
    const limit = DESIGN_LIMITS.maxRisePx;

    // Act
    const { apexPx } = simulateJump(12);

    // Assert
    expect(apexPx).toBeGreaterThanOrEqual(limit);
    expect(apexPx).toBeLessThan(limit + 6);
  });

  it("should match the flat gap design limit at top running speed", () => {
    // Arrange
    const limit = DESIGN_LIMITS.maxFlatGapPx;

    // Act
    const { flatGapPx } = simulateJump(12);

    // Assert
    expect(Math.abs(flatGapPx - limit)).toBeLessThan(6);
  });

  it("should add the dash distance without adding height", () => {
    // Arrange
    const plain = simulateJump(12);

    // Act
    const extra = dashedFlatGap(12) - plain.flatGapPx;

    // Assert
    expect(Math.round(extra)).toBeGreaterThanOrEqual(DESIGN_LIMITS.dashDistancePx);
  });
});

describe("Level logic: platform reachability rules", () => {
  const stepAt = (rise: number): BlueprintOptions => ({
    solids: [aGround("ground", 0, WORLD_WIDTH), aSolid("step", 300, GROUND_TOP - rise, 200)],
  });
  const gapOf = (width: number): BlueprintOptions => ({
    solids: [aGround("near_floor", 0, 500), aGround("far_floor", 500 + width, WORLD_WIDTH - 500 - width)],
  });

  it("should accept a step the comfortable jump can climb when it rises 96px", () => {
    // Arrange
    const options = stepAt(DESIGN_LIMITS.comfortableRisePx);

    // Act
    const violations = check(options);

    // Assert
    expect(violations.filter((v) => v.subject === "step")).toEqual([]);
  });

  it("should report UNREACHABLE_PLATFORM when a step rises 130px", () => {
    // Arrange
    const options = stepAt(130);

    // Act
    const violations = check(options);

    // Assert
    expect(has(violations, "UNREACHABLE_PLATFORM", "step")).toBe(true);
  });

  it("should accept a flat gap of 170px", () => {
    // Arrange
    const options = gapOf(DESIGN_LIMITS.comfortableFlatGapPx);

    // Act
    const violations = check(options);

    // Assert
    expect(violations.filter((v) => v.subject === "far_floor")).toEqual([]);
  });

  it("should fail the comfortable tier when a 260px gap has no stepping stone", () => {
    // Arrange
    const options = gapOf(260);

    // Act
    const violations = check(options);

    // Assert
    expect(has(violations, "DASH_ONLY", "far_floor")).toBe(true);
  });

  it("should report UNREACHABLE_PLATFORM when a 420px gap cannot be crossed even with a dash", () => {
    // Arrange
    const options = gapOf(420);

    // Act
    const violations = check(options);

    // Assert
    expect(has(violations, "UNREACHABLE_PLATFORM", "far_floor")).toBe(true);
  });
});

describe("Level logic: levers and gates", () => {
  const leverBehind = (gateId: string): BlueprintOptions => ({
    solids: [aGround("ground", 0, WORLD_WIDTH), aSolid(gateId, 600, 200, 40, 600)],
    levers: [{ id: "lever_1", x: 900, y: GROUND_TOP - 45, targetGateId: gateId }],
  });

  it("should report LEVER_BEHIND_GATE when the lever sits behind the gate it opens", () => {
    // Arrange
    const options = leverBehind("gate_1");

    // Act
    const violations = check(options);

    // Assert
    expect(has(violations, "LEVER_BEHIND_GATE", "lever_1")).toBe(true);
  });

  it("should report LEVER_BAD_TARGET when targetGateId names no solid", () => {
    // Arrange
    const options: BlueprintOptions = {
      levers: [{ id: "lever_1", x: 300, y: GROUND_TOP - 45, targetGateId: "missing_gate" }],
    };

    // Act
    const violations = check(options);

    // Assert
    expect(has(violations, "LEVER_BAD_TARGET", "lever_1")).toBe(true);
  });

  it("should report GATE_BLOCKS_NOTHING when the gate sits where the player can walk around it", () => {
    // Arrange
    const options: BlueprintOptions = {
      solids: [aGround("ground", 0, WORLD_WIDTH), aSolid("gate_1", 600, GROUND_TOP - 50, 40, 50)],
      levers: [{ id: "lever_1", x: 300, y: GROUND_TOP - 45, targetGateId: "gate_1" }],
    };

    // Act
    const violations = check(options);

    // Assert
    expect(has(violations, "GATE_BLOCKS_NOTHING", "gate_1")).toBe(true);
  });

  it("should accept a lever that opens the wall blocking the way to a portal", () => {
    // Arrange
    const options: BlueprintOptions = {
      solids: [aGround("ground", 0, WORLD_WIDTH), aSolid("gate_1", 700, 200, 40, 600)],
      levers: [{ id: "lever_1", x: 300, y: GROUND_TOP - 45, targetGateId: "gate_1" }],
      portals: [{ id: "exit", x: 1200, y: GROUND_TOP - 100, width: 60, height: 100 }],
    };

    // Act
    const errors = check(options).filter((v) => v.severity === "error" && v.code !== "PORTAL_DANGLING");

    // Assert
    expect(errors).toEqual([]);
  });
});

describe("Level logic: enemy and spawn rules", () => {
  const gruntAt = (y: number, patrolMinX: number, patrolMaxX: number, floorWidth = WORLD_WIDTH): BlueprintOptions => ({
    solids: [aGround("ground", 0, floorWidth)],
    enemies: [{ id: "grunt_1", monsterKey: "grunt", x: 200, y, patrolMinX, patrolMaxX }],
  });
  const standingY = GROUND_TOP - 48;

  it("should report ENEMY_PATROL_OFF_PLATFORM when a ground patrol leaves its platform", () => {
    // Arrange
    const options = gruntAt(standingY, 100, 600, 400);

    // Act
    const violations = check(options);

    // Assert
    expect(has(violations, "ENEMY_PATROL_OFF_PLATFORM", "grunt_1")).toBe(true);
  });

  it("should tolerate a ground enemy embedded 7px in the floor", () => {
    // Arrange
    const options = gruntAt(standingY + 7, 100, 300);

    // Act
    const violations = check(options);

    // Assert
    expect(violations.filter((v) => v.subject === "grunt_1")).toEqual([]);
  });

  it("should report ENEMY_IN_SOLID when a ground enemy is embedded 14px", () => {
    // Arrange
    const options = gruntAt(standingY + 14, 100, 300);

    // Act
    const violations = check(options);

    // Assert
    expect(has(violations, "ENEMY_IN_SOLID", "grunt_1")).toBe(true);
  });

  it("should report ENEMY_FLOATING when a ground enemy hovers 30px above the floor", () => {
    // Arrange
    const options = gruntAt(standingY - 30, 100, 300);

    // Act
    const violations = check(options);

    // Assert
    expect(has(violations, "ENEMY_FLOATING", "grunt_1")).toBe(true);
  });

  it("should report SPAWN_INVALID when the default spawn hangs 120px above the floor", () => {
    // Arrange
    const options: BlueprintOptions = { spawn: { x: PLAYER_SPAWN.x, y: PLAYER_SPAWN.y - 120 } };

    // Act
    const violations = check(options);

    // Assert
    expect(has(violations, "SPAWN_INVALID", "spawn:default")).toBe(true);
  });

  it("should report DUP_ID when two placements share an id", () => {
    // Arrange
    const options: BlueprintOptions = {
      solids: [aGround("ground", 0, WORLD_WIDTH), aSolid("ground", 300, GROUND_TOP - 50, 100)],
    };

    // Act
    const violations = check(options);

    // Assert
    expect(has(violations, "DUP_ID", "ground")).toBe(true);
  });
});
