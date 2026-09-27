import { describe, it, expect } from "bun:test";
import { MultiLayerBackgroundSystem, defaultMultiLayerBackgroundSystem } from "../multiLayerBackgroundSystem";
import { AtmosphericSectorRenderer, defaultAtmosphericSectorRenderer } from "../background/atmospheric/atmosphericSectorRenderer";
import { DebugProfilerOverlay, defaultDebugProfilerOverlay } from "../debugProfilerOverlay";
import { HitboxRenderer } from "../hitboxRenderer";
import { GameRenderer } from "../renderer";
import { getLocation } from "../../locations";
import { Player, Enemy, Entity, Projectile, PlayerId, CollisionType } from "../../types";
import { createMockContext2D as createMockContext } from "../../../test-utils";

describe("MultiLayerBackgroundSystem & DebugProfilerOverlay", () => {
  describe("MultiLayerBackgroundSystem AssetLoader & Subsystem Integration", () => {
    it("renders all supported sectors cleanly without throwing", () => {
      const sectors = ["courtyard", "thorn_chasm", "clocktower", "aether_sanctuary", "grand_bastion"];
      const multiLayer = new MultiLayerBackgroundSystem();

      for (const sector of sectors) {
        const ctx = createMockContext();
        const loc = getLocation(sector);
        expect(multiLayer.isSupported(sector)).toBe(true);

        multiLayer.render(ctx, loc, 3000, 1000, 1000, 625, 200, 100, 60);
        expect(ctx.getSaveBalance()).toBe(0);
      }
    });

    it("supports injecting custom AtmosphericSectorRenderer via DIP", () => {
      let atmosphereCalled = false;
      let proceduralCalled = false;

      const mockAtmospheric = {
        renderSectorAtmosphere: () => {
          atmosphereCalled = true;
        },
        renderProceduralFarBackdrop: () => {
          proceduralCalled = true;
        },
        clearCaches: () => {},
      };

      const multiLayer = new MultiLayerBackgroundSystem({
        atmosphericRenderer: mockAtmospheric as any,
      });

      const ctx = createMockContext();
      const loc = getLocation("thorn_chasm");
      multiLayer.render(ctx, loc, 3000, 1000, 1000, 625, 100, 50, 1);

      expect(atmosphereCalled).toBe(true);
    });
  });

  describe("AtmosphericSectorRenderer Standalone Tests", () => {
    it("renders atmospheric mist for Thorn Chasm with cached linear gradients", () => {
      const ctx = createMockContext();
      const atmospheric = new AtmosphericSectorRenderer();

      // Frame 1
      atmospheric.renderSectorAtmosphere(ctx, "thorn_chasm", 1000, 625, 1);
      const gradsFrame1 = ctx.getLinearGradientCount();
      expect(gradsFrame1).toBe(1);
      expect(ctx.getSaveBalance()).toBe(0);

      // Frame 2: 0 new gradient allocations
      atmospheric.renderSectorAtmosphere(ctx, "thorn_chasm", 1000, 625, 2);
      expect(ctx.getLinearGradientCount()).toBe(gradsFrame1);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("renders solar glow for Grand Bastion with cached linear gradients", () => {
      const ctx = createMockContext();
      const atmospheric = new AtmosphericSectorRenderer();

      atmospheric.renderSectorAtmosphere(ctx, "grand_bastion", 1000, 625, 1);
      expect(ctx.getLinearGradientCount()).toBe(1);
      expect(ctx.getSaveBalance()).toBe(0);

      atmospheric.renderSectorAtmosphere(ctx, "grand_bastion", 1000, 625, 2);
      expect(ctx.getLinearGradientCount()).toBe(1);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("renders steam for Clocktower with cached linear gradients", () => {
      const ctx = createMockContext();
      const atmospheric = new AtmosphericSectorRenderer();

      atmospheric.renderSectorAtmosphere(ctx, "clocktower", 1000, 625, 1);
      expect(ctx.getLinearGradientCount()).toBe(1);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("renders aura for Aether Sanctuary with cached radial gradients", () => {
      const ctx = createMockContext();
      const atmospheric = new AtmosphericSectorRenderer();

      atmospheric.renderSectorAtmosphere(ctx, "aether_sanctuary", 1000, 625, 1);
      expect(ctx.getRadialGradientCount()).toBe(1);
      expect(ctx.getSaveBalance()).toBe(0);

      atmospheric.renderSectorAtmosphere(ctx, "aether_sanctuary", 1000, 625, 2);
      expect(ctx.getRadialGradientCount()).toBe(1);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("renders haze for Courtyard with cached linear gradients", () => {
      const ctx = createMockContext();
      const atmospheric = new AtmosphericSectorRenderer();

      atmospheric.renderSectorAtmosphere(ctx, "courtyard", 1000, 625, 1);
      expect(ctx.getLinearGradientCount()).toBe(1);
      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("renders procedural far backdrop with mountains and cached radial glow", () => {
      const ctx = createMockContext();
      const atmospheric = new AtmosphericSectorRenderer();
      const loc = getLocation("courtyard");

      atmospheric.renderProceduralFarBackdrop(ctx, loc, 1000, 625, 1);
      expect(ctx.getRadialGradientCount()).toBe(1);
      expect(ctx.getSaveBalance()).toBe(0);

      atmospheric.renderProceduralFarBackdrop(ctx, loc, 1000, 625, 2);
      expect(ctx.getRadialGradientCount()).toBe(1);
    });
  });

  describe("DebugProfilerOverlay Standalone Tests", () => {
    it("renders complete profiler telemetry with balanced save/restore", () => {
      const ctx = createMockContext();
      const profiler = new DebugProfilerOverlay();

      const mockPlayer: Player = {
        id: PlayerId.Player1,
        name: "Valen",
        x: 120,
        y: 200,
        vx: 2.5,
        vy: -1.0,
        width: 32,
        height: 48,
        health: 85,
        maxHealth: 100,
        mana: 40,
        maxMana: 50,
        stamina: 70,
        maxStamina: 80,
        isGrounded: true,
        isDead: false,
      } as unknown as Player;

      profiler.render(
        ctx,
        1000,
        625,
        [mockPlayer],
        [],
        [],
        [],
        15,
        60,
        60,
        "grand_bastion",
        3200,
        800,
        true
      );

      expect(ctx.getSaveBalance()).toBe(0);
    });

    it("delegates from HitboxRenderer.renderProfiler to DebugProfilerOverlay seamlessly", () => {
      let overlayCalled = false;
      const mockOverlay = {
        render: () => {
          overlayCalled = true;
        },
      };

      const hitboxRenderer = new HitboxRenderer({
        profilerOverlay: mockOverlay as any,
      });

      const ctx = createMockContext();
      hitboxRenderer.renderProfiler(
        ctx,
        1000,
        625,
        [],
        [],
        [],
        [],
        0,
        60,
        60,
        "courtyard",
        2000,
        600,
        false
      );

      expect(overlayCalled).toBe(true);
    });
  });
});
