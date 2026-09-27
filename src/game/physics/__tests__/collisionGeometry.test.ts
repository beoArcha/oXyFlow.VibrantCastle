import { describe, it, expect, beforeEach } from "bun:test";
import {
  CollisionEngine,
  SolidCollisionStrategy,
  OneWayCollisionStrategy,
  HazardCollisionStrategy,
  TriggerCollisionStrategy,
  LeverCollisionStrategy,
  GoalCollisionStrategy,
  ICollisionContext,
} from "../collisions";
import { Player, Entity, CollisionType } from "../../types";
import { createMockPlayer } from "../../../test-utils/mockEntities";
import { statsManager } from "../../logic/stats";

describe("Collision Geometry & Strategy Resolution", () => {
  let engine: CollisionEngine;
  let player: Player;
  let mockContext: ICollisionContext;
  let narratedTriggers: string[];
  let activatedLevers: string[];
  let reachedGoals: Entity[];

  beforeEach(() => {
    narratedTriggers = [];
    activatedLevers = [];
    reachedGoals = [];

    mockContext = {
      triggerNarration: (id: string) => {
        narratedTriggers.push(id);
      },
      onLeverActivated: (triggerId: string) => {
        activatedLevers.push(triggerId);
      },
      onGoalReached: (entity?: Entity) => {
        if (entity) reachedGoals.push(entity);
      },
    };

    engine = new CollisionEngine();
    player = createMockPlayer({
      x: 100,
      y: 100,
      width: 40,
      height: 60,
      vx: 0,
      vy: 0,
      isGrounded: false,
    });
  });

  describe("CollisionEngine AABB intersection checks", () => {
    it("returns true when bounding boxes overlap", () => {
      const entity: Entity = {
        id: "block_1",
        x: 120,
        y: 120,
        width: 50,
        height: 50,
        type: CollisionType.Solid,
      };

      expect(engine.checkIntersection(player, entity)).toBe(true);
    });

    it("returns false when bounding boxes do not overlap", () => {
      const entity: Entity = {
        id: "block_2",
        x: 200,
        y: 200,
        width: 50,
        height: 50,
        type: CollisionType.Solid,
      };

      expect(engine.checkIntersection(player, entity)).toBe(false);
    });

    it("registers and delegates to custom collision strategies (OCP)", () => {
      let customHandled = false;
      const customStrategy = {
        handle: () => {
          customHandled = true;
        },
      };

      engine.registerStrategy(CollisionType.Solid, customStrategy);

      const entity: Entity = {
        id: "custom_block",
        x: 110,
        y: 110,
        width: 40,
        height: 40,
        type: CollisionType.Solid,
      };

      engine.resolve(player, entity, mockContext);
      expect(customHandled).toBe(true);
    });
  });

  describe("SolidCollisionStrategy", () => {
    let solid: SolidCollisionStrategy;

    beforeEach(() => {
      solid = new SolidCollisionStrategy();
    });

    it("resolves landing from above onto solid platform floor", () => {
      const platform: Entity = {
        id: "floor_1",
        x: 80,
        y: 155, // player feet are at y: 160, so overlapY is 5
        width: 100,
        height: 20,
        type: CollisionType.Solid,
        vx: 2,
      };

      player.vy = 4; // descending
      solid.handle(player, platform);

      expect(player.y).toBe(platform.y - player.height);
      expect(player.vy).toBe(0);
      expect(player.isGrounded).toBe(true);
      expect(player.standingPlatformId).toBe("floor_1");
      expect(player.platformVelocityX).toBe(2);
    });

    it("resolves head-banging on solid ceiling from below", () => {
      const ceiling: Entity = {
        id: "ceiling_1",
        x: 80,
        y: 70,
        width: 100,
        height: 40, // ceiling bottom is at y: 110. Player top is at y: 100
        type: CollisionType.Solid,
      };

      player.y = 95;
      player.vy = -6; // moving up
      player.isJumping = true;
      player.jumpHoldTimer = 5;

      solid.handle(player, ceiling);

      expect(player.vy).toBe(0);
      expect(player.isJumping).toBe(false);
      expect(player.jumpHoldTimer).toBe(0);
    });

    it("nudges player horizontally when catching ceiling corner within tolerance", () => {
      const block: Entity = {
        id: "corner_block",
        x: 135, // player x: 100..140. Only 5px overlap on X!
        y: 60,
        width: 50,
        height: 50,
        type: CollisionType.Solid,
      };

      player.y = 95;
      player.vy = -5; // jumping up

      solid.handle(player, block);

      // Should be nudged horizontally to the left away from the corner
      expect(player.x).toBeLessThan(100);
    });

    it("resolves horizontal wall collision pushing player back", () => {
      const wall: Entity = {
        id: "wall_left",
        x: 70,
        y: 90,
        width: 40, // right edge is at 110, player left edge is 100
        height: 80,
        type: CollisionType.Solid,
      };

      player.vx = -4; // moving into wall
      solid.handle(player, wall);

      expect(player.x).toBeGreaterThanOrEqual(110);
      expect(player.vx).toBe(0);
    });
  });

  describe("OneWayCollisionStrategy (Semi-permeable platforms)", () => {
    let oneWay: OneWayCollisionStrategy;
    let platform: Entity;

    beforeEach(() => {
      oneWay = new OneWayCollisionStrategy();
      platform = {
        id: "scaffold_1",
        x: 80,
        y: 150,
        width: 100,
        height: 10,
        type: CollisionType.OneWay,
      };
    });

    it("allows player jumping upward to pass cleanly through from below", () => {
      player.y = 130; // feet at 190, crossing scaffold
      player.vy = -6; // ascending

      oneWay.handle(player, platform);

      expect(player.isGrounded).toBe(false);
      expect(player.vy).toBe(-6);
    });

    it("solidly lands player descending onto top edge of platform", () => {
      player.y = 92; // feet at 152 (crossed top edge 150 by 2px)
      player.vy = 4; // descending (previous feet were at 148, above platform)

      oneWay.handle(player, platform);

      expect(player.y).toBe(platform.y - player.height);
      expect(player.vy).toBe(0);
      expect(player.isGrounded).toBe(true);
      expect(player.standingPlatformId).toBe("scaffold_1");
    });
  });

  describe("HazardCollisionStrategy", () => {
    let hazard: HazardCollisionStrategy;
    let spikes: Entity;

    beforeEach(() => {
      hazard = new HazardCollisionStrategy();
      spikes = {
        id: "spikes_1",
        x: 100,
        y: 140,
        width: 40,
        height: 20,
        type: CollisionType.Hazard,
      };
    });

    it("inflicts 20 damage, knocks player back, and triggers enemy hit narration", () => {
      player.health = 50;
      player.x = 90; // to the left of spikes center

      hazard.handle(player, spikes, mockContext);

      expect(player.health).toBe(30);
      expect(player.vx).toBe(-6); // knockback away to the left
      expect(player.vy).toBe(-5); // knockback upward
      expect(player.isGrounded).toBe(false);
      expect(narratedTriggers).toContain("narration_enemy_hit");
    });

    it("marks player dead and triggers defeat narration on fatal hazard damage", () => {
      player.health = 10;

      hazard.handle(player, spikes, mockContext);

      expect(player.health).toBe(0);
      expect(player.isDead).toBe(true);
      expect(narratedTriggers).toContain("narration_defeat");
    });

    it("ignores dead players", () => {
      player.isDead = true;
      player.health = 0;

      hazard.handle(player, spikes, mockContext);

      expect(narratedTriggers.length).toBe(0);
    });
  });

  describe("Interactive & Narrative Strategies (Trigger, Lever, Goal)", () => {
    it("TriggerCollisionStrategy activates once and emits narration", () => {
      const strategy = new TriggerCollisionStrategy();
      const triggerEntity: Entity = {
        id: "lore_stone",
        x: 100,
        y: 100,
        width: 40,
        height: 40,
        type: CollisionType.Trigger,
        triggerId: "narration_ancient_ruins",
        isActivated: false,
      };

      strategy.handle(player, triggerEntity, mockContext);
      expect(triggerEntity.isActivated).toBe(true);
      expect(narratedTriggers).toContain("narration_ancient_ruins");

      // Second trigger has no effect
      strategy.handle(player, triggerEntity, mockContext);
      expect(narratedTriggers.length).toBe(1);
    });

    it("LeverCollisionStrategy activates when player attacks it", () => {
      const strategy = new LeverCollisionStrategy();
      const lever: Entity = {
        id: "gate_switch",
        x: 100,
        y: 100,
        width: 30,
        height: 30,
        type: CollisionType.Lever,
        triggerId: "gate_1",
        isActivated: false,
      };

      // Player touches without attacking -> does not activate
      player.isAttacking = false;
      strategy.handle(player, lever, mockContext);
      expect(lever.isActivated).toBe(false);

      // Player attacks -> activates switch and invokes onLeverActivated
      player.isAttacking = true;
      strategy.handle(player, lever, mockContext);
      expect(lever.isActivated).toBe(true);
      expect(activatedLevers).toContain("gate_1");
      expect(narratedTriggers).toContain("narration_lever");
    });

    it("GoalCollisionStrategy marks goal reached and notifies context", () => {
      const strategy = new GoalCollisionStrategy();
      const goal: Entity = {
        id: "level_exit",
        x: 100,
        y: 100,
        width: 50,
        height: 80,
        type: CollisionType.Goal,
        isActivated: false,
      };

      strategy.handle(player, goal, mockContext);

      expect(goal.isActivated).toBe(true);
      expect(reachedGoals).toContain(goal);
    });
  });
});
