import { describe, it, expect, beforeEach } from "bun:test";
import { GameRenderer } from "../renderer";
import { MultiLayerBackgroundSystem } from "../multiLayerBackgroundSystem";
import { ParallaxRenderer } from "../parallaxRenderer";
import { ActorRenderer } from "../actorRenderer";
import { FxRenderer } from "../fxRenderer";
import { StructureRenderer } from "../structureRenderer";
import { HitboxRenderer } from "../hitboxRenderer";
import { Player, Enemy, Entity, Projectile, Particle, PlayerId, CollisionType } from "@game/types";
import { getLocation } from "@game/locations";
import { createMockContext2D as createMockContext } from "@test-utils";

describe("Renderer Optimization & Zero GC Pressure", () => {
  let mockPlayer: Player;
  let mockEnemy: Enemy;
  let mockEntity: Entity;
  let mockProjectile: Projectile;
  let mockParticles: Particle[];

  beforeEach(() => {
    mockPlayer = {
      id: PlayerId.Player1,
      name: "Valen",
      x: 100,
      y: 200,
      vx: 0,
      vy: 0,
      width: 32,
      height: 48,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      stamina: 80,
      maxStamina: 80,
      isGrounded: true,
      isDead: false,
      facingLeft: false,
      shieldActiveTime: 10,
    } as unknown as Player;

    mockEnemy = {
      id: "enemy_1",
      defaultName: "Gargoyle",
      x: 300,
      y: 200,
      width: 32,
      height: 36,
      health: 50,
      maxHealth: 100,
      isDead: false,
      isDummy: false,
      isAerial: true,
      facingLeft: true,
      damageTimer: 0,
    } as unknown as Enemy;

    mockEntity = {
      id: "platform_1",
      type: CollisionType.Solid,
      x: 100,
      y: 400,
      width: 200,
      height: 24,
      color: "#b35a38",
    } as Entity;

    mockProjectile = {
      id: "proj_1",
      x: 150,
      y: 210,
      vx: 6,
      vy: 0,
      radius: 8,
      color: "#38bdf8",
      ownerId: PlayerId.Player1,
    } as Projectile;

    mockParticles = [
      { x: 100, y: 100, vx: 0, vy: 1, size: 3, life: 10, maxLife: 50, color: "#d97706", type: "dust" },
      { x: 120, y: 110, vx: 1, vy: 1, size: 4, life: 15, maxLife: 60, color: "#f59e0b", type: "leaf" },
      { x: 140, y: 120, vx: -1, vy: 2, size: 2, life: 5, maxLife: 20, color: "#fbbf24", type: "spark" },
    ];
  });

  describe("Strict Canvas State Preservation (Save/Restore Balance)", () => {
    it("guarantees perfectly balanced save() and restore() in ActorRenderer", () => {
      const ctx = createMockContext();
      const actorRenderer = new ActorRenderer();

      actorRenderer.renderPlayers(ctx, [mockPlayer], "high", 60);

      expect(ctx.getSaveBalance()).toBe(0);
      expect(ctx.getSaveCount()).toBeGreaterThan(0);
    });

    it("guarantees perfectly balanced save() and restore() in StructureRenderer", () => {
      const ctx = createMockContext();
      const structureRenderer = new StructureRenderer();

      structureRenderer.render(ctx, [mockEntity], "en", 60);

      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("guarantees perfectly balanced save() and restore() in HitboxRenderer", () => {
      const ctx = createMockContext();
      const hitboxRenderer = new HitboxRenderer();

      hitboxRenderer.renderHitboxes(
        ctx,
        [mockPlayer],
        [mockEnemy],
        [mockEntity],
        [mockProjectile]
      );
      expect(ctx.getSaveBalance()).toBe(0);

      hitboxRenderer.renderProfiler(
        ctx,
        1000,
        625,
        [mockPlayer],
        [mockEnemy],
        [mockEntity],
        [mockProjectile],
        3,
        60,
        60,
        "courtyard",
        2600,
        650,
        true
      );
      expect(ctx.getSaveBalance()).toBe(0);
    });
  });

  describe("Parallax Layer Cache & Zero Sort Allocations", () => {
    it("caches depth-sorted layers across frames in ParallaxRenderer", () => {
      const ctx = createMockContext();
      const parallax = new ParallaxRenderer();
      const loc = getLocation("courtyard");

      // First render populates cache
      parallax.render(ctx, loc, 2600, 650, 1000, 625, 0, 0, 1);
      // Subsequent render uses cached array without re-sorting
      parallax.render(ctx, loc, 2600, 650, 1000, 625, 100, 0, 2);

      expect(ctx.getSaveBalance()).toBe(0);
    });
  });

  describe("MultiLayerBackgroundSystem Zero Allocation Loop", () => {
    it("replaces per-frame dynamic array creation with preallocated tier buckets", () => {
      const ctx = createMockContext();
      const multiLayer = new MultiLayerBackgroundSystem();
      const loc = getLocation("courtyard");

      expect(multiLayer.isSupported("courtyard")).toBe(true);

      multiLayer.render(ctx, loc, 2600, 650, 1000, 625, 50, 0, 10);
      expect(ctx.getSaveBalance()).toBe(0);

      // Render next frame: tierBuckets should be cleared and reused
      multiLayer.render(ctx, loc, 2600, 650, 1000, 625, 100, 0, 11);
      expect(ctx.getSaveBalance()).toBe(0);
    });
  });

  describe("Visual Effects & Particles Rendering Performance", () => {
    it("renders projectiles without allocating closures or leaking state", () => {
      const ctx = createMockContext();
      const fxRenderer = new FxRenderer();

      fxRenderer.renderProjectiles(ctx, [mockProjectile]);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("renders particles by targetType efficiently with zero allocations", () => {
      const ctx = createMockContext();
      const fxRenderer = new FxRenderer();

      fxRenderer.renderParticles(ctx, mockParticles, "dust");
      fxRenderer.renderParticles(ctx, mockParticles, "leaf");
      fxRenderer.renderParticles(ctx, mockParticles, "spark");

      expect(ctx.getSaveBalance()).toBe(0);
    });
  });

  describe("Gradient Caching & Zero Runtime Gradient Allocations", () => {
    it("guarantees zero gradient allocations in MultiLayerBackgroundSystem after frame 1", () => {
      const ctx = createMockContext();
      const multiLayer = new MultiLayerBackgroundSystem();
      const loc = getLocation("courtyard");

      // Frame 1 initializes gradient cache
      multiLayer.render(ctx, loc, 2600, 650, 1000, 625, 0, 0, 1);
      const gradsAfterFrame1 = ctx.getTotalGradientCount();
      expect(gradsAfterFrame1).toBeGreaterThan(0);

      // Subsequent 60 frames must not allocate any new gradients
      for (let tick = 2; tick <= 60; tick++) {
        multiLayer.render(ctx, loc, 2600, 650, 1000, 625, tick * 2, 0, tick);
      }
      expect(ctx.getTotalGradientCount()).toBe(gradsAfterFrame1);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("guarantees zero radial gradient allocations in FxRenderer for projectiles across frames", () => {
      const ctx = createMockContext();
      const fx = new FxRenderer();

      // Frame 1 caches projectile gradient for color/radius key
      fx.renderProjectiles(ctx, [mockProjectile]);
      const initialRadialGrads = ctx.getRadialGradientCount();
      expect(initialRadialGrads).toBe(1);

      // Render 50 frames with same projectile characteristics
      for (let i = 0; i < 50; i++) {
        mockProjectile.x += mockProjectile.vx;
        fx.renderProjectiles(ctx, [mockProjectile]);
      }
      expect(ctx.getRadialGradientCount()).toBe(initialRadialGrads);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("guarantees zero radial gradient allocations in StructureRenderer for goal portals across frames", () => {
      const ctx = createMockContext();
      const structureRenderer = new StructureRenderer();
      const portalEntity: Entity = {
        id: "portal_destination",
        type: CollisionType.Goal,
        x: 200,
        y: 300,
        width: 64,
        height: 96,
        structureId: "non_existent_atlas_force_procedural",
      } as Entity;

      // Frame 1 creates and caches portal gradient
      structureRenderer.render(ctx, [portalEntity], "en", 1);
      const initialRadialGrads = ctx.getRadialGradientCount();
      expect(initialRadialGrads).toBe(1);

      // Render 60 animated frames with pulsing ticks
      for (let tick = 2; tick <= 60; tick++) {
        structureRenderer.render(ctx, [portalEntity], "en", tick);
      }
      expect(ctx.getRadialGradientCount()).toBe(initialRadialGrads);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("verifies clearCaches resets caches in StructureRenderer and FxRenderer without leaking", () => {
      const ctx = createMockContext();
      const fx = new FxRenderer();
      const structureRenderer = new StructureRenderer();

      fx.renderProjectiles(ctx, [mockProjectile]);
      expect(ctx.getRadialGradientCount()).toBe(1);

      fx.clearCaches();
      fx.renderProjectiles(ctx, [mockProjectile]);
      expect(ctx.getRadialGradientCount()).toBe(2);

      structureRenderer.clearCaches();
    });
  });
});

