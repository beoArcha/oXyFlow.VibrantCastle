import { describe, it, expect } from "bun:test";
import { ViewCuller, VIEW_CULL_MARGIN } from "../viewCulling";
import { StructureRenderer } from "../structureRenderer";
import { EnemyRenderer } from "../enemyRenderer";
import { HitboxRenderer } from "../hitboxRenderer";
import { DebugProfilerOverlay } from "../debugProfilerOverlay";
import { GameRenderer } from "../renderer";
import { CollisionType } from "@game/types";
import type { Entity, Enemy } from "@game/types";
import { createMockContext2D as createMockContext, createMockCanvas } from "@test-utils";

const platform = (id: string, x: number, y = 100, w = 100, h = 20): Entity =>
  ({ id, type: CollisionType.Solid, x, y, width: w, height: h, color: "#555" }) as Entity;

const enemy = (id: string, x: number, y = 100): Enemy =>
  ({
    id,
    x,
    y,
    width: 32,
    height: 32,
    health: 10,
    maxHealth: 10,
    isDead: false,
    isDummy: false,
    isAerial: false,
    facingLeft: false,
    damageTimer: 0,
  }) as unknown as Enemy;

function view(camX = 0, camY = 0, vw = 1000, vh = 600): ViewCuller {
  const v = new ViewCuller();
  v.setView(camX, camY, vw, vh);
  return v;
}

describe("ViewCuller", () => {
  it("computes the rectangle from camera, viewport and margin", () => {
    const v = view(500, 50, 800, 400);
    expect(v.left).toBe(500 - VIEW_CULL_MARGIN);
    expect(v.right).toBe(500 + 800 + VIEW_CULL_MARGIN);
    expect(v.top).toBe(50 - VIEW_CULL_MARGIN);
    expect(v.bottom).toBe(50 + 400 + VIEW_CULL_MARGIN);
  });

  it("zoom (larger viewport in world units) widens the rectangle", () => {
    const near = view(0, 0, 1000, 600);
    const far = view(0, 0, 2000, 1200);
    expect(far.right).toBeGreaterThan(near.right);
    expect(far.intersects(1900, 100, 10, 10)).toBe(true);
    expect(near.intersects(1900, 100, 10, 10)).toBe(false);
  });

  it("accounts for screen shake", () => {
    const v = new ViewCuller();
    v.setView(0, 0, 1000, 600, 10, -5);
    expect(v.left).toBe(-10 - VIEW_CULL_MARGIN);
    expect(v.top).toBe(5 - VIEW_CULL_MARGIN);
  });

  it("treats fully outside, partial and in-margin boxes correctly", () => {
    const v = view();
    expect(v.intersects(5000, 100, 50, 50)).toBe(false);
    expect(v.intersects(-5000, 100, 50, 50)).toBe(false);
    expect(v.intersects(980, 100, 100, 50)).toBe(true);
    expect(v.intersects(1000 + VIEW_CULL_MARGIN - 1, 100, 10, 10)).toBe(true);
    expect(v.intersects(1000 + VIEW_CULL_MARGIN + 1, 100, 10, 10)).toBe(false);
    expect(v.intersects(100, 600 + VIEW_CULL_MARGIN + 1, 10, 10)).toBe(false);
  });
});

describe("StructureRenderer culling", () => {
  it("draws only entities intersecting the view and reports counters", () => {
    const ctx = createMockContext();
    const renderer = new StructureRenderer();
    const v = view();
    const entities = [platform("in", 100), platform("margin", 1100), platform("out", 4000)];

    renderer.render(ctx, entities, "en", 1, v);

    expect(v.entitiesTotal).toBe(3);
    expect(v.entitiesDrawn).toBe(2);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("draws everything when no view is supplied", () => {
    const ctx = createMockContext();
    const renderer = new StructureRenderer();
    expect(() => renderer.render(ctx, [platform("a", 99999)], "en", 1)).not.toThrow();
  });

  it("produces fewer draw calls for culled entities", () => {
    const entities = [platform("far", 9000)];
    const culledCtx = createMockContext();
    const fullCtx = createMockContext();
    new StructureRenderer().render(culledCtx, entities, "en", 1, view());
    new StructureRenderer().render(fullCtx, entities, "en", 1);
    expect(culledCtx.getFillRectCalls().length).toBeLessThan(fullCtx.getFillRectCalls().length);
  });
});

describe("EnemyRenderer culling", () => {
  it("skips off-screen enemies but still counts them in the total", () => {
    const ctx = createMockContext();
    const v = view();
    new EnemyRenderer().render(ctx, [enemy("a", 100), enemy("b", 8000)], 1, v);
    expect(v.enemiesTotal).toBe(2);
    expect(v.enemiesDrawn).toBe(1);
  });
});

describe("HitboxRenderer culling and profiler counters", () => {
  it("does not draw hitboxes for culled entities and enemies", () => {
    const culledCtx = createMockContext();
    const fullCtx = createMockContext();
    const entities = [platform("far", 9000)];
    const enemies = [enemy("far", 9000)];
    new HitboxRenderer().renderHitboxes(culledCtx, [], enemies, entities, [], view());
    new HitboxRenderer().renderHitboxes(fullCtx, [], enemies, entities, []);
    expect(culledCtx.getSaveBalance()).toBe(0);
    expect(culledCtx.getSaveCount()).toBe(fullCtx.getSaveCount());
    expect(culledCtx.getFillRectCalls().length).toBeLessThan(fullCtx.getFillRectCalls().length);
  });

  it("shows the culling counters in the profiler overlay", () => {
    const ctx = createMockContext();
    const v = view();
    v.entitiesDrawn = 7;
    v.entitiesTotal = 42;
    v.enemiesDrawn = 1;
    v.enemiesTotal = 5;
    new DebugProfilerOverlay().render(ctx, 1000, 600, [], [], [], [], 0, 60, 60, "x", 100, 100, true, v);
    expect(ctx.getSaveBalance()).toBe(0);
  });
});

describe("GameRenderer culling integration", () => {
  it("feeds camera and viewport to the culler and keeps save balance", () => {
    const { canvas, ctx } = createMockCanvas(1000, 600);
    const seen: ViewCuller[] = [];
    const structure = {
      render: (_c: unknown, _e: unknown, _l: unknown, _t: unknown, v?: ViewCuller) => {
        if (v) seen.push(v);
      },
    };
    const renderer = new GameRenderer(canvas as unknown as HTMLCanvasElement, {
      structureRenderer: structure,
    });
    renderer.setDimensions(1000, 600, 1, "pixel");
    const camera = { x: 3000, y: 0, shakeOffsetX: 0, shakeOffsetY: 0 };

    renderer.render([], [], [], [], [], camera, 6000, 600);

    expect(seen.length).toBe(1);
    expect(seen[0].left).toBe(3000 - VIEW_CULL_MARGIN);
    expect(seen[0].right).toBe(3000 + 1000 + VIEW_CULL_MARGIN);
    expect(ctx.getSaveBalance()).toBe(0);
  });
});
