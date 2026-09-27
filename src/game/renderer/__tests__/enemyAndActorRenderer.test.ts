import { describe, it, expect } from "bun:test";
import { EnemyRenderer } from "../enemyRenderer";
import { ActorRenderer } from "../actorRenderer";
import { Enemy, Player, PlayerId } from "../../types";
import { createMockContext2D as createMockContext } from "../../../test-utils";

describe("Podfaza 5.2: EnemyRenderer & ActorRenderer Comprehensive Unit Tests", () => {
  describe("1. EnemyRenderer Logic & Branching", () => {
    it("delegates to AtlasSpriteRenderer when atlas is registered", () => {
      let renderCalled = false;
      let passedOptions: any = null;

      const mockAtlasRenderer = {
        hasAtlas: (id: string) => id === "training_dummy",
        render: (_ctx: any, opts: any) => {
          renderCalled = true;
          passedOptions = opts;
          return true;
        },
      };

      const enemyRenderer = new EnemyRenderer(mockAtlasRenderer as any);
      const ctx = createMockContext();

      const dummyEnemy: Enemy = {
        id: "dummy_1",
        x: 100,
        y: 200,
        width: 32,
        height: 48,
        health: 100,
        maxHealth: 100,
        isDead: false,
        isDummy: true,
        damageTimer: 0,
      } as unknown as Enemy;

      enemyRenderer.render(ctx, [dummyEnemy], 60);

      expect(renderCalled).toBe(true);
      expect(passedOptions.atlasId).toBe("training_dummy");
      expect(passedOptions.animationName).toBe("idle");
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("renders procedural fallback for training dummy when atlas is unavailable", () => {
      const mockAtlasRenderer = {
        hasAtlas: () => false,
        render: () => false,
      };

      const enemyRenderer = new EnemyRenderer(mockAtlasRenderer as any);
      const ctx = createMockContext();

      const dummyEnemy: Enemy = {
        id: "dummy_proc",
        x: 200,
        y: 300,
        width: 32,
        height: 48,
        health: 100,
        maxHealth: 100,
        isDead: false,
        isDummy: true,
        damageTimer: 5, // Flashing
      } as unknown as Enemy;

      enemyRenderer.render(ctx, [dummyEnemy], 60);

      expect(ctx.getFillRectCalls().length).toBeGreaterThan(3);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("renders procedural aerial gargoyle with flapping wings", () => {
      const mockAtlasRenderer = {
        hasAtlas: () => false,
        render: () => false,
      };

      const enemyRenderer = new EnemyRenderer(mockAtlasRenderer as any);
      const ctx = createMockContext();

      const aerialEnemy: Enemy = {
        id: "gargoyle_1",
        x: 400,
        y: 250,
        width: 36,
        height: 36,
        health: 60,
        maxHealth: 100,
        isDead: false,
        isAerial: true,
        damageTimer: 0,
      } as unknown as Enemy;

      enemyRenderer.render(ctx, [aerialEnemy], 45);

      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("renders procedural ground crawler and overhead health bar when damaged", () => {
      const mockAtlasRenderer = {
        hasAtlas: () => false,
        render: () => false,
      };

      const enemyRenderer = new EnemyRenderer(mockAtlasRenderer as any);
      const ctx = createMockContext();

      const crawlerEnemy: Enemy = {
        id: "crawler_1",
        x: 350,
        y: 400,
        width: 40,
        height: 30,
        health: 45,
        maxHealth: 100, // Damaged!
        isDead: false,
        damageTimer: 0,
      } as unknown as Enemy;

      enemyRenderer.render(ctx, [crawlerEnemy], 60);

      // Verify health bar rendered (background and fill)
      const fillCalls = ctx.getFillRectCalls();
      expect(fillCalls.length).toBeGreaterThan(4);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("skips dead enemies completely", () => {
      const mockAtlasRenderer = {
        hasAtlas: () => true,
        render: () => {
          throw new Error("Should not be called for dead enemy");
        },
      };

      const enemyRenderer = new EnemyRenderer(mockAtlasRenderer as any);
      const ctx = createMockContext();

      const deadEnemy: Enemy = {
        id: "dead_1",
        x: 100,
        y: 100,
        width: 32,
        height: 48,
        health: 0,
        maxHealth: 100,
        isDead: true,
      } as unknown as Enemy;

      enemyRenderer.render(ctx, [deadEnemy], 60);
      expect(ctx.getFillRectCalls().length).toBe(0);
    });
  });

  describe("2. ActorRenderer Logic & Visual States", () => {
    it("renders player with crouch, attack reach, and shield active states cleanly", () => {
      const actorRenderer = new ActorRenderer();
      const ctx = createMockContext();

      const player1: Player = {
        id: PlayerId.Player1,
        name: "Valen",
        x: 100,
        y: 200,
        vx: 3,
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
        isAttacking: true,
        isCrouching: true,
        isSliding: false,
        shieldActiveTime: 12,
        damageTimer: 0,
        facingLeft: false,
      } as unknown as Player;

      actorRenderer.renderPlayers(ctx, [player1], "high", 60);

      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("renders sliding player with flashing damage timer cleanly", () => {
      const actorRenderer = new ActorRenderer();
      const ctx = createMockContext();

      const player2: Player = {
        id: PlayerId.Player2,
        name: "Aurelia",
        x: 250,
        y: 200,
        vx: -5,
        vy: 0,
        width: 32,
        height: 48,
        health: 60,
        maxHealth: 100,
        mana: 30,
        maxMana: 50,
        stamina: 40,
        maxStamina: 80,
        isGrounded: true,
        isDead: false,
        isAttacking: false,
        isCrouching: false,
        isSliding: true,
        shieldActiveTime: 0,
        damageTimer: 4,
        facingLeft: true,
      } as unknown as Player;

      actorRenderer.renderPlayers(ctx, [player2], "high", 60);

      expect(ctx.getSaveBalance()).toBe(0);
    });
  });
});
