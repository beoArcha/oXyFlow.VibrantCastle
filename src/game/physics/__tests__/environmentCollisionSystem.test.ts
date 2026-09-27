import { describe, it, expect, beforeEach } from "bun:test";
import {
  EnvironmentCollisionSystem,
  IEnvironmentCollisionContext,
} from "../environmentCollisionSystem";
import { Player, Entity, CollisionType, PlayerId } from "../../types";
import { ICollisionEngine } from "../collisions";
import { createMockPlayer } from "@test-utils";

describe("EnvironmentCollisionSystem (SOLID & Zero Allocation)", () => {
  let mockPlayer: Player;
  let players: Player[];
  let entities: Entity[];
  let bursts: Array<{ x: number; y: number; color: string; type: string; count: number }>;
  let narratedIds: string[];
  let goalsReached: Array<Entity | undefined>;
  let leversActivated: string[];
  let noClipMode: boolean;
  let levelTransitionPending: boolean;
  let mockCollisionEngine: ICollisionEngine;
  let context: IEnvironmentCollisionContext;
  let system: EnvironmentCollisionSystem;

  beforeEach(() => {
    bursts = [];
    narratedIds = [];
    goalsReached = [];
    leversActivated = [];
    noClipMode = false;
    levelTransitionPending = false;

    mockPlayer = createMockPlayer({
      isGrounded: false,
      mana: 50,
      stamina: 80,
    });

    players = [mockPlayer];
    entities = [];

    mockCollisionEngine = {
      checkIntersection: (p, e) => {
        return (
          p.x < e.x + e.width &&
          p.x + p.width > e.x &&
          p.y < e.y + e.height &&
          p.y + p.height > e.y
        );
      },
      resolve: (p, e, callbacks) => {
        if (e.type === CollisionType.Solid || e.type === CollisionType.OneWay) {
          // Snap player feet to top of platform
          p.y = e.y - p.height;
          p.vy = 0;
        } else if (e.type === CollisionType.Goal) {
          callbacks?.onGoalReached?.(e);
        } else if (e.type === CollisionType.Lever) {
          callbacks?.onLeverActivated?.(e.id);
        }
      },
      registerStrategy: () => { },
    };

    context = {
      collisionEngine: mockCollisionEngine,
      triggerNarration: (id) => narratedIds.push(id),
      onGoalReached: (goalEntity) => goalsReached.push(goalEntity),
      onLeverActivated: (leverId) => leversActivated.push(leverId),
      spawnBurst: (x, y, color, type, count) => bursts.push({ x, y, color, type, count }),
      isNoClip: () => noClipMode,
      isLevelTransitionPending: () => levelTransitionPending,
    };

    system = new EnvironmentCollisionSystem();
  });

  describe("Grounded State & Platform Carriage", () => {
    it("makes player grounded and emits landing dust when landing on solid platform", () => {
      // Platform directly below player
      const platform: Entity = {
        id: "plat_1",
        x: 80,
        y: 140, // player is at y: 100, height: 48 -> bottom is 148, overlaps platform
        width: 100,
        height: 20,
        type: CollisionType.Solid,
        vx: 2.5,
        vy: 0,
      };
      entities = [platform];

      expect(mockPlayer.isGrounded).toBe(false);

      system.resolveEnvironmentCollisions(players, entities, 2000, 0, context);

      expect(mockPlayer.isGrounded).toBe(true);
      expect(mockPlayer.standingPlatformId).toBe("plat_1");
      expect(mockPlayer.platformVelocityX).toBe(2.5);
      // Emitted landing dust
      const dustBurst = bursts.find((b) => b.type === "dust");
      expect(dustBurst).toBeDefined();
      expect(dustBurst?.color).toBe("#fed7aa");
    });

    it("resets grounded state and carriage velocities when walking off platform ledge", () => {
      mockPlayer.isGrounded = true;
      mockPlayer.standingPlatformId = "plat_1";
      mockPlayer.platformVelocityX = 3;

      // Platform is far to the right, player is in mid-air
      const farPlatform: Entity = {
        id: "plat_1",
        x: 500,
        y: 200,
        width: 100,
        height: 20,
        type: CollisionType.Solid,
      };
      entities = [farPlatform];

      system.resolveEnvironmentCollisions(players, entities, 2000, 0, context);

      expect(mockPlayer.isGrounded).toBe(false);
      expect(mockPlayer.standingPlatformId).toBeNull();
      expect(mockPlayer.platformVelocityX).toBe(0);
      expect(mockPlayer.platformVelocityY).toBe(0);
    });
  });

  describe("Shield Absorption vs Hazards", () => {
    it("absorbs hazard damage with purple spark burst when shield is active", () => {
      mockPlayer.shieldActiveTime = 60;

      const spikes: Entity = {
        id: "hazard_spikes",
        x: 100,
        y: 100,
        width: 32,
        height: 48,
        type: CollisionType.Hazard,
      };
      entities = [spikes];

      system.resolveEnvironmentCollisions(players, entities, 2000, 0, context);

      const sparkBurst = bursts.find((b) => b.type === "spark" && b.color === "#a855f7");
      expect(sparkBurst).toBeDefined();
      expect(sparkBurst?.count).toBe(8);
      // Should not have triggered goals or levers
      expect(goalsReached.length).toBe(0);
    });
  });

  describe("Portal Cooldowns & Level Boundaries", () => {
    it("skips goal portal interaction when portalCooldownTimer is greater than 0", () => {
      const portal: Entity = {
        id: "portal_gate",
        x: 100,
        y: 100,
        width: 48,
        height: 80,
        type: CollisionType.Goal,
      };
      entities = [portal];

      // Cooldown active
      system.resolveEnvironmentCollisions(players, entities, 2000, 30, context);
      expect(goalsReached.length).toBe(0);

      // Cooldown expired
      system.resolveEnvironmentCollisions(players, entities, 2000, 0, context);
      expect(goalsReached.length).toBe(1);
    });

    it("clamps player horizontal position to level boundaries", () => {
      // Left boundary clamp
      mockPlayer.x = -50;
      system.resolveEnvironmentCollisions(players, entities, 2000, 0, context);
      expect(mockPlayer.x).toBe(0);

      // Right boundary clamp
      mockPlayer.x = 2050;
      system.resolveEnvironmentCollisions(players, entities, 2000, 0, context);
      expect(mockPlayer.x).toBe(2000 - mockPlayer.width);
    });

    it("bypasses collision resolution completely when noClip is active", () => {
      noClipMode = true;
      const wall: Entity = {
        id: "solid_wall",
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        type: CollisionType.Solid,
      };
      entities = [wall];

      system.resolveEnvironmentCollisions(players, entities, 2000, 0, context);

      expect(mockPlayer.isGrounded).toBe(false);
      expect(bursts.length).toBe(0);
    });
  });

  describe("GameEngine Integration & Delegation", () => {
    it("exposes environmentCollisions and executes simulation without regressions", async () => {
      const { GameEngine } = await import("../../loop/engine");
      const engine = new GameEngine();

      expect(engine.environmentCollisions).toBeDefined();

      // Running fixedUpdate executes environmental collision resolution seamlessly
      expect(() => engine.fixedUpdate(1.0)).not.toThrow();

      // Advance simulation until player settles on ground
      for (let i = 0; i < 40; i++) {
        engine.fixedUpdate(1.0);
      }
      expect(engine.players[0].isGrounded).toBe(true);
    });
  });
});

